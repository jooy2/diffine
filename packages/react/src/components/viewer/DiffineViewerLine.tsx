'use client';

import * as React from 'react';
import type { DiffLine, DiffRowKind, DiffineSide, DiffineStrings } from '../../types.js';

/** What is drawn in the marker column, per side. */
const MARKERS: Record<DiffineSide, Partial<Record<DiffRowKind, string>>> = {
  before: { delete: '−', replace: '~' },
  after: { insert: '+', replace: '~' }
};

/** Which word a screen reader hears in front of the line. */
function labelFor(strings: DiffineStrings, kind: DiffRowKind, side: DiffineSide): string | null {
  if (kind === 'replace') {
    return strings.changed;
  }

  if (kind === 'insert' && side === 'after') {
    return strings.added;
  }

  if (kind === 'delete' && side === 'before') {
    return strings.removed;
  }

  return null;
}

export interface DiffineViewerLineProps {
  /** Which row of the comparison this is, and how the two sides find each other. */
  row: number;
  kind: DiffRowKind;
  side: DiffineSide;
  /** The line to draw, or `null` for the blank opposite a line with no counterpart. */
  line: DiffLine | null;
  /**
   * The numbers down the side, one per column. A split view has one column and
   * a unified view has two, so this is a list rather than a number; `null` is a
   * column with nothing to put in it on this line.
   */
  numbers: readonly (number | null)[];
  lineNumbers: boolean;
  markers: boolean;
  strings: DiffineStrings;
}

/**
 * One line of one side, and the columns beside it.
 *
 * `kind` is the row's rather than the line's, so a blank knows what happened
 * opposite it: a blank across from an inserted line and a blank across from
 * nothing at all are two different things, and drawing both as empty loses
 * which of the two a reader is looking at.
 */
export function DiffineViewerLine({
  row,
  kind,
  side,
  line,
  numbers,
  lineNumbers,
  markers,
  strings
}: DiffineViewerLineProps): React.JSX.Element {
  const label = line ? labelFor(strings, kind, side) : null;

  return (
    <div className="diffine-line" data-row={row} data-kind={line ? kind : 'blank'} data-side={side}>
      {lineNumbers || markers ? (
        // One element around the numbers and the marker so that the whole of it
        // can be held against the left edge while a long line is scrolled past
        // it. Held one at a time, the marker slides out from under the numbers.
        <span className="diffine-gutter" aria-hidden="true">
          {lineNumbers
            ? numbers.map((value, column) => (
                <span key={column} className="diffine-number">
                  {value ?? ''}
                </span>
              ))
            : null}
          {markers ? (
            <span className="diffine-marker">{(line && MARKERS[side][kind]) ?? ''}</span>
          ) : null}
        </span>
      ) : null}
      <span className="diffine-text">
        {label ? <span className="diffine-said">{`${label}: `}</span> : null}
        {line ? <DiffineViewerText line={line} /> : null}
      </span>
    </div>
  );
}

/** The line itself, with whatever moved inside it picked out. */
function DiffineViewerText({ line }: { line: DiffLine }): React.JSX.Element {
  if (line.segments.length === 0) {
    return <>{line.text}</>;
  }

  return (
    <>
      {line.segments.map((piece, index) =>
        piece.kind === 'equal' ? (
          <React.Fragment key={index}>{piece.text}</React.Fragment>
        ) : (
          <mark key={index} className="diffine-piece" data-kind={piece.kind}>
            {piece.text}
          </mark>
        )
      )}
    </>
  );
}
