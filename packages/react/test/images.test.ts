import { describe, expect, it } from 'vitest';
import {
  MOST_PICTURES,
  diffImage,
  diffImages,
  imagesSimilarity,
  paintDiffImages,
  type DiffImagesResult,
  type DiffPixels
} from 'diffine-react';

/** A picture written as rows of characters, the same way `image.test.ts` writes one. */
const PAINTS: Record<string, readonly [number, number, number, number]> = {
  '.': [255, 255, 255, 255],
  '#': [0, 0, 0, 255],
  r: [255, 0, 0, 255],
  g: [0, 128, 0, 255],
  b: [0, 0, 255, 255],
  ' ': [0, 0, 0, 0]
};

function picture(...rows: string[]): DiffPixels {
  const width = rows[0]?.length ?? 0;
  const data = new Uint8ClampedArray(width * rows.length * 4);

  for (const [y, row] of rows.entries()) {
    for (let x = 0; x < width; x += 1) {
      data.set(PAINTS[row[x]], (y * width + x) * 4);
    }
  }

  return { data, width, height: rows.length };
}

/** The mask read back a pixel at a time, as the bits it holds. */
function bits(result: DiffImagesResult): string[] {
  const rows: string[] = [];

  for (let y = 0; y < result.height; y += 1) {
    let row = '';

    for (let x = 0; x < result.width; x += 1) {
      row += result.mask[y * result.width + x].toString(16);
    }

    rows.push(row);
  }

  return rows;
}

describe('diffImages', () => {
  it('finds nothing between three copies of the same picture', () => {
    const same = picture('.#.', '#.#');
    const result = diffImages([same, same, same]);

    expect(result.stats.changed).toBe(0);
    expect(result.stats.unchanged).toBe(6);
    expect(result.stats.ratio).toBe(0);
    expect(result.stats.apart).toEqual([0, 0, 0]);
    expect(result.regions).toEqual([]);
  });

  it('sets a bit for each picture that disagrees with the baseline', () => {
    const base = picture('...', '...');
    const second = picture('r..', '...');
    const third = picture('..g', '...');
    const result = diffImages([base, second, third]);

    // The second picture is bit 1 and the third is bit 2.
    expect(bits(result)).toEqual(['204', '000']);
    expect(result.stats.changed).toBe(2);
    expect(result.stats.apart).toEqual([0, 1, 1]);
  });

  it('sets both bits where two of them disagree about the same pixel', () => {
    const base = picture('..');
    const result = diffImages([base, picture('r.'), picture('g.')]);

    expect(bits(result)).toEqual(['60']);
  });

  it('counts a pixel only some of them cover', () => {
    const result = diffImages([picture('..'), picture('..'), picture('..', '..')]);

    expect(result.width).toBe(2);
    expect(result.height).toBe(2);
    // The third picture reaches the second row and the other two do not, so it
    // is the one that disagrees there.
    expect(bits(result)).toEqual(['00', '44']);
    expect(result.stats.covered).toBe(4);
    expect(result.stats.changed).toBe(2);
  });

  it('reads the baseline the options name', () => {
    const odd = picture('r.');
    const result = diffImages([odd, picture('..'), picture('..')], { baseline: 1 });

    expect(result.baseline).toBe(1);
    // Counted against the second picture, the odd one out is the first.
    expect(bits(result)).toEqual(['10']);
    expect(result.stats.apart).toEqual([1, 0, 0]);
  });

  it('says the same thing about a pair as the comparison of two does', () => {
    const before = picture('....', '.rg.', '....');
    const after = picture('....', '.r..', '..b.');
    const pair = diffImage(before, after, { tolerance: 0 });
    const many = diffImages([before, after], { tolerance: 0 });

    expect(many.width).toBe(pair.width);
    expect(many.height).toBe(pair.height);
    expect(many.stats.changed).toBe(pair.stats.changed);
    expect(many.stats.covered).toBe(pair.stats.covered);
    expect(many.regions).toEqual(pair.regions);
  });

  it('reads the options the comparison of two reads', () => {
    const flat = picture('..', '..');
    const dimmer = picture('.#', '..');

    expect(diffImages([flat, dimmer], { tolerance: 1 }).stats.changed).toBe(0);
    expect(diffImages([flat, dimmer], { tolerance: 0 }).stats.changed).toBe(1);
  });

  it('refuses a list that is not a comparison', () => {
    const one = picture('..');

    expect(() => diffImages([one])).toThrow(/2 to 8/);
    expect(() => diffImages(Array.from({ length: MOST_PICTURES + 1 }, () => one))).toThrow(
      /2 to 8/
    );
    expect(() => diffImages([one, one], { baseline: 2 })).toThrow(/baseline/);
    expect(() =>
      diffImages([one, { data: new Uint8ClampedArray(4), width: 2, height: 2 }])
    ).toThrow(/picture 1/);
  });

  it('takes every picture up to the most it holds', () => {
    const all = Array.from({ length: MOST_PICTURES }, (_, at) =>
      at === MOST_PICTURES - 1 ? picture('r.') : picture('..')
    );
    const result = diffImages(all);

    // Only the last one differs, and its bit is the highest one a byte holds.
    expect(result.mask[0]).toBe(1 << (MOST_PICTURES - 1));
    expect(result.mask[0]).toBe(128);
  });
});

describe('imagesSimilarity', () => {
  it('says three copies of the same picture are the same picture', () => {
    const same = picture('.#.', '#.#');
    const result = imagesSimilarity([same, same, same]);

    expect(result.similarity).toBe(1);
    expect(result.identical).toBe(true);
    expect(result.each).toEqual([1, 1, 1]);
    expect(result.pixels).toBe(6);
    expect(result.sizes).toEqual([
      { width: 3, height: 2 },
      { width: 3, height: 2 },
      { width: 3, height: 2 }
    ]);
  });

  it('says which of them is the odd one out', () => {
    const base = picture('....', '....');
    const close = picture('r...', '....');
    const far = picture('rrrr', '....');
    const result = imagesSimilarity([base, close, far]);

    expect(result.each[0]).toBe(1);
    expect(result.each[1]).toBe(7 / 8);
    expect(result.each[2]).toBe(0.5);
    expect(result.each.indexOf(Math.min(...result.each))).toBe(2);
    // Four of the eight, because the two disagreements overlap: a pixel is
    // agreed about only when every picture agrees about it.
    expect(result.matched).toBe(4);
    expect(result.similarity).toBe(0.5);
  });
});

describe('paintDiffImages', () => {
  it('paints every pixel any of them disagrees about', () => {
    const result = diffImages([picture('..'), picture('r.'), picture('.g')]);
    const painted = paintDiffImages(result);

    expect([...painted.data.slice(0, 4)]).toEqual([232, 62, 140, 255]);
    expect([...painted.data.slice(4, 8)]).toEqual([232, 62, 140, 255]);
  });

  it('paints one picture on its own', () => {
    const result = diffImages([picture('..'), picture('r.'), picture('.g')]);
    const painted = paintDiffImages(result, { picture: 1 });

    expect([...painted.data.slice(0, 4)]).toEqual([232, 62, 140, 255]);
    // The second pixel is the third picture's disagreement, not the second's.
    expect([...painted.data.slice(4, 8)]).toEqual([0, 0, 0, 0]);
  });
});
