/**
 * The words both viewers put on the screen, and the one thing done to a word.
 *
 * There are not many words in Diffine and there will not be many more: what it
 * draws is two documents, and everything else on the screen came out of those
 * two. What is here is the frame around them, and only the part of that frame
 * both viewers share — the rest is in `text.ts` and `image.ts`, so that a page
 * with one of them on it carries the words for one of them.
 *
 * An application whose language is not on this list passes `strings` instead,
 * and one whose language is on it can still pass `strings` to change a word.
 */

import type { DiffineCommonStrings, DiffineLocale } from '../../types.js';

export const COMMON: Record<DiffineLocale, DiffineCommonStrings> = {
  en: {
    before: 'Before',
    after: 'After',
    empty: 'Nothing to compare yet.',
    identical: 'The two are the same.',
    previousChange: 'Previous change',
    nextChange: 'Next change',
    changePosition: 'Change {position} of {total}'
  },
  ko: {
    before: '이전',
    after: '이후',
    empty: '아직 비교할 내용이 없습니다.',
    identical: '두 문서가 같습니다.',
    previousChange: '이전 변경',
    nextChange: '다음 변경',
    changePosition: '변경 {total}건 중 {position}번째'
  }
};

/** Fills `{name}` in a string with whatever was given for it. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)}/g, (whole, name: string) =>
    name in values ? String(values[name]) : whole
  );
}
