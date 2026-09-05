import type * as React from 'react';
import type { DiffEditKind, DiffLine, DiffineToken } from '../types.js';

/** One run of a line, with everything that decides how it is drawn. */
export interface LinePiece {
  text: string;
  kind: DiffEditKind;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A line cut at every boundary either of the two things that colour it has.
 *
 * The comparison says which runs of the line changed. An application's
 * highlighter says which runs are a keyword, a string, a comment. Neither knows
 * about the other, and their boundaries fall wherever they fall — a changed
 * word that is half a string literal is an ordinary thing for both of them to
 * say at once. So the line is cut at the union of the two, and each piece
 * carries what both had to say about it.
 *
 * `null` when there is nothing to say: no comparison inside this line and no
 * highlighting, which is the common case and is drawn as the text itself.
 */
export function splitLine(
  line: DiffLine,
  tokens: readonly DiffineToken[] | null | undefined
): LinePiece[] | null {
  const coloured = tokens?.filter((token) => token.length > 0) ?? [];

  if (line.segments.length === 0 && coloured.length === 0) {
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

  while (cursor < text.length) {
    const take = Math.min(inSegment, inToken, text.length - cursor);

    pieces.push({
      text: text.slice(cursor, cursor + take),
      kind: line.segments[segment]?.kind ?? 'equal',
      className: coloured[token]?.className,
      style: coloured[token]?.style
    });

    cursor += take;
    inSegment -= take;
    inToken -= take;

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
