/**
 * The comparison inside one pair of lines.
 *
 * A row that says "this line changed" is half an answer. What a reader is
 * looking for is the word that changed, and finding it is the same search run
 * over a smaller alphabet: words instead of lines, or graphemes instead of
 * words.
 *
 * The result has a side each rather than one list between them, and that is not
 * a convenience. With `ignoreCase` on, or whitespace being ignored, a run the
 * engine calls equal is two different strings — `Title` on one side and `title`
 * on the other. One list would have to pick one of them to hold, and whichever
 * it picked would be text that was never in the other document. Two lists each
 * hold their own side, so joining a side back together gives the line that was
 * passed in.
 *
 * What one list does need is the order, and that is kept beside the two as
 * offsets rather than text: each run says where it sits in both lines, so a view
 * drawing the pair as one line takes the text from whichever side it wants and
 * still knows where the other side's run went.
 */

import type {
  DiffEdit,
  DiffInlineMode,
  DiffInlineResult,
  DiffSegment,
  DiffWhitespace
} from '../../types.js';
import { matchSequences } from './myers.js';
import { comparisonKey, splitGraphemes, splitWords } from './tokens.js';

/** How the inside of a pair of lines is compared. */
export interface InlineOptions {
  mode: DiffInlineMode;
  whitespace: DiffWhitespace;
  ignoreCase: boolean;
  maxCost: number;
}

const NOTHING_IN_COMMON: DiffInlineResult = { before: [], after: [], similarity: 0, edits: [] };

/** Appends text to a side, joining it to the piece before it where it can. */
function append(segments: DiffSegment[], kind: DiffSegment['kind'], text: string): void {
  if (text === '') {
    return;
  }

  const previous = segments[segments.length - 1];

  if (previous && previous.kind === kind) {
    previous.text += text;

    return;
  }

  segments.push({ kind, text });
}

/**
 * Appends a run to the list both sides share, joining it to the run before it
 * where it can — two matches with nothing between them are one equal run.
 */
function extend(edits: DiffEdit[], kind: DiffEdit['kind'], before: number, after: number): void {
  if (before === 0 && after === 0) {
    return;
  }

  const previous = edits[edits.length - 1];
  const beforeStart = previous?.beforeEnd ?? 0;
  const afterStart = previous?.afterEnd ?? 0;

  if (previous && previous.kind === kind) {
    previous.beforeEnd += before;
    previous.afterEnd += after;

    return;
  }

  edits.push({
    kind,
    beforeStart,
    beforeEnd: beforeStart + before,
    afterStart,
    afterEnd: afterStart + after
  });
}

/** Compares two lines with the tokens `mode` asks for. */
export function compareInline(
  before: string,
  after: string,
  options: InlineOptions
): DiffInlineResult {
  if (options.mode === 'none') {
    return NOTHING_IN_COMMON;
  }

  if (before === after) {
    const whole: DiffEdit = {
      kind: 'equal',
      beforeStart: 0,
      beforeEnd: before.length,
      afterStart: 0,
      afterEnd: after.length
    };

    return {
      before: before === '' ? [] : [{ kind: 'equal', text: before }],
      after: after === '' ? [] : [{ kind: 'equal', text: after }],
      similarity: 1,
      edits: before === '' ? [] : [whole]
    };
  }

  const split = options.mode === 'word' ? splitWords : splitGraphemes;
  const beforeTokens = split(before);
  const afterTokens = split(after);
  const key = (token: string) => comparisonKey(token, options.whitespace, options.ignoreCase);
  const { matches } = matchSequences(beforeTokens.map(key), afterTokens.map(key), options.maxCost);

  const beforeSegments: DiffSegment[] = [];
  const afterSegments: DiffSegment[] = [];
  const edits: DiffEdit[] = [];
  let beforeCursor = 0;
  let afterCursor = 0;
  let paired = 0;

  for (const match of matches) {
    const deleted = beforeTokens.slice(beforeCursor, match.beforeStart).join('');
    const inserted = afterTokens.slice(afterCursor, match.afterStart).join('');

    append(beforeSegments, 'delete', deleted);
    append(afterSegments, 'insert', inserted);
    extend(edits, 'delete', deleted.length, 0);
    extend(edits, 'insert', 0, inserted.length);

    const beforeText = beforeTokens
      .slice(match.beforeStart, match.beforeStart + match.length)
      .join('');
    const afterText = afterTokens.slice(match.afterStart, match.afterStart + match.length).join('');

    append(beforeSegments, 'equal', beforeText);
    append(afterSegments, 'equal', afterText);
    extend(edits, 'equal', beforeText.length, afterText.length);
    paired += beforeText.length + afterText.length;

    beforeCursor = match.beforeStart + match.length;
    afterCursor = match.afterStart + match.length;
  }

  const deleted = beforeTokens.slice(beforeCursor).join('');
  const inserted = afterTokens.slice(afterCursor).join('');

  append(beforeSegments, 'delete', deleted);
  append(afterSegments, 'insert', inserted);
  extend(edits, 'delete', deleted.length, 0);
  extend(edits, 'insert', 0, inserted.length);

  const total = before.length + after.length;

  return {
    before: beforeSegments,
    after: afterSegments,
    similarity: total === 0 ? 1 : paired / total,
    edits
  };
}
