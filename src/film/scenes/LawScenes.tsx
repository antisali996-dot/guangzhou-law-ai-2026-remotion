import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {LawFocus, LawCompanion} from '../LawFocus';
import {LAW_HEADINGS} from '../lawReading';
export {CivilResponsibility as S06Law, ConditionalCompensation as S07Law, CriminalBoundary as S09Law} from './LegalStory';

export const S05Law: React.FC<{start:number}> = ({start}) => <AbsoluteFill>
  <Img src={staticFile('film-v19/upward.png')} style={{position:'absolute',width:1920,height:1080,opacity:.5}}/>
  <LawCompanion active={0}/>
  <LawFocus start={start} lines={['禁止从建筑物中抛掷物品。']} marks={[26]} active={0}
    headings={LAW_HEADINGS.s05} section="禁止高空抛物" cite="《民法典》第1254条第一款（节选）"/>
</AbsoluteFill>;
