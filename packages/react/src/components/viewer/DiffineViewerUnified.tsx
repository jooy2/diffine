'use client';

import * as React from 'react';
import type { DiffLine, DiffResult, DiffineSide, DiffineStrings } from '../../types.js';
import { DiffineViewerLine } from './DiffineViewerLine.js';

/** One line of a unified view, with the numbers it carries in both documents. */
interface UnifiedLine {
  kind: 'equal' | 'insert' | 'delete';
  side: DiffineSide;
  line: DiffLine;
  numbers: readonly (number | null)[];
}

/**
 * The rows of a comparison, put one under the other.
 *
 * A change that edited three lines into two is drawn as three lines going out
 * and then two coming in, rather than as pairs — which is the shape a patch
 * has, and the shape a reader of one expects. The words picked out inside those
 * lines are the same ones a split view marks, because they were worked out
 * before either view got hold of them.
 */
function unify(result: DiffResult): UnifiedLine[] {
  const lines: UnifiedLine[] = [];
  let cursor = 0;

  function pushUnchanged(until: number): void {
    for (; cursor < until; cursor += 1) {
      const row = result.rows[cursor];

      if (row.before && row.after) {
        lines.push({
          kind: 'equal',
          side: 'before',
          line: row.before,
          numbers: [row.before.index + 1, row.after.index + 1]
        });
      }
    }
  }

  for (const change of result.changes) {
    pushUnchanged(change.rowStart);

    const rows = result.rows.slice(change.rowStart, change.rowEnd);

    for (const row of rows) {
      if (row.before) {
        lines.push({
          kind: 'delete',
          side: 'before',
          line: row.before,
          numbers: [row.before.index + 1, null]
        });
      }
    }

    for (const row of rows) {
      if (row.after) {
        lines.push({
          kind: 'insert',
          side: 'after',
          line: row.after,
          numbers: [null, row.after.index + 1]
        });
      }
    }

    cursor = change.rowEnd;
  }

  pushUnchanged(result.rows.length);

  return lines;
}

export interface DiffineViewerUnifiedProps {
  result: DiffResult;
  lineNumbers: boolean;
  markers: boolean;
  label: string;
  strings: DiffineStrings;
  paneRef: React.RefObject<HTMLDivElement | null>;
}

/** The two documents in one column. */
export function DiffineViewerUnified({
  result,
  lineNumbers,
  markers,
  label,
  strings,
  paneRef
}: DiffineViewerUnifiedProps): React.JSX.Element {
  const lines = React.useMemo(() => unify(result), [result]);

  return (
    <div
      className="diffine-pane"
      data-side="unified"
      role="region"
      aria-label={label}
      tabIndex={0}
      ref={paneRef}
    >
      <div className="diffine-lines">
        {lines.map((entry, index) => (
          <DiffineViewerLine
            key={index}
            row={index}
            kind={entry.kind}
            side={entry.side}
            line={entry.line}
            numbers={entry.numbers}
            lineNumbers={lineNumbers}
            markers={markers}
            strings={strings}
          />
        ))}
      </div>
    </div>
  );
}
