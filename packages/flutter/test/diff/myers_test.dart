import 'dart:math' as math;

import 'package:diffine/diffine.dart';
import 'package:diffine/src/internal/diff/myers.dart';
import 'package:flutter_test/flutter_test.dart';

/// How many tokens the two sequences have in common, as the search found them.
int paired(List<DiffMatch> matches) {
  return matches.fold(0, (int total, DiffMatch match) => total + match.length);
}

/// The longest run of tokens both sequences hold in order, worked out the slow
/// way — which is the answer the engine has to reach by the fast one.
int longestCommon(List<String> before, List<String> after) {
  final List<List<int>> table = List<List<int>>.generate(
    before.length + 1,
    (int _) => List<int>.filled(after.length + 1, 0),
  );

  for (int i = 1; i <= before.length; i += 1) {
    for (int j = 1; j <= after.length; j += 1) {
      table[i][j] = before[i - 1] == after[j - 1]
          ? table[i - 1][j - 1] + 1
          : math.max(table[i - 1][j], table[i][j - 1]);
    }
  }

  return table[before.length][after.length];
}

void main() {
  group('matchSequences', () {
    test('pairs up every token two identical sequences have', () {
      final List<String> tokens = 'a b c d e'.split(' ');

      expect(paired(matchSequences(tokens, tokens, 5000).matches), 5);
    });

    test('pairs up nothing between two sequences with nothing in common', () {
      expect(paired(matchSequences('a b c'.split(' '), 'x y z'.split(' '), 5000).matches), 0);
    });

    test('finds as much in common as there is to find, over a thousand random pairs', () {
      final math.Random random = math.Random(20260910);

      for (int round = 0; round < 1000; round += 1) {
        final List<String> before = List<String>.generate(
          random.nextInt(9),
          (int _) => String.fromCharCode(97 + random.nextInt(4)),
        );
        final List<String> after = List<String>.generate(
          random.nextInt(9),
          (int _) => String.fromCharCode(97 + random.nextInt(4)),
        );

        expect(
          paired(matchSequences(before, after, 5000).matches),
          longestCommon(before, after),
          reason: '$before vs $after',
        );
      }
    });

    test('finds as much in common as there is to find in a long pair', () {
      final math.Random random = math.Random(7);
      final List<String> before = List<String>.generate(
        400,
        (int index) => 'line ${random.nextInt(120)}',
      );
      final List<String> after = List<String>.from(before)
        ..removeRange(30, 60)
        ..insertAll(120, <String>['one', 'two', 'three']);

      expect(paired(matchSequences(before, after, 5000).matches), longestCommon(before, after));
    });

    test('returns its runs in order and without overlaps', () {
      final List<DiffMatch> matches = matchSequences(
        'a b c d e f'.split(' '),
        'a x c d y f'.split(' '),
        5000,
      ).matches;

      int before = 0;
      int after = 0;

      for (final DiffMatch match in matches) {
        expect(match.beforeStart, greaterThanOrEqualTo(before));
        expect(match.afterStart, greaterThanOrEqualTo(after));
        before = match.beforeStart + match.length;
        after = match.afterStart + match.length;
      }
    });

    test('leaves the two sequences reconstructable from the edits it returns', () {
      final List<String> before = 'the quick brown fox jumps over'.split(' ');
      final List<String> after = 'the slow brown fox leaps over again'.split(' ');
      final List<String> rebuiltBefore = <String>[];
      final List<String> rebuiltAfter = <String>[];

      for (final DiffEdit edit in diffSequence(before, after)) {
        rebuiltBefore.addAll(before.sublist(edit.beforeStart, edit.beforeEnd));
        rebuiltAfter.addAll(after.sublist(edit.afterStart, edit.afterEnd));
      }

      expect(rebuiltBefore, before);
      expect(rebuiltAfter, after);
    });
  });
}
