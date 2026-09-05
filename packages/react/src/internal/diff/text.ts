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
  DiffResult,
  DiffRow,
  DiffStats
} from '../../types.js';
import { compareInline, type InlineOptions } from './inline.js';
import { matchSequences } from './myers.js';
import { comparisonKey, splitLines } from './tokens.js';

/** Every option settled, with nothing left to fall back on. */
export interface TextOptions extends InlineOptions {
  inlineThreshold: number;
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
    const beforeCount = beforeEnd - beforeCursor;
    const afterCount = afterEnd - afterCursor;

    if (beforeCount === 0 && afterCount === 0) {
      return;
    }

    const kind: DiffChangeKind =
      beforeCount === 0 ? 'insert' : afterCount === 0 ? 'delete' : 'replace';
    const rowStart = rows.length;

    // Lines are paired off in the order they were written, and whatever is left
    // over on the longer side follows as lines with nothing opposite them. It is
    // the only pairing that holds a rewritten paragraph together: matching by
    // similarity instead would reorder the rows, and a reader following an edit
    // down the page reads the order it was written in.
    for (let offset = 0; offset < Math.max(beforeCount, afterCount); offset += 1) {
      const beforeIndex = offset < beforeCount ? beforeCursor + offset : -1;
      const afterIndex = offset < afterCount ? afterCursor + offset : -1;

      if (beforeIndex >= 0 && afterIndex >= 0) {
        const inside = compareInline(beforeLines[beforeIndex], afterLines[afterIndex], options);
        const worthMarking = inside.similarity >= options.inlineThreshold;

        rows.push({
          kind: 'replace',
          before: {
            index: beforeIndex,
            text: beforeLines[beforeIndex],
            segments: worthMarking ? inside.before : []
          },
          after: {
            index: afterIndex,
            text: afterLines[afterIndex],
            segments: worthMarking ? inside.after : []
          }
        });
        stats.changed += 1;
      } else if (beforeIndex >= 0) {
        rows.push({
          kind: 'delete',
          before: { index: beforeIndex, text: beforeLines[beforeIndex], segments: [] },
          after: null
        });
        stats.deleted += 1;
      } else {
        rows.push({
          kind: 'insert',
          before: null,
          after: { index: afterIndex, text: afterLines[afterIndex], segments: [] }
        });
        stats.inserted += 1;
      }
    }

    changes.push({
      kind,
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
