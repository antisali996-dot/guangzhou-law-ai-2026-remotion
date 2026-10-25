const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
const {test} = require('node:test');
for (const ext of ['.ts', '.tsx']) {
  require.extensions[ext] = (module, filename) => module._compile(
    ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true},
    }).outputText, filename);
}
const {RIG} = require('../../src/characters/Rig.tsx');
const {alanAt} = require('../../src/film/alan.ts');
const {solveTwoBone} = require('../../src/lib/ik.ts');

test('screen quotations retain the verified official paragraphs with all conditions and alternatives', () => {
  const reference=require('./legal-reference.json');
  const {CIVIL_QUOTES,COMPENSATION_QUOTES,CRIMINAL_QUOTES}=require('../../src/film/legalFlow.ts');
  const {VO}=require('../../src/film/vo.ts');
  assert.equal(VO.find(v=>v.id==='L05').text+CIVIL_QUOTES.join('')+COMPENSATION_QUOTES.join(''),reference.civil.text);
  assert.equal(CRIMINAL_QUOTES.join(''),reference.criminal.text);
});

test('story subtitles switch on the rounded cue boundary without retaining the previous phrase', () => {
  const {SUB_CUES,subtitleCueAtFrame}=require('../../src/film/ui.tsx');
  const {f}=require('../../src/film/timeline.ts');
  for(const cue of SUB_CUES) {
    assert.equal(subtitleCueAtFrame(f(cue.t0)),cue);
    assert.equal(subtitleCueAtFrame(f(cue.t1)-1),cue);
    assert.notEqual(subtitleCueAtFrame(f(cue.t1)),cue);
  }
  assert.equal(subtitleCueAtFrame(f(25.9)),null);
  assert.equal(subtitleCueAtFrame(f(78)),null);
});

test('each planted foot reaches the authored world strike instead of adding a second hip offset', () => {
  const {WALK_IN}=require('../../src/film/alan.ts');
  const {LEAVE}=require('../../src/film/leave.ts');
  const {sampleTrack,soleX}=require('../../src/characters/locomotion.ts');
  for(const track of [WALK_IN,LEAVE]) {
    const strikes=track.strikes.filter(s=>s.real && s.d<=track.samples.at(-1).hip);
    strikes.forEach((strike,i)=>{
      const pose=sampleTrack(track,track.strikeTimes[i]+.025);
      const foot=soleX(strike.leg,strike.leg===0?pose.near:pose.far,pose.hip,pose.bob);
      assert.ok(Math.abs(foot.x-strike.x)<.6,`foot misses planned contact by ${(foot.x-strike.x).toFixed(2)}px`);
      assert.ok(Math.abs(foot.y-(strike.leg===0?190:184))<.2,'stance sole must stay on its ground plane');
    });
  }
});

test('departure begins with the same flat soles and planted contacts as confirmation', () => {
  const {standingLegs,soleX}=require('../../src/characters/locomotion.ts');
  const {leaveAt}=require('../../src/film/leave.ts');
  const still=standingLegs(), first=leaveAt(0).loco;
  for(const [i,key] of [[0,'near'],[1,'far']]) {
    assert.equal(first[key].foot,still[key].foot,'shoe must not snap to toe-off across the cut');
    const a=soleX(i,still[key],0,still.bob),b=soleX(i,first[key],0,first.bob);
    assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<.1);
  }
});

test('entry footsteps follow the actual landing times instead of a separate guessed rhythm', () => {
  const {WALK_IN}=require('../../src/film/alan.ts');
  const {SFX_CUES}=require('../../src/film/cues.ts');
  const sounds=SFX_CUES.filter(c=>c.file==='sfx-step.wav' && c.at<10);
  assert.equal(sounds.length,WALK_IN.strikeTimes.length);
  sounds.forEach((s,i)=>assert.ok(Math.abs(s.at-WALK_IN.strikeTimes[i])<1/60));
});

test('entry and departure keep a support foot grounded without sliding flat soles', () => {
  const {WALK_IN}=require('../../src/film/alan.ts');
  const {LEAVE}=require('../../src/film/leave.ts');
  const {sampleTrack,soleX}=require('../../src/characters/locomotion.ts');
  for(const track of [WALK_IN,LEAVE]) {
    let previous;
    const duration=(track.samples.length-1)*track.dt;
    for(let f=0;f<=Math.floor(duration*60);f++) {
      const state=sampleTrack(track,track.t0+f/60);
      const feet=[state.near,state.far].map((leg,i)=>({...soleX(i,leg,state.hip,state.bob),angle:leg.foot,ground:i===0?190:184}));
      assert.ok(feet.every(p=>p.y<=p.ground+.05),'a sole sinks through the pavement');
      assert.ok(feet.some(p=>Math.abs(p.y-p.ground)<.05),'both feet lose ground support');
      if(previous) feet.forEach((p,i)=>{
        const old=previous[i];
        if(Math.abs(p.angle)<.001 && Math.abs(old.angle)<.001 && Math.abs(p.y-p.ground)<.01 && Math.abs(old.y-old.ground)<.01) {
          assert.ok(Math.abs(p.x-old.x)<.03,'a planted flat foot skates');
        }
      });
      previous=feet;
    }
  }
});

test('trousers keep their bone lengths, a covered hip root and short knee rounding', () => {
  const {legGeometryFor}=require('../../src/characters/Rig.tsx');
  for(let frame=0;frame<=510;frame+=3) {
    const pose=alanAt(frame/60).pose;
    for(const [hip,spec] of [[{x:RIG.hipHalf,y:0},pose.legNear],[{x:-RIG.hipHalf,y:RIG.farHipY},pose.legFar]]) {
      const g=legGeometryFor(hip,spec);
      assert.ok(!/NaN|Infinity/.test(g.outline));
      assert.ok(Math.abs(Math.hypot(g.knee.x-hip.x,g.knee.y-hip.y)-RIG.thigh)<1e-8);
      assert.ok(Math.abs(Math.hypot(g.ankle.x-g.knee.x,g.ankle.y-g.knee.y)-RIG.shin)<1e-8);
      const knees=[...g.outline.matchAll(/Q ([^LQCZ]+)/g)].map(m=>m[1].trim().split(/\s+/).map(Number));
      for(const fillet of [knees[0],knees[2]]) {
        assert.ok(Math.abs(Math.hypot(fillet[2]-fillet[0],fillet[3]-fillet[1])-10)<1e-8,'rounding must stay local to the knee');
      }
      const cap=g.outline.match(/C ([^Z]+)/)[1].trim().split(/\s+/).map(Number);
      assert.ok(Math.min(cap[1],cap[3])<hip.y-6,'rounded root must extend above the exposed hip joint');
    }
  }
});

test('shirt covers the trouser roots and both legs stay in one complete person', () => {
  const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
  const {Actor}=require('../../src/characters/Rig.tsx');
  const all=renderToStaticMarkup(React.createElement(Actor,{x:0,y:0,pose:alanAt(8.1).pose}));
  assert.ok(all.indexOf('data-body-part="near-leg"')<all.indexOf('data-body-part="torso"'));
  for(const leg of ['far-leg','near-leg']) assert.ok(all.includes(`data-body-part="${leg}"`));
});

test('walking beside the bicycle keeps both legs on the same side in every story scene', () => {
  const {execFileSync}=require('node:child_process');
  const path=require('node:path');
  const result=execFileSync(process.execPath,[path.join(__dirname,'push-side-review.cjs'),'--check'],{encoding:'utf8'});
  assert.ok(result.includes('11 real Film scenes'));
});

test('face controls keep expression overshoot out of the new head geometry', () => {
  const {faceState}=require('../../src/characters/face.ts');
  for(const surprise of [-4,0,.5,1,3]) for(const mood of [-3,-.75,0,.5,3]) for(const blink of [-1,0,.5,1,2]) {
    const a=faceState({surprise,mood,blink,yaw:3});
    assert.ok(Object.values(a).every(Number.isFinite));
    assert.ok(a.startle>=0 && a.startle<=1);
    assert.ok(a.eyeOpen>=.025 && a.eyeOpen<=1);
    assert.ok(a.browLift>=0 && a.browLift<=2.1);
    assert.ok(Math.abs(a.mouthCurve)<=.7);
    assert.ok(Math.abs(a.shift)<=2.6);
  }
});

test('drawn brows stay above open eyes throughout the concern and startle range', () => {
  const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
  const {Head}=require('../../src/characters/Head.tsx');
  const {ALAN_LOOK}=require('../../src/characters/Rig.tsx');
  const numbers=s=>s.match(/-?\d*\.?\d+/g).map(Number);
  for(const surprise of [0,.5,1,-3.8]) for(const mood of [-1,0,1]) {
    const svg=renderToStaticMarkup(React.createElement('svg',null,React.createElement(Head,{yaw:.5,nod:0,tilt:0,ponytail:0,look:ALAN_LOOK,surprise,mood})));
    assert.ok(!/NaN|Infinity/.test(svg));
    const browGroup=svg.match(/data-face-part="brows"[^>]*>([\s\S]*?)<\/g>/)[1];
    const brows=[...browGroup.matchAll(/d="([^"]+)"/g)].map(m=>numbers(m[1]));
    const browBottom=Math.max(...brows.flatMap(n=>[n[1],n[1]+n[3],n[1]+n[5]]))+.675;
    // Conservative control-point bound, rather than assuming a particular resting eyebrow shape.
    const eyeTop=-9.5-Math.max(0,Math.min(1,surprise));
    assert.ok(browBottom<eyeTop+.7,`brow/lid clearance lost: ${surprise}, ${mood}`);
  }
});

test('new head eye masks remain distinct when several characters share a static frame', () => {
  const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
  const {Head}=require('../../src/characters/Head.tsx');
  const {ALAN_LOOK}=require('../../src/characters/Rig.tsx');
  const svg=renderToStaticMarkup(React.createElement('svg',null,[0,1,2].map(i=>React.createElement(Head,{key:i,yaw:i*.2,nod:0,tilt:0,ponytail:0,look:ALAN_LOOK,blink:i/2}))));
  const ids=[...svg.matchAll(/<clipPath id="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(ids.length,6);assert.equal(new Set(ids).size,6);
  for(const id of ids) assert.ok(svg.includes(`url(#${id})`));
});

test('foreground rain stays outside phone interfaces, evidence desks and reading scenes', () => {
  const {foregroundRainAt}=require('../../src/film/cameraAngles.ts');
  for(const [time,rain] of [[8,true],[21.8,true],[22.3,false],[25,false],[31,false],[55,false],[65,false],[71,true],[77.9,true],[78,false],[83,false]]) assert.equal(foregroundRainAt(Math.round(time*60)),rain);
});

test('legal flow uses the spoken frame boundaries and does not accuse possible users early', () => {
  const {COMPENSATION_MARKS,compensationPhaseAt,windowStateAt} = require('../../src/film/legalFlow.ts');
  const {VO}=require('../../src/film/vo.ts');
  assert.deepEqual([...COMPENSATION_MARKS],VO.find(v=>v.id==='L07').show.map(s=>s.t0));
  for(let phase=0;phase<4;phase++) {
    const states=Array.from({length:12},(_,i)=>windowStateAt(Math.floor(i/4),i%4,phase));
    if(phase<3) assert.ok(!states.includes('identified'));
    if(phase===0) assert.ok(states.every(s=>s==='unknown'));
    if(phase===1) assert.equal(states.filter(s=>s==='excluded').length,8);
    if(phase===2) assert.equal(states.filter(s=>s==='possible').length,4);
  }
  for(let i=1;i<4;i++) {
    const boundary=Math.round(COMPENSATION_MARKS[i]*60);
    assert.equal(compensationPhaseAt((boundary-1)/60),i-1);
    assert.equal(compensationPhaseAt(boundary/60),i);
  }
});

test('legal quotation replaces duplicate captions only within the legal scenes', () => {
  const {isLegalFrame,CRIMINAL_QUOTES}=require('../../src/film/legalFlow.ts');
  for(const [frame,value] of [[1559,false],[1560,true],[3119,true],[3120,false],[3569,false],[3570,true],[4217,true],[4218,false]]) assert.equal(isLegalFrame(frame),value);
  assert.ok(CRIMINAL_QUOTES[0].includes('情节严重的'));
  assert.equal(CRIMINAL_QUOTES[1],'处一年以下有期徒刑、拘役或者管制，');
});

test('post-impact surprise settles at rest without driving brows into the eyes', () => {
  const {reactionSurpriseAt} = require('../../src/film/scenes/S02Reaction.tsx');
  let previous=0.95;
  for(let frame=0;frame<140;frame++) {
    const local=frame/60;
    const surprise=reactionSurpriseAt(local);
    assert.ok(surprise>=0 && surprise<=0.95, `expression overshoots at ${local}s: ${surprise}`);
    assert.ok(surprise<=previous+1e-12, 'a settling reaction must not reverse direction');
    if(local>=1.15) assert.equal(surprise,0);
    previous=surprise;
  }
});

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
