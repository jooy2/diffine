/**
 * Which line of a replaced run belongs opposite which.
 *
 * Taking them in order is right far more often than it is wrong, and it is
 * wrong in exactly one situation — a run where lines were inserted as well as
 * edited. Three lines out and four in, and the fourth is the edited one: laid
 * out in order, every pair is wrong from the first row down, and each of them
 * gets the words inside it compared against a line it has nothing to do with.
 *
 * So the run is laid out to pair the lines that look like each other, keeping
 * the order they were written in. That is the same shape of problem the engine
 * solves one level up, with one difference that matters: two lines are not
 * equal or unequal here, they are more or less alike, and the pairing is
 * whichever one leaves the most likeness on the table.
 */

/**
 * How alike two lines look, in one pass over each.
 *
 * The share of the two that is a common start and a common end. An edit lands
 * in the middle of a line far more often than at both ends of it, so this
 * scores the pair that was edited well above the pair that merely landed next
 * to each other — which is all this has to do. It is deliberately not the
 * comparison the words inside the line get: that one is worth its cost once per
 * pair and not once per pair that was considered.
 */
export function affinity(before: string, after: string): number {
  if (before === after) {
    return 1;
  }

  const total = before.length + after.length;

  if (total === 0) {
    return 1;
  }

  const shorter = Math.min(before.length, after.length);
  let prefix = 0;

  while (prefix < shorter && before[prefix] === after[prefix]) {
    prefix += 1;
  }

  let suffix = 0;

  while (
    suffix < shorter - prefix &&
    before[before.length - 1 - suffix] === after[after.length - 1 - suffix]
  ) {
    suffix += 1;
  }

  return ((prefix + suffix) * 2) / total;
}

/**
 * What a pair is worth beyond how alike it is.
 *
 * Without it, two lines with nothing in common score the same paired as they do
 * on their own, and the run is drawn twice as tall as it needs to be for no
 * gain. With it, a pair is always worth making unless a gap buys a better one —
 * which is the behaviour that reads as "in order, unless there is a reason".
 */
const PAIRING_BONUS = 0.05;

/** Where a run stops being worth laying out carefully. */
const MAX_CELLS = 10_000;

const PAIR = 0;
const SKIP_BEFORE = 1;
const SKIP_AFTER = 2;

/** One row of a replaced run: an index into each side, or -1 for a blank. */
export type LinePair = readonly [number, number];

/** The two sides taken in order, which is what a run too large to weigh gets. */
function inOrder(beforeCount: number, afterCount: number): LinePair[] {
  const pairs: LinePair[] = [];

  for (let offset = 0; offset < Math.max(beforeCount, afterCount); offset += 1) {
    pairs.push([offset < beforeCount ? offset : -1, offset < afterCount ? offset : -1]);
  }

  return pairs;
}

/**
 * The rows a replaced run is drawn as, in order, as indexes into the two sides.
 *
 * Ties go to the blank rather than to the pair, which is what puts the pairing
 * at the top of a run where nothing resembles anything: three lines against
 * one, with no likeness anywhere, reads better as the first line paired and two
 * blanks under it than as two blanks and the last line paired.
 */
export function pairLines(before: readonly string[], after: readonly string[]): LinePair[] {
  const n = before.length;
  const m = after.length;

  if (n === 0 || m === 0 || n * m > MAX_CELLS) {
    return inOrder(n, m);
  }

  const width = m + 1;
  const score = new Float64Array((n + 1) * width);
  const choice = new Uint8Array((n + 1) * width);

  for (let i = 1; i <= n; i += 1) {
    choice[i * width] = SKIP_BEFORE;
  }

  for (let j = 1; j <= m; j += 1) {
    choice[j] = SKIP_AFTER;
  }

  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      const paired =
        score[(i - 1) * width + j - 1] + affinity(before[i - 1], after[j - 1]) + PAIRING_BONUS;
      const skipBefore = score[(i - 1) * width + j];
      const skipAfter = score[i * width + j - 1];
      const best = Math.max(paired, skipBefore, skipAfter);

      score[i * width + j] = best;
      choice[i * width + j] =
        skipBefore === best ? SKIP_BEFORE : skipAfter === best ? SKIP_AFTER : PAIR;
    }
  }

  const pairs: LinePair[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    const step = i === 0 ? SKIP_AFTER : j === 0 ? SKIP_BEFORE : choice[i * width + j];

    if (step === PAIR) {
      pairs.push([i - 1, j - 1]);
      i -= 1;
      j -= 1;
    } else if (step === SKIP_BEFORE) {
      pairs.push([i - 1, -1]);
      i -= 1;
    } else {
      pairs.push([-1, j - 1]);
      j -= 1;
    }
  }

  return pairs.reverse();
}
