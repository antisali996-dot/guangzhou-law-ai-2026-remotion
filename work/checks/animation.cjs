const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
const {test} = require('node:test');
for (const ext of ['.ts', '.tsx']) {
  require.extensions[ext] = (module, filename) => module._compile(
    ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX},
    }).outputText, filename);
}
const {RIG} = require('../../src/characters/Rig.tsx');
const {alanAt} = require('../../src/film/alan.ts');
const {solveTwoBone} = require('../../src/lib/ik.ts');

test('new incident cameras cover every frame and keep the impact inside its close-up', () => {
  const {INCIDENT_SHOTS,shotAtFrame,SHOULDER_LOCAL} = require('../../src/film/cameraAngles.ts');
  const {T_CONTACT} = require('../../src/film/alan.ts');
  const {f} = require('../../src/film/timeline.ts');
  for(let frame=f(6);frame<f(12.264);frame++) {
    assert.equal(INCIDENT_SHOTS.filter(s=>frame>=f(s.start)&&frame<f(s.end)).length,1);
  }
  assert.equal(shotAtFrame(f(T_CONTACT)).id,'impact');
  assert.equal(shotAtFrame(f(8.6)-1).id,'street');
  assert.equal(shotAtFrame(f(8.6)).id,'overhead');
  assert.ok(SHOULDER_LOCAL.start>=2, 'physical retrieval must finish before the shoulder cut');
  assert.ok(19.3+SHOULDER_LOCAL.end<22.6, 'shutter must remain visible in the phone close-up');
});

test('macro camera projects the shared physical contact to its calibrated rim without a jump', () => {
  const {IMPACT_CAMERA,macroCupAt} = require('../../src/film/cameraAngles.ts');
  const {T_CONTACT} = require('../../src/film/alan.ts');
  const c=macroCupAt(T_CONTACT);
  assert.ok(Math.hypot(c.x-IMPACT_CAMERA.x,c.y-IMPACT_CAMERA.y)<1e-8);
  for(const direction of [-1,1]) {
    const near=macroCupAt(T_CONTACT+direction*1e-6);
    assert.ok(Math.hypot(near.x-c.x,near.y-c.y)<.01);
  }
  assert.ok(macroCupAt(T_CONTACT-.08).y<c.y);
});

test('phone screen perspective maps all four corners into the generated phone', () => {
  const {PHONE_PLANE,planeMatrix} = require('../../src/film/cameraAngles.ts');
  const m=planeMatrix(PHONE_PLANE,300,600).slice(9,-1).split(',').map(Number);
  for(const [i,[x,y]] of [[0,0],[300,0],[300,600],[0,600]].entries()) {
    const w=m[3]*x+m[7]*y+m[15];
    const actual={x:(m[0]*x+m[4]*y+m[12])/w,y:(m[1]*x+m[5]*y+m[13])/w};
    assert.ok(Math.hypot(actual.x-PHONE_PLANE[i].x,actual.y-PHONE_PLANE[i].y)<1e-8);
  }
});

test('law clauses change on the same rounded frame as their narration', () => {
  const {lawClauseIndex} = require('../../src/film/lawReading.ts');
  const marks = [38.7, 41.589, 44.768, 48.825];
  for (let i = 1; i < marks.length; i++) {
    const boundary = Math.round(marks[i]*60);
    assert.equal(lawClauseIndex((boundary-1)/60, marks), i-1);
    assert.equal(lawClauseIndex(boundary/60, marks), i);
  }
});

test('a natural blink briefly closes the eyes and never leaves them shut', () => {
  const {blinkAt} = require('../../src/lib/blink.ts');
  let closed = 0, peak = 0;
  for (let frame = 0; frame < 5040; frame++) {
    const value = blinkAt(frame/60);
    assert.ok(value >= 0 && value <= 1);
    peak = Math.max(peak,value);
    if (value > 0.5) closed++;
  }
  assert.ok(peak > 0.95);
  assert.ok(closed > 0 && closed/5040 < 0.03);
  assert.equal(blinkAt(6.7),0);
  assert.equal(blinkAt(7.1),0);
});

function assertReach(pose, label) {
  const angle = ((pose.lean || 0) + (pose.chest || 0) * 0.5) * Math.PI / 180;
  const pivot = RIG.shoulderY * 0.3;
  for (const near of [true, false]) {
    const arm = near ? pose.armNear : pose.armFar;
    if (arm.kind !== 'ik') continue;
    const x = near ? RIG.shoulderHalf : -RIG.shoulderHalf + 12;
    const y = RIG.shoulderY - (pose.shoulderLift || 0) * (near ? 1 : 0.75) - pivot;
    const root = {x: x * Math.cos(angle) - y * Math.sin(angle),
      y: x * Math.sin(angle) + y * Math.cos(angle) + pivot};
    const actual = solveTwoBone(root, arm.target, RIG.upperArm, RIG.forearm, 1).wrist;
    const error = Math.hypot(actual.x - arm.target.x, actual.y - arm.target.y);
    assert.ok(error < 0.1, `${label}, ${near ? 'near' : 'far'} hand misses by ${error.toFixed(2)}px`);
  }
}

test('both hands reach their handlebar targets throughout walk-in and stopping', () => {
  for (let frame = 360; frame < 736; frame++) assertReach(alanAt(frame / 60).pose, `frame ${frame}`);
});

test('departure still travels and steps naturally at the final visible frame', () => {
  const {LEAVE} = require('../../src/film/scenes/Ending.tsx');
  const {sampleTrack} = require('../../src/characters/locomotion.ts');
  const before = sampleTrack(LEAVE, 4.1);
  const after = sampleTrack(LEAVE, 4.283333333333);
  const speed = (after.hip - before.hip) / (4.283333333333 - 4.1);
  assert.ok(speed > 150 && speed < 230, `departure ends at ${speed.toFixed(1)}px/s`);
  assert.ok(after.amp > 0.8, 'the walk must not fade into a standing pose');
  assert.ok(Math.abs(after.near.hip-before.near.hip) + Math.abs(after.far.hip-before.far.hip) > 3,
    'the final steps must keep moving instead of closing both feet');
});

test('departure starts at the stored-phone pose, grips before moving, and keeps contact', () => {
  const {leaveAt, LEAVE_WALK_DELAY} = require('../../src/film/leave.ts');
  const {phoneStowAt} = require('../../src/film/stowPhone.ts');
  const {armGeometryFor} = require('../../src/characters/Rig.tsx');
  const {BIKE} = require('../../src/props/Bike.tsx');
  const {GROUND, HIP_Y, HIP_REST} = require('../../src/film/geometry.ts');
  const before = phoneStowAt(3.4).pose;
  const first = leaveAt(0);
  assert.equal(first.actorX, HIP_REST);
  for (const near of [true, false]) {
    const a = armGeometryFor(before, near).wrist;
    const b = armGeometryFor(first.pose, near).wrist;
    assert.ok(Math.hypot(a.x-b.x, a.y-b.y) < 0.01, 'hand teleports across the cut');
  }
  for (let frame = Math.ceil(LEAVE_WALK_DELAY*60); frame < 258; frame++) {
    const motion = leaveAt(frame/60);
    assertReach(motion.pose, `departure frame ${frame}`);
    for (const near of [true, false]) {
      const arm = near ? motion.pose.armNear : motion.pose.armFar;
      assert.equal(arm.hand, 'grip');
      const wrist = armGeometryFor(motion.pose, near).wrist;
      const expectedX = motion.bikeX + BIKE.grip.x - (near ? 0 : 13);
      const expectedY = GROUND + BIKE.grip.y - (near ? 0 : 9);
      assert.ok(Math.hypot(motion.actorX+wrist.x-expectedX, HIP_Y+motion.loco.bob+wrist.y-expectedY) < 0.1);
    }
  }
});

test('departure camera gradually stays behind and footsteps follow the new gait', () => {
  const {leaveAt, LEAVE, LEAVE_START} = require('../../src/film/leave.ts');
  const {SFX_CUES} = require('../../src/film/cues.ts');
  const a = leaveAt(3.8), b = leaveAt(4.28);
  assert.ok((b.cameraX-a.cameraX) < 0.1*(b.actorX-a.actorX));
  const first = leaveAt(0), last = leaveAt(4.28);
  assert.ok(1.5*((last.actorX-last.cameraX)-(first.actorX-first.cameraX)) > 550);
  const effects = SFX_CUES.filter(c => c.file === 'sfx-step.wav' && c.at >= LEAVE_START);
  assert.equal(effects.length, LEAVE.strikeTimes.length);
  effects.forEach((cue, i) => assert.ok(Math.abs(cue.at-LEAVE_START-LEAVE.strikeTimes[i]) <= 1/60));
});

test('the kickstand folds before departure and stays clear of the road during travel', () => {
  const {leaveAt} = require('../../src/film/leave.ts');
  const {bikeKickstandTip} = require('../../src/props/Bike.tsx');
  assert.equal(leaveAt(0).kickstand, 1);
  for (let frame = 48; frame < 258; frame++) {
    assert.ok(bikeKickstandTip(leaveAt(frame/60).kickstand).y < -50);
  }
  assert.equal(alanAt(9).kickstand, 1);
});

test('wheel rotates forward without sliding when the bicycle advances', () => {
  const {BIKE} = require('../../src/props/Bike.tsx');
  const before = alanAt(6.2);
  const after = alanAt(6.3);
  const distance = after.bikeX - before.bikeX;
  const rotation = (after.wheelDeg - before.wheelDeg) * Math.PI / 180;
  assert.ok(distance > 0);
  assert.ok(Math.abs(distance - BIKE.wheelR * rotation) < 0.01,
    'the tyre bottom moves with the bike instead of opposing its travel');
});

test('falling cup contacts the rim where damage appears, clear of the hands', () => {
  const {cupAt, T_CONTACT} = require('../../src/film/alan.ts');
  const {BIKE} = require('../../src/props/Bike.tsx');
  const actor = alanAt(T_CONTACT);
  // The rendered crack starts at bike-local x=188 on the basket front rim.
  const crackX = actor.bikeX + 188;
  const cupX = cupAt(T_CONTACT).x;
  assert.ok(Math.abs(cupX - crackX) < 1, `cup misses the damaged rim by ${Math.abs(cupX-crackX).toFixed(1)}px`);
  assert.ok(cupX - (actor.bikeX + BIKE.grip.x) > 45, 'impact must be clear of the grip');
});

test('surveillance and street show the same cup throughout the entire flight', () => {
  const {cupAt, T_CONTACT} = require('../../src/film/alan.ts');
  const {cctvCupAt, CCTV_RELEASE, CCTV_CONTACT} = require('../../src/film/cctv.ts');
  for (let local = CCTV_RELEASE; local < CCTV_CONTACT; local += 1/120) {
    const main = cupAt(T_CONTACT + local - CCTV_CONTACT);
    const replay = cctvCupAt(local);
    assert.ok(Math.hypot(main.x-replay.x, main.y-replay.y) < 0.01,
      `the replay depicts a different throw at ${local.toFixed(3)}s`);
    assert.ok(Math.abs(main.rotate-replay.rotate) < 0.01, 'cup orientation differs');
  }
});

test('surveillance includes the same bystander and advances time until its explicit freeze', () => {
  const {cctvAt, CCTV_CONTACT, CCTV_FREEZE} = require('../../src/film/cctv.ts');
  const {T_CONTACT} = require('../../src/film/alan.ts');
  const before = cctvAt(CCTV_CONTACT-0.2), after = cctvAt(CCTV_CONTACT+0.2);
  assert.notEqual(before.clock, after.clock, 'a moving replay must not have a stopped clock');
  const frame = cctvAt(CCTV_CONTACT);
  assert.deepEqual(frame.actor, alanAt(T_CONTACT), 'the person standing beside the bicycle is missing or misplaced');
  assert.equal(frame.frozen, false);
  assert.equal(cctvAt(CCTV_FREEZE+1).frozen, true);
  assert.deepEqual(cctvAt(CCTV_FREEZE+1), cctvAt(CCTV_FREEZE+2));
});

test('cup has no contact-frame jump and settles into the following shot pose', () => {
  const {cupAt, CUP_REST, T_CONTACT, CUP_GROUND_Y} = require('../../src/film/alan.ts');
  const before = cupAt(T_CONTACT - 1e-7);
  const after = cupAt(T_CONTACT + 1e-7);
  assert.ok(Math.hypot(before.x-after.x, before.y-after.y) < 0.01);
  assert.deepEqual(cupAt(12.264), {...CUP_REST});
  const rotation = CUP_REST.rotate * Math.PI / 180;
  const lowestLid = CUP_REST.y + (31 * Math.sin(rotation) - 95 * Math.cos(rotation)) * CUP_REST.scale;
  assert.ok(Math.abs(lowestLid - CUP_GROUND_Y) < 2, 'rotated cup must rest on the foreground pavement');
});

test('spilling tea lowers the remaining liquid instead of refilling the cup', () => {
  const {cupLiquidLevel} = require('../../src/props/Cup.tsx');
  assert.ok(cupLiquidLevel(0.14) > cupLiquidLevel(0.62));
  assert.equal(cupLiquidLevel(-1), cupLiquidLevel(0));
  assert.equal(cupLiquidLevel(2), cupLiquidLevel(1));
});

test('the settled cup stays in the foreground, clear of departing tyres and shoes', () => {
  const {CUP_REST, GROUND} = require('../../src/film/alan.ts');
  const angle = CUP_REST.rotate * Math.PI / 180;
  const points = [[-31,-95],[31,-95],[-28,-86],[28,-86],[-20,-7],[20,-7],[-13,0],[13,0]];
  const top = Math.min(...points.map(([x,y]) => CUP_REST.y + (x*Math.sin(angle)+y*Math.cos(angle))*CUP_REST.scale));
  assert.ok(top > GROUND+12, `cup overlaps the travel lane at y=${top.toFixed(1)}`);
});

test('surveillance replay stays continuous at release and impact, then shares the resting cup', () => {
  const {cctvCupAt, CCTV_RELEASE, CCTV_CONTACT} = require('../../src/film/cctv.ts');
  const {CUP_REST} = require('../../src/film/alan.ts');
  for (const boundary of [CCTV_RELEASE, CCTV_CONTACT]) {
    const before = cctvCupAt(boundary - 1e-7);
    const after = cctvCupAt(boundary + 1e-7);
    assert.ok(Math.hypot(before.x-after.x, before.y-after.y) < 0.01, `jump at ${boundary}`);
  }
  assert.deepEqual(cctvCupAt(5), {...CUP_REST});
});

test('phone stays full size, crosses the bag opening, and only then disappears', () => {
  const {phoneStowAt, PHONE_HEIGHT} = require('../../src/film/stowPhone.ts');
  let previousBottom = -Infinity;
  for (let frame = 0; frame <= 132; frame++) {
    const state = phoneStowAt(frame / 60);
    assertReach(state.pose, `phone frame ${frame}`);
    assert.equal(PHONE_HEIGHT, 48);
    if (frame / 60 >= 0.9 && frame / 60 <= 1.7) {
      assert.ok(state.bottomInBag.y >= previousBottom, 'phone must slide downward');
      previousBottom = state.bottomInBag.y;
    }
    if (!state.visible) assert.ok(state.topInBagY >= 4, 'phone disappears before entering bag');
  }
  assert.ok(phoneStowAt(1.2).visible, 'phone tip must remain visible during insertion');
  assert.ok(!phoneStowAt(1.8).visible, 'phone must fit inside the bag by the end');
});

test('phone retrieval emerges from the bag before the reading pose', () => {
  const {phoneTakeOutAt} = require('../../src/film/stowPhone.ts');
  assert.equal(phoneTakeOutAt(0).visible, false);
  assert.equal(phoneTakeOutAt(1).visible, true);
  assert.equal(phoneTakeOutAt(1.8).bagOpen, 0);
  let visible = false;
  for (let frame = 0; frame < 120; frame++) {
    const phone = phoneTakeOutAt(frame/60);
    assertReach(phone.pose, `phone retrieval frame ${frame}`);
    if (visible) assert.ok(phone.visible, 'phone disappears again while being held');
    visible ||= phone.visible;
  }
});
