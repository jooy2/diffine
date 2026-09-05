/**
 * Cutting text into the pieces a comparison is made of.
 *
 * Three sizes of piece, and the choice between them is the whole of what a
 * reader means by how detailed a comparison is: lines for the shape of the
 * document, words for what a person edited, graphemes for the one digit that
 * moved. Every one of them comes back as an array of strings, because that is
 * what the engine takes.
 */

import type { DiffWhitespace } from '../../types.js';

/** Runs of letters and digits, runs of whitespace, everything else on its own. */
const WORD = /[\p{L}\p{N}_]+|\s+|[\s\S]/gu;

/**
 * Graphemes rather than code points, where the runtime can tell the difference.
 *
 * A character diff that splits `é` into a letter and an accent, or an emoji into
 * its parts, marks half a glyph as changed and draws the other half — which is
 * the one place a comparison can produce text that was in neither document.
 * `Intl.Segmenter` has been in every current browser and in Node since 16;
 * where it is missing, splitting by code point at least keeps surrogate pairs
 * together.
 */
const segmenter =
  typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : null;

/**
 * A document, one line at a time, with the line endings taken off.
 *
 * `\r\n`, `\n` and a lone `\r` all end a line, so a document written on one
 * platform and edited on another does not come back as one changed line per
 * line. The newline that ends the last line is the end of that line rather than
 * the start of an empty one, which is why an empty document is no lines at all
 * and `a\n` is one.
 */
export function splitLines(text: string): string[] {
  if (text === '') {
    return [];
  }

  const lines = text.split(/\r\n|\r|\n/);

  if (lines[lines.length - 1] === '') {
    lines.pop();
  }

  return lines;
}

/** A line, one word at a time, with the whitespace between them kept. */
export function splitWords(text: string): string[] {
  return text.match(WORD) ?? [];
}

/** A line, one grapheme at a time. */
export function splitGraphemes(text: string): string[] {
  if (!segmenter) {
    return [...text];
  }

  const graphemes: string[] = [];

  for (const { segment } of segmenter.segment(text)) {
    graphemes.push(segment);
  }

  return graphemes;
}

/**
 * What a piece of text is compared as, once the things being ignored are gone.
 *
 * This is only ever the key. Whatever comes off here is still drawn, so turning
 * whitespace off changes which lines are called equal and never what a reader
 * sees.
 */
export function comparisonKey(
  text: string,
  whitespace: DiffWhitespace,
  ignoreCase: boolean
): string {
  let key = text;

  switch (whitespace) {
    case 'trailing':
      key = key.replace(/\s+$/u, '');
      break;
    case 'surrounding':
      key = key.trim();
      break;
    case 'amount':
      key = key.trim().replace(/\s+/gu, ' ');
      break;
    case 'all':
      key = key.replace(/\s+/gu, '');
      break;
    default:
      break;
  }

  return ignoreCase ? key.toLowerCase() : key;
}
