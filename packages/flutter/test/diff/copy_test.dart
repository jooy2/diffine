import 'package:diffine/diffine.dart';
import 'package:diffine/src/internal/rows.dart';
import 'package:flutter_test/flutter_test.dart';

/// The one line `the quick fox` against `the slow fox` is drawn as in a merged
/// view, which reads `the quickslow fox`.
PaneLayout merged() {
  final DiffResult result = diffText('keep\nthe quick fox', 'keep\nthe slow fox');

  return unifiedLayout(
    result.rows,
    result.changes,
    changeOfRow(result.rows.length, result.changes),
    null,
    merge: true,
  );
}

void main() {
  group('a merged line', () {
    test('puts a point inside what went out where that run was', () {
      final MergedLine line = merged().lines[1].merged!;

      // `the ` is equal, `quick` went out, `slow` came in, ` fox` is equal.
      expect(line.afterOffset(0), 0);
      expect(line.afterOffset(4), 4);
      expect(line.afterOffset(6), 4);
      expect(line.afterOffset(9), 4);
      expect(line.afterOffset(11), 6);
      expect(line.afterOffset(17), 12);
    });
  });
}
