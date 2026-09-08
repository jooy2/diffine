/**
 * How a document is written, apart from what is in it.
 *
 * None of this is in the comparison, and that is deliberate rather than
 * missing: `\r\n`, `\r` and `\n` all end a line, so a file written on one
 * platform and edited on another does not come back as a document where every
 * line changed. The cost of that is a file whose only difference is invisible —
 * the same lines, saved by another editor — reading as no difference at all.
 *
 * So it is worked out beside the comparison instead, in one pass over each
 * document, and the view says so where the two disagree.
 */

import type { DiffFormat, DiffLineEnding } from '../../types.js';

/** The byte order mark, which is a character at the start of the first line. */
const MARK = '\ufeff';

/** What a document ends its lines with, whether it ends in one, and its mark. */
export function formatOf(text: string): DiffFormat {
  let crlf = false;
  let lf = false;
  let cr = false;

  // One pass rather than three searches. In an editor this runs on both
  // documents for every keystroke.
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);

    if (code === 13) {
      if (text.charCodeAt(index + 1) === 10) {
        crlf = true;
        index += 1;
      } else {
        cr = true;
      }
    } else if (code === 10) {
      lf = true;
    }
  }

  const kinds = [crlf, lf, cr].filter(Boolean).length;
  const ending: DiffLineEnding =
    kinds === 0 ? 'none' : kinds > 1 ? 'mixed' : crlf ? 'crlf' : lf ? 'lf' : 'cr';

  return {
    ending,
    finalNewline: /[\r\n]$/u.test(text),
    byteOrderMark: text.startsWith(MARK)
  };
}
