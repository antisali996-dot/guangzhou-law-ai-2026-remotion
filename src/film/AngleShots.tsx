import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {Cup} from '../props/Cup';
import {Splash} from '../props/Splash';
import {T_CONTACT, T_DROP, cupAt, ip, smooth} from './alan';
import {IMPACT_CAMERA, macroCupAt, PHONE_PLANE, planeMatrix} from './cameraAngles';
import {Neighbour} from './ResidentFigure';
import {EvidenceStill, EVIDENCE_FOCUS, Vignette} from './ui';

const Plate: React.FC<{name: string}> = ({name}) => <Img src={staticFile(`film-v19/${name}.png`)} style={{position:'absolute', width:1920, height:1080}} />;

export const OverheadShot: React.FC<{start: number}> = ({start}) => {
  const t=start+useCurrentFrame()/60;
  const fall=ip(t,[T_DROP,T_CONTACT],[0,1]);
  const cup=cupAt(t);
  // Viewed along the falling axis: its lid grows as it approaches the street camera plane.
  const x=ip(fall,[0,1],[1450,968]), y=ip(fall,[0,1],[80,558]);
  return <AbsoluteFill>
    <Plate name="overhead" />
    {t>=T_DROP ? <svg width={1920} height={1080} style={{position:'absolute'}}>
      <g transform={`translate(${x} ${y}) rotate(${cup.rotate}) scale(${1.65-fall*.9})`}>
        <ellipse rx={23} ry={18} fill="#C3CBCD" fillOpacity={.6} stroke="#E8EEEB" strokeWidth={2}/>
        <ellipse rx={18} ry={13} fill="#91704D" fillOpacity={.45}/>
        <path d="M 2 0 l 10 -25" stroke="#D9BD91" strokeWidth={5} strokeLinecap="round"/>
      </g>
    </svg> : null}
    <Vignette strength={.18}/>
  </AbsoluteFill>;
};

export const ImpactShot: React.FC<{start: number}> = ({start}) => {
  const t=start+useCurrentFrame()/60;
  const since=t-T_CONTACT;
  const c=macroCupAt(t);
  const crack=ip(since,[0,.08],[0,1],smooth);
  const jolt=since>0 ? 3*Math.exp(-since*9)*Math.sin(since*35) : 0;
  return <AbsoluteFill>
    <AbsoluteFill style={{transform:`translate(${jolt}px,${jolt*.6}px)`}}>
      <Plate name="impact"/>
      <svg width={1920} height={1080} style={{position:'absolute'}}>
        <path d="M1294 513 l-6 35 14 17 -20 24 9 22 -16 35" fill="none" stroke="#05090D" strokeWidth={8} strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1-crack}/>
        <path d="M1301 514 l-6 35 14 17" fill="none" stroke="#71818A" strokeWidth={2} opacity={crack*.7}/>
        <ellipse cx={1150} cy={478} rx={102} ry={20} fill="#926638" opacity={ip(since,[.08,.35],[0,.5])}/>
      </svg>
      {t>=T_DROP ? <Cup {...c}/> : null}
      <Splash x={IMPACT_CAMERA.x} y={IMPACT_CAMERA.y-8} scale={2.1} progress={since>0?since/.62:0}/>
    </AbsoluteFill>
    <Vignette strength={.16}/>
  </AbsoluteFill>;
};

/** The same anonymous residents, observed through the new upward camera. */
export const UpwardShot: React.FC<{t:number;local:number;gesture:number}> = ({t,local,gesture}) => {
  const p=ip(local,[1.3,4.7],[0,1],smooth);
  const windows=[
    {poly:'604,298 739,324 735,438 594,411',x:666,y:406,s:1.65,tilt:8,phase:0},
    {poly:'929,349 1060,375 1066,479 935,458',x:993,y:448,s:1.4,tilt:6,phase:1.4},
    {poly:'571,529 735,556 733,692 558,669',x:648,y:654,s:1.8,tilt:8,phase:2.6},
  ];
  return <AbsoluteFill>
    <AbsoluteFill style={{transform:`translateY(${-10*p}px) scale(${1+p*.018})`}}>
      <Plate name="upward"/>
      <svg width={1920} height={1080} viewBox="0 0 1672 941" style={{position:'absolute'}}>
        {windows.map((w,i)=><g key={i}>
          <defs><clipPath id={`angle-window-${i}`}><polygon points={w.poly}/></clipPath></defs>
          <g clipPath={`url(#angle-window-${i})`}>
            <g transform={`translate(${w.x} ${w.y}) rotate(${w.tilt}) scale(${w.s})`}>
              <Neighbour x={0} y={0} phase={t*(2.6+i*.25)+w.phase} lean={i===1?2:-2} gesture={gesture*(1-i*.3)} tilt={i===1?6:-4}/>
            </g>
          </g>
        </g>)}
      </svg>
    </AbsoluteFill>
    <Vignette strength={.2}/>
  </AbsoluteFill>;
};

export const ShoulderShot: React.FC<{local:number}> = ({local}) => {
  const sway=Math.sin((local-2)*1.5)*1.8;
  return <AbsoluteFill>
    <AbsoluteFill style={{transform:`translateY(${sway}px)`}}>
      <Plate name="shoulder"/>
      <div style={{position:'absolute',left:0,top:0,width:300,height:600,overflow:'hidden',transformOrigin:'0 0',transform:planeMatrix(PHONE_PLANE,300,600),borderRadius:10}}>
        <EvidenceStill w={300} h={600} focus={EVIDENCE_FOCUS} scale={2}/>
        <svg width={300} height={600} style={{position:'absolute',inset:0}}>
          <g fill="none" stroke="#F4F1DE" strokeWidth={2} opacity={.85}><path d="M68 230v-18h18 M214 212h18v18 M68 358v18h18 M214 376h18v-18"/><circle cx={150} cy={548} r={26}/></g>
          <circle cx={150} cy={548} r={20} fill="#ECE9D9"/>
        </svg>
      </div>
    </AbsoluteFill>
    <Vignette strength={.16}/>
  </AbsoluteFill>;
};
