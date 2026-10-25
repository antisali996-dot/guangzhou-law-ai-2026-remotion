import React from 'react';
import type {CharacterLook} from './Rig';
import {faceState} from './face';

/** Flat, restrained adult head, rebuilt from the approved in-scene design. */
export const Head: React.FC<{
  yaw:number; nod:number; tilt:number; look:CharacterLook; ponytail:number;
  surprise?:number; mood?:number; blink?:number;
}> = ({yaw,nod,tilt,look,ponytail,surprise=0,mood=.25,blink=0}) => {
  const a=faceState({yaw,mood,surprise,blink}), id=React.useId();
  const f=a.shift, squish=1-Math.abs(f)*.018;
  const leftEye=`M ${-9.7+f} -2.9 Q ${-5.4+f} ${-9.5-a.startle} ${-1.2+f} -3.3 Q ${-4.9+f} ${1.9+a.startle*.6} ${-9.7+f} -2.9 Z`;
  const rightEye=`M ${6.8+f} -3.1 Q ${10.8+f} ${-9-a.startle} ${14.3+f} -3.5 Q ${10.9+f} ${1.6+a.startle*.6} ${6.8+f} -3.1 Z`;
  return <g transform={`rotate(${tilt}) translate(${yaw*1.4} 0)`}>
    <path d="M-8 22H8L9 38Q0 45-9 38Z" fill={look.skin}/>
    <path d="M-8 22H8L8.5 33Q0 36-8 29Z" fill={look.skinShade} opacity={.6}/>
    {look.hairStyle==='ponytail'?<g transform={`rotate(${ponytail} -23 -9)`}>
      <path d="M-22-14C-39-16-42 5-36 20C-34 31-29 38-23 38C-16 36-19 29-23 23C-30 13-28 3-22-4Z" fill={look.hairShade}/>
      <path d="M-29-6C-35 6-31 22-25 29" fill="none" stroke={look.hair} strokeWidth={2.5} opacity={.65}/>
      <path d="M-29-13l8 3" stroke="#A35B4C" strokeWidth={3.5} strokeLinecap="round"/>
    </g>:null}
    <path d="M-27 1C-32-22-17-38 2-38C21-39 32-24 29-5L25 13-18 24-27 13Z" fill={look.hair}/>
    <g transform={`scale(${squish} 1)`}>
      <path d="M-23-5C-24-19-13-29 1-30C16-31 27-20 27-6C28 3 24 9 24 16C23 22 18 27 11 30C5 32-3 28-10 24C-18 19-23 9-23-5Z" fill={look.skin}/>
      <path d="M18 17Q22 20 18 25Q12 30 7 31Q14 27 18 17Z" fill={look.skinShade} opacity={.16}/>
      <g data-face-part="brows" fill="none" stroke="#49372F" strokeWidth={1.35} strokeLinecap="round">
        <path d={`M${-9.5+f} ${-11.1-1.7*a.startle}q4.1 ${-1.3-.3*a.concern} 8.2 ${-.1-a.concern*.7}`}/>
        <path d={`M${6.5+f} ${-11.5-a.browLift}q3.9 -1 7.5 ${.6+a.concern*.6}`}/>
      </g>
      <g data-face-part="eyes" transform={`translate(0 -3.1) scale(1 ${a.eyeOpen}) translate(0 3.1)`}>
        <defs>
          <clipPath id={`${id}-left`}><path d={leftEye}/></clipPath>
          <clipPath id={`${id}-right`}><path d={rightEye}/></clipPath>
        </defs>
        <path d={leftEye} fill="#F1EADD"/>
        <path d={rightEye} fill="#F1EADD"/>
        {[{cx:-4.5+f,clip:'left',r:2.3},{cx:11+f,clip:'right',r:2.1}].map(eye=><g key={eye.clip} clipPath={`url(#${id}-${eye.clip})`}>
          <circle cx={eye.cx} cy={-3.2} r={eye.r} fill="#574135"/>
          <circle cx={eye.cx+.2} cy={-3.3} r={1.3} fill="#211A17"/>
          <circle cx={eye.cx+.65} cy={-4.15} r={.48} fill="#F5F0E4"/>
        </g>)}
        <path d={`M${-9.7+f} -2.9Q${-5.4+f} ${-9.5-a.startle} ${-1.2+f} -3.3M${6.8+f} -3.1Q${10.8+f} ${-9-a.startle} ${14.3+f} -3.5`} stroke="#3C2C26" strokeWidth={1.05} fill="none" strokeLinecap="round"/>
      </g>
      <g opacity={a.closed} stroke="#45332B" strokeWidth={1.2} fill="none" strokeLinecap="round">
        <path d={`M${-9.4+f} -3q4 1.1 8.1-.2M${6.9+f} -3.2q3.8 1 7.3-.2`}/>
      </g>
      <path d={`M${11.8+f} 0q.3 4.1 2.1 6l-2.3 1.3-1.1-.5`} fill={look.skinShade} opacity={.6}/>
      {a.startle>.4?<ellipse cx={6.4+f} cy={15+nod*.04} rx={1.8} ry={1+a.startle} fill="#8E5142"/>:
        <path d={`M${2+f} ${14.7+nod*.04}q4.2 ${a.mouthCurve*1.7} 8.4 .05`} fill="none" stroke="#A15E50" strokeWidth={1.6} strokeLinecap="round"/>}
    </g>
    <path d="M-28-1C-31-20-17-38 2-38C19-38 31-25 29-7C26-13 22-19 17-23C8-16-5-13-15-5C-19 0-19 10-20 17C-24 13-27 7-28-1Z" fill={look.hair}/>
    <path d="M-25-5C-26 5-24 14-20 18L-19 6-18-9Z" fill={look.hairShade}/>
    <path d="M-20 0q-6-3-6 4q0 8 6 8l2-7Z" fill={look.skin}/>
    <path d="M-23 3q3-2 3 3" fill="none" stroke={look.skinShade} strokeWidth={1.1} opacity={.65}/>
    <circle cx={-20.5} cy={11} r={1} fill="#D2B37D"/>
    <path d="M-10-31C4-36 19-26 24-17" fill="none" stroke="#57473E" strokeWidth={1.45} opacity={.32} strokeLinecap="round"/>
  </g>;
};
