/**
 * Where the second picture has to be put for the two to line up.
 *
 * A picture moved one pixel to the right is, to a comparison that starts both
 * of them at the top-left corner, a picture where every edge in it changed.
 * That is the honest answer to the question that was asked and almost never the
 * one anybody wanted, and it is what this exists to avoid: before the pixels
 * are compared, an offset is looked for that puts the most of one picture on
 * top of the most of the other.
 *
 * The search is coarse first. Trying every offset within sixteen pixels of the
 * corner is a thousand-odd whole-picture comparisons, which costs more than the
 * comparison it is preparing for; trying them on a picture shrunk to a
 * thumbnail costs nothing, and the answer that comes back is right to within a
 * pixel of the thumbnail — so the picture is halved until it is small, the
 * offset is found there, and each step back up refines it by one pixel on the
 * finer grid. What that turns a thousand comparisons into is a few dozen.
 */

import type { DiffPixels } from '../../types.js';
import { brightnessOf } from './colour.js';

/** How far the second picture sits from the first, in pixels. */
export interface Offset {
  x: number;
  y: number;
}

export const NO_OFFSET: Offset = { x: 0, y: 0 };

/** One picture in one byte a pixel, at one size. */
interface Level {
  grey: Uint8Array;
  width: number;
  height: number;
}

/** Nothing smaller than this is worth halving again. */
const SMALLEST = 24;

/** How many times a picture may be halved, however wide the search is. */
const DEEPEST = 5;

/** The share of the smaller picture an offset has to keep overlapping to count. */
const ENOUGH = 0.25;

/**
 * How many pixels one candidate offset is scored over, at most.
 *
 * The finest level of the pyramid is the whole picture, and scoring nine
 * candidates across ten million pixels costs more than the comparison this is
 * preparing for. Every fourth pixel of a large one says the same thing about
 * where an edge falls as all of them do, so past this the level is sampled.
 */
const SAMPLES = 250_000;

/** How far apart the pixels a level is scored over are. */
function strideOf({ width, height }: Level): number {
  return Math.max(1, Math.round(Math.sqrt((width * height) / SAMPLES)));
}

/** The same picture at half the width and half the height, averaged four to one. */
function halve({ grey, width, height }: Level): Level {
  const next = Math.max(1, width >> 1);
  const lines = Math.max(1, height >> 1);
  const smaller = new Uint8Array(next * lines);

  for (let y = 0; y < lines; y += 1) {
    const top = Math.min(y * 2, height - 1) * width;
    const bottom = Math.min(y * 2 + 1, height - 1) * width;

    for (let x = 0; x < next; x += 1) {
      const left = Math.min(x * 2, width - 1);
      const right = Math.min(x * 2 + 1, width - 1);

      smaller[y * next + x] =
        (grey[top + left] + grey[top + right] + grey[bottom + left] + grey[bottom + right]) >> 2;
    }
  }

  return { grey: smaller, width: next, height: lines };
}

/**
 * How badly the two line up at this offset, as the average difference in
 * brightness over the part where they overlap.
 *
 * `Infinity` when they barely overlap at all. Without that floor the search
 * would find that sliding one picture off the side of the other leaves four
 * pixels in perfect agreement, and report it as the best answer it could find.
 */
function costOf(before: Level, after: Level, dx: number, dy: number, stride: number): number {
  const fromX = Math.max(0, dx);
  const toX = Math.min(before.width, dx + after.width);
  const fromY = Math.max(0, dy);
  const toY = Math.min(before.height, dy + after.height);

  const covered = (toX - fromX) * (toY - fromY);
  const smaller = Math.min(before.width * before.height, after.width * after.height);

  if (covered <= 0 || covered < smaller * ENOUGH) {
    return Infinity;
  }

  let total = 0;
  let counted = 0;

  for (let y = fromY; y < toY; y += stride) {
    const beforeRow = y * before.width;
    const afterRow = (y - dy) * after.width - dx;

    for (let x = fromX; x < toX; x += stride) {
      const step = before.grey[beforeRow + x] - after.grey[afterRow + x];

      total += step < 0 ? -step : step;
      counted += 1;
    }
  }

  return counted === 0 ? Infinity : total / counted;
}

/** The offset with the least cost, preferring the smallest one where two tie. */
function search(before: Level, after: Level, around: Offset, reach: number): Offset {
  const stride = strideOf(before);

  let best = around;
  let least = Infinity;
  let nearest = Infinity;

  for (let dy = around.y - reach; dy <= around.y + reach; dy += 1) {
    for (let dx = around.x - reach; dx <= around.x + reach; dx += 1) {
      const cost = costOf(before, after, dx, dy, stride);

      if (cost === Infinity) {
        continue;
      }

      // A picture with a flat area in it lines up equally well several ways.
      // The smallest of those is the one that is true, and every other one is
      // the search reading a coincidence as evidence.
      const distance = Math.abs(dx) + Math.abs(dy);

      if (cost < least || (cost === least && distance < nearest)) {
        best = { x: dx, y: dy };
        least = cost;
        nearest = distance;
      }
    }
  }

  return least === Infinity ? around : best;
}

/**
 * The offset that lines the second picture up with the first, within `radius`
 * pixels of where it started.
 *
 * How far down the pyramid the search starts is decided by that radius rather
 * than fixed: halving the picture halves the distance an offset has to travel,
 * so a search that has to reach sixteen pixels starts four halvings down where
 * sixteen pixels is one, and a search that only has to reach two starts one
 * halving down. Anything the pyramid overshoots is clipped at the end, so the
 * answer is always inside what was asked for.
 */
export function findOffset(before: DiffPixels, after: DiffPixels, radius: number): Offset {
  const reach = Math.max(0, Math.floor(radius));

  if (reach === 0 || before.width === 0 || before.height === 0) {
    return NO_OFFSET;
  }

  const levels: Level[][] = [
    [
      {
        grey: brightnessOf(before.data, before.width, before.height),
        width: before.width,
        height: before.height
      }
    ],
    [
      {
        grey: brightnessOf(after.data, after.width, after.height),
        width: after.width,
        height: after.height
      }
    ]
  ];

  const deepest = Math.min(DEEPEST, Math.max(0, Math.floor(Math.log2(reach))));

  for (let level = 0; level < deepest; level += 1) {
    const [first, second] = levels.map((side) => side[level]);

    if (Math.min(first.width, first.height, second.width, second.height) <= SMALLEST) {
      break;
    }

    levels[0].push(halve(first));
    levels[1].push(halve(second));
  }

  const built = levels[0].length - 1;
  let found = search(
    levels[0][built],
    levels[1][built],
    NO_OFFSET,
    Math.max(1, Math.ceil(reach / 2 ** built))
  );

  // Back up the pyramid: what was one pixel down there is two up here, and one
  // step either way is all that is left to decide.
  for (let level = built - 1; level >= 0; level -= 1) {
    found = search(levels[0][level], levels[1][level], { x: found.x * 2, y: found.y * 2 }, 1);
  }

  const clamp = (value: number) => Math.max(-reach, Math.min(reach, value));

  return { x: clamp(found.x), y: clamp(found.y) };
}
