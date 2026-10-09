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

import type {
  DiffChange,
  DiffEdit,
  DiffLine,
  DiffRow,
  DiffRowKind,
  DiffSegment,
  DiffineSide
} from '../types.js';
import type { FoldPlan, FoldRun } from './fold.js';

/** One run of a line drawn from two, and where it sits in all three. */
export interface MergedRun extends DiffEdit {
  /** Where the run sits in the line as it is drawn, as a half-open interval. */
  start: number;
  end: number;
}

/**
 * A pair of lines drawn as one.
 *
 * The drawn line is neither of the two: it is the text they share, with what
 * went out and what came in next to each other where they differ. So it is
 * kept apart from {@link PaneLine.line}, which stays the line of `after` that
 * this stands for — the one a reader copies, and the one handed to anything of
 * the application's own.
 */
export interface MergedLine {
  /** The line as it is drawn, cut into its equal, deleted and inserted runs. */
  drawn: DiffLine;
  before: DiffLine;
  after: DiffLine;
  /** Where each run of the drawn line came from, in order. */
  runs: readonly MergedRun[];
}

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
  /**
   * The run of rows this stands in for, for a band rather than a line.
   *
   * A band takes a line's place in the list and a line's height on the screen,
   * so everything that counts lines or measures one of them carries on working
   * without knowing this is here.
   */
  fold?: FoldRun;
  /** The pair this line draws as one, for a line of a merged view. */
  merged?: MergedLine;
}

/** Everything a pane needs to draw, and to be pointed at from outside. */
export interface PaneLayout {
  lines: PaneLine[];
  /** Where a comparison row sits in `lines`, or -1 for a row this pane skips. */
  positions: Int32Array;
  /** The longest line in the document, which is what sets the width to scroll. */
  widest: PaneLine | null;
}

/** How many characters a line takes up on the screen. */
function drawnLength(drawn: PaneLine | null): number {
  return (drawn?.merged?.drawn ?? drawn?.line)?.text.length ?? 0;
}

/**
 * The pair of lines in a row drawn as one, or `null` where it cannot be.
 *
 * Only a row the engine laid the two lines against each other for can be, and
 * only when what it laid out covers both lines in order. A row comes from
 * outside as often as from the engine — a `result` worked out on a server, one
 * read back from storage — and runs that point past the end of a line would
 * draw text that is in neither document. A row like that is drawn as two lines
 * instead, which is always true.
 */
export function mergeRow(row: DiffRow): MergedLine | null {
  const { before, after, edits } = row;

  if (row.kind !== 'replace' || !before || !after || !edits || edits.length === 0) {
    return null;
  }

  const runs: MergedRun[] = [];
  const segments: DiffSegment[] = [];
  let beforeAt = 0;
  let afterAt = 0;
  let cursor = 0;

  for (const edit of edits) {
    const beforeLength = edit.beforeEnd - edit.beforeStart;
    const afterLength = edit.afterEnd - edit.afterStart;
    const fits =
      edit.beforeStart === beforeAt &&
      edit.afterStart === afterAt &&
      beforeLength >= 0 &&
      afterLength >= 0 &&
      (edit.kind === 'equal' ||
        (edit.kind === 'delete' && afterLength === 0) ||
        (edit.kind === 'insert' && beforeLength === 0));

    if (!fits) {
      return null;
    }

    const text =
      edit.kind === 'delete'
        ? before.text.slice(edit.beforeStart, edit.beforeEnd)
        : after.text.slice(edit.afterStart, edit.afterEnd);

    runs.push({ ...edit, start: cursor, end: cursor + text.length });
    segments.push({ kind: edit.kind, text });
    beforeAt = edit.beforeEnd;
    afterAt = edit.afterEnd;
    cursor += text.length;
  }

  if (beforeAt !== before.text.length || afterAt !== after.text.length) {
    return null;
  }

  return {
    drawn: { index: after.index, text: segments.map((segment) => segment.text).join(''), segments },
    before,
    after,
    runs
  };
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
  blanks: boolean,
  plan: FoldPlan | null
): PaneLayout {
  const lines: PaneLine[] = [];
  const positions = new Int32Array(rows.length).fill(-1);
  let widest: PaneLine | null = null;

  /** The band that stands in front of a row, where the plan puts one there. */
  function band(row: number): void {
    const fold = plan?.bands[row];

    if (fold) {
      lines.push({ kind: 'equal', side, line: null, numbers: [], change: -1, fold });
    }
  }

  for (const [row, entry] of rows.entries()) {
    band(row);

    if (plan?.hidden[row]) {
      continue;
    }

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

    if (line && (!widest || line.text.length > drawnLength(widest))) {
      widest = drawn;
    }
  }

  band(rows.length);

  return { lines, positions, widest };
}

/**
 * One side of a split view, with the line the caret can reach at the end of it.
 *
 * A comparison has no line after the last newline, and it is right not to: two
 * documents that both end in one have nothing there to compare. A field does —
 * put the caret at the end of `one\ntwo\n` and it sits on a third line, and an
 * empty document is one empty line rather than none.
 *
 * So the editor draws that line even though the comparison never mentions it.
 * Without it the field would be exactly one line taller than the lines drawn
 * behind it, which is the one thing that cannot differ: the text a reader types
 * and the tint under it would come apart at the bottom of the document.
 *
 * It is appended, so nothing that points into `positions` moves.
 */
export function fieldLayout(
  rows: readonly DiffRow[],
  owner: Int32Array,
  side: DiffineSide,
  text: string
): PaneLayout {
  const layout = splitLayout(rows, owner, side, false, null);

  if (text !== '' && !/[\n\r]$/.test(text)) {
    return layout;
  }

  layout.lines.push({
    kind: 'equal',
    side,
    line: { index: layout.lines.length, text: '', segments: [] },
    numbers: [layout.lines.length + 1],
    change: -1
  });

  return layout;
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
 * With `merge`, a pair of lines that were edited rather than replaced is drawn
 * once instead: the text both share, with what went out and what came in next
 * to each other inside it. The lines either side of such a pair are drawn the
 * unified way, a run of them at a time, so a change with nothing worth merging
 * in it — compared as whole lines, or too far apart to mark — comes out exactly
 * as it does without `merge`.
 *
 * `positions` is filled in for the sake of the type it shares with a split
 * pane. Nothing in a one-column view points at a row from outside it: there is
 * one pane, so there is nothing to hold level and nothing to draw a band
 * between.
 */
export function unifiedLayout(
  rows: readonly DiffRow[],
  changes: readonly DiffChange[],
  owner: Int32Array,
  plan: FoldPlan | null,
  merge = false
): PaneLayout {
  const lines: PaneLine[] = [];
  const positions = new Int32Array(rows.length).fill(-1);
  let widest: PaneLine | null = null;
  let cursor = 0;

  function push(drawn: PaneLine, row: number): void {
    if (positions[row] < 0) {
      positions[row] = lines.length;
    }

    lines.push(drawn);

    if (drawnLength(drawn) > drawnLength(widest)) {
      widest = drawn;
    }
  }

  /** The band that stands in front of a row, where the plan puts one there. */
  function band(row: number): void {
    const fold = plan?.bands[row];

    if (fold) {
      lines.push({ kind: 'equal', side: 'before', line: null, numbers: [], change: -1, fold });
    }
  }

  function pushUnchanged(until: number): void {
    for (; cursor < until; cursor += 1) {
      band(cursor);

      if (plan?.hidden[cursor]) {
        continue;
      }

      const row = rows[cursor];

      if (row.before && row.after) {
        push(
          {
            kind: 'equal',
            side: 'before',
            line: row.before,
            numbers: [row.before.index + 1, row.after.index + 1],
            change: owner[cursor]
          },
          cursor
        );
      }
    }
  }

  /** A run of changed rows the unified way: every line out, then every line in. */
  function pushApart(from: number, to: number): void {
    for (let row = from; row < to; row += 1) {
      const line = rows[row].before;

      if (line) {
        push(
          {
            kind: 'delete',
            side: 'before',
            line,
            numbers: [line.index + 1, null],
            change: owner[row]
          },
          row
        );
      }
    }

    for (let row = from; row < to; row += 1) {
      const line = rows[row].after;

      if (line) {
        push(
          {
            kind: 'insert',
            side: 'after',
            line,
            numbers: [null, line.index + 1],
            change: owner[row]
          },
          row
        );
      }
    }
  }

  for (const change of changes) {
    pushUnchanged(change.rowStart);
    band(change.rowStart);

    // Where the run of rows not drawn yet starts. A pair drawn as one line ends
    // that run, so the lines around it stay on the side of it they belong to.
    let pending = change.rowStart;

    for (let row = change.rowStart; merge && row < change.rowEnd; row += 1) {
      const merged = mergeRow(rows[row]);

      if (!merged) {
        continue;
      }

      pushApart(pending, row);
      push(
        {
          kind: 'replace',
          side: 'after',
          line: merged.after,
          numbers: [merged.before.index + 1, merged.after.index + 1],
          change: owner[row],
          merged
        },
        row
      );
      pending = row + 1;
    }

    pushApart(pending, change.rowEnd);
    cursor = change.rowEnd;
  }

  pushUnchanged(rows.length);
  band(rows.length);

  return { lines, positions, widest };
}
