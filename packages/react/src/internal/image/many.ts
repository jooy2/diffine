/**
 * Several pictures compared at once, out of the comparison of two.
 *
 * Nothing here compares a pixel. Every pair is `comparePixels`, exactly as a
 * pair on its own would be, and what this adds is the two things a list needs
 * that a pair does not: one frame large enough for all of them, and one mask
 * that says which of them disagree rather than that two of them do.
 *
 * Built that way on purpose. A second comparison loop would be a second place
 * for the tolerance, the smoothing test and the frame arithmetic to be right
 * in, and the two would drift. It costs the mask of one pair at a time, which
 * is merged and let go before the next pair is compared.
 */

import type { DiffImageArea, DiffImagesResult, DiffImagesStats, DiffPixels } from '../../types.js';
import type { Offset } from './align.js';
import { comparePixels, type CompareOptions } from './compare.js';
import { createCells, markPixel, regionsOf } from './regions.js';

/** Everything a comparison of several needs, already settled. */
export interface ManyOptions extends Omit<CompareOptions, 'offset'> {
  baseline: number;
  /** How far each picture sits from the baseline, in the order they were given. */
  offsets: readonly Offset[];
}

/** The frame that holds every picture once its offset is applied. */
function frameOfAll(
  pictures: readonly DiffPixels[],
  offsets: readonly Offset[]
): { width: number; height: number; areas: DiffImageArea[] } {
  let left = 0;
  let top = 0;
  let right = 0;
  let bottom = 0;

  for (const [at, picture] of pictures.entries()) {
    const offset = offsets[at];

    left = Math.min(left, offset.x);
    top = Math.min(top, offset.y);
    right = Math.max(right, offset.x + picture.width);
    bottom = Math.max(bottom, offset.y + picture.height);
  }

  return {
    width: right - left,
    height: bottom - top,
    areas: pictures.map((picture, at) => ({
      x: offsets[at].x - left,
      y: offsets[at].y - top,
      width: picture.width,
      height: picture.height
    }))
  };
}

/**
 * How many pixels of one row at least one picture reaches.
 *
 * Counted from the rectangles rather than from the pixels, because a rectangle
 * knows where it starts and stops and a pixel has to be asked. The spans are
 * put in order and run together, which for the usual list — pictures of one
 * size laid corner to corner — is one span the width of the frame.
 */
function coveredIn(areas: readonly DiffImageArea[], y: number, width: number): number {
  const spans: [number, number][] = [];

  for (const area of areas) {
    if (y < area.y || y >= area.y + area.height) {
      continue;
    }

    const from = Math.max(0, area.x);
    const to = Math.min(width, area.x + area.width);

    if (to > from) {
      spans.push([from, to]);
    }
  }

  spans.sort((one, other) => one[0] - other[0]);

  let counted = 0;
  let reached = -1;

  for (const [from, to] of spans) {
    const start = Math.max(from, reached);

    if (to > start) {
      counted += to - start;
      reached = to;
    }
  }

  return counted;
}

/** Several pictures, compared against the one named as the baseline. */
export function compareMany(
  pictures: readonly DiffPixels[],
  options: ManyOptions
): DiffImagesResult {
  const { baseline, offsets } = options;
  const frame = frameOfAll(pictures, offsets);
  const { width, height } = frame;
  const mask = new Uint8Array(width * height);
  const apart = pictures.map(() => 0);

  for (const [at, picture] of pictures.entries()) {
    if (at === baseline) {
      continue;
    }

    /*
     * The pair, in its own frame, and where that frame sits in the large one.
     * A pair holds the baseline and one picture, so its frame is a part of the
     * frame that holds all of them, and never the other way round.
     */
    const pair = comparePixels(pictures[baseline], picture, {
      ...options,
      offset: offsets[at]
    });
    const left = frame.areas[baseline].x - pair.before.x;
    const top = frame.areas[baseline].y - pair.before.y;
    const bit = 1 << at;

    let counted = 0;

    for (let y = 0; y < pair.height; y += 1) {
      const from = y * pair.width;
      const into = (y + top) * width + left;

      for (let x = 0; x < pair.width; x += 1) {
        if (pair.mask[from + x] !== 0) {
          mask[into + x] |= bit;
          counted += 1;
        }
      }
    }

    apart[at] = counted;
  }

  /*
   * What came out, read back once: where the changes are, and how much of the
   * frame any picture reaches. Neither is a pair's answer — a pair's frame is
   * smaller and its regions are only its own.
   */
  const cells = createCells(width, height, Math.max(1, Math.floor(options.blockSize)));

  let changed = 0;
  let covered = 0;

  for (let y = 0; y < height; y += 1) {
    const row = y * width;

    covered += coveredIn(frame.areas, y, width);

    for (let x = 0; x < width; x += 1) {
      if (mask[row + x] !== 0) {
        changed += 1;
        markPixel(cells, x, y);
      }
    }
  }

  const stats: DiffImagesStats = {
    pixels: width * height,
    covered,
    unchanged: covered - changed,
    changed,
    ratio: covered === 0 ? 0 : changed / covered,
    apart
  };
  const { regions, complete } = regionsOf(cells, Math.max(1, Math.floor(options.maxRegions)));

  return {
    width,
    height,
    areas: frame.areas,
    offsets: offsets.map((offset) => ({ ...offset })),
    baseline,
    mask,
    regions,
    stats,
    complete
  };
}
