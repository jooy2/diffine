/**
 * Where the changes are, worked out from where the changed pixels are.
 *
 * A mask is an answer no reader can act on. Ten thousand lit pixels scattered
 * over a photograph and ten thousand in one corner of a screenshot are the same
 * number and not the same news, and what turns one into the other is grouping:
 * pixels are counted into squares of a fixed size as the comparison runs, the
 * squares that touch each other are one change, and each change comes out as
 * the smallest rectangle that holds the pixels inside it.
 *
 * The grid is what keeps this affordable. Joining up ten million pixels one at
 * a time is a graph with ten million nodes in it; joining up the squares of a
 * sixteen-pixel grid is a graph with forty thousand, and the boxes that come
 * out are tight either way because each square remembers the pixels it actually
 * saw rather than its own corners.
 */

import type { DiffImageRegion } from '../../types.js';

/** The grid, and what each square of it has seen. */
export interface Cells {
  columns: number;
  rows: number;
  size: number;
  /** How many changed pixels fell in each square. */
  pixels: Int32Array;
  /** The box those pixels actually covered, per square. */
  left: Int32Array;
  top: Int32Array;
  right: Int32Array;
  bottom: Int32Array;
}

/** An empty grid over a frame of `width` by `height`. */
export function createCells(width: number, height: number, size: number): Cells {
  const columns = Math.max(1, Math.ceil(width / size));
  const rows = Math.max(1, Math.ceil(height / size));
  const count = columns * rows;

  return {
    columns,
    rows,
    size,
    pixels: new Int32Array(count),
    left: new Int32Array(count),
    top: new Int32Array(count),
    right: new Int32Array(count),
    bottom: new Int32Array(count)
  };
}

/** Counts one changed pixel into the square it falls in. */
export function markPixel(cells: Cells, x: number, y: number): void {
  const at = ((y / cells.size) | 0) * cells.columns + ((x / cells.size) | 0);
  const seen = cells.pixels[at];

  cells.pixels[at] = seen + 1;

  if (seen === 0) {
    cells.left[at] = x;
    cells.top[at] = y;
    cells.right[at] = x;
    cells.bottom[at] = y;

    return;
  }

  if (x < cells.left[at]) {
    cells.left[at] = x;
  } else if (x > cells.right[at]) {
    cells.right[at] = x;
  }

  if (y < cells.top[at]) {
    cells.top[at] = y;
  } else if (y > cells.bottom[at]) {
    cells.bottom[at] = y;
  }
}

/** What came out of the grid, and whether it is the whole of it. */
export interface RegionResult {
  regions: DiffImageRegion[];
  complete: boolean;
}

/**
 * The squares that hold something, joined into regions.
 *
 * Two squares belong to the same change when they touch, corners included — a
 * diagonal line crosses a grid one square at a time and would otherwise come
 * back as a staircase of separate findings.
 *
 * Past `maxRegions` the largest are kept and `complete` says so. Which is the
 * honest answer for two photographs that differ everywhere: the mask still
 * holds every pixel, and a list of forty thousand rectangles is not a list
 * anybody was going to step through.
 */
export function regionsOf(cells: Cells, maxRegions: number): RegionResult {
  const { columns, rows, pixels } = cells;
  const seen = new Uint8Array(pixels.length);
  // One entry a square at the very worst, which is a change that fills the
  // frame — and that is the case where growing an array would hurt most.
  const stack = new Int32Array(pixels.length);
  const regions: DiffImageRegion[] = [];

  for (let start = 0; start < pixels.length; start += 1) {
    if (pixels[start] === 0 || seen[start] === 1) {
      continue;
    }

    let depth = 0;
    let count = 0;
    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;

    stack[depth] = start;
    depth += 1;
    seen[start] = 1;

    while (depth > 0) {
      depth -= 1;

      const at = stack[depth];
      const column = at % columns;
      const row = (at / columns) | 0;

      count += pixels[at];
      left = Math.min(left, cells.left[at]);
      top = Math.min(top, cells.top[at]);
      right = Math.max(right, cells.right[at]);
      bottom = Math.max(bottom, cells.bottom[at]);

      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nextColumn = column + dx;
          const nextRow = row + dy;

          if (nextColumn < 0 || nextColumn >= columns || nextRow < 0 || nextRow >= rows) {
            continue;
          }

          const next = nextRow * columns + nextColumn;

          if (pixels[next] === 0 || seen[next] === 1) {
            continue;
          }

          seen[next] = 1;
          stack[depth] = next;
          depth += 1;
        }
      }
    }

    regions.push({
      x: left,
      y: top,
      width: right - left + 1,
      height: bottom - top + 1,
      pixels: count
    });
  }

  const complete = regions.length <= maxRegions;

  if (!complete) {
    regions.sort((one, other) => other.pixels - one.pixels);
    regions.length = maxRegions;
  }

  // Reading order, which is the order a reader steps through them in. The
  // largest-first sort above is only ever a way of choosing which ones to keep.
  regions.sort((one, other) => one.y - other.y || one.x - other.x);

  return { regions, complete };
}
