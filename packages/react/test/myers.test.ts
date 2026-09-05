import { describe, expect, it } from 'vitest';
import { diffSequence } from 'diffine-react';

/**
 * The length of the longest common subsequence, worked out the slow way.
 *
 * The engine finds the smallest set of edits, and the smallest set of edits is
 * everything the two sequences do not have in common — so an answer that pairs
 * up fewer tokens than this is a wrong answer, and one that pairs up more is
 * impossible. This is quadratic and reads straight off the definition, which is
 * exactly what a check on a clever implementation should be.
 */
function longestCommon(before: readonly string[], after: readonly string[]): number {
  let previous = new Int32Array(after.length + 1);
  let current = new Int32Array(after.length + 1);

  for (let i = 1; i <= before.length; i += 1) {
    for (let j = 1; j <= after.length; j += 1) {
      current[j] =
        before[i - 1] === after[j - 1]
          ? previous[j - 1] + 1
          : Math.max(previous[j], current[j - 1]);
    }

    [previous, current] = [current, previous];
  }

  return previous[after.length];
}

/** How many tokens the engine managed to pair up. */
function paired(before: readonly string[], after: readonly string[]): number {
  return diffSequence(before, after)
    .filter((edit) => edit.kind === 'equal')
    .reduce((total, edit) => total + (edit.beforeEnd - edit.beforeStart), 0);
}

/** A sequence drawn from a small alphabet, so that runs repeat the way real text does. */
function sequence(random: () => number, length: number, alphabet: string): string[] {
  return Array.from({ length }, () => alphabet[Math.floor(random() * alphabet.length)]);
}

/** The same sequences on every run, so a failure can be looked at again. */
function seeded(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;

    return state / 2147483648;
  };
}

describe('the engine', () => {
  it('pairs up every token two identical sequences have', () => {
    const tokens = 'a b c d e'.split(' ');

    expect(paired(tokens, tokens)).toBe(5);
  });

  it('pairs up nothing between two sequences with nothing in common', () => {
    expect(paired(['a', 'b'], ['c', 'd'])).toBe(0);
  });

  it('finds as much in common as there is to find, over a thousand random pairs', () => {
    const random = seeded(20260905);

    for (let round = 0; round < 1000; round += 1) {
      const alphabet = round % 2 === 0 ? 'ab' : 'abcdef';
      const before = sequence(random, Math.floor(random() * 40), alphabet);
      const after = sequence(random, Math.floor(random() * 40), alphabet);

      expect({ round, paired: paired(before, after) }).toEqual({
        round,
        paired: longestCommon(before, after)
      });
    }
  });

  it('finds as much in common as there is to find in a long pair', () => {
    const random = seeded(7);
    const before = sequence(random, 2000, 'abcdefghij');
    const after = before.filter(() => random() > 0.1);

    expect(paired(before, after)).toBe(longestCommon(before, after));
  });

  it('leaves the two sequences reconstructable from the edits it returns', () => {
    const random = seeded(99);

    for (let round = 0; round < 200; round += 1) {
      const before = sequence(random, Math.floor(random() * 30), 'abc');
      const after = sequence(random, Math.floor(random() * 30), 'abc');
      const edits = diffSequence(before, after);

      const rebuiltBefore: string[] = [];
      const rebuiltAfter: string[] = [];

      for (const edit of edits) {
        rebuiltBefore.push(...before.slice(edit.beforeStart, edit.beforeEnd));
        rebuiltAfter.push(...after.slice(edit.afterStart, edit.afterEnd));
      }

      expect(rebuiltBefore).toEqual(before);
      expect(rebuiltAfter).toEqual(after);
    }
  });
});
