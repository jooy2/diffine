import { describe, expect, it } from 'vitest';
import { colourAt, hexOf, pixelAt, type Sample } from '../src/internal/image/loupe.js';
import type { DiffPixels } from 'diffine-react';

/** A picture whose every pixel says where it is, so a read can be checked. */
function picture(width: number, height: number): DiffPixels {
  const data = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      data.set([x * 10, y * 10, 128, 255], (y * width + x) * 4);
    }
  }

  return { data, width, height };
}

const sampleOf = (width: number, height: number, x = 0, y = 0): Sample => {
  const pixels = picture(width, height);

  return {
    label: 'before',
    picture: {
      drawable: null as unknown as CanvasImageSource,
      pixels,
      width,
      height,
      bytes: 0,
      reduced: false,
      owned: false
    },
    area: { x, y, width, height }
  };
};

describe('the loupe', () => {
  it('reads the pixel the pointer is on', () => {
    expect(colourAt(sampleOf(8, 8), 3, 5)).toEqual([30, 50, 128, 255]);
  });

  it('reads through the offset a picture sits at in the frame', () => {
    // The picture starts two pixels into the frame, so frame 5 is its pixel 3.
    expect(colourAt(sampleOf(8, 8, 2, 1), 5, 4)).toEqual([30, 30, 128, 255]);
    expect(pixelAt(sampleOf(8, 8, 2, 1), 5, 4)).toEqual({ x: 3, y: 3 });
  });

  it('takes the pixel a point falls in rather than the one it rounds to', () => {
    expect(pixelAt(sampleOf(8, 8), 3.9, 5.1)).toEqual({ x: 3, y: 5 });
  });

  it('says nothing where the picture does not reach', () => {
    expect(colourAt(sampleOf(4, 4), 9, 1)).toBeNull();
    expect(colourAt(sampleOf(4, 4), 1, -1)).toBeNull();
    expect(colourAt(sampleOf(4, 4, 2, 0), 1, 1)).toBeNull();
  });

  it('writes a colour the way a reader would type it back', () => {
    expect(hexOf([26, 127, 75, 255])).toBe('#1a7f4b');
    expect(hexOf([0, 0, 0, 255])).toBe('#000000');
    // Transparency is worth the four extra digits and nothing else is.
    expect(hexOf([26, 127, 75, 128])).toBe('#1a7f4b80');
    expect(hexOf([0, 0, 0, 0])).toBe('#00000000');
  });
});
