/// What the two sequences have in common, and how the engine finds it.
///
/// Everything above this file — lines, words, characters — comes down to two
/// lists of strings and one question: which entries of the first are also
/// entries of the second, in the same order, with as little given up as
/// possible. The answer is a list of matching runs, and every kind of edit is
/// read off the gaps between them.
///
/// The method is the one Eugene Myers published in 1986, in the shape he
/// describes in the second half of that paper: walk the edit graph forwards
/// from the start and backwards from the end at the same time, stop at the step
/// where the two waves meet, and recurse on the two halves either side of the
/// run of matches at the meeting point. It costs a pass over both sequences per
/// step and holds one row of the graph rather than the whole thing, which is
/// the difference between a viewer that opens a large file and one that runs
/// the app out of memory trying.
library;

import 'dart:typed_data';

/// A run of entries that is in both sequences, at these two places.
class DiffMatch {
  /// One matching run.
  DiffMatch(this.beforeStart, this.afterStart, this.length);

  /// Where it starts in `before`.
  final int beforeStart;

  /// Where it starts in `after`.
  final int afterStart;

  /// How many entries long it is. Grown where two runs turn out to touch.
  int length;
}

/// What the search found, and whether it got to finish.
class DiffMatchResult {
  /// One search.
  const DiffMatchResult(this.matches, this.complete);

  /// The runs the two sequences have in common, in order.
  final List<DiffMatch> matches;

  /// `false` when a range cost more than it was allowed to spend and came back
  /// with no matches in it at all. Everything outside that range is still the
  /// real answer.
  final bool complete;
}

/// The diagonal run two waves met on, in absolute positions.
class _MiddleSnake {
  const _MiddleSnake(this.beforeStart, this.afterStart, this.beforeEnd, this.afterEnd);

  final int beforeStart;
  final int afterStart;
  final int beforeEnd;
  final int afterEnd;
}

/// The runs `before` and `after` have in common, in order and without overlaps.
///
/// [maxCost] is the largest number of steps either wave will take in one
/// search. A range that needs more comes back with nothing matching in it,
/// which reads downstream as "all of this was replaced" — a wrong answer only
/// in the sense that a smaller set of edits existed and was too expensive to
/// find.
DiffMatchResult matchSequences(List<String> before, List<String> after, int maxCost) {
  final List<DiffMatch> matches = <DiffMatch>[];
  bool complete = true;

  /// The step where the forward and backward waves overlap, and the run of
  /// matches they overlap on. `null` when the search ran past [maxCost].
  ///
  /// Both waves are stored as one number per diagonal — the furthest that
  /// diagonal has reached — which is why this is a pair of lists rather than
  /// the whole graph. A diagonal is `x - y`, so the forward wave lives in
  /// `[-d, d]` and the backward one in `[delta - d, delta + d]`; each gets an
  /// offset of its own so that both fit a list of the same length, and the one
  /// extra slot at either end is the sentinel the first step reads.
  _MiddleSnake? middleSnake(int a0, int a1, int b0, int b1) {
    final int n = a1 - a0;
    final int m = b1 - b0;
    final int delta = n - m;
    // With an odd `delta` the two waves can only overlap on a forward step, and
    // with an even one only on a backward step. Checking the wrong one costs
    // nothing but never fires, so each pass checks only its own.
    final bool odd = (delta & 1) != 0;
    final int max = ((n + m) / 2).ceil();

    final int size = 2 * max + 3;
    final int forwardOffset = max + 1;
    final int backwardOffset = max + 1 - delta;
    final Int32List forward = Int32List(size);
    final Int32List backward = Int32List(size);

    // The sentinels. `forward[k = 1] = 0` makes the first forward step start at
    // the origin, and `backward[k = delta + 1] = n + 1` makes the first
    // backward step start at the far corner.
    forward[forwardOffset + 1] = 0;
    backward[backwardOffset + delta + 1] = n + 1;

    for (int d = 0; d <= max; d += 1) {
      if (d > maxCost) {
        return null;
      }

      for (int k = -d; k <= d; k += 2) {
        // Whichever neighbour reached further: down from `k + 1`, which keeps
        // `x` and takes a line from `after`, or right from `k - 1`, which
        // advances `x` and gives up a line of `before`.
        int x =
            k == -d || (k != d && forward[forwardOffset + k - 1] < forward[forwardOffset + k + 1])
            ? forward[forwardOffset + k + 1]
            : forward[forwardOffset + k - 1] + 1;
        int y = x - k;
        final int snakeX = x;
        final int snakeY = y;

        while (x < n && y < m && before[a0 + x] == after[b0 + y]) {
          x += 1;
          y += 1;
        }

        forward[forwardOffset + k] = x;

        if (odd &&
            k >= delta - (d - 1) &&
            k <= delta + (d - 1) &&
            x >= backward[backwardOffset + k]) {
          return _MiddleSnake(a0 + snakeX, b0 + snakeY, a0 + x, b0 + y);
        }
      }

      for (int k = delta - d; k <= delta + d; k += 2) {
        // The same choice read from the other end: left from `k + 1` gives up a
        // line of `before`, up from `k - 1` takes a line from `after`.
        int x =
            k == delta - d ||
                (k != delta + d &&
                    backward[backwardOffset + k + 1] - 1 < backward[backwardOffset + k - 1])
            ? backward[backwardOffset + k + 1] - 1
            : backward[backwardOffset + k - 1];
        int y = x - k;
        final int snakeX = x;
        final int snakeY = y;

        while (x > 0 && y > 0 && before[a0 + x - 1] == after[b0 + y - 1]) {
          x -= 1;
          y -= 1;
        }

        backward[backwardOffset + k] = x;

        if (!odd && k >= -d && k <= d && forward[forwardOffset + k] >= x) {
          return _MiddleSnake(a0 + x, b0 + y, a0 + snakeX, b0 + snakeY);
        }
      }
    }

    // Unreachable: at `d = max` the two waves have covered the whole graph
    // between them and one of the checks above has fired.
    return null;
  }

  void push(int beforeStart, int afterStart, int length) {
    if (length == 0) {
      return;
    }

    final DiffMatch? previous = matches.isEmpty ? null : matches.last;

    // Trimming the ends and then recursing produces runs that touch, and two
    // runs that touch are one run. Joining them here rather than in a pass
    // afterwards keeps every consumer from having to know the difference.
    if (previous != null &&
        previous.beforeStart + previous.length == beforeStart &&
        previous.afterStart + previous.length == afterStart) {
      previous.length += length;

      return;
    }

    matches.add(DiffMatch(beforeStart, afterStart, length));
  }

  void collect(int a0, int a1, int b0, int b1) {
    // The ends first. Two documents usually share a great deal of both, and
    // taking those off is not only faster — it is what guarantees the search
    // below always splits into two strictly smaller problems, because what is
    // left of the two ranges cannot start or end with the same entry.
    int prefix = 0;

    while (a0 + prefix < a1 && b0 + prefix < b1 && before[a0 + prefix] == after[b0 + prefix]) {
      prefix += 1;
    }

    if (prefix > 0) {
      push(a0, b0, prefix);
      a0 += prefix;
      b0 += prefix;
    }

    int suffix = 0;

    while (a1 - suffix > a0 &&
        b1 - suffix > b0 &&
        before[a1 - suffix - 1] == after[b1 - suffix - 1]) {
      suffix += 1;
    }

    a1 -= suffix;
    b1 -= suffix;

    if (a0 < a1 && b0 < b1) {
      final _MiddleSnake? snake = middleSnake(a0, a1, b0, b1);

      if (snake == null) {
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

  return DiffMatchResult(matches, complete);
}
