import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {FONT} from '../../theme';
import {ip, smooth} from '../alan';
import {lawClauseIndex} from '../lawReading';
import {CIVIL_MARKS, CIVIL_QUOTES, COMPENSATION_MARKS, COMPENSATION_QUOTES, CRIMINAL_MARKS, CRIMINAL_QUOTES, compensationPhaseAt, windowStateAt} from '../legalFlow';

const GREEN='#89BFA9', CREAM='#EEEADB', AMBER='#DFB778', RED='#D88A73';
const Backdrop: React.FC<{criminal?:boolean}> = ({criminal=false}) => <>
  <Img src={staticFile('film-v19/upward.png')} style={{position:'absolute',width:1920,height:1080,opacity:criminal?.22:.27}}/>
  <AbsoluteFill style={{background:criminal?'linear-gradient(110deg,rgba(25,23,25,.85),rgba(37,29,27,.8))':'linear-gradient(110deg,rgba(11,31,35,.7),rgba(10,24,29,.92))'}}/>
</>;

/** One legible original clause, supplying the legal narration captions. */
export const LegalQuotation: React.FC<{text:string;cite:string;active:number;count:number;criminal?:boolean}> = ({text,cite,active,count,criminal=false}) => <div data-law-part="quotation" style={{position:'absolute',left:128,top:738,width:1664,height:232,background:'#ECEADF',color:'#263D3F',boxShadow:'0 8px 24px #07131855'}}>
  <div style={{position:'absolute',left:0,top:0,bottom:0,width:5,background:criminal?'#A75B46':'#3D7E70'}}/>
  <div style={{position:'absolute',left:30,top:17,fontFamily:FONT.sans,fontSize:23,color:'#61776E',letterSpacing:2}}>法条原文 · 节选</div>
  <div data-law-part="quote-text" style={{position:'absolute',left:30,right:30,top:57,fontFamily:FONT.serif,fontSize:text.length>28?52:56,lineHeight:1.4,fontWeight:500}}>{text}</div>
  <div data-law-part="citation" style={{position:'absolute',left:30,bottom:20,fontFamily:FONT.sans,fontSize:28,color:'#506960'}}>{cite}</div>
  <div style={{position:'absolute',right:32,bottom:24,display:'flex',gap:9}}>{Array.from({length:count},(_,i)=><div key={i} style={{width:i===active?44:14,height:4,background:i===active?'#467D70':'#A6B8AA'}}/>)}</div>
</div>;

const Chapter: React.FC<{label:string;title:string;note?:string}> = ({label,title,note}) => <>
  <div data-law-part="condition" style={{position:'absolute',left:132,top:96,fontFamily:FONT.sans,fontSize:36,lineHeight:1.2,color:GREEN,letterSpacing:2}}>{label}</div>
  <div data-law-part="headline" style={{position:'absolute',left:128,top:155,fontFamily:FONT.sans,fontSize:66,fontWeight:700,color:CREAM,letterSpacing:1}}>{title}</div>
  {note?<div style={{position:'absolute',left:132,top:245,fontFamily:FONT.sans,fontSize:28,color:'#B4C6BC'}}>{note}</div>:null}
</>;

export const CivilResponsibility: React.FC<{start:number}> = ({start}) => {
  const frame=useCurrentFrame(), t=start+frame/60,active=lawClauseIndex(t,CIVIL_MARKS);
  const enter=ip(t,[CIVIL_MARKS[active],CIVIL_MARKS[active]+.42],[0,1],smooth);
  return <AbsoluteFill>
    <Backdrop/>
    <Chapter label="第一步 · 明确侵权责任" title={active===0?'物品造成损害，责任不能凭猜测':'由侵权人，依法承担侵权责任'} note={active===0?'受损事实与责任认定，都需要证据。':'查明实际侵权人时，依法向其主张损害赔偿。'}/>
    <div style={{position:'absolute',left:132,top:312,width:850,height:365,overflow:'hidden',border:'2px solid #9CB0A5'}}>
      <Img src={staticFile('film-v18/basket-detail.png')} style={{width:'100%',height:'100%',objectFit:'cover',transform:`scale(${1.04+frame*.00005})`}}/>
      <div style={{position:'absolute',left:20,bottom:18,fontFamily:FONT.sans,fontSize:26,padding:'8px 14px',background:'#101F26DC',color:CREAM}}>受损车筐 · 画面示意</div>
      <svg width={850} height={365} style={{position:'absolute',inset:0}}><circle cx={650} cy={173} r={51} fill="none" stroke={AMBER} strokeWidth={3}/><path d="M702 173h92" stroke={AMBER} strokeWidth={2}/></svg>
    </div>
    <div style={{position:'absolute',left:1105,top:325,width:660,color:CREAM,fontFamily:FONT.sans,opacity:.5+.5*enter,transform:`translateY(${12*(1-enter)}px)`}}>
      <div style={{fontSize:29,color:GREEN,letterSpacing:3}}>{active===0?'先保全现场证据':'责任回到实际侵权人'}</div>
      <div style={{fontSize:70,fontWeight:700,marginTop:30,lineHeight:1.28}}>{active===0?<>损害事实<br/><span style={{color:AMBER}}>有证据可查</span></>:<>侵权责任<br/><span style={{color:AMBER}}>依法承担</span></>}</div>
      <svg width={580} height={80}><path d="M8 45h520m-18-14 18 14-18 14" fill="none" stroke={GREEN} strokeWidth={3} pathLength={1} strokeDasharray={1} strokeDashoffset={1-enter}/></svg>
    </div>
    <LegalQuotation text={CIVIL_QUOTES[active]} cite="《民法典》第1254条第一款（节选）" active={active} count={2}/>
  </AbsoluteFill>;
};

const WINDOW_PLANES = [
  [[292,54],[426,73],[406,154],[267,137]], [[626,109],[744,128],[743,220],[611,201]],
  [[916,161],[1031,184],[1040,266],[925,246]], [[1197,218],[1300,238],[1320,329],[1205,308]],
  [[240,235],[391,264],[374,371],[207,347]], [[604,298],[739,324],[735,438],[594,411]],
  [[929,349],[1060,375],[1066,479],[935,458]], [[1248,408],[1364,429],[1393,536],[1269,514]],
  [[186,470],[345,497],[321,636],[130,604]], [[571,529],[735,556],[733,692],[558,669]],
  [[943,579],[1080,604],[1092,738],[946,710]], [[1304,650],[1422,678],[1454,808],[1330,776]],
];
const windowCenter=(i:number)=>({x:WINDOW_PLANES[i].reduce((sum,p)=>sum+p[0],0)/4,y:WINDOW_PLANES[i].reduce((sum,p)=>sum+p[1],0)/4});
const BuildingFlow: React.FC<{t:number;phase:number}> = ({t,phase}) => {
  const cells:React.ReactNode[]=[], flows:React.ReactNode[]=[];
  const target=windowCenter(6), basket={x:1880,y:675};
  for(let i=0;i<WINDOW_PLANES.length;i++) {
    const state=windowStateAt(Math.floor(i/4),i%4,phase), at=windowCenter(i);
    const color=state==='excluded'?GREEN:state==='identified'?RED:state==='possible'?AMBER:'#BCC9BF';
    const fill=state==='excluded'?'#143B39':state==='identified'?'#8A4F3D':state==='possible'?'#9C763B':'#1B2D33';
    const reveal=phase===1?ip(t,[41.7+i*.08,42.1+i*.08],[0,1],smooth):1;
    cells.push(<g key={i}>
      <polygon points={WINDOW_PLANES[i].map(p=>p.join(',')).join(' ')} fill={fill} fillOpacity={state==='unknown'?.72:.6} stroke={color} strokeWidth={state==='unknown'?3:5}/>
      {state==='excluded'?<path d={`M${at.x-24} ${at.y}l18 19 36-40`} fill="none" stroke={GREEN} strokeWidth={9} strokeLinecap="round" opacity={reveal}/>:null}
      {state==='unknown'?<text x={at.x} y={at.y+23} textAnchor="middle" fill="#E2E5D6" fontSize={66}>?</text>:null}
      {state==='possible'?<circle cx={at.x} cy={at.y} r={18} fill={AMBER}/>:null}
      {state==='identified'?<g fill={RED}><circle cx={at.x} cy={at.y-16} r={20}/><path d={`M${at.x-35} ${at.y+40}q0-37 35-37t35 37z`}/></g>:null}
    </g>);
    if(state==='possible' && phase===2) {
      const travel=ip(t,[45.2+i*.1,47.5+i*.1],[0,1],smooth);
      if(travel>0 && travel<1) flows.push(<circle key={`pay-${i}`} cx={at.x+(basket.x-at.x)*travel} cy={at.y+(basket.y-at.y)*travel} r={14} fill={AMBER} opacity={Math.sin(travel*Math.PI)}/>);
    }
    if(state==='possible' && phase===3) {
      const progress=ip(t,[49.0+i*.06,50.3+i*.06],[0,1],smooth);
      flows.push(<path key={`recover-${i}`} d={`M${at.x} ${at.y}Q${at.x+140} ${at.y-100} ${target.x} ${target.y}`} fill="none" stroke={AMBER} strokeWidth={5} opacity={.8} pathLength={1} strokeDasharray={1} strokeDashoffset={1-progress}/>);
    }
  }
  return <svg width={1040} height={465} viewBox="0 0 2105 941" style={{position:'absolute',left:130,top:264}}>
    <image href={staticFile('film-v19/upward.png')} x={0} y={0} width={1672} height={941}/>
    {cells}{flows}
    <g transform={`translate(${basket.x} ${basket.y})`}>
      <path d="M-100-64H100L80 64H-80Z" fill="#21292D" stroke="#BBC6B8" strokeWidth={7}/>
      {[-54,-18,18,54].map(x=><path key={x} d={`M${x} -53v100`} stroke="#7D8E85" strokeWidth={9}/>)}
      <path d="M40-64l-12 38 20 23-22 27" fill="none" stroke={RED} strokeWidth={7}/>
      <text y={136} textAnchor="middle" fontFamily={FONT.sans} fill={CREAM} fontSize={48}>受损一方</text>
    </g>
    <rect x={24} y={858} width={1590} height={68} fill="#0E2027" fillOpacity={.94}/>
    <text x={68} y={905} fontFamily={FONT.sans} fill="#C5D7C7" fontSize={42}>教学示意 · 实际范围须依法调查确定</text>
  </svg>;
};

export const ConditionalCompensation: React.FC<{start:number}> = ({start}) => {
  const t=start+useCurrentFrame()/60, phase=compensationPhaseAt(t);
  const heading=['先调查','能证明不是自己','可能加害的使用人','后来查明侵权人'][phase];
  const outcome=['仍难确定侵权人','依法排除','给予补偿','有权追偿'][phase];
  return <AbsoluteFill>
    <Backdrop/>
    <Chapter label="假设分支 · 经调查仍难确定侵权人时" title="找不到谁扔的，也不能整栋一概收钱"/>
    <BuildingFlow t={t} phase={phase}/>
    <div data-law-part="branch-summary" style={{position:'absolute',left:1200,top:302,width:590,height:390,fontFamily:FONT.sans,color:CREAM}}>
      <div style={{position:'absolute',top:0,fontSize:54,fontWeight:600,lineHeight:1.2}}>{heading}</div>
      <div style={{position:'absolute',top:92,fontSize:72,lineHeight:1.2,fontWeight:700,color:phase===3?AMBER:GREEN}}>{outcome}</div>
      <div style={{position:'absolute',top:188,width:90,height:3,background:GREEN}}/>
      <div style={{position:'absolute',top:212,fontSize:34,color:'#BBCEC2',lineHeight:1.45}}>{['先调查，再判断补偿责任。','不是所有建筑物使用人都要补偿。','补偿范围须依法调查确定。','补偿人可向实际侵权人追偿。'][phase]}</div>
      <div style={{position:'absolute',top:332,display:'flex',gap:24}}>{COMPENSATION_MARKS.map((_,i)=><span key={i} style={{fontSize:30,color:i===phase?CREAM:'#65837A',borderBottom:i===phase?'2px solid #9CC7B2':'2px solid transparent',paddingBottom:7}}>{['调查','排除','补偿','追偿'][i]}</span>)}</div>
    </div>
    <LegalQuotation text={COMPENSATION_QUOTES[phase]} cite="《民法典》第1254条第一款（节选）" active={phase} count={4}/>
  </AbsoluteFill>;
};

export const CriminalBoundary: React.FC<{start:number}> = ({start}) => {
  const frame=useCurrentFrame(),t=start+frame/60,phase=lawClauseIndex(t,CRIMINAL_MARKS);
  const enter=ip(t,[CRIMINAL_MARKS[phase],CRIMINAL_MARKS[phase]+.45],[0,1],smooth);
  return <AbsoluteFill>
    <Backdrop criminal/>
    <div data-law-part="condition" style={{position:'absolute',left:132,top:100,color:RED,fontFamily:FONT.sans,fontSize:36,letterSpacing:1.5}}>刑事责任提示 · 适用前提：<span style={{fontSize:42,fontWeight:600,color:AMBER}}>情节严重</span> · 须依法认定</div>
    <div data-law-part="headline" style={{position:'absolute',left:128,top:172,fontFamily:FONT.sans,fontSize:67,color:CREAM,fontWeight:700}}>高空抛物，还可能触及刑责</div>
    <div style={{position:'absolute',left:128,top:305,width:1664,height:374,opacity:.5+.5*enter,transform:`translateY(${12*(1-enter)}px)`,fontFamily:FONT.sans,color:CREAM}}>
      {phase===0?<>
        <svg width={490} height={360}><path d="M245 35 425 325H65Z" fill="#382D2B" stroke={RED} strokeWidth={6}/><path d="M245 129v98" stroke={RED} strokeWidth={10} strokeLinecap="round"/><circle cx={245} cy={272} r={7} fill={RED}/></svg>
        <div style={{position:'absolute',left:620,top:35,fontSize:112,fontWeight:700,color:AMBER}}>情节严重</div>
        <div style={{position:'absolute',left:624,top:211,fontSize:36,color:'#D0C8B6'}}>须结合具体事实与证据依法认定</div>
      </>:phase===1?<>
        {['有期徒刑','拘役','管制'].map((label,i)=><div data-penalty={label} key={label} style={{position:'absolute',left:i*570,top:24,width:480,textAlign:'center'}}>
          <div style={{fontSize:31,color:'#BDBEAF',letterSpacing:4}}>依法适用</div>
          <div style={{fontSize:80,fontWeight:700,color:AMBER,marginTop:38}}>{label}</div>
          <div style={{fontSize:i===0?52:30,marginTop:24,color:i===0?CREAM:'#BCBFAF'}}>{i===0?'一年以下':'刑法规定的刑罚种类'}</div>
          {i<2?<div data-law-part="alternative" style={{position:'absolute',left:493,top:128,fontSize:54,color:'#D1D8CB'}}>或</div>:null}
        </div>)}
      </>:<>
        <div style={{position:'absolute',left:160,top:80,fontSize:58}}>并处或者单处</div>
        <div style={{position:'absolute',left:800,top:4,fontSize:162,fontWeight:700,color:AMBER,letterSpacing:16}}>罚金</div>
        <div style={{position:'absolute',left:805,top:232,fontSize:30,color:'#D3CCB8'}}>与前述刑罚规则结合理解</div>
      </>}
    </div>
    <LegalQuotation text={CRIMINAL_QUOTES[phase]} cite="《刑法》第291条之二第一款" active={phase} count={3} criminal/>
  </AbsoluteFill>;
};
