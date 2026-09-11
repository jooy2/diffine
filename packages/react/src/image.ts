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
  DiffPixelKind,
  DiffPixels
} from './types.js';
import { findOffset, NO_OFFSET } from './internal/image/align.js';
import { comparePixels } from './internal/image/compare.js';

export type {
  DiffImageAlign,
  DiffImageArea,
  DiffImageOptions,
  DiffImagePaint,
  DiffPixelColour,
  DiffImageRegion,
  DiffImageResult,
  DiffImageStats,
  DiffPixelKind,
  DiffPixels
} from './types.js';

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
function check(pixels: DiffPixels, side: 'before' | 'after'): void {
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

/** What each kind of pixel is painted in, where nothing else was asked for. */
const PAINT: Required<DiffImagePaint> = {
  changed: [232, 62, 140, 255],
  added: [26, 127, 75, 255],
  removed: [194, 51, 63, 255],
  unchanged: [0, 0, 0, 0]
};

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
