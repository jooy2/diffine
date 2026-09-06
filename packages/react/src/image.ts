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

import type { DiffImageOptions, DiffImageResult, DiffPixelKind, DiffPixels } from './types.js';
import { findOffset, NO_OFFSET } from './internal/image/align.js';
import { comparePixels } from './internal/image/compare.js';

export type {
  DiffImageAlign,
  DiffImageArea,
  DiffImageOptions,
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
