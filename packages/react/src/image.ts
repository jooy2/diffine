/**
 * The comparison of two pictures, on its own.
 *
 * The same bargain `diffine-react/diff` makes for text, made again for pixels:
 * nothing here touches React or the DOM, and what comes back is a value rather
 * than a picture. Which matters more here than it does there. Comparing two
 * photographs is a few million pieces of arithmetic, and an application that
 * wants that off the thread its page is drawn on can put this call in a worker
 * — the buffers go in, the mask comes out, and `ImageDiff` is handed the
 * result instead of the two files.
 *
 * What it does not do is open a file. A picture reaches this as pixels, and
 * turning a PNG into pixels is a decoder — the browser's, a worker's, or a
 * server's, and never something a comparison should have an opinion about.
 */

import type {
  DiffImageOptions,
  DiffImagePaint,
  DiffImageResult,
  DiffImageSimilarity,
  DiffImagesOptions,
  DiffImagesResult,
  DiffImagesSimilarity,
  DiffPixelKind,
  DiffPixels
} from './types.js';
import { MOST_PICTURES } from './types.js';
import { findOffset, NO_OFFSET, type Offset } from './internal/image/align.js';
import { comparePixels } from './internal/image/compare.js';
import { compareMany } from './internal/image/many.js';

export type {
  DiffImageAlign,
  DiffImageArea,
  DiffImageOptions,
  DiffImagePaint,
  DiffPixelColour,
  DiffImageRegion,
  DiffImageResult,
  DiffImageSimilarity,
  DiffImageStats,
  DiffImagesOptions,
  DiffImagesResult,
  DiffImagesSimilarity,
  DiffImagesStats,
  DiffPixelKind,
  DiffPixels
} from './types.js';
export { MOST_PICTURES } from './types.js';

/**
 * What each byte of {@link DiffImageResult.mask} means, in the order the bytes
 * count: `DIFF_PIXEL_KINDS[mask[pixel]]`.
 */
export const DIFF_PIXEL_KINDS: readonly DiffPixelKind[] = ['equal', 'changed', 'added', 'removed'];

/** What every option falls back to. */
export const DIFFINE_IMAGE_DEFAULTS: Required<DiffImageOptions> = {
  tolerance: 0.05,
  ignoreAntialiasing: true,
  align: 'none',
  alignRadius: 16,
  blockSize: 16,
  maxRegions: 200
};

/**
 * Compares two pictures and returns everything worked out about them: what
 * happened to each pixel, where the changes are, and how much of the frame they
 * cover.
 *
 * ```ts
 * const result = diffImage(before, after, { align: 'shift' });
 *
 * console.log(`${result.regions.length} areas changed, ${Math.round(result.stats.ratio * 100)}%`);
 * ```
 *
 * Both sides are `ImageData`, or anything else shaped like it. The two do not
 * have to be the same size: what only one of them covers comes back as `added`
 * or `removed` rather than as an error.
 */
export function diffImage(
  before: DiffPixels,
  after: DiffPixels,
  options?: DiffImageOptions
): DiffImageResult {
  check(before, 'before');
  check(after, 'after');

  const align = options?.align ?? DIFFINE_IMAGE_DEFAULTS.align;
  const radius = options?.alignRadius ?? DIFFINE_IMAGE_DEFAULTS.alignRadius;

  return comparePixels(before, after, {
    tolerance: options?.tolerance ?? DIFFINE_IMAGE_DEFAULTS.tolerance,
    ignoreAntialiasing: options?.ignoreAntialiasing ?? DIFFINE_IMAGE_DEFAULTS.ignoreAntialiasing,
    blockSize: options?.blockSize ?? DIFFINE_IMAGE_DEFAULTS.blockSize,
    maxRegions: options?.maxRegions ?? DIFFINE_IMAGE_DEFAULTS.maxRegions,
    offset: align === 'shift' ? findOffset(before, after, radius) : NO_OFFSET
  });
}

/**
 * That a picture is as large as it says it is, checked once before anything
 * reads it.
 *
 * The loop underneath reads a buffer at `(y * width + x) * 4` and never asks
 * whether the buffer reaches that far, because asking a few million times is
 * most of what a comparison would cost. So it is asked here instead, and it has
 * to be asked somewhere: a typed array hands back `undefined` past its end
 * rather than throwing, two of those compare equal, and a buffer one row short
 * would come back as two pictures that agree about the row it is missing.
 */
function check(pixels: DiffPixels, side: string): void {
  const { data, width, height } = pixels;

  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 0 || height < 0) {
    throw new RangeError(
      `diffine: the ${side} picture is ${width} × ${height}, which is not a size.`
    );
  }

  const wanted = width * height * 4;

  if (data.length < wanted) {
    throw new RangeError(
      `diffine: the ${side} picture is ${width} × ${height}, which is ${wanted} bytes, and ${data.length} arrived.`
    );
  }
}

/**
 * How alike two pictures are, as one number and the counts behind it.
 *
 * {@link diffImage} answers "where did these two differ", which is the question
 * a reader looking at them has. A build with a threshold in it, a report
 * ranking a hundred screenshots and a badge on a page are all asking the
 * shorter one instead, and this is the shorter one:
 *
 * ```ts
 * const { similarity, changed } = imageSimilarity(before, after);
 *
 * if (similarity < 0.995) {
 *   throw new Error(`${changed} pixels moved — ${(similarity * 100).toFixed(2)}% alike`);
 * }
 * ```
 *
 * It is the whole comparison underneath, so every option means what it means
 * there: `tolerance` decides how much of a difference counts against the
 * number, `align` lines two shots up before anything is counted, and a pixel
 * only one of the two covers counts against it — two pictures of different
 * sizes cannot be 1.
 *
 * A comparison already worked out has all of this on `result.stats` and needs
 * no second pass: `1 - stats.ratio` is the same number.
 */
export function imageSimilarity(
  before: DiffPixels,
  after: DiffPixels,
  options?: DiffImageOptions
): DiffImageSimilarity {
  const { stats } = diffImage(before, after, options);

  return {
    similarity: 1 - stats.ratio,
    identical: stats.changed === 0 && stats.added === 0 && stats.removed === 0,
    pixels: stats.covered,
    matched: stats.unchanged,
    changed: stats.changed,
    added: stats.added,
    removed: stats.removed,
    distance: stats.distance,
    before: { width: before.width, height: before.height },
    after: { width: after.width, height: after.height }
  };
}

/**
 * How the pictures of a list are lined up with the baseline, and what is left
 * of the options once that is settled.
 */
function settle(
  pictures: readonly DiffPixels[],
  baseline: number,
  options: DiffImagesOptions | undefined
): { offsets: Offset[] } {
  const align = options?.align ?? DIFFINE_IMAGE_DEFAULTS.align;
  const radius = options?.alignRadius ?? DIFFINE_IMAGE_DEFAULTS.alignRadius;

  return {
    offsets: pictures.map((picture, at) =>
      at === baseline || align !== 'shift'
        ? NO_OFFSET
        : findOffset(pictures[baseline], picture, radius)
    )
  };
}

/**
 * Compares several pictures at once and returns where any of them disagree.
 *
 * ```ts
 * const result = diffImages([chrome, firefox, safari]);
 *
 * console.log(`${result.regions.length} areas, ${Math.round(result.stats.ratio * 100)}%`);
 * ```
 *
 * Three renderings of one screen, four exports of one asset, a saved version
 * against the last five runs: what is wanted there is one frame with every
 * disagreement on it, and `diffImage` cannot give that because a pair has no
 * room for a third.
 *
 * Each picture is compared with the baseline exactly as `diffImage` would
 * compare it, so every option means what it means there — and a list of two is
 * the same answer in a different shape. What the list adds is the mask: a bit a
 * picture rather than a kind, so that `mask[pixel] !== 0` is "does anything
 * disagree here" and `mask[pixel] & (1 << i)` is "does this one".
 *
 * At most {@link MOST_PICTURES}, because a bit a picture is what a byte holds.
 */
export function diffImages(
  pictures: readonly DiffPixels[],
  options?: DiffImagesOptions
): DiffImagesResult {
  const baseline = options?.baseline ?? 0;

  if (pictures.length < 2 || pictures.length > MOST_PICTURES) {
    throw new RangeError(
      `diffine: ${pictures.length} pictures were given, and a comparison takes 2 to ${MOST_PICTURES}.`
    );
  }

  if (!Number.isInteger(baseline) || baseline < 0 || baseline >= pictures.length) {
    throw new RangeError(
      `diffine: the baseline is ${baseline}, which is not one of the ${pictures.length} pictures.`
    );
  }

  for (const [at, picture] of pictures.entries()) {
    check(picture, `picture ${at}`);
  }

  return compareMany(pictures, {
    tolerance: options?.tolerance ?? DIFFINE_IMAGE_DEFAULTS.tolerance,
    ignoreAntialiasing: options?.ignoreAntialiasing ?? DIFFINE_IMAGE_DEFAULTS.ignoreAntialiasing,
    blockSize: options?.blockSize ?? DIFFINE_IMAGE_DEFAULTS.blockSize,
    maxRegions: options?.maxRegions ?? DIFFINE_IMAGE_DEFAULTS.maxRegions,
    baseline,
    ...settle(pictures, baseline, options)
  });
}

/**
 * How alike several pictures are, as one number and the counts behind it.
 *
 * The same shorter question {@link imageSimilarity} asks about a pair. A build
 * comparing one screen drawn on four machines wants one number to put a
 * threshold on and a list saying which of the four is the odd one out:
 *
 * ```ts
 * const { similarity, each } = imagesSimilarity([chrome, firefox, safari]);
 *
 * if (similarity < 0.995) {
 *   console.log(`the odd one out is ${each.indexOf(Math.min(...each))}`);
 * }
 * ```
 *
 * One picture disagreeing in a corner costs the set exactly as much as all of
 * them disagreeing there, because the question `similarity` asks is whether
 * they agree. `each` is what says which of them did not.
 */
export function imagesSimilarity(
  pictures: readonly DiffPixels[],
  options?: DiffImagesOptions
): DiffImagesSimilarity {
  const { stats, baseline } = diffImages(pictures, options);

  return {
    similarity: 1 - stats.ratio,
    identical: stats.changed === 0,
    pixels: stats.covered,
    matched: stats.unchanged,
    changed: stats.changed,
    baseline,
    each: stats.apart.map((apart) => (stats.covered === 0 ? 1 : 1 - apart / stats.covered)),
    sizes: pictures.map((picture) => ({ width: picture.width, height: picture.height }))
  };
}

/** What each kind of pixel is painted in, where nothing else was asked for. */
const PAINT: Required<DiffImagePaint> = {
  changed: [232, 62, 140, 255],
  added: [26, 127, 75, 255],
  removed: [194, 51, 63, 255],
  unchanged: [0, 0, 0, 0]
};

/**
 * The mask of several pictures as a picture of its own.
 *
 * The same step between an answer and a file that {@link paintDiffImage} is,
 * for a comparison of a list. With no `picture` it paints every pixel any of
 * them disagrees about, which is the one image a build attaches to a run that
 * compared four. With one, it paints what that picture alone disagrees with the
 * baseline about — four files, one a picture, saying who is the odd one out
 * where.
 *
 * `added` and `removed` do not apply: whose arrival a pixel is depends on which
 * of the pictures is being asked about, and the answer for a list is that they
 * disagree.
 */
export function paintDiffImages(
  result: DiffImagesResult,
  paint?: DiffImagePaint & { picture?: number }
): DiffPixels {
  const { width, height, mask } = result;
  const data = new Uint8ClampedArray(width * height * 4);
  const changed = paint?.changed ?? PAINT.changed;
  const unchanged = paint?.unchanged ?? PAINT.unchanged;
  const wanted = paint?.picture === undefined ? 0xff : 1 << paint.picture;

  for (let pixel = 0; pixel < mask.length; pixel += 1) {
    const colour = (mask[pixel] & wanted) === 0 ? unchanged : changed;
    const at = pixel * 4;

    data[at] = colour[0];
    data[at + 1] = colour[1];
    data[at + 2] = colour[2];
    data[at + 3] = colour[3];
  }

  return { data, width, height };
}

/**
 * The mask as a picture of its own: what changed, on a ground that is
 * see-through.
 *
 * This is the comparison in the one shape everything outside a page can read. A
 * build that compares two screenshots has an answer nobody can look at until it
 * is a file, and the step between the two is this — the pixels go to an
 * `ImageData`, the `ImageData` goes on a canvas, and the canvas writes the PNG
 * that ends up attached to the run.
 *
 * ```ts
 * const picture = paintDiffImage(diffImage(before, after));
 * const canvas = new OffscreenCanvas(picture.width, picture.height);
 *
 * canvas.getContext('2d')?.putImageData(new ImageData(picture.data, picture.width), 0, 0);
 *
 * const png = await canvas.convertToBlob();
 * ```
 *
 * Writing that file is the application's, for the same reason decoding one is:
 * a page, a worker and a server each have their own way of doing it, and none
 * of them is the comparison's business.
 */
export function paintDiffImage(result: DiffImageResult, paint?: DiffImagePaint): DiffPixels {
  const { width, height, mask } = result;
  const data = new Uint8ClampedArray(width * height * 4);
  const colours = [
    paint?.unchanged ?? PAINT.unchanged,
    paint?.changed ?? PAINT.changed,
    paint?.added ?? PAINT.added,
    paint?.removed ?? PAINT.removed
  ];

  for (let pixel = 0; pixel < mask.length; pixel += 1) {
    const colour = colours[mask[pixel]] ?? PAINT.unchanged;
    const at = pixel * 4;

    data[at] = colour[0];
    data[at + 1] = colour[1];
    data[at + 2] = colour[2];
    data[at + 3] = colour[3];
  }

  return { data, width, height };
}
