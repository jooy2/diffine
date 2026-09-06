/**
 * Somewhere to draw that is not the page.
 *
 * Three things here need one: reading the pixels out of a decoded file, drawing
 * a picture smaller than it arrived, and painting the mask. None of them is
 * ever seen — what is seen is the canvas in the pane, and these are the working
 * surfaces behind it.
 *
 * `OffscreenCanvas` where there is one, because it is exactly this and costs no
 * element in the document. Where there is not, an element that is never
 * appended does the same job.
 */

/** A canvas to draw on, whichever of the two kinds it turned out to be. */
export type Surface = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

/**
 * A surface of `width` by `height`.
 *
 * `read` says the pixels are going to be read back off it, which is a promise
 * worth making: a browser keeps a canvas on the graphics card until somebody
 * asks for its pixels, and reading one back from there is slow enough that
 * saying so in advance changes where it is kept.
 */
export function surfaceOf(width: number, height: number, read = false): Surface {
  if (typeof OffscreenCanvas === 'function') {
    const context = new OffscreenCanvas(width, height).getContext('2d', {
      willReadFrequently: read
    });

    if (context) {
      return context;
    }
  }

  const canvas = document.createElement('canvas');

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d', { willReadFrequently: read });

  if (!context) {
    throw new Error('diffine: this browser gave no 2D canvas to draw on.');
  }

  return context;
}

/**
 * Any CSS colour, as the four bytes it comes out as.
 *
 * There is no parser here and there does not need to be one: a canvas already
 * understands every colour CSS has, so the colour is painted onto one pixel and
 * read back. That covers `#abc`, `oklch()`, a colour with transparency in it and
 * whatever is added next, and it is how a custom property somebody set on the
 * component reaches a mask that has to be painted rather than styled.
 *
 * An unreadable colour leaves whatever the surface had before it, which is
 * black — visible, and never an exception thrown out of a paint.
 */
export function bytesOfColour(colour: string): [number, number, number, number] {
  const context = surfaceOf(1, 1, true);

  context.fillStyle = colour;
  context.fillRect(0, 0, 1, 1);

  const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;

  return [red, green, blue, alpha];
}
