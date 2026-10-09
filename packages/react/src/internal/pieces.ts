import type * as React from 'react';
import type { DiffEditKind, DiffLine, DiffineToken } from '../types.js';
import type { MergedLine } from './rows.js';

/** One run of a line, with everything that decides how it is drawn. */
export interface LinePiece {
  text: string;
  kind: DiffEditKind;
  className?: string;
  style?: React.CSSProperties;
  /** Whether a search found this run, and whether it is the one being read. */
  match?: 'found' | 'current';
}

/** A run of a line a search turned up, and whether it is the one a reader is on. */
export interface LineRange {
  start: number;
  end: number;
  current?: boolean;
}

/**
 * A line cut at every boundary the three things that mark it up have.
 *
 * The comparison says which runs of the line changed. An application's
 * highlighter says which runs are a keyword, a string, a comment. A search says
 * which runs somebody is looking for. None of the three knows about the others,
 * and their boundaries fall wherever they fall — a searched-for word that is
 * half a string literal and half of it changed is an ordinary thing for all
 * three to say at once. So the line is cut at the union of them, and each piece
 * carries what each had to say about it.
 *
 * The first two are partitions of the line and the third is not: matches have
 * gaps between them, and the run to the next boundary is the start of the next
 * match while a piece is outside one and its end while a piece is inside one.
 *
 * `null` when there is nothing to say: no comparison inside this line, no
 * highlighting and no match, which is the common case and is drawn as the text
 * itself.
 */
export function splitLine(
  line: DiffLine,
  tokens: readonly DiffineToken[] | null | undefined,
  matches?: readonly LineRange[]
): LinePiece[] | null {
  const coloured = tokens?.filter((token) => token.length > 0) ?? [];
  const found = matches ?? [];

  if (line.segments.length === 0 && coloured.length === 0 && found.length === 0) {
    return null;
  }

  const pieces: LinePiece[] = [];
  const text = line.text;
  let segment = 0;
  let token = 0;
  // `Infinity` past the end of either list is what makes a line the other one
  // does not reach all the way across still come out whole.
  let inSegment =
    line.segments.length > 0 ? line.segments[0].text.length : Number.POSITIVE_INFINITY;
  let inToken = coloured.length > 0 ? coloured[0].length : Number.POSITIVE_INFINITY;
  let cursor = 0;
  let range = 0;

  while (cursor < text.length) {
    const inside = found[range] !== undefined && cursor >= found[range].start;
    const edge = found[range]
      ? (inside ? found[range].end : found[range].start) - cursor
      : Number.POSITIVE_INFINITY;
    const take = Math.min(inSegment, inToken, edge, text.length - cursor);

    pieces.push({
      text: text.slice(cursor, cursor + take),
      kind: line.segments[segment]?.kind ?? 'equal',
      className: coloured[token]?.className,
      style: coloured[token]?.style,
      match: inside ? (found[range].current ? 'current' : 'found') : undefined
    });

    cursor += take;
    inSegment -= take;
    inToken -= take;

    if (inside && cursor >= found[range].end) {
      range += 1;
    }

    if (inSegment === 0) {
      segment += 1;
      inSegment =
        segment < line.segments.length
          ? line.segments[segment].text.length
          : Number.POSITIVE_INFINITY;
    }

    if (inToken === 0) {
      token += 1;
      inToken = token < coloured.length ? coloured[token].length : Number.POSITIVE_INFINITY;
    }
  }

  return pieces;
}

/** Appends the part of a line's runs that falls between two offsets of it. */
function cutTokens(
  tokens: readonly DiffineToken[] | null | undefined,
  start: number,
  end: number,
  into: DiffineToken[]
): void {
  let at = 0;

  for (const token of tokens ?? []) {
    const from = Math.max(at, start);
    const to = Math.min(at + token.length, end);

    if (to > from) {
      into.push({ ...token, length: to - from });
    }

    at += token.length;

    if (at >= end) {
      return;
    }
  }

  // The runs stopped short of the end, which leaves the rest of the line plain.
  into.push({ length: end - Math.max(at, start) });
}

/**
 * The runs a highlighter gave the two lines of a pair, cut to fit the line
 * drawn from both of them.
 *
 * A highlighter is only ever handed a whole line of a document, because a
 * grammar applied to a fragment does not come out right — and the drawn line is
 * a line of neither. So each side is coloured on its own and every run of the
 * drawn line takes its colours from the side its text came from: a word that
 * went out the way `before` colours it, and the rest the way `after` does.
 */
export function mergeTokens(
  merged: MergedLine,
  before: readonly DiffineToken[] | null | undefined,
  after: readonly DiffineToken[] | null | undefined
): DiffineToken[] | null {
  if (!before?.length && !after?.length) {
    return null;
  }

  const tokens: DiffineToken[] = [];

  for (const run of merged.runs) {
    if (run.kind === 'delete') {
      cutTokens(before, run.beforeStart, run.beforeEnd, tokens);
    } else {
      cutTokens(after, run.afterStart, run.afterEnd, tokens);
    }
  }

  return tokens;
}

/**
 * Ranges that may overlap, as ranges that do not.
 *
 * {@link splitLine} walks the matches of a line in order and expects each one to
 * start after the last one ended, which a single search over a single line
 * always gives it. A line drawn from two is searched twice, once per side, and
 * a match in one can sit across a match in the other. Where they overlap, the
 * one a reader is on wins.
 */
export function disjointRanges(ranges: readonly LineRange[]): LineRange[] {
  const edges = [...new Set(ranges.flatMap((range) => [range.start, range.end]))].sort(
    (a, b) => a - b
  );
  const disjoint: LineRange[] = [];

  for (let index = 0; index + 1 < edges.length; index += 1) {
    const start = edges[index];
    const end = edges[index + 1];
    const covering = ranges.filter((range) => range.start <= start && range.end >= end);

    if (covering.length === 0) {
      continue;
    }

    const current = covering.some((range) => range.current);
    const last = disjoint[disjoint.length - 1];

    if (last && last.end === start && Boolean(last.current) === current) {
      last.end = end;
    } else {
      disjoint.push({ start, end, current });
    }
  }

  return disjoint;
}
