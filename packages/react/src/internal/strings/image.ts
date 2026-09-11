/**
 * The words the picture comparison puts on the screen.
 *
 * The other half of the frame: what an empty pane invites, what the zoom
 * controls are called, how the changed areas are counted out. Together with
 * `COMMON` it is the whole table `ImageDiff` needs, and nothing here reaches a
 * page that only compares documents.
 */

import type { DiffineImageStrings, DiffineLocale } from '../../types.js';
import { COMMON } from './common.js';

const IMAGE: Record<DiffineLocale, Omit<DiffineImageStrings, keyof typeof COMMON.en>> = {
  en: {
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
    wipe: 'Drag to wipe between the two',
    picture: 'Picture {number}',
    at: 'At',
    loupeMove: 'Drag to move the magnified pixels',
    loupeSize: 'Drag to show more pixels'
  },
  ko: {
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
    wipe: '끌어서 나눠 보기',
    picture: '이미지 {number}',
    at: '좌표',
    loupeMove: '끌어서 확대 창 옮기기',
    loupeSize: '끌어서 더 넓은 범위 보기'
  }
};

/** The words for a locale, with whatever the application replaced put over them. */
export function imageStrings(
  locale: DiffineLocale,
  overrides: Partial<DiffineImageStrings> | undefined
): DiffineImageStrings {
  return {
    ...(COMMON[locale] ?? COMMON.en),
    ...(IMAGE[locale] ?? IMAGE.en),
    ...overrides
  };
}
