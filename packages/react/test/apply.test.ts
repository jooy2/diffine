import { describe, expect, it } from 'vitest';
import { diffText } from 'diffine-react';
import type { DiffineSide } from 'diffine-react';
import { applyChange } from '../src/internal/apply.js';

/** One change written across, and the document it leaves behind. */
function take(before: string, after: string, into: DiffineSide, index = 0): string {
  const result = diffText(before, after);

  return applyChange(result, result.changes[index], into, into === 'before' ? before : after).whole;
}

/** A document as the comparison reads it, which is where a trailing newline stops counting. */
const linesOf = (text: string) => diffText(text, '').before;

/**
 * Every change written across, one at a time, until the two documents agree.
 *
 * Each one is worked out again from the document as it stands, which is what
 * the component does: a keystroke, or a change taken across, is a new
 * comparison. The count is a guard against a rule that never finishes.
 */
function takeAll(before: string, after: string, into: DiffineSide): [string, string] {
  let left = before;
  let right = after;

  for (let pass = 0; pass < 50; pass += 1) {
    const result = diffText(left, right);

    if (result.changes.length === 0) {
      return [left, right];
    }

    const text = into === 'before' ? left : right;
    const { whole } = applyChange(result, result.changes[0], into, text);

    if (into === 'before') {
      left = whole;
    } else {
      right = whole;
    }
  }

  throw new Error('the changes never ran out');
}

describe('applyChange', () => {
  it('writes the left-hand version over the right', () => {
    expect(take('a\nB\nc\n', 'a\nb\nc\n', 'after')).toBe('a\nB\nc\n');
  });

  it('writes the right-hand version over the left', () => {
    expect(take('a\nB\nc\n', 'a\nb\nc\n', 'before')).toBe('a\nb\nc\n');
  });

  it('puts back a line the other side does not have', () => {
    expect(take('a\nb\nc\n', 'a\nc\n', 'after')).toBe('a\nb\nc\n');
  });

  it('takes away a line the other side does not have', () => {
    expect(take('a\nb\nc\n', 'a\nc\n', 'before')).toBe('a\nc\n');
  });

  it('writes several lines over one', () => {
    expect(take('a\nb\n', 'a\none\ntwo\nthree\n', 'before')).toBe('a\none\ntwo\nthree\n');
  });

  it('keeps a document that does not end in a newline as one', () => {
    expect(take('a\nB', 'a\nb', 'after')).toBe('a\nB');
  });

  it('adds the newline a line needs when it is put after the last one', () => {
    expect(take('a', 'a\nnew', 'before')).toBe('a\nnew');
  });

  it('takes the last line away', () => {
    expect(take('a\nb', 'a', 'after')).toBe('a\nb');
    expect(linesOf(take('a\nb', 'a', 'before'))).toEqual(['a']);
  });

  it('writes into a document that is empty', () => {
    expect(take('', 'one\ntwo\n', 'before')).toBe('one\ntwo\n');
    expect(take('one\ntwo\n', '', 'after')).toBe('one\ntwo\n');
  });

  it('empties a document whose every line went across', () => {
    expect(take('one\ntwo\n', '', 'before')).toBe('');
  });

  it('leaves the two documents the same once every change has been taken', () => {
    const pairs: [string, string][] = [
      ['one\ntwo\nthree\n', 'one\n2\nthree\nfour\n'],
      ['a\nb\nc\nd\ne\n', 'a\nc\ne\n'],
      ['', 'only\n'],
      ['only', ''],
      ['a\nb', 'b\na'],
      ['first\nsecond\nthird', 'first\nSECOND\nthird\nfourth\nfifth']
    ];

    for (const [before, after] of pairs) {
      // Whether a document ends in a newline is not something a comparison can
      // see, so the two agree line for line rather than character for
      // character.
      for (const into of ['before', 'after'] as const) {
        const [left, right] = takeAll(before, after, into);

        expect(diffText(left, right).changes).toEqual([]);
        expect(linesOf(left)).toEqual(linesOf(into === 'before' ? after : before));
      }
    }
  });
});
