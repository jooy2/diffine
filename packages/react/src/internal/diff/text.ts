/**
 * Two documents, turned into the rows a reader looks at.
 *
 * The lines are matched first, which says where the changes are. Then every
 * pair of lines inside a change is compared again, one level down, which says
 * what happened inside them. The result is one flat list of rows in document
 * order, each holding whichever side has a line on it — the shape a side-by-side
 * view can draw straight through, and the shape a unified view gets by reading
 * the same rows and putting one side under the other.
 */

import type {
  DiffChange,
  DiffChangeKind,
  DiffLine,
  DiffOptions,
  DiffResult,
  DiffRow,
  DiffStats
} from '../../types.js';
import { compareInline, type InlineOptions } from './inline.js';
import { matchSequences } from './myers.js';
import { pairLines } from './pair.js';
import { comparisonKey, splitLines } from './tokens.js';

/** Every option settled, with nothing left to fall back on. */
export interface TextOptions extends InlineOptions {
  inlineThreshold: number;
}

/** What every option falls back to. */
export const TEXT_DEFAULTS: Required<DiffOptions> = {
  inline: 'word',
  whitespace: 'exact',
  ignoreCase: false,
  inlineThreshold: 0.3,
  maxCost: 5000
};

/** The options as they were given, with the defaults filled in behind them. */
export function settleOptions(options: DiffOptions | undefined): TextOptions {
  return {
    mode: options?.inline ?? TEXT_DEFAULTS.inline,
    whitespace: options?.whitespace ?? TEXT_DEFAULTS.whitespace,
    ignoreCase: options?.ignoreCase ?? TEXT_DEFAULTS.ignoreCase,
    inlineThreshold: options?.inlineThreshold ?? TEXT_DEFAULTS.inlineThreshold,
    maxCost: options?.maxCost ?? TEXT_DEFAULTS.maxCost
  };
}

/**
 * The rows for one run of lines that went out and one run that came in.
 *
 * Both the engine and the patch reader arrive at the same question here — a
 * handful of lines were removed and a handful were added, so which of them goes
 * opposite which, and what changed inside each pair. The offsets say where each
 * run starts in its own document, so the lines come back carrying the number
 * they have there rather than the number they have in the run.
 */
export function changeRows(
  before: readonly string[],
  after: readonly string[],
  beforeOffset: number,
  afterOffset: number,
  options: TextOptions
): { kind: DiffChangeKind; rows: DiffRow[] } {
  const kind: DiffChangeKind =
    before.length === 0 ? 'insert' : after.length === 0 ? 'delete' : 'replace';
  const rows: DiffRow[] = [];

  // Which line goes opposite which, in the order they were written. See
  // `pair.ts`: taking them straight down the run is right until a run both
  // edits lines and inserts them, and from there every row after the insertion
  // is a pair of lines that have nothing to do with each other.
  for (const [beforeSlot, afterSlot] of pairLines(before, after)) {
    if (beforeSlot >= 0 && afterSlot >= 0) {
      const inside = compareInline(before[beforeSlot], after[afterSlot], options);
      const worthMarking = inside.similarity >= options.inlineThreshold;

      rows.push({
        kind: 'replace',
        before: {
          index: beforeOffset + beforeSlot,
          text: before[beforeSlot],
          segments: worthMarking ? inside.before : []
        },
        after: {
          index: afterOffset + afterSlot,
          text: after[afterSlot],
          segments: worthMarking ? inside.after : []
        }
      });
    } else if (beforeSlot >= 0) {
      rows.push({
        kind: 'delete',
        before: { index: beforeOffset + beforeSlot, text: before[beforeSlot], segments: [] },
        after: null
      });
    } else {
      rows.push({
        kind: 'insert',
        before: null,
        after: { index: afterOffset + afterSlot, text: after[afterSlot], segments: [] }
      });
    }
  }

  return { kind, rows };
}

/** Counts a run of changed rows into the totals a result carries. */
export function countRows(rows: readonly DiffRow[], stats: DiffStats): void {
  for (const row of rows) {
    if (row.kind === 'replace') {
      stats.changed += 1;
    } else if (row.kind === 'delete') {
      stats.deleted += 1;
    } else if (row.kind === 'insert') {
      stats.inserted += 1;
    } else {
      stats.unchanged += 1;
    }
  }
}

export function compareText(before: string, after: string, options: TextOptions): DiffResult {
  const beforeLines = splitLines(before);
  const afterLines = splitLines(after);
  const key = (line: string) => comparisonKey(line, options.whitespace, options.ignoreCase);
  const { matches, complete } = matchSequences(
    beforeLines.map(key),
    afterLines.map(key),
    options.maxCost
  );

  const rows: DiffRow[] = [];
  const changes: DiffChange[] = [];
  const stats: DiffStats = { unchanged: 0, changed: 0, inserted: 0, deleted: 0 };

  let beforeCursor = 0;
  let afterCursor = 0;

  /** The rows for everything between the last match and the next one. */
  function pushChange(beforeEnd: number, afterEnd: number): void {
    if (beforeEnd === beforeCursor && afterEnd === afterCursor) {
      return;
    }

    const rowStart = rows.length;
    const built = changeRows(
      beforeLines.slice(beforeCursor, beforeEnd),
      afterLines.slice(afterCursor, afterEnd),
      beforeCursor,
      afterCursor,
      options
    );

    rows.push(...built.rows);
    countRows(built.rows, stats);

    changes.push({
      kind: built.kind,
      beforeStart: beforeCursor,
      beforeEnd,
      afterStart: afterCursor,
      afterEnd,
      rowStart,
      rowEnd: rows.length
    });

    beforeCursor = beforeEnd;
    afterCursor = afterEnd;
  }

  /** A line that is on both sides, so both cells of the row hold their own. */
  function equalLine(lines: readonly string[], index: number): DiffLine {
    return { index, text: lines[index], segments: [] };
  }

  for (const match of matches) {
    pushChange(match.beforeStart, match.afterStart);

    for (let offset = 0; offset < match.length; offset += 1) {
      rows.push({
        kind: 'equal',
        before: equalLine(beforeLines, match.beforeStart + offset),
        after: equalLine(afterLines, match.afterStart + offset)
      });
    }

    stats.unchanged += match.length;
    beforeCursor = match.beforeStart + match.length;
    afterCursor = match.afterStart + match.length;
  }

  pushChange(beforeLines.length, afterLines.length);

  return { before: beforeLines, after: afterLines, rows, changes, stats, complete };
}
