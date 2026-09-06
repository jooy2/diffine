/**
 * Turning what an application handed over into something to draw and something
 * to compare.
 *
 * Two answers come out of one decode, and they are not the same thing. A pane
 * draws a picture, which is a job for whatever the browser can put on a canvas
 * fastest — an `ImageBitmap`, held where the graphics card can reach it. The
 * engine reads a picture, which is four bytes a pixel in ordinary memory. There
 * is no representation that is both, so both are made once and kept.
 *
 * The cap on how large that is exists for the same reason. A photograph from a
 * modern camera is twenty-four million pixels; two of them, as bitmaps and as
 * buffers, is most of a gigabyte before anything has been compared. Past
 * `maxPixels` a picture is decoded smaller — which is a decision to draw a
 * picture slightly soft rather than to take the page down, and it is the
 * application's to change.
 */

import type { DiffPixels, DiffineImageContent } from '../../types.js';
import { surfaceOf, type Surface } from './surface.js';

/** A picture, ready to be drawn and ready to be compared. */
export interface Picture {
  /** What a pane draws. */
  drawable: CanvasImageSource;
  /** What the engine reads. */
  pixels: DiffPixels;
  width: number;
  height: number;
  /** What the file weighed, or what the pixels weigh where there was no file. */
  bytes: number;
  /** Whether it had to be decoded smaller than it is. */
  reduced: boolean;
  /**
   * Whether the drawable is the component's to throw away.
   *
   * A bitmap the application passed in is the application's, and closing it
   * because a prop changed would break a picture somebody else is still
   * holding. Everything decoded or redrawn here is ours, and is closed.
   */
  owned: boolean;
}

/** Anything shaped like `ImageData`, which is what the engine takes. */
export function isPixels(content: DiffineImageContent): content is DiffPixels {
  return (
    typeof content === 'object' &&
    content !== null &&
    'data' in content &&
    typeof (content as DiffPixels).width === 'number'
  );
}

/**
 * A buffer of pixels as `ImageData`, copied only where it has to be.
 *
 * `ImageData` will not take a view onto memory shared with a worker, which is
 * the one case there is no way round a copy. Everything else is handed over as
 * it stands.
 */
function imageDataOf({ data, width, height }: DiffPixels): ImageData {
  const own = data.buffer instanceof ArrayBuffer;

  return new ImageData(
    own ? (data as Uint8ClampedArray<ArrayBuffer>) : new Uint8ClampedArray(data),
    width,
    height
  );
}

/** How much smaller a picture has to be decoded to fit inside `maxPixels`. */
function reductionOf(width: number, height: number, maxPixels: number): number {
  const area = width * height;

  return area > maxPixels && maxPixels > 0 ? Math.sqrt(maxPixels / area) : 1;
}

/**
 * A file, decoded.
 *
 * `createImageBitmap` is the way to do this — it decodes off the thread the
 * page is drawn on, and hands back something a canvas can draw without
 * uploading it again. The `<img>` underneath is for the browser that has not
 * got it, and it is why the object URL is revoked in a `finally`: an element
 * that never loaded still holds one.
 */
async function decodeBlob(
  blob: Blob
): Promise<CanvasImageSource & { width: number; height: number }> {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(blob);
  }

  const url = URL.createObjectURL(blob);

  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();

      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('diffine: that file could not be decoded.'));
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** The pixels of something already drawable, read back through a canvas. */
function pixelsOf(source: CanvasImageSource, width: number, height: number): DiffPixels {
  const context = surfaceOf(width, height, true);

  context.drawImage(source, 0, 0, width, height);

  const { data } = context.getImageData(0, 0, width, height);

  return { data, width, height };
}

/** The same picture, drawn smaller. */
function reduce(source: CanvasImageSource, width: number, height: number): Surface {
  const context = surfaceOf(width, height, true);

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(source, 0, 0, width, height);

  return context;
}

/** What a buffer of pixels weighs, for a picture that never was a file. */
const weightOf = (pixels: DiffPixels) => pixels.width * pixels.height * 4;

/**
 * Everything a pane and the engine need, out of whichever of the three shapes
 * the application passed.
 *
 * A buffer of pixels goes onto a canvas and stays there, because it is already
 * the thing the engine wants and only the drawing is missing. A file or a
 * bitmap goes the other way: the drawing is what arrived, and the pixels are
 * read back off a canvas it was drawn onto once.
 */
export async function decodeImage(
  content: DiffineImageContent,
  maxPixels: number
): Promise<Picture> {
  if (isPixels(content)) {
    const scale = reductionOf(content.width, content.height, maxPixels);
    const holding = surfaceOf(content.width, content.height, scale === 1);

    holding.putImageData(imageDataOf(content), 0, 0);

    if (scale === 1) {
      return {
        drawable: holding.canvas,
        pixels: content,
        width: content.width,
        height: content.height,
        bytes: weightOf(content),
        reduced: false,
        owned: true
      };
    }

    const width = Math.max(1, Math.round(content.width * scale));
    const height = Math.max(1, Math.round(content.height * scale));
    const smaller = reduce(holding.canvas, width, height);

    return {
      drawable: smaller.canvas,
      pixels: { data: smaller.getImageData(0, 0, width, height).data, width, height },
      width,
      height,
      bytes: weightOf(content),
      reduced: true,
      owned: true
    };
  }

  const source = content instanceof Blob ? await decodeBlob(content) : content;
  const full = { width: Number(source.width), height: Number(source.height) };
  const bytes = content instanceof Blob ? content.size : full.width * full.height * 4;
  const scale = reductionOf(full.width, full.height, maxPixels);

  if (scale === 1) {
    return {
      drawable: source,
      pixels: pixelsOf(source, full.width, full.height),
      width: full.width,
      height: full.height,
      bytes,
      reduced: false,
      owned: content instanceof Blob
    };
  }

  const width = Math.max(1, Math.round(full.width * scale));
  const height = Math.max(1, Math.round(full.height * scale));
  const smaller = reduce(source, width, height);

  // The full-size decode has served its purpose and is the largest thing here.
  if (typeof ImageBitmap === 'function' && source instanceof ImageBitmap) {
    source.close();
  }

  return {
    drawable: smaller.canvas,
    pixels: { data: smaller.getImageData(0, 0, width, height).data, width, height },
    width,
    height,
    bytes,
    reduced: true,
    owned: true
  };
}

/** Lets go of whatever the decode is holding that the garbage collector will not. */
export function releasePicture(picture: Picture | null): void {
  if (
    picture?.owned &&
    typeof ImageBitmap === 'function' &&
    picture.drawable instanceof ImageBitmap
  ) {
    picture.drawable.close();
  }
}
