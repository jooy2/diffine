import 'dart:typed_data';

import 'package:diffine/diffine.dart';
import 'package:diffine/src/internal/fold.dart';
import 'package:diffine/src/internal/rows.dart';
import 'package:flutter_test/flutter_test.dart';

/// A document of `count` numbered lines.
String document(int count) =>
    '${List<String>.generate(count, (int index) => 'line $index').join('\n')}\n';

FoldPlan? planFor(
  DiffResult result, {
  bool collapse = true,
  int context = 3,
  Set<int> opened = const <int>{},
}) {
  return foldPlan(result.rows, FoldOptions(collapse: collapse, context: context, opened: opened));
}

/// What one pane draws, with a band written as the count it stands for.
List<String> drawn(DiffResult result, FoldPlan? plan) {
  final PaneLayout layout = splitLayout(
    result.rows,
    changeOfRow(result.rows.length, result.changes),
    DiffineSide.before,
    true,
    plan,
  );

  return layout.lines
      .map(
        (PaneLine line) =>
            line.fold != null ? 'fold ${line.fold!.lines}' : (line.line?.text ?? '·'),
      )
      .toList();
}

void main() {
  group('foldPlan', () {
    test('folds nothing at all when it is not asked to', () {
      final DiffResult result = diffText(document(40), document(40).replaceFirst('line 20', 'X'));

      expect(planFor(result, collapse: false), isNull);
    });

    test('keeps the lines either side of a change and folds the rest away', () {
      final DiffResult result = diffText(document(40), document(40).replaceFirst('line 20', 'X'));

      expect(drawn(result, planFor(result)), <String>[
        'fold 17',
        'line 17',
        'line 18',
        'line 19',
        'line 20',
        'line 21',
        'line 22',
        'line 23',
        'fold 16',
      ]);
    });

    test('keeps nothing at the top and the bottom, where there is no change to surround', () {
      final DiffResult result = diffText(document(10), document(10).replaceFirst('line 0', 'X'));
      final List<String> lines = drawn(result, planFor(result));

      // The change is the first row, so nothing is kept above it.
      expect(lines.first, 'line 0');
      expect(lines.last, 'fold 6');
    });

    test('draws the run a reader opened, and leaves the others folded', () {
      final String before = document(60);
      final String after = before.replaceFirst('line 10', 'X').replaceFirst('line 50', 'Y');
      final DiffResult result = diffText(before, after);
      final FoldPlan? shut = planFor(result);
      final int first = shut!.bands.indexWhere((FoldRun? run) => run != null);
      final List<String> shutLines = drawn(result, shut);
      final List<String> opened = drawn(
        result,
        planFor(result, opened: <int>{shut.bands[first]!.start}),
      );

      expect(shutLines.where((String line) => line.startsWith('fold ')), hasLength(3));
      expect(opened.where((String line) => line.startsWith('fold ')), hasLength(2));
      expect(opened, contains('line 0'));
    });

    test('folds a comparison that found no changes at all into one band', () {
      final DiffResult result = diffText(document(20), document(20));

      expect(drawn(result, planFor(result)), <String>['fold 20']);
    });

    test('says how many lines each band stands for', () {
      final DiffResult result = diffText(document(40), document(40).replaceFirst('line 20', 'X'));
      final List<String> lines = drawn(result, planFor(result));

      expect(lines.first, 'fold 17');
      expect(lines.last, 'fold 16');
    });

    test('reads the number of lines kept from `context`', () {
      final DiffResult result = diffText(document(40), document(40).replaceFirst('line 20', 'X'));
      final List<String> lines = drawn(result, planFor(result, context: 1));

      expect(lines, <String>['fold 19', 'line 19', 'line 20', 'line 21', 'fold 18']);
    });

    test('says where a patch is missing lines, whether or not anything is folded', () {
      const String patch = '''
--- a
+++ b
@@ -1,1 +1,1 @@
-a
+A
@@ -40,1 +40,1 @@
-b
+B
''';
      final DiffResult result = parsePatch(patch).single.result;
      final FoldPlan? plan = planFor(result, collapse: false);

      expect(plan, isNotNull);
      expect(drawn(result, plan), <String>['a', 'fold 38', 'b']);
    });

    test('makes a band a button only where the lines can be opened', () {
      const String patch = '--- a\n+++ b\n@@ -1,1 +1,1 @@\n-a\n+A\n@@ -40,1 +40,1 @@\n-b\n+B\n';
      final DiffResult result = parsePatch(patch).single.result;
      final FoldPlan plan = planFor(result, collapse: false)!;
      final FoldRun missing = plan.bands.firstWhere((FoldRun? run) => run != null)!;

      expect(missing.expandable, isFalse);

      final DiffResult whole = diffText(document(40), document(40).replaceFirst('line 20', 'X'));
      final FoldPlan folded = planFor(whole)!;

      expect(folded.bands.firstWhere((FoldRun? run) => run != null)!.expandable, isTrue);
    });

    test('folds both sides the same way, so the two stay level', () {
      final DiffResult result = diffText(document(40), document(40).replaceFirst('line 20', 'X'));
      final FoldPlan? plan = planFor(result);
      final Int32List owner = changeOfRow(result.rows.length, result.changes);
      final PaneLayout before = splitLayout(result.rows, owner, DiffineSide.before, true, plan);
      final PaneLayout after = splitLayout(result.rows, owner, DiffineSide.after, true, plan);

      expect(before.lines.length, after.lines.length);
      expect(
        before.lines.map((PaneLine line) => line.fold?.lines).toList(),
        after.lines.map((PaneLine line) => line.fold?.lines).toList(),
      );
    });

    test('folds a unified column as well', () {
      final DiffResult result = diffText(document(40), document(40).replaceFirst('line 20', 'X'));
      final PaneLayout layout = unifiedLayout(
        result.rows,
        result.changes,
        changeOfRow(result.rows.length, result.changes),
        planFor(result),
      );

      expect(layout.lines.where((PaneLine line) => line.fold != null), hasLength(2));
    });
  });
}
