'use client';

import * as React from 'react';
import type {
  DiffLine,
  DiffRowKind,
  DiffineHighlight,
  DiffineRender,
  DiffineSide,
  DiffineStrings
} from '../../types.js';
import type { LineRange } from '../../internal/pieces.js';
import { splitLine } from '../../internal/pieces.js';
import type { SearchMatch } from '../../internal/search.js';

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

export interface DiffineLineProps {
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
  /** What a search found in this line, or nothing when it found nothing here. */
  matches?: readonly SearchMatch[];
  /** The match a reader is on, which is the one drawn differently from the rest. */
  match?: SearchMatch | null;
  /** Something of the application's own for the gutter, or nothing. */
  renderGutter?: DiffineRender;
  /** Something of the application's own for under the line, or nothing. */
  renderWidget?: DiffineRender;
}

/**
 * One line of one side, and the columns beside it.
 *
 * `kind` is the row's rather than the line's, so a blank knows what happened
 * opposite it: a blank across from an inserted line and a blank across from
 * nothing at all are two different things, and drawing both as empty loses
 * which of the two a reader is looking at.
 */
export function DiffineLine({
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
  highlight,
  matches,
  match,
  renderGutter,
  renderWidget
}: DiffineLineProps): React.JSX.Element {
  const label = line ? labelFor(strings, kind, side) : null;
  const slot = line && renderGutter ? renderGutter(line, side) : null;
  const widget = line && renderWidget ? renderWidget(line, side) : null;
  const body = (
    <>
      {lineNumbers || markers || slot ? (
        // One element around the numbers, the marker and whatever the
        // application put beside them, so that the whole of it can be held
        // against the left edge while a long line is scrolled past it. Held one
        // at a time, the marker slides out from under the numbers.
        <span className="diffine-gutter">
          {lineNumbers
            ? numbers.map((value, column) => (
                <span key={column} className="diffine-number" aria-hidden="true">
                  {value ?? ''}
                </span>
              ))
            : null}
          {markers ? (
            <span className="diffine-marker" aria-hidden="true">
              {(line && MARKERS[side][kind]) ?? ''}
            </span>
          ) : null}
          {slot ? <span className="diffine-slot">{slot}</span> : null}
        </span>
      ) : null}
      <span className="diffine-text">
        {label ? <span className="diffine-said">{`${label}: `}</span> : null}
        {line ? (
          <DiffineLineText
            line={line}
            side={side}
            highlight={highlight}
            matches={matches}
            match={match}
          />
        ) : null}
      </span>
    </>
  );

  return (
    <div
      className="diffine-line"
      data-kind={line ? kind : 'blank'}
      data-side={side}
      {...(row === null ? {} : { 'data-row': row })}
      {...(change < 0 ? {} : { 'data-change': change })}
      {...(current ? { 'data-current': 'true' } : {})}
      {...(widget ? { 'data-widget': 'true' } : {})}
    >
      {/*
        The line's own columns stay one flex row whether or not something is
        drawn under them, so a widget stacks under the line rather than beside
        it and the row it is measured by is still the whole of both.
      */}
      {widget ? <div className="diffine-row">{body}</div> : body}
      {widget ? <div className="diffine-widget">{widget}</div> : null}
    </div>
  );
}

/** The line itself, with whatever moved inside it — and whatever marks it. */
function DiffineLineText({
  line,
  side,
  highlight,
  matches,
  match
}: {
  line: DiffLine;
  side: DiffineSide;
  highlight?: DiffineHighlight;
  matches?: readonly SearchMatch[];
  match?: SearchMatch | null;
}): React.JSX.Element {
  const found: LineRange[] | undefined = matches?.map((each) => ({
    start: each.start,
    end: each.end,
    current: each === match
  }));
  const pieces = splitLine(line, highlight?.(line, side), found);

  if (!pieces) {
    return <>{line.text}</>;
  }

  return (
    <>
      {pieces.map((piece, index) => {
        if (piece.kind === 'equal') {
          // A run a search turned up is a `<mark>` for the same reason a run the
          // comparison turned up is one: it is text picked out of the line for
          // the reader's benefit rather than text with a colour on it.
          if (piece.match) {
            return (
              <mark
                key={index}
                className={piece.className ? `diffine-found ${piece.className}` : 'diffine-found'}
                data-current={piece.match === 'current' ? 'true' : undefined}
                style={piece.style}
              >
                {piece.text}
              </mark>
            );
          }

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
            data-found={piece.match}
            style={piece.style}
          >
            {piece.text}
          </mark>
        );
      })}
    </>
  );
}
