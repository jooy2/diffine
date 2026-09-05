'use client';

import * as React from 'react';
import type {
  DiffLine,
  DiffRowKind,
  DiffineHighlight,
  DiffineSide,
  DiffineStrings
} from '../../types.js';
import { splitLine } from '../../internal/pieces.js';

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
  /**
   * Where this line sits in its pane's own list, or `null` for one that is not
   * really there — the hidden copy of the longest line that holds the pane's
   * width open while the rest are undrawn.
   */
  row: number | null;
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
  /** Which change this belongs to, or -1 for a line that did not change. */
  change: number;
  /** Whether this is the change a reader has moved to. */
  current: boolean;
  lineNumbers: boolean;
  markers: boolean;
  strings: DiffineStrings;
  highlight?: DiffineHighlight;
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
  change,
  current,
  lineNumbers,
  markers,
  strings,
  highlight
}: DiffineViewerLineProps): React.JSX.Element {
  const label = line ? labelFor(strings, kind, side) : null;

  return (
    <div
      className="diffine-line"
      data-kind={line ? kind : 'blank'}
      data-side={side}
      {...(row === null ? {} : { 'data-row': row })}
      {...(change < 0 ? {} : { 'data-change': change })}
      {...(current ? { 'data-current': 'true' } : {})}
    >
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
        {line ? <DiffineViewerText line={line} side={side} highlight={highlight} /> : null}
      </span>
    </div>
  );
}

/** The line itself, with whatever moved inside it — and whatever colours it. */
function DiffineViewerText({
  line,
  side,
  highlight
}: {
  line: DiffLine;
  side: DiffineSide;
  highlight?: DiffineHighlight;
}): React.JSX.Element {
  const pieces = splitLine(line, highlight?.(line, side));

  if (!pieces) {
    return <>{line.text}</>;
  }

  return (
    <>
      {pieces.map((piece, index) => {
        if (piece.kind === 'equal') {
          return piece.className || piece.style ? (
            <span key={index} className={piece.className} style={piece.style}>
              {piece.text}
            </span>
          ) : (
            <React.Fragment key={index}>{piece.text}</React.Fragment>
          );
        }

        return (
          <mark
            key={index}
            className={piece.className ? `diffine-piece ${piece.className}` : 'diffine-piece'}
            data-kind={piece.kind}
            style={piece.style}
          >
            {piece.text}
          </mark>
        );
      })}
    </>
  );
}
