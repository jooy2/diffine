/**
 * The comparison itself: two buffers of pixels in, one byte a pixel out.
 *
 * Everything expensive about comparing two pictures is in the loop below, so
 * the loop is written for a machine rather than for a reader. What keeps it
 * affordable is the order the tests are in. Two pixels with the same four bytes
 * are settled in one comparison of one 32-bit word, which is what most of a
 * picture is; a pair that differs is measured; only a pair that differs by more
 * than the tolerance is looked at with its neighbours. A photograph saved twice
 * pays for the first test on nearly every pixel and for the third on almost
 * none.
 *
 * Everything above the loop is the frame. Two pictures of the same size laid
 * corner to corner need none of it, but two of different sizes, or two held a
 * few pixels apart, do not agree about where a pixel is — so both are placed in
 * a frame large enough to hold them, and the answer is written in the frame's
 * coordinates rather than in either picture's.
 */

import type { DiffImageArea, DiffImageResult, DiffImageStats, DiffPixels } from '../../types.js';
import type { Offset } from './align.js';
import { brightnessAt, distanceBetween } from './colour.js';
import { createCells, markPixel, regionsOf } from './regions.js';

/** What a byte of the mask means, in the order the bytes count. */
export const KINDS = ['equal', 'changed', 'added', 'removed'] as const;

/** The bytes themselves. Nothing writes `equal`: a fresh mask is already all of it. */
export const CHANGED = 1;
export const ADDED = 2;
export const REMOVED = 3;

/** Everything the comparison needs, already settled. */
export interface CompareOptions {
  tolerance: number;
  ignoreAntialiasing: boolean;
  blockSize: number;
  maxRegions: number;
  offset: Offset;
}

/** The frame the two pictures are compared in, and where each one sits in it. */
export interface Frame {
  width: number;
  height: number;
  before: DiffImageArea;
  after: DiffImageArea;
}

/**
 * A frame large enough for both pictures, with the second one moved by
 * `offset`.
 *
 * The two are placed rather than resized. Where only one of them reaches, the
 * comparison has nothing to compare and says so — those pixels come back as
 * `added` or `removed`, which is the same answer the text engine gives a line
 * with nothing opposite it.
 */
export function frameOf(before: DiffPixels, after: DiffPixels, offset: Offset): Frame {
  const left = Math.min(0, offset.x);
  const top = Math.min(0, offset.y);
  const right = Math.max(before.width, offset.x + after.width);
  const bottom = Math.max(before.height, offset.y + after.height);

  return {
    width: right - left,
    height: bottom - top,
    before: { x: -left, y: -top, width: before.width, height: before.height },
    after: { x: offset.x - left, y: offset.y - top, width: after.width, height: after.height }
  };
}

/**
 * The same buffer read four bytes at a time, so that two pixels can be told
 * apart in one comparison.
 *
 * A typed array can only be read as words when it starts on a boundary of four,
 * which is true of everything a canvas hands back and not guaranteed of a view
 * somebody built themselves. The rare buffer that is not gets copied into one
 * that is, which costs a pass over the picture and saves three quarters of the
 * comparisons after it.
 */
function wordsOf(data: Uint8ClampedArray): Uint32Array {
  if (data.byteOffset % 4 === 0) {
    return new Uint32Array(data.buffer, data.byteOffset, data.length >> 2);
  }

  return new Uint32Array(new Uint8Array(data).buffer);
}

/** Where a pixel is in a picture, in bytes, with anything outside it clamped in. */
function indexIn(image: DiffPixels, x: number, y: number): number {
  const column = x < 0 ? 0 : x >= image.width ? image.width - 1 : x;
  const row = y < 0 ? 0 : y >= image.height ? image.height - 1 : y;

  return (row * image.width + column) * 4;
}

/** How many of the eight pixels around one have to be exactly its colour. */
const ALIKE = 2;

/**
 * Whether one pixel sits inside something level: two of the pixels around it
 * are exactly the colour it is.
 *
 * Exactly rather than nearly, because "nearly" is what a texture is made of.
 * Two pixels of a photograph beside each other are almost always close and
 * almost never equal, and two pixels of a page a renderer filled are equal to
 * the byte.
 */
function levelAt(words: Uint32Array, width: number, height: number, x: number, y: number): boolean {
  const colour = words[y * width + x];

  let same = 0;

  for (let dy = -1; dy <= 1; dy += 1) {
    const row = y + dy;

    if (row < 0 || row >= height) {
      continue;
    }

    const at = row * width;

    for (let dx = -1; dx <= 1; dx += 1) {
      const column = x + dx;

      if ((dx === 0 && dy === 0) || column < 0 || column >= width) {
        continue;
      }

      if (words[at + column] === colour) {
        same += 1;

        if (same === ALIKE) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Whether there is anything level in reach of one pixel: any of the nine pixels
 * about it sits inside something level.
 *
 * Any of the nine rather than the pixel itself, because the pixel itself never
 * is — it is the blend, and a blend is by definition unlike everything around
 * it. What is being asked is whether there is a flat area nearby for an edge to
 * be the edge of. Small text is the case that decides the reach: a letter at
 * sixteen pixels is thin enough that the darkest pixel beside a blend is often
 * another blend, and the page it is printed on is one pixel further out.
 */
function levelAround(
  words: Uint32Array,
  width: number,
  height: number,
  x: number,
  y: number
): boolean {
  for (let dy = -1; dy <= 1; dy += 1) {
    const row = y + dy;

    if (row < 0 || row >= height) {
      continue;
    }

    for (let dx = -1; dx <= 1; dx += 1) {
      const column = x + dx;

      if (column < 0 || column >= width) {
        continue;
      }

      if (levelAt(words, width, height, column, row)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * How strong the edge one pixel is sitting on is, and zero when it is not
 * sitting on one.
 *
 * Two things have to hold. The pixel has to lie between its neighbours rather
 * than be the brightest or the darkest thing among them, which is what a colour
 * of its own looks like. And there has to be something level in reach of it, so
 * that the step it lies across is the edge of something rather than two pixels
 * that happen to be unalike.
 *
 * The second test is the one that matters on a photograph. Nearly every pixel
 * of a textured picture lies between the pixels around it and the range across
 * a texture is most of the scale, so without it the allowance below is wide
 * enough to swallow a change that really happened — a patch cloned over a rainy
 * window came back as a fifth of the pixels it covers. What comes back is the
 * range of brightness across the neighbourhood, which is the largest change the
 * edge running through it could account for.
 */
function blendAt(image: DiffPixels, words: Uint32Array, x: number, y: number): number {
  const centre = brightnessAt(image.data, indexIn(image, x, y));

  let low = 256;
  let high = -1;

  for (let dy = -1; dy <= 1; dy += 1) {
    const row = y + dy < 0 ? 0 : y + dy >= image.height ? image.height - 1 : y + dy;

    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) {
        continue;
      }

      const column = x + dx < 0 ? 0 : x + dx >= image.width ? image.width - 1 : x + dx;
      const beside = brightnessAt(image.data, (row * image.width + column) * 4);

      if (beside < low) {
        low = beside;
      }

      if (beside > high) {
        high = beside;
      }
    }
  }

  if (centre <= low || centre >= high) {
    return 0;
  }

  return levelAround(words, image.width, image.height, x, y) ? (high - low) / 255 : 0;
}

/**
 * The test for a pixel that only differs because an edge was drawn smooth.
 *
 * A renderer draws a diagonal by putting part of the line's colour into the
 * pixels either side of where it really falls, and how much each one gets is
 * its own arithmetic. So the same page drawn twice by two of them differs along
 * every letter and every curve, in a way that has nothing to do with the page
 * having changed.
 *
 * What tells that apart from a real change is what the pixel is. It has to be
 * sitting on an edge in at least one of the two pictures — see {@link blendAt}
 * — and the change has to be no larger than the step that edge is, so that
 * moving the line under it accounts for what happened. A pixel that went from
 * white to black in the middle of a white field is on no edge at all, and a
 * pixel of a texture is on a step that belongs to no edge either.
 */
function smoothingTest(
  before: DiffPixels,
  beforeWords: Uint32Array,
  after: DiffPixels,
  afterWords: Uint32Array
): (bx: number, by: number, ax: number, ay: number, distance: number) => boolean {
  return (bx, by, ax, ay, distance) => {
    const step = Math.max(blendAt(before, beforeWords, bx, by), blendAt(after, afterWords, ax, ay));

    return step > 0 && distance <= step;
  };
}

/** Two pictures, compared pixel by pixel in the frame that holds both. */
export function comparePixels(
  before: DiffPixels,
  after: DiffPixels,
  options: CompareOptions
): DiffImageResult {
  const frame = frameOf(before, after, options.offset);
  const { width, height } = frame;
  const mask = new Uint8Array(width * height);
  const cells = createCells(width, height, Math.max(1, Math.floor(options.blockSize)));

  const beforeWords = wordsOf(before.data);
  const afterWords = wordsOf(after.data);
  const isSmoothing = smoothingTest(before, beforeWords, after, afterWords);

  let changed = 0;
  let added = 0;
  let removed = 0;
  // How far apart the pixels both pictures cover are, added up. Every pixel
  // settled by the word comparison is nought and adds nothing, and every pixel
  // past it has already been measured — so the total costs one addition on the
  // pixels that were going to be measured anyway.
  let apart = 0;

  for (let y = 0; y < height; y += 1) {
    const beforeRow = y - frame.before.y;
    const afterRow = y - frame.after.y;
    const onBefore = beforeRow >= 0 && beforeRow < before.height;
    const onAfter = afterRow >= 0 && afterRow < after.height;

    if (!onBefore && !onAfter) {
      continue;
    }

    const row = y * width;

    for (let x = 0; x < width; x += 1) {
      const beforeColumn = x - frame.before.x;
      const afterColumn = x - frame.after.x;
      const inBefore = onBefore && beforeColumn >= 0 && beforeColumn < before.width;
      const inAfter = onAfter && afterColumn >= 0 && afterColumn < after.width;

      if (inBefore && inAfter) {
        const first = beforeRow * before.width + beforeColumn;
        const second = afterRow * after.width + afterColumn;

        if (beforeWords[first] === afterWords[second]) {
          continue;
        }

        const distance = distanceBetween(before.data, first * 4, after.data, second * 4);

        apart += distance;

        if (distance <= options.tolerance) {
          continue;
        }

        if (
          options.ignoreAntialiasing &&
          isSmoothing(beforeColumn, beforeRow, afterColumn, afterRow, distance)
        ) {
          continue;
        }

        mask[row + x] = CHANGED;
        changed += 1;
      } else if (inAfter) {
        mask[row + x] = ADDED;
        added += 1;
      } else if (inBefore) {
        mask[row + x] = REMOVED;
        removed += 1;
      } else {
        continue;
      }

      markPixel(cells, x, y);
    }
  }

  /*
   * How much of the frame each picture reaches, worked out from the rectangles
   * rather than counted in the loop. A counter there would be an increment on
   * every pixel of the picture to answer a question two multiplications answer
   * — and the corner of a frame that neither picture reaches is a real corner,
   * left by two pictures one of which is wider and the other taller.
   */
  const overlap =
    Math.max(
      0,
      Math.min(frame.before.x + before.width, frame.after.x + after.width) -
        Math.max(frame.before.x, frame.after.x)
    ) *
    Math.max(
      0,
      Math.min(frame.before.y + before.height, frame.after.y + after.height) -
        Math.max(frame.before.y, frame.after.y)
    );
  const covered = before.width * before.height + after.width * after.height - overlap;
  const stats: DiffImageStats = {
    pixels: width * height,
    covered,
    unchanged: overlap - changed,
    changed,
    added,
    removed,
    ratio: covered === 0 ? 0 : (changed + added + removed) / covered,
    distance: overlap === 0 ? 0 : apart / overlap
  };
  const { regions, complete } = regionsOf(cells, Math.max(1, Math.floor(options.maxRegions)));

  return {
    width,
    height,
    before: frame.before,
    after: frame.after,
    offset: { ...options.offset },
    mask,
    regions,
    stats,
    complete
  };
}
