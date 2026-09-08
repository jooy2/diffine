/**
 * Where the rows of one pane are.
 *
 * Everything that points at a row from outside it — the band a change makes
 * between two panes, the button that jumps to the next change, the search
 * bringing a match onto the screen, the space standing in for the rows that are
 * not drawn — needs to know where a row sits without looking at it, because
 * most of the time it is not there to look at.
 *
 * There are three answers to that and they are the whole of this file. Every
 * row the same height, which is a pane that is not wrapping: arithmetic. Rows
 * of their own heights, which is a pane that is: a table built from the ones
 * that have been measured, with the rest standing at the average of them. And
 * a pane drawing every row it has, where the page itself is the answer and a
 * guess would be a worse one — so these say they do not know, and the caller
 * reads the element.
 */

/** Where the rows of one pane are, for anything that has to point at one. */
export interface RowMetrics {
  /**
   * Where a row starts, or -1 where the answer is only in the page.
   *
   * Asking for the row after the last one gives the height of the whole column,
   * which is what a spacer under the drawn rows is.
   */
  top: (row: number) => number;
  /** How tall a row is, or 0 where the answer is only in the page. */
  height: (row: number) => number;
  /** Which row is at a point down the column, or -1 where that is not known. */
  at: (offset: number) => number;
  /** How tall the whole column is, or 0 where every row of it is drawn. */
  total: number;
}

/** A pane drawing every row it has, where the page is the only honest answer. */
export const DRAWN_ROWS: RowMetrics = {
  top: () => -1,
  height: () => 0,
  at: () => -1,
  total: 0
};

/** Every row the same height, which is a pane that is not wrapping. */
export function evenRows(count: number, height: number): RowMetrics {
  return {
    top: (row) => Math.min(Math.max(row, 0), count) * height,
    height: () => height,
    at: (offset) => Math.min(count - 1, Math.max(0, Math.floor(offset / height))),
    total: count * height
  };
}

/** The last row that starts at or before `offset`, found by halving the table. */
function rowAt(tops: Float64Array, count: number, offset: number): number {
  let low = 0;
  let high = count - 1;

  while (low < high) {
    const middle = (low + high + 1) >> 1;

    if (tops[middle] <= offset) {
      low = middle;
    } else {
      high = middle - 1;
    }
  }

  return Math.max(0, low);
}

/**
 * Rows of their own heights, from a table of where each one starts.
 *
 * `tops` is one longer than the rows, so the last entry is the height of the
 * whole column and every row's height is the step to the next entry.
 */
export function unevenRows(tops: Float64Array, count: number): RowMetrics {
  return {
    top: (row) => tops[Math.min(Math.max(row, 0), count)],
    height: (row) => (row >= 0 && row < count ? tops[row + 1] - tops[row] : 0),
    at: (offset) => (count === 0 ? -1 : rowAt(tops, count, offset)),
    total: tops[count]
  };
}
