/**
 * The pixels under the pointer, read rather than drawn.
 *
 * A comparison zoomed to four hundred per cent says two pixels are different
 * and stops there. What a reader is asking at that point is what the two
 * actually are — is this the same grey a shade darker, or a different colour
 * altogether — and the answer is a number, not a picture. So this is the half
 * of the loupe that has nothing to do with a canvas: where the pointer is in
 * each picture, and what the pixel there is.
 */

import type { DiffImageArea, DiffPixelColour } from '../../types.js';
import type { Picture } from './decode.js';

/** How many pixels across the loupe shows. Odd, so that one of them is the middle. */
export const SPAN = 9;

/** One side under the pointer: what it is called, what to draw, and what it is. */
export interface Sample {
  label: string;
  picture: Picture;
  /** Where the picture sits in the frame. */
  area: DiffImageArea;
}

/** Where a point of the frame falls in one picture, and whether it falls in it at all. */
export function pixelAt(sample: Sample, frameX: number, frameY: number): { x: number; y: number } {
  return { x: Math.floor(frameX) - sample.area.x, y: Math.floor(frameY) - sample.area.y };
}

/** The colour of one pixel of a picture, or `null` where the picture does not reach. */
export function colourAt(sample: Sample, frameX: number, frameY: number): DiffPixelColour | null {
  const { x, y } = pixelAt(sample, frameX, frameY);
  const { data, width, height } = sample.picture.pixels;

  if (x < 0 || y < 0 || x >= width || y >= height) {
    return null;
  }

  const at = (y * width + x) * 4;

  return [data[at], data[at + 1], data[at + 2], data[at + 3]];
}

/**
 * A colour as the string a reader would type back into a stylesheet.
 *
 * Eight digits where there is transparency and six where there is none, because
 * `#1a7f4bff` is a thing nobody writes and `#1a7f4b80` is a thing they have to.
 */
export function hexOf(colour: DiffPixelColour): string {
  const digits = (value: number) => value.toString(16).padStart(2, '0');
  const rgb = `#${digits(colour[0])}${digits(colour[1])}${digits(colour[2])}`;

  return colour[3] === 255 ? rgb : `${rgb}${digits(colour[3])}`;
}
