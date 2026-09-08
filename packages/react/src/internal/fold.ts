/**
 * The runs of the comparison a pane stands a band in for instead of drawing.
 *
 * There are two of them and they look the same on the screen, which is why they
 * are one thing here. A run of unchanged lines far from any change is a run
 * nobody reading a comparison is reading: `collapse` folds it away and leaves a
 * band a reader can open. A run that is missing altogether — the lines between
 * one hunk of a patch and the next — cannot be opened, because nobody sent
 * them, and it still has to be said rather than drawn over.
 *
 * The plan is worked out from the rows, so both panes of a split view fold the
 * same rows and stay level with each other. It is not worked out from what is
 * on the screen, so a folded run costs nothing to scroll past.
 */

import type { DiffRow } from '../types.js';
import { follows, gapBetween } from './diff/gap.js';

/** A run of rows a pane does not draw, and what it stands in for. */
export interface FoldRun {
  /** The rows it covers, as a half-open interval. Empty for a run that is missing. */
  start: number;
  end: number;
  /** How many lines of the document it stands in for. */
  lines: number;
  /** Whether those lines are in hand, so a reader can open the band. */
  expandable: boolean;
}

/** Which rows are folded, in the shape a layout reads them in. */
export interface FoldPlan {
  /**
   * The band drawn in front of each row, where there is one.
   *
   * One longer than the rows, because a run can end the document and its band
   * still has to be drawn after the last line that is.
   */
  bands: readonly (FoldRun | undefined)[];
  /** Whether each row is inside a run, and so is not drawn at all. */
  hidden: Uint8Array;
}

/** How a comparison is folded. */
export interface FoldOptions {
  /** Whether runs of unchanged lines far from a change are folded away. */
  collapse: boolean;
  /** How many unchanged lines are kept either side of a change. */
  context: number;
  /** The runs a reader has opened, by the row each one starts at. */
  opened: ReadonlySet<number>;
}

/**
 * Every run the panes fold, in row order and never overlapping.
 *
 * A missing run is found whatever `collapse` says, because it is not a choice
 * about how much to show: the lines are not there, and a view that drew line 7
 * above line 40 would be saying they were next to each other.
 */
function foldRuns(rows: readonly DiffRow[], options: FoldOptions): FoldRun[] {
  const kept = Math.max(0, Math.trunc(options.context));
  const runs: FoldRun[] = [];
  let index = 0;

  while (index < rows.length) {
    // What is missing in front of this row, which is a band of its own.
    const missing = index > 0 ? gapBetween(rows[index - 1], rows[index]) : 0;

    if (missing > 0) {
      runs.push({ start: index, end: index, lines: missing, expandable: false });
    }

    if (rows[index].kind !== 'equal') {
      index += 1;
      continue;
    }

    // The run of unchanged rows this one begins, up to the next change or the
    // next thing that is missing.
    let end = index + 1;

    while (end < rows.length && rows[end].kind === 'equal' && follows(rows[end - 1], rows[end])) {
      end += 1;
    }

    // What is kept is what surrounds a change. A run that reaches the top or
    // the bottom of the comparison has nothing on that side to surround.
    const keepStart = index > 0 && rows[index - 1].kind !== 'equal' ? kept : 0;
    const keepEnd = end < rows.length && rows[end].kind !== 'equal' ? kept : 0;
    const from = index + keepStart;
    const to = end - keepEnd;

    // A band where something is missing already stands at this row. Two of them
    // in a row would say the same thing twice, so the lines that are in hand
    // are drawn instead.
    const taken = missing > 0 && from === index;

    if (options.collapse && to > from && !taken && !options.opened.has(from)) {
      runs.push({ start: from, end: to, lines: to - from, expandable: true });
    }

    index = end;
  }

  return runs;
}

/**
 * The rows a pane draws and the bands that stand in for the rest, or `null`
 * where nothing is folded at all.
 *
 * `null` rather than a plan that folds nothing, so that the common case — a
 * comparison of two whole documents, drawn whole — allocates nothing and every
 * layout takes the path it took before any of this existed.
 */
export function foldPlan(rows: readonly DiffRow[], options: FoldOptions): FoldPlan | null {
  const runs = foldRuns(rows, options);

  if (runs.length === 0) {
    return null;
  }

  const bands: (FoldRun | undefined)[] = new Array(rows.length + 1).fill(undefined);
  const hidden = new Uint8Array(rows.length);

  for (const run of runs) {
    bands[run.start] = run;
    hidden.fill(1, run.start, run.end);
  }

  return { bands, hidden };
}
