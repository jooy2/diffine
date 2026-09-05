/**
 * The comparison, on its own.
 *
 * Nothing here touches React or the DOM, which is the point of it being its own
 * entry: `diffine-react/diff` is the engine for an application that wants the
 * answer rather than the picture — a summary line, a count in a badge, a patch
 * written out somewhere else. The viewer is one consumer of what these
 * functions return.
 */

import type { DiffEdit, DiffInlineResult, DiffOptions, DiffResult } from './types.js';
import { compareInline } from './internal/diff/inline.js';
import { matchSequences } from './internal/diff/myers.js';
import { comparisonKey } from './internal/diff/tokens.js';
import { compareText, type TextOptions } from './internal/diff/text.js';

export type {
  DiffChange,
  DiffChangeKind,
  DiffEdit,
  DiffEditKind,
  DiffInlineMode,
  DiffInlineResult,
  DiffLine,
  DiffOptions,
  DiffResult,
  DiffRow,
  DiffRowKind,
  DiffSegment,
  DiffStats,
  DiffWhitespace
} from './types.js';

/** What every option falls back to. */
export const DIFFINE_DEFAULTS: Required<DiffOptions> = {
  inline: 'word',
  whitespace: 'exact',
  ignoreCase: false,
  inlineThreshold: 0.3,
  maxCost: 5000
};

function settle(options: DiffOptions | undefined): TextOptions {
  return {
    mode: options?.inline ?? DIFFINE_DEFAULTS.inline,
    whitespace: options?.whitespace ?? DIFFINE_DEFAULTS.whitespace,
    ignoreCase: options?.ignoreCase ?? DIFFINE_DEFAULTS.ignoreCase,
    inlineThreshold: options?.inlineThreshold ?? DIFFINE_DEFAULTS.inlineThreshold,
    maxCost: options?.maxCost ?? DIFFINE_DEFAULTS.maxCost
  };
}

/**
 * Compares two documents and returns everything worked out about them: the
 * lines each was split into, the rows a viewer draws, the changes in order, and
 * the counts.
 *
 * ```ts
 * const result = diffText(before, after);
 *
 * console.log(`${result.changes.length} changes, ${result.stats.inserted} lines added`);
 * ```
 */
export function diffText(before: string, after: string, options?: DiffOptions): DiffResult {
  return compareText(before, after, settle(options));
}

/**
 * Compares two lines a word at a time — runs of letters and digits, runs of
 * whitespace, and every other character on its own.
 *
 * This is the comparison {@link diffText} runs inside a pair of changed lines,
 * reachable on its own for a heading, a title, a cell of a table.
 */
export function diffWords(before: string, after: string, options?: DiffOptions): DiffInlineResult {
  return compareInline(before, after, { ...settle(options), mode: 'word' });
}

/** Compares two lines a grapheme at a time. */
export function diffCharacters(
  before: string,
  after: string,
  options?: DiffOptions
): DiffInlineResult {
  return compareInline(before, after, { ...settle(options), mode: 'character' });
}

/**
 * Compares two sequences of tokens and returns the edits between them.
 *
 * The engine underneath everything else, for an application whose tokens are
 * not lines and not words: cells of a row, names in a list, the steps of a
 * recipe. Both sides are compared as strings, so whatever the tokens are, they
 * arrive here as the text that identifies them.
 *
 * ```ts
 * diffSequence(['a', 'b', 'c'], ['a', 'c']);
 * // [
 * //   { kind: 'equal',  beforeStart: 0, beforeEnd: 1, afterStart: 0, afterEnd: 1 },
 * //   { kind: 'delete', beforeStart: 1, beforeEnd: 2, afterStart: 1, afterEnd: 1 },
 * //   { kind: 'equal',  beforeStart: 2, beforeEnd: 3, afterStart: 1, afterEnd: 2 }
 * // ]
 * ```
 */
export function diffSequence(
  before: readonly string[],
  after: readonly string[],
  options?: DiffOptions
): DiffEdit[] {
  const settled = settle(options);
  const key = (token: string) => comparisonKey(token, settled.whitespace, settled.ignoreCase);
  const { matches } = matchSequences(before.map(key), after.map(key), settled.maxCost);

  const edits: DiffEdit[] = [];
  let beforeCursor = 0;
  let afterCursor = 0;

  function push(kind: DiffEdit['kind'], beforeEnd: number, afterEnd: number): void {
    if (beforeEnd === beforeCursor && afterEnd === afterCursor) {
      return;
    }

    edits.push({
      kind,
      beforeStart: beforeCursor,
      beforeEnd,
      afterStart: afterCursor,
      afterEnd
    });

    beforeCursor = beforeEnd;
    afterCursor = afterEnd;
  }

  for (const match of matches) {
    push('delete', match.beforeStart, afterCursor);
    push('insert', beforeCursor, match.afterStart);
    push('equal', match.beforeStart + match.length, match.afterStart + match.length);
  }

  push('delete', before.length, afterCursor);
  push('insert', beforeCursor, after.length);

  return edits;
}
