import {f} from './timeline';

/** Select the spoken clause on the same rounded frame as the audio timeline. */
export const lawClauseIndex = (seconds: number, marks: readonly number[]): number => {
  if (!marks.length) throw new Error('A law reading needs at least one narration mark');
  let index = 0;
  for (let i = 1; i < marks.length; i++) if (f(seconds) >= f(marks[i])) index = i;
  return index;
};

export const LAW_HEADINGS = {
  s05: ['高空抛物\n法律明令禁止'],
  s06: ['物品造成\n他人损害', '由侵权人\n承担侵权责任'],
  s07: ['先调查\n不是整栋一概赔', '能证明不是自己\n依法排除', '可能加害的使用人\n给予补偿', '补偿之后\n有权追偿'],
  s09: ['情节严重\n可能构成犯罪', '一年以下有期徒刑\n拘役或者管制', '并处或者单处\n罚金'],
} as const;
