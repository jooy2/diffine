import 'package:diffine/diffine.dart';
import 'package:diffine/src/internal/apply.dart';
import 'package:flutter_test/flutter_test.dart';

/// One change taken across, and the document it leaves behind.
String taken(String before, String after, DiffineSide into, {int change = 0}) {
  final DiffResult result = diffText(before, after);
  final String text = into == DiffineSide.before ? before : after;

  return applyChange(result, result.changes[change], into, text).whole;
}

void main() {
  group('applyChange', () {
    test('writes the left-hand version over the right', () {
      expect(taken('a\nb\n', 'a\nB\n', DiffineSide.after), 'a\nb\n');
    });

    test('writes the right-hand version over the left', () {
      expect(taken('a\nb\n', 'a\nB\n', DiffineSide.before), 'a\nB\n');
    });

    test('puts back a line the other side does not have', () {
      expect(taken('a\nb\nc\n', 'a\nc\n', DiffineSide.after), 'a\nb\nc\n');
    });

    test('takes away a line the other side does not have', () {
      expect(taken('a\nb\nc\n', 'a\nc\n', DiffineSide.before), 'a\nc\n');
    });

    test('writes several lines over one', () {
      expect(taken('a\nb\n', 'a\nX\nY\nZ\n', DiffineSide.before), 'a\nX\nY\nZ\n');
    });

    test('keeps a document that does not end in a newline as one', () {
      expect(taken('a\nb', 'a\nB', DiffineSide.after), 'a\nb');
    });

    test('adds the newline a line needs when it is put after the last one', () {
      expect(taken('a\nb', 'a', DiffineSide.after), 'a\nb');
    });

    test('takes the last line away', () {
      // As lines rather than as a string: whether the document that is left
      // ends in a newline is a question about the last line, and it has one
      // line in it either way.
      expect(diffText(taken('a\nb', 'a', DiffineSide.before), '').before, <String>['a']);
    });

    test('writes into a document that is empty', () {
      expect(taken('a\nb\n', '', DiffineSide.after), 'a\nb\n');
    });

    test('empties a document whose every line went across', () {
      expect(taken('', 'a\nb\n', DiffineSide.after), '');
    });

    test('leaves the two documents the same once every change has been taken', () {
      const String before = 'one\ntwo\nthree\nfour\nfive\n';
      const String after = 'one\nTWO\nthree\nfive\nsix\n';

      String held = after;

      // Backwards, so that taking one change does not move the ranges of the
      // ones that have not been taken yet.
      DiffResult result = diffText(before, held);

      for (int index = result.changes.length - 1; index >= 0; index -= 1) {
        held = applyChange(result, result.changes[index], DiffineSide.after, held).whole;
        result = diffText(before, held);
      }

      expect(held, before);
    });
  });
}
