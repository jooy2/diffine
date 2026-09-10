/// Which line of a replaced run belongs opposite which.
///
/// Taking them in order is right far more often than it is wrong, and it is
/// wrong in exactly one situation — a run where lines were inserted as well as
/// edited. Three lines out and four in, and the fourth is the edited one: laid
/// out in order, every pair is wrong from the first row down, and each of them
/// gets the words inside it compared against a line it has nothing to do with.
///
/// So the run is laid out to pair the lines that look like each other, keeping
/// the order they were written in. That is the same shape of problem the engine
/// solves one level up, with one difference that matters: two lines are not
/// equal or unequal here, they are more or less alike, and the pairing is
/// whichever one leaves the most likeness on the table.
library;

import 'dart:math' as math;
import 'dart:typed_data';

/// How alike two lines look, in one pass over each.
///
/// The share of the two that is a common start and a common end. An edit lands
/// in the middle of a line far more often than at both ends of it, so this
/// scores the pair that was edited well above the pair that merely landed next
/// to each other — which is all this has to do. It is deliberately not the
/// comparison the words inside the line get: that one is worth its cost once
/// per pair and not once per pair that was considered.
double affinity(String before, String after) {
  if (before == after) {
    return 1;
  }

  final int total = before.length + after.length;

  if (total == 0) {
    return 1;
  }

  final int shorter = math.min(before.length, after.length);
  int prefix = 0;

  while (prefix < shorter && before.codeUnitAt(prefix) == after.codeUnitAt(prefix)) {
    prefix += 1;
  }

  int suffix = 0;

  while (suffix < shorter - prefix &&
      before.codeUnitAt(before.length - 1 - suffix) ==
          after.codeUnitAt(after.length - 1 - suffix)) {
    suffix += 1;
  }

  return (prefix + suffix) * 2 / total;
}

/// What a pair is worth beyond how alike it is.
///
/// Without it, two lines with nothing in common score the same paired as they
/// do on their own, and the run is drawn twice as tall as it needs to be for no
/// gain. With it, a pair is always worth making unless a gap buys a better one
/// — which is the behaviour that reads as "in order, unless there is a reason".
const double _pairingBonus = 0.05;

/// Where a run stops being worth laying out carefully.
const int _maxCells = 10000;

const int _pair = 0;
const int _skipBefore = 1;
const int _skipAfter = 2;

/// One row of a replaced run: an index into each side, or -1 for a blank.
class LinePair {
  /// One row.
  const LinePair(this.before, this.after);

  /// Which line of `before` this row holds, or -1.
  final int before;

  /// Which line of `after` it holds, or -1.
  final int after;
}

/// The two sides taken in order, which is what a run too large to weigh gets.
List<LinePair> _inOrder(int beforeCount, int afterCount) {
  final List<LinePair> pairs = <LinePair>[];

  for (int offset = 0; offset < math.max(beforeCount, afterCount); offset += 1) {
    pairs.add(LinePair(offset < beforeCount ? offset : -1, offset < afterCount ? offset : -1));
  }

  return pairs;
}

/// The rows a replaced run is drawn as, in order, as indexes into the two
/// sides.
///
/// Ties go to the blank rather than to the pair, which is what puts the pairing
/// at the top of a run where nothing resembles anything: three lines against
/// one, with no likeness anywhere, reads better as the first line paired and
/// two blanks under it than as two blanks and the last line paired.
List<LinePair> pairLines(List<String> before, List<String> after) {
  final int n = before.length;
  final int m = after.length;

  if (n == 0 || m == 0 || n * m > _maxCells) {
    return _inOrder(n, m);
  }

  final int width = m + 1;
  final Float64List score = Float64List((n + 1) * width);
  final Uint8List choice = Uint8List((n + 1) * width);

  for (int i = 1; i <= n; i += 1) {
    choice[i * width] = _skipBefore;
  }

  for (int j = 1; j <= m; j += 1) {
    choice[j] = _skipAfter;
  }

  for (int i = 1; i <= n; i += 1) {
    for (int j = 1; j <= m; j += 1) {
      final double paired =
          score[(i - 1) * width + j - 1] + affinity(before[i - 1], after[j - 1]) + _pairingBonus;
      final double skipBefore = score[(i - 1) * width + j];
      final double skipAfter = score[i * width + j - 1];
      final double best = math.max(paired, math.max(skipBefore, skipAfter));

      score[i * width + j] = best;
      choice[i * width + j] = skipBefore == best
          ? _skipBefore
          : skipAfter == best
          ? _skipAfter
          : _pair;
    }
  }

  final List<LinePair> pairs = <LinePair>[];
  int i = n;
  int j = m;

  while (i > 0 || j > 0) {
    final int step = i == 0
        ? _skipAfter
        : j == 0
        ? _skipBefore
        : choice[i * width + j];

    if (step == _pair) {
      pairs.add(LinePair(i - 1, j - 1));
      i -= 1;
      j -= 1;
    } else if (step == _skipBefore) {
      pairs.add(LinePair(i - 1, -1));
      i -= 1;
    } else {
      pairs.add(LinePair(-1, j - 1));
      j -= 1;
    }
  }

  return pairs.reversed.toList();
}
