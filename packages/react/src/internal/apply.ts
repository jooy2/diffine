/**
 * Writing one side's version of a change over the other's.
 *
 * A comparison is worked out in lines and a document is one string, so this is
 * the translation between them: which characters a run of lines covers, and
 * what has to be written there for the run to read as the other side's. The
 * awkward part is the newline, and it is awkward in exactly one place — the end
 * of a document that does not end in one, where a line taken out has one
 * terminator too many and a line put in has one too few.
 */

import type { DiffChange, DiffResult, DiffineSide } from '../types.js';
import { lineStarts } from './search.js';

/** One range of a document, and what is to be written over it. */
export interface LineEdit {
  start: number;
  end: number;
  /** What goes in its place, newlines included. */
  text: string;
  /** The document as it will read afterwards. */
  whole: string;
}

/**
 * Takes one side's lines and writes them over the other side's, for one change.
 *
 * `into` is the document being written, so a change applied `into` `'after'`
 * leaves the two sides reading as `before` did over that run — the version on
 * the left, taken across.
 *
 * `text` is that document as it stands now rather than as the comparison saw
 * it. The two are the same in an editor, where a keystroke is a new comparison,
 * and this reads the live one so that they cannot come apart.
 */
export function applyChange(
  result: DiffResult,
  change: DiffChange,
  into: DiffineSide,
  text: string
): LineEdit {
  const from = into === 'before' ? change.beforeStart : change.afterStart;
  const to = into === 'before' ? change.beforeEnd : change.afterEnd;
  const source =
    into === 'before'
      ? result.after.slice(change.afterStart, change.afterEnd)
      : result.before.slice(change.beforeStart, change.beforeEnd);

  // `lineStarts` has one entry per line and one more for the empty position
  // after a final newline, which is the answer wanted for a run that reaches
  // the end of the document.
  const starts = lineStarts(text);
  const at = (line: number) => (line < starts.length ? starts[line] : text.length);
  const start = at(from);
  const end = at(to);

  let body = source.join('\n');

  if (source.length > 0) {
    if (text === '' || end < text.length || /[\r\n]$/.test(text)) {
      // Every line of the run ends where the next one begins, so each of these
      // needs its own terminator — and a document with nothing in it yet is
      // given one, because a file of lines is a file that ends in a newline.
      body += '\n';
    } else if (start === end && start > 0) {
      // Nothing is being written over, and the line above has no terminator of
      // its own. The one that separates it from these goes in front of them.
      body = `\n${body}`;
    }
  }

  return { start, end, text: body, whole: text.slice(0, start) + body + text.slice(end) };
}
