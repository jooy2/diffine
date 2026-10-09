'use client';

import * as React from 'react';
import type {
  DiffLine,
  DiffRowKind,
  DiffineHighlight,
  DiffineRender,
  DiffineSide,
  DiffineTextStrings
} from '../../types.js';
import type { LinePiece, LineRange } from '../../internal/pieces.js';
import { disjointRanges, mergeTokens, splitLine } from '../../internal/pieces.js';
import type { MergedLine } from '../../internal/rows.js';
import type { SearchMatch } from '../../internal/search.js';

/** What is drawn in the marker column, per side. */
const MARKERS: Record<DiffineSide, Partial<Record<DiffRowKind, string>>> = {
  before: { delete: '−', replace: '~' },
  after: { insert: '+', replace: '~' }
};

/** Runs of spaces, and runs of tabs, which are drawn rather than left invisible. */
const BLANKS = / +|\t+/gu;

/**
 * A run of text with its whitespace picked out, or the text as it was.
 *
 * The characters themselves stay exactly as they were, and the marks are drawn
 * on the elements around them — so what a reader copies out is the line, not a
 * line with dots and arrows in it.
 */
function marked(text: string, invisibles: boolean): React.ReactNode {
  if (!invisibles || !/[ \t]/u.test(text)) {
    return text;
  }

  const nodes: React.ReactNode[] = [];
  let cursor = 0;

  for (const run of text.matchAll(BLANKS)) {
    if (run.index > cursor) {
      nodes.push(text.slice(cursor, run.index));
    }

    nodes.push(
      <span
        key={run.index}
        className="diffine-invisible"
        data-kind={run[0].charAt(0) === '\t' ? 'tab' : 'space'}
      >
        {run[0]}
      </span>
    );
    cursor = run.index + run[0].length;
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }

  return nodes;
}

/** Which word a screen reader hears in front of the line. */
function labelFor(
  strings: DiffineTextStrings,
  kind: DiffRowKind,
  side: DiffineSide
): string | null {
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
  strings: DiffineTextStrings;
  highlight?: DiffineHighlight;
  /** What a search found in this line, or nothing when it found nothing here. */
  matches?: readonly SearchMatch[];
  /** The match a reader is on, which is the one drawn differently from the rest. */
  match?: SearchMatch | null;
  /** Something of the application's own for the gutter, or nothing. */
  renderGutter?: DiffineRender;
  /** Something of the application's own for under the line, or nothing. */
  renderWidget?: DiffineRender;
  /** Whether the spaces and tabs inside the line are drawn. */
  invisibles?: boolean;
  /**
   * The pair this line draws as one, for a line of a merged view.
   *
   * `line` is still the line of `after` it stands for, which is what the
   * application's gutter and widget are handed.
   */
  merged?: MergedLine;
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
  renderWidget,
  invisibles = false,
  merged
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
        {merged ? (
          <DiffineMergedText
            merged={merged}
            strings={strings}
            highlight={highlight}
            matches={matches}
            match={match}
            invisibles={invisibles}
          />
        ) : line ? (
          <DiffineLineText
            line={line}
            side={side}
            highlight={highlight}
            matches={matches}
            match={match}
            invisibles={invisibles}
          />
        ) : null}
      </span>
    </>
  );

  return (
    <div
      className="diffine-line"
      data-kind={line ? kind : 'blank'}
      // A line drawn from two belongs to neither side, so it takes neither
      // side's tint: most of it is text that did not change.
      data-side={merged ? 'both' : side}
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

/**
 * A run of a line that the comparison has nothing to say about, with whatever a
 * search or a highlighter does.
 */
function plainPiece(piece: LinePiece, key: number, invisibles: boolean): React.ReactNode {
  // A run a search turned up is a `<mark>` for the same reason a run the
  // comparison turned up is one: it is text picked out of the line for the
  // reader's benefit rather than text with a colour on it.
  if (piece.match) {
    return (
      <mark
        key={key}
        className={piece.className ? `diffine-found ${piece.className}` : 'diffine-found'}
        data-current={piece.match === 'current' ? 'true' : undefined}
        style={piece.style}
      >
        {marked(piece.text, invisibles)}
      </mark>
    );
  }

  return piece.className || piece.style ? (
    <span key={key} className={piece.className} style={piece.style}>
      {marked(piece.text, invisibles)}
    </span>
  ) : (
    <React.Fragment key={key}>{marked(piece.text, invisibles)}</React.Fragment>
  );
}

/** The line itself, with whatever moved inside it — and whatever marks it. */
function DiffineLineText({
  line,
  side,
  highlight,
  matches,
  match,
  invisibles
}: {
  line: DiffLine;
  side: DiffineSide;
  highlight?: DiffineHighlight;
  matches?: readonly SearchMatch[];
  match?: SearchMatch | null;
  invisibles: boolean;
}): React.JSX.Element {
  const found: LineRange[] | undefined = matches?.map((each) => ({
    start: each.start,
    end: each.end,
    current: each === match
  }));
  const pieces = splitLine(line, highlight?.(line, side), found);

  if (!pieces) {
    return <>{marked(line.text, invisibles)}</>;
  }

  return (
    <>
      {pieces.map((piece, index) => {
        if (piece.kind === 'equal') {
          return plainPiece(piece, index, invisibles);
        }

        return (
          <mark
            key={index}
            className={piece.className ? `diffine-piece ${piece.className}` : 'diffine-piece'}
            data-kind={piece.kind}
            data-found={piece.match}
            style={piece.style}
          >
            {marked(piece.text, invisibles)}
          </mark>
        );
      })}
    </>
  );
}

/**
 * A pair of lines drawn as one: the text both share, with what went out and
 * what came in next to each other where they differ.
 *
 * What went out is a `<del>` and what came in an `<ins>`, each with the word for
 * it in front where only a screen reader hears it. On a line that only went out
 * or only came in, the word in front of the line says which, and the marks
 * inside it only say where. Here the two are mixed in one line, and without a
 * word on each run a reader hears both versions run together as one sentence
 * that neither document holds.
 *
 * A run is drawn as one element however many pieces a highlighter or a search
 * cut it into, so the word is said once per run rather than once per piece.
 */
function DiffineMergedText({
  merged,
  strings,
  highlight,
  matches,
  match,
  invisibles
}: {
  merged: MergedLine;
  strings: DiffineTextStrings;
  highlight?: DiffineHighlight;
  matches?: readonly SearchMatch[];
  match?: SearchMatch | null;
  invisibles: boolean;
}): React.JSX.Element {
  const found = matches
    ? disjointRanges(
        matches.flatMap((each) =>
          (each.parts ?? [each]).map((part) => ({
            start: part.start,
            end: part.end,
            current: each === match
          }))
        )
      )
    : undefined;
  const tokens = highlight
    ? mergeTokens(merged, highlight(merged.before, 'before'), highlight(merged.after, 'after'))
    : null;
  const pieces = splitLine(merged.drawn, tokens, found) ?? [];
  // Two runs next to each other are never the same kind, so a run is every
  // piece up to the next change of kind.
  const runs: { kind: LinePiece['kind']; pieces: LinePiece[] }[] = [];

  for (const piece of pieces) {
    const last = runs[runs.length - 1];

    if (last && last.kind === piece.kind) {
      last.pieces.push(piece);
    } else {
      runs.push({ kind: piece.kind, pieces: [piece] });
    }
  }

  return (
    <>
      {runs.map((run, index) => {
        const inside = run.pieces.map((piece, at) => plainPiece(piece, at, invisibles));

        if (run.kind === 'equal') {
          return <React.Fragment key={index}>{inside}</React.Fragment>;
        }

        const Run = run.kind === 'delete' ? 'del' : 'ins';

        return (
          <Run key={index} className="diffine-piece" data-kind={run.kind}>
            <span className="diffine-said">
              {`${run.kind === 'delete' ? strings.removed : strings.added}: `}
            </span>
            {inside}
          </Run>
        );
      })}
    </>
  );
}
