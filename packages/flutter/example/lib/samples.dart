/// The pairs the gallery compares.
///
/// Written here rather than in the screens, because every demo showing the same
/// pair is what makes the options comparable: a reader turning wrapping on
/// should see the wrapping change and nothing else.
library;

import 'dart:math' as math;
import 'dart:typed_data';

import 'package:diffine/diffine.dart';

/// One pair of documents, and what to call each side.
class Sample {
  /// One pair.
  const Sample({
    required this.before,
    required this.after,
    required this.beforeLabel,
    required this.afterLabel,
    this.language = 'plain',
  });

  /// The left document.
  final String before;

  /// The right one.
  final String after;

  /// What the left one is called.
  final String beforeLabel;

  /// What the right one is called.
  final String afterLabel;

  /// What the pair is written in, for `language`.
  final String language;
}

const String _codeBefore = '''
Map<String, num> subtotal(List<Item> items) {
  num total = 0;

  for (final Item item in items) {
    total += item.price * item.quantity;
  }

  return <String, num>{'total': total};
}

// Rounding is the caller's problem for now.
String format(num amount) {
  return '\\\$\${amount.toStringAsFixed(2)}';
}
''';

const String _codeAfter = '''
Map<String, num> subtotal(List<Item> items, {String currency = 'USD'}) {
  num total = 0;

  for (final Item item in items) {
    total += item.price * item.quantity;
  }

  final num tax = total * rateFor(currency);

  return <String, num>{'total': total + tax, 'tax': tax};
}

String format(num amount, {String currency = 'USD'}) {
  return NumberFormat.simpleCurrency(name: currency).format(amount);
}
''';

const String _proseBefore = '''
The comparison is worked out in two passes.

Lines are matched first, which says where the changes are. Every pair of lines
inside a change is then compared again, one level down, which says what happened
inside them.

The result is one flat list of rows.
''';

const String _proseAfter = '''
The comparison is worked out in two passes.

Lines are matched first, which says where the changes are. Every pair of lines
inside a change is then compared a second time, one level down, which says what
happened inside them — words, or graphemes where a number moved.

The result is one flat list of rows, in document order.
Each row holds whichever side has a line on it.
''';

/// Two versions of a source file.
const Sample code = Sample(
  before: _codeBefore,
  after: _codeAfter,
  beforeLabel: 'checkout.dart',
  afterLabel: 'checkout.dart (draft)',
  language: 'dart',
);

/// Two versions of a paragraph.
const Sample prose = Sample(
  before: _proseBefore,
  after: _proseAfter,
  beforeLabel: 'v1',
  afterLabel: 'v2',
);

/// A long file, for the folding and the virtualised rows.
Sample get longFile {
  final List<String> lines = List<String>.generate(
    400,
    (int index) => 'const step$index = ${index * 7 % 97};',
  );
  final List<String> after = List<String>.from(lines);

  after[40] = 'const step40 = 41; // adjusted';
  after[180] = 'const step180 = 3; // adjusted';
  after.insert(300, 'const extra = true;');
  after.removeAt(360);

  return Sample(
    before: '${lines.join('\n')}\n',
    after: '${after.join('\n')}\n',
    beforeLabel: 'constants.dart',
    afterLabel: 'constants.dart (draft)',
    language: 'dart',
  );
}

/// A patch, for the viewer that is handed a comparison rather than two
/// documents.
const String patch = '''
--- a/lib/src/engine.dart
+++ b/lib/src/engine.dart
@@ -12,7 +12,7 @@ class Engine {
   final List<Rule> rules;

   /// Runs every rule over the document.
-  List<Token> run(String document) {
+  List<Token> run(String document, {bool strict = false}) {
     final List<Token> out = <Token>[];

     return out;
@@ -48,6 +48,8 @@ class Engine {
   void reset() {
     _cache.clear();
   }
+
+  bool get isEmpty => _cache.isEmpty;
 }
''';

/// A drawing, for the picture comparison.
///
/// Built rather than shipped, so the gallery carries no asset and every
/// platform draws exactly the same pixels — which is also what makes the
/// comparison worth looking at: the second picture is the first one with a few
/// deliberate differences in it.
///
/// [pass] 0 is the original. 1 and 2 are two rounds of editing done to it, and
/// neither touches what the other did — which is what a comparison of three
/// pictures has to be able to show: a pane apiece, each marked where its own
/// picture left the original.
DiffPixels drawing({int pass = 0}) {
  const int width = 320;
  const int height = 200;
  final Uint8List data = Uint8List(width * height * 4);

  void paint(int x, int y, int red, int green, int blue) {
    if (x < 0 || y < 0 || x >= width || y >= height) {
      return;
    }

    final int at = (y * width + x) * 4;

    data[at] = red;
    data[at + 1] = green;
    data[at + 2] = blue;
    data[at + 3] = 255;
  }

  void box(int left, int top, int right, int bottom, int red, int green, int blue) {
    for (int y = top; y < bottom; y += 1) {
      for (int x = left; x < right; x += 1) {
        paint(x, y, red, green, blue);
      }
    }
  }

  // The ground, and a band across the top. The second pass restyled the band.
  box(0, 0, width, height, 246, 248, 251);
  box(0, 0, width, 36, pass == 2 ? 18 : 27, pass == 2 ? 58 : 34, pass == 2 ? 92 : 44);

  // Three cards.
  for (int card = 0; card < 3; card += 1) {
    final int left = 16 + card * 98;

    box(left, 56, left + 82, 130, 255, 255, 255);
    box(left, 56, left + 82, 60, 14, 127, 252);

    // A line of "text" in each. The first pass lengthened the middle card's,
    // the second cut the first card's back.
    for (int line = 0; line < 3; line += 1) {
      final int width =
          60 - line * 14 + (pass == 1 && card == 1 ? 10 : 0) - (pass == 2 && card == 0 ? 16 : 0);

      box(left + 10, 74 + line * 14, left + 10 + width, 80 + line * 14, 200, 208, 220);
    }
  }

  // A circle at the bottom, moved a little by the first pass.
  final int centre = pass == 1 ? 178 : 160;

  for (int y = 148; y < 188; y += 1) {
    for (int x = centre - 20; x < centre + 20; x += 1) {
      final double distance = math.sqrt(math.pow(x - centre, 2) + math.pow(y - 168, 2));

      if (distance <= 18) {
        paint(x, y, pass == 1 ? 232 : 26, pass == 1 ? 62 : 127, pass == 1 ? 140 : 75);
      }
    }
  }

  return DiffPixels(data: data, width: width, height: height);
}
