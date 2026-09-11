/**
 * The words the document comparison puts on the screen.
 *
 * The half of the frame `TextDiff` draws and `ImageDiff` never asks for: what a
 * band of hidden lines says, what the search bar's switches are called, how the
 * counts under the panes are read out. Together with `COMMON` it is the whole
 * table that component needs, and nothing here reaches a page that only
 * compares pictures.
 */

import type { DiffineLocale, DiffineTextStrings } from '../../types.js';
import { COMMON } from './common.js';

const TEXT: Record<DiffineLocale, Omit<DiffineTextStrings, keyof typeof COMMON.en>> = {
  en: {
    placeholder: 'Type or paste a document here.',
    added: 'Added',
    removed: 'Removed',
    changed: 'Changed',
    folded: '{lines} unchanged lines',
    expand: 'Show {lines} unchanged lines',
    applyChange: 'Take this change into {label}',
    format: '{before} → {after}',
    mixedEndings: 'mixed',
    noFinalNewline: 'no final newline',
    language: 'Syntax highlighting',
    summary: '{changes} changes, {inserted} lines added, {deleted} lines removed',
    documentSize: '{label}: {characters} characters, {size}',
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
    replaceAll: 'Replace all'
  },
  ko: {
    placeholder: '여기에 문서를 입력하거나 붙여 넣으세요.',
    added: '추가됨',
    removed: '삭제됨',
    changed: '변경됨',
    folded: '변경 없는 {lines}줄',
    expand: '변경 없는 {lines}줄 펼치기',
    applyChange: '이 변경을 {label}에 적용',
    format: '{before} → {after}',
    mixedEndings: '혼용',
    noFinalNewline: '끝 개행 없음',
    language: '구문 강조',
    summary: '변경 {changes}건, {inserted}줄 추가, {deleted}줄 삭제',
    documentSize: '{label}: {characters}자, {size}',
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
    replaceAll: '모두 바꾸기'
  }
};

/** The words for a locale, with whatever the application replaced put over them. */
export function textStrings(
  locale: DiffineLocale,
  overrides: Partial<DiffineTextStrings> | undefined
): DiffineTextStrings {
  return {
    ...(COMMON[locale] ?? COMMON.en),
    ...(TEXT[locale] ?? TEXT.en),
    ...overrides
  };
}
