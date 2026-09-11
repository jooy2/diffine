/// The pairs the gallery compares.
///
/// Written here rather than in the screens, because every demo showing the same
/// pair is what makes the options comparable: a reader turning wrapping on
/// should see the wrapping change and nothing else.
///
/// Each pair is longer than it has to be to show one change, and deliberately:
/// a demo is somewhere to scroll a comparison, fold it, search it and step
/// between changes, and a pair that fits on one screen answers none of those.
/// So the changes are spread from the top of each document to the bottom rather
/// than gathered where they would all be visible at once.
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

const String _codeBefore = r'''
const double taxRate = 0.08;

class Line {
  Line({required this.sku, required this.name, required this.price, this.quantity = 1});

  final String sku;
  final String name;
  final num price;
  int quantity;
}

num subtotal(List<Line> lines) {
  num total = 0;

  for (final Line line in lines) {
    total += line.price * line.quantity;
  }

  return total;
}

num tax(List<Line> lines) {
  return subtotal(lines) * taxRate;
}

num total(List<Line> lines) {
  return subtotal(lines) + tax(lines);
}

// Rounding is the caller's problem for now.
String format(num amount) {
  return '$' + amount.toStringAsFixed(2);
}

Cart addItem(Cart cart, Product product, {int quantity = 1}) {
  final Line? found = cart.lines.where((Line line) => line.sku == product.sku).firstOrNull;

  if (found != null) {
    found.quantity += quantity;

    return cart;
  }

  cart.lines.add(
    Line(sku: product.sku, name: product.name, price: product.price, quantity: quantity),
  );

  return cart;
}

Cart removeItem(Cart cart, String sku) {
  cart.lines.removeWhere((Line line) => line.sku == sku);

  return cart;
}

Cart setQuantity(Cart cart, String sku, int quantity) {
  final Line? found = cart.lines.where((Line line) => line.sku == sku).firstOrNull;

  if (found == null) {
    return cart;
  }

  if (quantity < 1) {
    return removeItem(cart, sku);
  }

  found.quantity = quantity;

  return cart;
}

int itemCount(Cart cart) {
  return cart.lines.fold(0, (int sum, Line line) => sum + line.quantity);
}

bool isEmpty(Cart cart) {
  return cart.lines.isEmpty;
}

Summary summarise(Cart cart) {
  return Summary(
    lines: cart.lines.length,
    items: itemCount(cart),
    total: format(total(cart.lines)),
  );
}
''';

const String _codeAfter = r'''
const Map<String, int> decimals = <String, int>{'USD': 2, 'EUR': 2, 'JPY': 0, 'KRW': 0};
const Map<String, double> taxRates = <String, double>{'US': 0.08, 'DE': 0.19, 'KR': 0.1};

class Line {
  Line({
    required this.sku,
    required this.name,
    required this.price,
    required this.currency,
    this.quantity = 1,
  });

  final String sku;
  final String name;
  final num price;
  final String currency;
  int quantity;
}

num subtotal(List<Line> lines, {String currency = 'USD'}) {
  num total = 0;

  for (final Line line in lines) {
    total += line.price * line.quantity;
  }

  return round(total, currency);
}

num round(num amount, String currency) {
  return num.parse(amount.toStringAsFixed(decimals[currency] ?? 2));
}

num tax(List<Line> lines, {String region = 'US', String currency = 'USD'}) {
  return round(subtotal(lines, currency: currency) * (taxRates[region] ?? 0), currency);
}

num total(List<Line> lines, {String region = 'US', String currency = 'USD'}) {
  return round(
    subtotal(lines, currency: currency) + tax(lines, region: region, currency: currency),
    currency,
  );
}

String format(num amount, {String currency = 'USD'}) {
  return NumberFormat.simpleCurrency(name: currency).format(amount);
}

Cart addItem(Cart cart, Product product, {int quantity = 1}) {
  final Line? found = cart.lines.where((Line line) => line.sku == product.sku).firstOrNull;

  if (found != null) {
    found.quantity += quantity;

    return cart;
  }

  cart.lines.add(
    Line(
      sku: product.sku,
      name: product.name,
      price: product.price,
      currency: product.currency ?? cart.currency,
      quantity: quantity,
    ),
  );

  return cart;
}

Cart removeItem(Cart cart, String sku) {
  cart.lines.removeWhere((Line line) => line.sku == sku);

  return cart;
}

Cart setQuantity(Cart cart, String sku, int quantity) {
  final Line? found = cart.lines.where((Line line) => line.sku == sku).firstOrNull;

  if (found == null) {
    return cart;
  }

  if (quantity < 1) {
    return removeItem(cart, sku);
  }

  found.quantity = quantity;

  return cart;
}

Cart applyDiscount(Cart cart, String code) {
  final Discount? rule = cart.discounts[code];

  if (rule == null) {
    return cart;
  }

  cart.discount = Discount(code: code, off: rule.off);

  return cart;
}

int itemCount(Cart cart) {
  return cart.lines.fold(0, (int sum, Line line) => sum + line.quantity);
}

Summary summarise(Cart cart) {
  return Summary(
    lines: cart.lines.length,
    items: itemCount(cart),
    currency: cart.currency,
    total: format(
      total(cart.lines, region: cart.region, currency: cart.currency),
      currency: cart.currency,
    ),
  );
}
''';

const String _proseBefore = '''
The comparison is worked out in two passes.

Lines are matched first, which says where the changes are. Every pair of lines
inside a change is then compared again, one level down, which says what happened
inside them.

The result is one flat list of rows.

Matching the lines

The two documents are cut into lines and walked against each other. A line that
appears on both sides in the same order is left alone.

Everything else is a change: a run of lines that arrived, a run that went away,
or a run that was replaced.

Looking inside a change

A replaced run is compared again, word by word. A word is a run of letters and
digits, and everything between two words is its own token.

Where a line changed by a digit or two, the words are cut again into graphemes,
so that a number that moved is a number that moved rather than a new one.

What comes back

Each row holds a line, a kind and a number.

A viewer draws the rows in order and needs nothing else.
''';

const String _proseAfter = '''
The comparison is worked out in two passes.

Lines are matched first, which says where the changes are. Every pair of lines
inside a change is then compared a second time, one level down, which says what
happened inside them — words, or graphemes where a number moved.

The result is one flat list of rows, in document order.
Each row holds whichever side has a line on it.

Matching the lines

The two documents are cut into lines and walked against each other, longest run
of agreement first. A line that appears on both sides in the same order is left
alone.

Everything else is a change: a run of lines that arrived, a run that went away,
or a run that was replaced. A run that arrived beside one that went away is read
as a replacement rather than as two changes.

Looking inside a change

A replaced run is compared again, word by word. A word is a run of letters and
digits, and everything between two words is its own token, so a comma that moved
is a comma that moved.

Where a line changed by a digit or two, the words are cut again into graphemes,
so that a number that moved is a number that moved rather than a new one.

What comes back

Each row holds a line, a kind, a number on each side, and the pieces inside it.

A viewer draws the rows in order and needs nothing else. Nothing in the answer
is a widget, so a build script can ask for one and hand it on.
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
