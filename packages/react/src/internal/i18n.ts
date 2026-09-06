/**
 * The words the components put on the screen.
 *
 * There are thirteen of them, and there will not be many more: what these draw is
 * two documents, and everything else on the screen came out of those documents.
 * What is here is the frame around them — what each side is called, what an
 * empty field invites, what is said when there is nothing to show, and what a
 * screen reader is told about a view whose whole meaning is in its colours.
 *
 * An application whose language is not on this list passes `strings` instead,
 * and one whose language is on it can still pass `strings` to change a word.
 */

import type { DiffineLocale, DiffineStrings } from '../types.js';

const LOCALES: Record<DiffineLocale, DiffineStrings> = {
  en: {
    before: 'Before',
    after: 'After',
    empty: 'Nothing to compare yet.',
    placeholder: 'Type or paste a document here.',
    identical: 'The two are the same.',
    added: 'Added',
    removed: 'Removed',
    changed: 'Changed',
    summary: '{changes} changes, {inserted} lines added, {deleted} lines removed',
    documentSize: '{label}: {characters} characters, {size}',
    previousChange: 'Previous change',
    nextChange: 'Next change',
    changePosition: 'Change {position} of {total}'
  },
  ko: {
    before: '이전',
    after: '이후',
    empty: '아직 비교할 내용이 없습니다.',
    placeholder: '여기에 문서를 입력하거나 붙여 넣으세요.',
    identical: '두 문서가 같습니다.',
    added: '추가됨',
    removed: '삭제됨',
    changed: '변경됨',
    summary: '변경 {changes}건, {inserted}줄 추가, {deleted}줄 삭제',
    documentSize: '{label}: {characters}자, {size}',
    previousChange: '이전 변경',
    nextChange: '다음 변경',
    changePosition: '변경 {total}건 중 {position}번째'
  }
};

/** The words for a locale, with whatever the application replaced put over them. */
export function stringsFor(
  locale: DiffineLocale,
  overrides: Partial<DiffineStrings> | undefined
): DiffineStrings {
  const base = LOCALES[locale] ?? LOCALES.en;

  return overrides ? { ...base, ...overrides } : base;
}

/** Fills `{name}` in a string with whatever was given for it. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)}/g, (whole, name: string) =>
    name in values ? String(values[name]) : whole
  );
}
