/**
 * The words the components put on the screen.
 *
 * There are not many, and there will not be many more: what these draw is two
 * documents, and everything else on the screen came out of those documents.
 * What is here is the frame around them — what each side is called, what an
 * empty field invites, what is said when there is nothing to show, what the
 * controls above and below the panes are named, and what a screen reader is
 * told about a view whose whole meaning is in its colours.
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
    folded: '{lines} unchanged lines',
    expand: 'Show {lines} unchanged lines',
    applyChange: 'Take this change into {label}',
    language: 'Syntax highlighting',
    summary: '{changes} changes, {inserted} lines added, {deleted} lines removed',
    documentSize: '{label}: {characters} characters, {size}',
    previousChange: 'Previous change',
    nextChange: 'Next change',
    changePosition: 'Change {position} of {total}',
    search: 'Find',
    searchIn: 'Find in {label}',
    searchPrevious: 'Previous match',
    searchNext: 'Next match',
    searchClose: 'Close find',
    searchPosition: 'Match {position} of {total}',
    searchEmpty: 'No matches',
    matchCase: 'Match case',
    wholeWord: 'Whole word',
    regex: 'Regular expression',
    replace: 'Replace',
    replaceWith: 'Replace with',
    replaceAll: 'Replace all',
    imageSize: '{label}: {width} × {height}, {size}',
    imageSummary: '{regions} changed areas, {percent}% of the picture',
    choose: 'Choose an image',
    chooseIn: 'Choose an image for {label}',
    unsupported: 'That file is not an image.',
    loading: 'Opening the picture',
    zoomOut: 'Zoom out',
    zoomIn: 'Zoom in',
    zoomFit: 'Fit to the pane',
    zoomLevel: '{percent}%',
    fade: 'Fade between the two',
    wipe: 'Drag to wipe between the two'
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
    folded: '변경 없는 {lines}줄',
    expand: '변경 없는 {lines}줄 펼치기',
    applyChange: '이 변경을 {label}에 적용',
    language: '구문 강조',
    summary: '변경 {changes}건, {inserted}줄 추가, {deleted}줄 삭제',
    documentSize: '{label}: {characters}자, {size}',
    previousChange: '이전 변경',
    nextChange: '다음 변경',
    changePosition: '변경 {total}건 중 {position}번째',
    search: '찾기',
    searchIn: '{label}에서 찾기',
    searchPrevious: '이전 결과',
    searchNext: '다음 결과',
    searchClose: '찾기 닫기',
    searchPosition: '결과 {total}건 중 {position}번째',
    searchEmpty: '결과 없음',
    matchCase: '대소문자 구분',
    wholeWord: '단어 단위',
    regex: '정규식',
    replace: '바꾸기',
    replaceWith: '바꿀 내용',
    replaceAll: '모두 바꾸기',
    imageSize: '{label}: {width} × {height}, {size}',
    imageSummary: '변경 {regions}곳, 전체의 {percent}%',
    choose: '이미지 고르기',
    chooseIn: '{label}에 넣을 이미지 고르기',
    unsupported: '이미지 파일이 아닙니다.',
    loading: '이미지를 읽는 중',
    zoomOut: '축소',
    zoomIn: '확대',
    zoomFit: '창에 맞추기',
    zoomLevel: '{percent}%',
    fade: '두 이미지 겹쳐 보기',
    wipe: '끌어서 나눠 보기'
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
