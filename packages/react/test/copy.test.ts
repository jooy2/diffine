import { describe, expect, it } from 'vitest';
import { diffImage, diffText, paintDiffImage } from 'diffine-react';
import { joinLines } from '../src/internal/copy.js';
import { changeOfRow, splitLayout } from '../src/internal/rows.js';

/** One side of a comparison, laid out the way a viewer draws it. */
function paneOf(before: string, after: string, side: 'before' | 'after') {
  const result = diffText(before, after);

  return splitLayout(
    result.rows,
    changeOfRow(result.rows.length, result.changes),
    side,
    true,
    null
  );
}

/** A picture of one flat colour, for a comparison with a known answer. */
function block(
  width: number,
  height: number,
  colour: number
): { data: Uint8ClampedArray; width: number; height: number } {
  const data = new Uint8ClampedArray(width * height * 4);

  for (let pixel = 0; pixel < width * height; pixel += 1) {
    data[pixel * 4] = colour;
    data[pixel * 4 + 1] = colour;
    data[pixel * 4 + 2] = colour;
    data[pixel * 4 + 3] = 255;
  }

  return { data, width, height };
}

describe('what a reader copies out of a pane', () => {
  const BEFORE = 'one\ntwo\nthree';
  const AFTER = 'one\ntwo\nthree\nfour\nfive';

  it('leaves out the blanks that hold the two sides level', () => {
    const layout = paneOf(BEFORE, AFTER, 'before');

    // Five rows are drawn on the left: three lines and two blanks.
    expect(layout.lines).toHaveLength(5);
    expect(joinLines(layout, 0, 4, 0, 0)).toBe('one\ntwo\nthree');
  });

  it('cuts the first and the last line where the selection does', () => {
    const layout = paneOf(BEFORE, AFTER, 'after');

    expect(joinLines(layout, 0, 2, 1, 3)).toBe('ne\ntwo\nthr');
  });

  it('copies one line as that line', () => {
    const layout = paneOf(BEFORE, AFTER, 'after');

    expect(joinLines(layout, 1, 1, 1, 3)).toBe('wo');
  });

  it('finds nothing where nothing but blanks was selected', () => {
    const layout = paneOf(BEFORE, AFTER, 'before');

    expect(joinLines(layout, 3, 4, 0, 0)).toBeNull();
  });
});

describe('paintDiffImage', () => {
  it('paints the pixels that changed and leaves the rest see-through', () => {
    const result = diffImage(block(2, 1, 0), block(2, 1, 255));
    const picture = paintDiffImage(result);

    expect([picture.width, picture.height]).toEqual([2, 1]);
    expect([...picture.data.slice(0, 4)]).toEqual([232, 62, 140, 255]);
  });

  it('leaves an unchanged pixel with nothing in it', () => {
    const picture = paintDiffImage(diffImage(block(1, 1, 40), block(1, 1, 40)));

    expect([...picture.data]).toEqual([0, 0, 0, 0]);
  });

  it('paints what only one of the two pictures covers', () => {
    const result = diffImage(block(1, 1, 40), block(2, 1, 40));
    const picture = paintDiffImage(result, { added: [1, 2, 3, 4] });

    expect([...picture.data.slice(4)]).toEqual([1, 2, 3, 4]);
  });

  it('takes a colour for every kind of pixel', () => {
    const picture = paintDiffImage(diffImage(block(1, 1, 0), block(1, 1, 0)), {
      unchanged: [9, 9, 9, 9]
    });

    expect([...picture.data]).toEqual([9, 9, 9, 9]);
  });
});
