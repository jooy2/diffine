/**
 * The comparison's rows, turned into what one pane actually draws.
 *
 * A row belongs to both documents at once, and a pane draws one of them. That
 * is one step of translation on its own — but it is also where two other things
 * are settled, and both of them are needed before a single line is on the page.
 *
 * Which line sits where. With the two sides held level, a pane draws every row
 * and a line's position is its row's number. Without, a pane draws only the
 * rows it has a line for, and the two numbers part company. Anything that has
 * to point at a row from outside the pane — the band a change makes between the
 * panes, the button that moves to the next one — needs the second number, so it
 * is worked out once here rather than counted again by each of them.
 *
 * And how wide the pane's content is. With the rows virtualised the drawn lines
 * are the ones on the screen, so the widest of them is whatever happens to be
 * in view, and the sideways scroll would grow and shrink as a reader scrolled
 * down. The longest line of the whole document is kept for that.
 */

import type { DiffChange, DiffLine, DiffRow, DiffRowKind, DiffineSide } from '../types.js';

/** One line as a pane draws it. */
export interface PaneLine {
  /** What happened to the row this came from. */
  kind: DiffRowKind;
  /** Which document the line is from, which decides its colour and its marker. */
  side: DiffineSide;
  /** The line, or `null` for the blank opposite a line with no counterpart. */
  line: DiffLine | null;
  /** The numbers down the side: one for a split view, two for a unified one. */
  numbers: readonly (number | null)[];
  /** Which change this belongs to, or -1 for a line that did not change. */
  change: number;
}

/** Everything a pane needs to draw, and to be pointed at from outside. */
export interface PaneLayout {
  lines: PaneLine[];
  /** Where a comparison row sits in `lines`, or -1 for a row this pane skips. */
  positions: Int32Array;
  /** The longest line in the document, which is what sets the width to scroll. */
  widest: PaneLine | null;
}

/** Which change each row belongs to, or -1 where a row did not change. */
export function changeOfRow(rowCount: number, changes: readonly DiffChange[]): Int32Array {
  const owner = new Int32Array(rowCount).fill(-1);

  for (const [index, change] of changes.entries()) {
    owner.fill(index, change.rowStart, change.rowEnd);
  }

  return owner;
}

/** One side of a split view. */
export function splitLayout(
  rows: readonly DiffRow[],
  owner: Int32Array,
  side: DiffineSide,
  blanks: boolean
): PaneLayout {
  const lines: PaneLine[] = [];
  const positions = new Int32Array(rows.length).fill(-1);
  let widest: PaneLine | null = null;

  for (const [row, entry] of rows.entries()) {
    const line = entry[side];

    if (!line && !blanks) {
      continue;
    }

    const drawn: PaneLine = {
      kind: entry.kind,
      side,
      line,
      numbers: [line ? line.index + 1 : null],
      change: owner[row]
    };

    positions[row] = lines.length;
    lines.push(drawn);

    if (line && (!widest || line.text.length > (widest.line?.text.length ?? 0))) {
      widest = drawn;
    }
  }

  return { lines, positions, widest };
}

/**
 * The two documents in one column, with what went out above what came in.
 *
 * A change that edited three lines into two is drawn as three lines going out
 * and then two coming in, rather than as pairs — which is the shape a patch
 * has, and the shape a reader of one expects. The words picked out inside those
 * lines are the same ones a split view marks, because they were worked out
 * before either view got hold of them.
 *
 * `positions` is filled in for the sake of the type it shares with a split
 * pane. Nothing in a unified view points at a row from outside it: there is one
 * pane, so there is nothing to hold level and nothing to draw a band between.
 */
export function unifiedLayout(
  rows: readonly DiffRow[],
  changes: readonly DiffChange[],
  owner: Int32Array
): PaneLayout {
  const lines: PaneLine[] = [];
  const positions = new Int32Array(rows.length).fill(-1);
  let widest: PaneLine | null = null;
  let cursor = 0;

  function push(
    kind: DiffRowKind,
    side: DiffineSide,
    line: DiffLine,
    numbers: (number | null)[],
    row: number
  ): void {
    const drawn: PaneLine = { kind, side, line, numbers, change: owner[row] };

    if (positions[row] < 0) {
      positions[row] = lines.length;
    }

    lines.push(drawn);

    if (line.text.length > (widest?.line?.text.length ?? 0)) {
      widest = drawn;
    }
  }

  function pushUnchanged(until: number): void {
    for (; cursor < until; cursor += 1) {
      const row = rows[cursor];

      if (row.before && row.after) {
        push('equal', 'before', row.before, [row.before.index + 1, row.after.index + 1], cursor);
      }
    }
  }

  for (const change of changes) {
    pushUnchanged(change.rowStart);

    for (let row = change.rowStart; row < change.rowEnd; row += 1) {
      const line = rows[row].before;

      if (line) {
        push('delete', 'before', line, [line.index + 1, null], row);
      }
    }

    for (let row = change.rowStart; row < change.rowEnd; row += 1) {
      const line = rows[row].after;

      if (line) {
        push('insert', 'after', line, [null, line.index + 1], row);
      }
    }

    cursor = change.rowEnd;
  }

  pushUnchanged(rows.length);

  return { lines, positions, widest };
}
