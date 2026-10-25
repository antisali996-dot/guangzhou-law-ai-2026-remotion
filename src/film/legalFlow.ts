import {lawClauseIndex} from './lawReading';
import {SCENES, f} from './timeline';

export const COMPENSATION_MARKS = [38.7, 41.589, 44.768, 48.825] as const;
export const CRIMINAL_MARKS = [59.5, 63.964, 67.79] as const;
export const CIVIL_MARKS = [29.2, 35.319] as const;
export const CIVIL_QUOTES = ['从建筑物中抛掷物品或者从建筑物上坠落的物品造成他人损害的，', '由侵权人依法承担侵权责任；'] as const;
export const COMPENSATION_QUOTES = ['经调查难以确定具体侵权人的，', '除能够证明自己不是侵权人的外，', '由可能加害的建筑物使用人给予补偿。', '可能加害的建筑物使用人补偿后，有权向侵权人追偿。'] as const;
export const CRIMINAL_QUOTES = ['从建筑物或者其他高空抛掷物品，情节严重的，', '处一年以下有期徒刑、拘役或者管制，', '并处或者单处罚金。'] as const;

export const compensationPhaseAt = (seconds: number) => lawClauseIndex(seconds, COMPENSATION_MARKS);
export type WindowState = 'unknown' | 'excluded' | 'possible' | 'identified';
/** Teaching example only: actual possible-user scope is determined through investigation. */
export const windowStateAt = (row: number, col: number, phase: number): WindowState => {
  if (phase === 0) return 'unknown';
  const possible = row < 2 && (col === 1 || col === 2);
  if (!possible) return 'excluded';
  if (phase === 1) return 'unknown';
  if (phase === 3 && row === 1 && col === 2) return 'identified';
  return 'possible';
};

/** The quotation itself supplies narration subtitles on these scenes. */
export const isLegalFrame = (frame: number): boolean => SCENES.some(s =>
  ['s05', 's06', 's07', 's09'].includes(s.id) && frame >= f(s.start) && frame < f(s.end));
