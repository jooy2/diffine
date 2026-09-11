import { describe, expect, it } from 'vitest';
import { comparePixels } from '../src/internal/image/compare.js';
import {
  DIFF_PIXEL_KINDS,
  diffImage,
  imageSimilarity,
  type DiffImageResult,
  type DiffPixels
} from 'diffine-react';

/**
 * A picture written as rows of characters, so that a test reads as the thing it
 * is testing.
 *
 * A digit is a shade of grey, `0` black and `9` white, which is what an edge
 * drawn smooth is made of. The letters are the colours worth naming, and a
 * space is nothing at all — a pixel with no alpha behind it.
 */
const PAINTS: Record<string, readonly [number, number, number, number]> = {
  '.': [255, 255, 255, 255],
  '#': [0, 0, 0, 255],
  r: [255, 0, 0, 255],
  g: [0, 128, 0, 255],
  ' ': [0, 0, 0, 0]
};

function paintOf(mark: string): readonly [number, number, number, number] {
  if (mark >= '0' && mark <= '9') {
    const grey = Math.round((Number(mark) / 9) * 255);

    return [grey, grey, grey, 255];
  }

  const paint = PAINTS[mark];

  if (!paint) {
    throw new Error(`No paint for '${mark}'`);
  }

  return paint;
}

function picture(...rows: string[]): DiffPixels {
  const width = rows[0]?.length ?? 0;
  const data = new Uint8ClampedArray(width * rows.length * 4);

  for (const [y, row] of rows.entries()) {
    expect(row).toHaveLength(width);

    for (let x = 0; x < width; x += 1) {
      data.set(paintOf(row[x]), (y * width + x) * 4);
    }
  }

  return { data, width, height: rows.length };
}

/** The mask read back as characters, one a pixel: `.` equal, `~+-` the rest. */
function marks(result: DiffImageResult): string[] {
  const letters = { equal: '.', changed: '~', added: '+', removed: '-' };
  const rows: string[] = [];

  for (let y = 0; y < result.height; y += 1) {
    let row = '';

    for (let x = 0; x < result.width; x += 1) {
      row += letters[DIFF_PIXEL_KINDS[result.mask[y * result.width + x]]];
    }

    rows.push(row);
  }

  return rows;
}

describe('diffImage', () => {
  it('finds nothing between two copies of the same picture', () => {
    const result = diffImage(picture('.#.', '#.#'), picture('.#.', '#.#'));

    expect(result.stats).toEqual({
      pixels: 6,
      covered: 6,
      unchanged: 6,
      changed: 0,
      added: 0,
      removed: 0,
      ratio: 0,
      distance: 0
    });
    expect(result.regions).toEqual([]);
    expect(result.complete).toBe(true);
  });

  it('refuses a buffer that is shorter than the size it was given', () => {
    const short = { data: new Uint8ClampedArray(4 * 3), width: 2, height: 2 };
    const whole = picture('..', '..');

    // Without the check the reads past the end are `undefined` on both sides,
    // which compare equal — so the row that is missing comes back as a row the
    // two pictures agree about.
    expect(() => diffImage(short, whole)).toThrow(/before picture/);
    expect(() => diffImage(whole, short)).toThrow(/after picture/);
  });

  it('takes a buffer with room to spare', () => {
    const roomy = { data: new Uint8ClampedArray(4 * 8), width: 2, height: 2 };

    expect(diffImage(roomy, roomy).stats.changed).toBe(0);
  });

  it('marks the pixel that changed and nothing else', () => {
    const result = diffImage(picture('...', '...', '...'), picture('...', '.r.', '...'));

    expect(marks(result)).toEqual(['...', '.~.', '...']);
    expect(result.stats.changed).toBe(1);
    expect(result.regions).toEqual([{ x: 1, y: 1, width: 1, height: 1, pixels: 1 }]);
  });

  it('puts every pixel of the frame in the right one of the four kinds', () => {
    /*
     * The frame arithmetic decides which picture covers which pixel, and it is
     * the part of the loop that is written for speed rather than for reading.
     * So it is checked against the plain answer: for every pixel of the frame,
     * is it inside the first rectangle, the second, both, or neither.
     */
    const sizes = [
      [4, 3],
      [3, 4],
      [5, 5],
      [1, 6]
    ] as const;
    const offsets = [
      [0, 0],
      [2, 1],
      [-2, 1],
      [1, -3],
      [-4, -4],
      [6, 6]
    ] as const;

    const flat = (width: number, height: number, mark: string) =>
      picture(...Array.from({ length: height }, () => mark.repeat(width)));

    for (const [beforeWidth, beforeHeight] of sizes) {
      for (const [afterWidth, afterHeight] of sizes) {
        for (const [dx, dy] of offsets) {
          // Two colours nothing could call equal, so every shared pixel is a
          // changed one and the four kinds are decided by the frame alone.
          const before = flat(beforeWidth, beforeHeight, '#');
          const after = flat(afterWidth, afterHeight, '.');
          const left = Math.min(0, dx);
          const top = Math.min(0, dy);
          const result = comparePixels(before, after, {
            tolerance: 0,
            ignoreAntialiasing: false,
            blockSize: 16,
            maxRegions: 200,
            offset: { x: dx, y: dy }
          });

          const wanted: string[] = [];

          for (let y = 0; y < result.height; y += 1) {
            let row = '';

            for (let x = 0; x < result.width; x += 1) {
              const inBefore =
                x + left >= 0 && x + left < beforeWidth && y + top >= 0 && y + top < beforeHeight;
              const inAfter =
                x + left >= dx &&
                x + left < dx + afterWidth &&
                y + top >= dy &&
                y + top < dy + afterHeight;

              row += inBefore && inAfter ? '~' : inAfter ? '+' : inBefore ? '-' : '.';
            }

            wanted.push(row);
          }

          expect(
            marks(result),
            `${beforeWidth}×${beforeHeight} ${afterWidth}×${afterHeight} ${dx},${dy}`
          ).toEqual(wanted);
        }
      }
    }
  });

  it('leaves out the corner of the frame neither picture reaches', () => {
    // One is wider and the other is taller, so the bottom-right corner of the
    // frame is nothing at all rather than two pixels that agree.
    const result = diffImage(picture('....', '....'), picture('..', '..', '..', '..'));

    expect(result.stats.pixels).toBe(16);
    expect(result.stats.covered).toBe(12);
    expect(result.stats.unchanged).toBe(4);
    expect(result.stats.added + result.stats.removed).toBe(8);
    expect(result.stats.ratio).toBe(8 / 12);
  });

  it('measures how far apart the pixels both cover are', () => {
    const flat = picture('..', '..');
    const dimmer = picture('.8', '..');
    const { distance } = diffImage(flat, dimmer, { tolerance: 1 }).stats;

    // One pixel of four moved from white to a shade of grey, and the other
    // three did not move at all.
    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeCloseTo((255 - 226) / 255 / 4, 2);
  });

  it('counts a pixel that only one of the two pictures has', () => {
    const result = diffImage(picture('..', '..'), picture('...', '...', '...'));

    expect(result.width).toBe(3);
    expect(result.height).toBe(3);
    expect(marks(result)).toEqual(['..+', '..+', '+++']);
    expect(result.stats.added).toBe(5);
    expect(result.stats.removed).toBe(0);
  });

  it('reads a picture that lost a row as pixels that were removed', () => {
    const result = diffImage(picture('..', '..'), picture('..'));

    expect(marks(result)).toEqual(['..', '--']);
    expect(result.stats.removed).toBe(2);
  });

  it('lets a difference under the tolerance go', () => {
    const before = picture('55');
    const after = picture('56');

    expect(diffImage(before, after, { tolerance: 0.2 }).stats.changed).toBe(0);
    expect(diffImage(before, after, { tolerance: 0 }).stats.changed).toBe(1);
  });

  it('tells nothing at all from a white pixel', () => {
    // Both are white once they are blended onto white, and only the
    // transparency says otherwise.
    const result = diffImage(picture(' '), picture('.'), { tolerance: 0 });

    expect(result.stats.changed).toBe(1);
  });

  it('ignores an edge that was drawn smooth a second way', () => {
    // A black bar on a white page, with the column the edge falls in drawn as
    // a blend of the two — and drawn again with the blend weighted otherwise.
    const before = picture('..5###..', '..5###..', '..5###..', '..5###..', '..5###..');
    const after = picture('..8###..', '..8###..', '..8###..', '..8###..', '..8###..');

    expect(diffImage(before, after).stats.changed).toBe(0);
    expect(diffImage(before, after, { ignoreAntialiasing: false }).stats.changed).toBe(5);
  });

  it('ignores a hairline drawn smooth a second way', () => {
    // One pixel wide, so the line itself is not level. The page either side of
    // it is, which is what says there is an edge here at all.
    const before = picture('..5#5..', '..5#5..', '..5#5..', '..5#5..', '..5#5..');
    const after = picture('..8#3..', '..8#3..', '..8#3..', '..8#3..', '..8#3..');

    expect(diffImage(before, after).stats.changed).toBe(0);
  });

  it('keeps a change inside a texture, where no edge runs', () => {
    // Every pixel of this lies between the pixels around it and nothing in it
    // is level, so there is no edge for a change to hide under. The pixel in
    // the middle moved two shades, which the range across the texture would
    // otherwise be wide enough to account for.
    const before = picture('04836', '71592', '28364', '59107', '13649');
    const after = picture('04836', '71592', '28764', '59107', '13649');

    expect(diffImage(before, after).stats.changed).toBe(1);
  });

  it('keeps a pixel that took a colour of its own', () => {
    // Nothing around it is darker, so it is not a blend of anything: this is a
    // mark that arrived rather than an edge that moved.
    const before = picture('...', '...', '...');
    const after = picture('...', '.#.', '...');

    expect(diffImage(before, after).stats.changed).toBe(1);
  });

  it('groups the changed pixels into one region a change', () => {
    const before = picture('.......', '.......', '.......', '.......');
    const after = picture('r......', '.......', '.......', '.....g.');
    const result = diffImage(before, after, { blockSize: 2 });

    expect(result.regions).toEqual([
      { x: 0, y: 0, width: 1, height: 1, pixels: 1 },
      { x: 5, y: 3, width: 1, height: 1, pixels: 1 }
    ]);
  });

  it('joins what falls in one square of the grid, and splits what does not', () => {
    const before = picture('.....', '.....', '.....');
    const after = picture('r...r', '.....', '.....');

    expect(diffImage(before, after, { blockSize: 8 }).regions).toEqual([
      { x: 0, y: 0, width: 5, height: 1, pixels: 2 }
    ]);
    expect(diffImage(before, after, { blockSize: 2 }).regions).toHaveLength(2);
  });

  it('keeps the largest regions and says the list is not all of them', () => {
    const before = picture('.....', '.....', '.....');
    const after = picture('r.r.r', '.....', 'r.r.r');
    const result = diffImage(before, after, { blockSize: 1, maxRegions: 2 });

    expect(result.regions).toHaveLength(2);
    expect(result.complete).toBe(false);
    // The mask still holds every one of them.
    expect(result.stats.changed).toBe(6);
  });

  describe('with align: shift', () => {
    const before = picture(
      '.......',
      '.#####.',
      '.#...#.',
      '.#.#.#.',
      '.#...#.',
      '.#####.',
      '.......'
    );
    /** The same drawing, one pixel to the right and one down. */
    const moved = picture(
      '........',
      '........',
      '..#####.',
      '..#...#.',
      '..#.#.#.',
      '..#...#.',
      '..#####.',
      '........'
    );

    it('reads a picture that moved as a picture that changed, left alone', () => {
      expect(diffImage(before, moved).stats.changed).toBeGreaterThan(10);
    });

    it('finds the offset and compares what actually overlaps', () => {
      const result = diffImage(before, moved, { align: 'shift' });

      // The drawing sits a pixel further right and down, so the picture holding
      // it is moved a pixel back to put the two on top of each other.
      expect(result.offset).toEqual({ x: -1, y: -1 });
      expect(result.stats.changed).toBe(0);
      expect(result.before).toEqual({ x: 1, y: 1, width: 7, height: 7 });
      expect(result.after).toEqual({ x: 0, y: 0, width: 8, height: 8 });
    });

    it('stays where it is when the two are already lined up', () => {
      expect(diffImage(before, before, { align: 'shift' }).offset).toEqual({ x: 0, y: 0 });
    });

    it('goes no further than the radius it was given', () => {
      const result = diffImage(before, moved, { align: 'shift', alignRadius: 0 });

      expect(result.offset).toEqual({ x: 0, y: 0 });
    });
  });
});

describe('imageSimilarity', () => {
  it('says two copies of the same picture are the same picture', () => {
    const result = imageSimilarity(picture('.#.', '#.#'), picture('.#.', '#.#'));

    expect(result).toEqual({
      similarity: 1,
      identical: true,
      pixels: 6,
      matched: 6,
      changed: 0,
      added: 0,
      removed: 0,
      distance: 0,
      before: { width: 3, height: 2 },
      after: { width: 3, height: 2 }
    });
  });

  it('counts a changed pixel against the share', () => {
    const result = imageSimilarity(picture('....', '....'), picture('....', '..r.'));

    expect(result.changed).toBe(1);
    expect(result.matched).toBe(7);
    expect(result.similarity).toBe(7 / 8);
    expect(result.identical).toBe(false);
  });

  it('counts a pixel only one of the two covers against it', () => {
    const result = imageSimilarity(picture('..'), picture('..', '..'));

    expect(result.added).toBe(2);
    expect(result.pixels).toBe(4);
    expect(result.similarity).toBe(0.5);
    expect(result.before).toEqual({ width: 2, height: 1 });
    expect(result.after).toEqual({ width: 2, height: 2 });
  });

  it('reads the options the comparison reads', () => {
    const before = picture('55', '55');
    const after = picture('56', '55');

    expect(imageSimilarity(before, after, { tolerance: 0 }).similarity).toBe(0.75);
    expect(imageSimilarity(before, after, { tolerance: 0.2 }).similarity).toBe(1);
  });

  it('tells a picture that is unalike everywhere from one that is far apart', () => {
    const flat = picture('....', '....');
    // Every pixel moved, and only a little.
    const dimmed = picture('8888', '8888');
    // A quarter of the pixels moved, and all the way.
    const painted = picture('##..', '....');

    const little = imageSimilarity(flat, dimmed, { tolerance: 0 });
    const lot = imageSimilarity(flat, painted);

    expect(little.similarity).toBeLessThan(lot.similarity);
    expect(little.distance).toBeLessThan(lot.distance);
  });
});
