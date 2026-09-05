/**
 * What the two sequences have in common, and how the engine finds it.
 *
 * Everything above this file — lines, words, characters — comes down to two
 * arrays of strings and one question: which entries of the first are also
 * entries of the second, in the same order, with as little given up as
 * possible. The answer is a list of matching runs, and every kind of edit is
 * read off the gaps between them.
 *
 * The method is the one Eugene Myers published in 1986, in the shape he
 * describes in the second half of that paper: walk the edit graph forwards from
 * the start and backwards from the end at the same time, stop at the step where
 * the two waves meet, and recurse on the two halves either side of the run of
 * matches at the meeting point. It costs a pass over both sequences per step
 * and holds one row of the graph rather than the whole thing, which is the
 * difference between a viewer that opens a large file and one that runs the tab
 * out of memory trying.
 */

/** A run of entries that is in both sequences, at these two places. */
export interface DiffMatch {
  beforeStart: number;
  afterStart: number;
  length: number;
}

/** What the search found, and whether it got to finish. */
export interface DiffMatchResult {
  matches: DiffMatch[];
  /**
   * `false` when a range cost more than it was allowed to spend and came back
   * with no matches in it at all. Everything outside that range is still the
   * real answer.
   */
  complete: boolean;
}

/** The diagonal run two waves met on, in absolute positions. */
interface MiddleSnake {
  beforeStart: number;
  afterStart: number;
  beforeEnd: number;
  afterEnd: number;
}

/**
 * The runs `before` and `after` have in common, in order and without overlaps.
 *
 * `maxCost` is the largest number of steps either wave will take in one search.
 * A range that needs more comes back with nothing matching in it, which reads
 * downstream as "all of this was replaced" — a wrong answer only in the sense
 * that a smaller set of edits existed and was too expensive to find.
 */
export function matchSequences(
  before: readonly string[],
  after: readonly string[],
  maxCost: number
): DiffMatchResult {
  const matches: DiffMatch[] = [];
  let complete = true;

  /**
   * The step where the forward and backward waves overlap, and the run of
   * matches they overlap on. `null` when the search ran past `maxCost`.
   *
   * Both waves are stored as one number per diagonal — the furthest that
   * diagonal has reached — which is why this is a pair of arrays rather than
   * the whole graph. A diagonal is `x - y`, so the forward wave lives in
   * `[-d, d]` and the backward one in `[delta - d, delta + d]`; each gets an
   * offset of its own so that both fit an array of the same length, and the one
   * extra slot at either end is the sentinel the first step reads.
   */
  function middleSnake(a0: number, a1: number, b0: number, b1: number): MiddleSnake | null {
    const n = a1 - a0;
    const m = b1 - b0;
    const delta = n - m;
    // With an odd `delta` the two waves can only overlap on a forward step, and
    // with an even one only on a backward step. Checking the wrong one costs
    // nothing but never fires, so each pass checks only its own.
    const odd = (delta & 1) !== 0;
    const max = Math.ceil((n + m) / 2);

    const size = 2 * max + 3;
    const forwardOffset = max + 1;
    const backwardOffset = max + 1 - delta;
    const forward = new Int32Array(size);
    const backward = new Int32Array(size);

    // The sentinels. `forward[k = 1] = 0` makes the first forward step start at
    // the origin, and `backward[k = delta + 1] = n + 1` makes the first
    // backward step start at the far corner.
    forward[forwardOffset + 1] = 0;
    backward[backwardOffset + delta + 1] = n + 1;

    for (let d = 0; d <= max; d += 1) {
      if (d > maxCost) {
        return null;
      }

      for (let k = -d; k <= d; k += 2) {
        // Whichever neighbour reached further: down from `k + 1`, which keeps
        // `x` and takes a line from `after`, or right from `k - 1`, which
        // advances `x` and gives up a line of `before`.
        let x =
          k === -d || (k !== d && forward[forwardOffset + k - 1] < forward[forwardOffset + k + 1])
            ? forward[forwardOffset + k + 1]
            : forward[forwardOffset + k - 1] + 1;
        let y = x - k;
        const snakeX = x;
        const snakeY = y;

        while (x < n && y < m && before[a0 + x] === after[b0 + y]) {
          x += 1;
          y += 1;
        }

        forward[forwardOffset + k] = x;

        if (
          odd &&
          k >= delta - (d - 1) &&
          k <= delta + (d - 1) &&
          x >= backward[backwardOffset + k]
        ) {
          return {
            beforeStart: a0 + snakeX,
            afterStart: b0 + snakeY,
            beforeEnd: a0 + x,
            afterEnd: b0 + y
          };
        }
      }

      for (let k = delta - d; k <= delta + d; k += 2) {
        // The same choice read from the other end: left from `k + 1` gives up a
        // line of `before`, up from `k - 1` takes a line from `after`.
        let x =
          k === delta - d ||
          (k !== delta + d &&
            backward[backwardOffset + k + 1] - 1 < backward[backwardOffset + k - 1])
            ? backward[backwardOffset + k + 1] - 1
            : backward[backwardOffset + k - 1];
        let y = x - k;
        const snakeX = x;
        const snakeY = y;

        while (x > 0 && y > 0 && before[a0 + x - 1] === after[b0 + y - 1]) {
          x -= 1;
          y -= 1;
        }

        backward[backwardOffset + k] = x;

        if (!odd && k >= -d && k <= d && forward[forwardOffset + k] >= x) {
          return {
            beforeStart: a0 + x,
            afterStart: b0 + y,
            beforeEnd: a0 + snakeX,
            afterEnd: b0 + snakeY
          };
        }
      }
    }

    // Unreachable: at `d = max` the two waves have covered the whole graph
    // between them and one of the checks above has fired.
    return null;
  }

  function push(beforeStart: number, afterStart: number, length: number): void {
    if (length === 0) {
      return;
    }

    const previous = matches[matches.length - 1];

    // Trimming the ends and then recursing produces runs that touch, and two
    // runs that touch are one run. Joining them here rather than in a pass
    // afterwards keeps every consumer from having to know the difference.
    if (
      previous &&
      previous.beforeStart + previous.length === beforeStart &&
      previous.afterStart + previous.length === afterStart
    ) {
      previous.length += length;

      return;
    }

    matches.push({ beforeStart, afterStart, length });
  }

  function collect(a0: number, a1: number, b0: number, b1: number): void {
    // The ends first. Two documents usually share a great deal of both, and
    // taking those off is not only faster — it is what guarantees the search
    // below always splits into two strictly smaller problems, because what is
    // left of the two ranges cannot start or end with the same entry.
    let prefix = 0;

    while (a0 + prefix < a1 && b0 + prefix < b1 && before[a0 + prefix] === after[b0 + prefix]) {
      prefix += 1;
    }

    if (prefix > 0) {
      push(a0, b0, prefix);
      a0 += prefix;
      b0 += prefix;
    }

    let suffix = 0;

    while (
      a1 - suffix > a0 &&
      b1 - suffix > b0 &&
      before[a1 - suffix - 1] === after[b1 - suffix - 1]
    ) {
      suffix += 1;
    }

    a1 -= suffix;
    b1 -= suffix;

    if (a0 < a1 && b0 < b1) {
      const snake = middleSnake(a0, a1, b0, b1);

      if (snake === null) {
        complete = false;
      } else {
        collect(a0, snake.beforeStart, b0, snake.afterStart);
        push(snake.beforeStart, snake.afterStart, snake.beforeEnd - snake.beforeStart);
        collect(snake.beforeEnd, a1, snake.afterEnd, b1);
      }
    }

    if (suffix > 0) {
      push(a1, b1, suffix);
    }
  }

  collect(0, before.length, 0, after.length);

  return { matches, complete };
}
