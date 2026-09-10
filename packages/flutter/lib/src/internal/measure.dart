/// How much text a document holds, and how to write that down.
///
/// Two numbers, both of which a reader of a comparison asks for: how long the
/// document is, and how heavy it is. They are worked out in one pass over the
/// string and without allocating anything, because the editor asks for them
/// again on every keystroke and a document is not always small.
library;

import 'package:diffine/src/types.dart';

/// How much text there is, counted two ways.
class DocumentSize {
  /// One measurement.
  const DocumentSize(this.characters, this.bytes);

  /// Characters, counted the way a reader counts them.
  ///
  /// Code points rather than the units a string is stored in, so an emoji or a
  /// character outside the basic plane is one character and not two.
  final int characters;

  /// What it weighs as UTF-8, which is what a file of it would.
  final int bytes;
}

/// The size of a document, in one pass and without a copy of it.
DocumentSize measureText(String text) {
  int characters = 0;
  int bytes = 0;

  for (int index = 0; index < text.length; index += 1) {
    final int code = text.codeUnitAt(index);

    characters += 1;

    if (code < 0x80) {
      bytes += 1;
    } else if (code < 0x800) {
      bytes += 2;
    } else if (code >= 0xd800 &&
        code <= 0xdbff &&
        index + 1 < text.length &&
        (text.codeUnitAt(index + 1) & 0xfc00) == 0xdc00) {
      // A surrogate pair: one character between the two units, and four bytes
      // for it. A lone high surrogate falls through to the three-byte case
      // below.
      bytes += 4;
      index += 1;
    } else {
      bytes += 3;
    }
  }

  return DocumentSize(characters, bytes);
}

/// A number with its digits grouped, and a fraction of the length asked for.
///
/// Written here rather than taken from a formatting package, because both
/// languages this speaks group by three with a comma and separate the fraction
/// with a full stop — and a dependency the size of the CLDR tables is not worth
/// a status bar. An application whose locale groups differently passes its own
/// numbers in through `strings`.
String _grouped(double value, int fraction) {
  final String written = value.toStringAsFixed(fraction);
  final int point = written.indexOf('.');
  final String whole = point < 0 ? written : written.substring(0, point);
  final String rest = point < 0 ? '' : written.substring(point);
  final bool negative = whole.startsWith('-');
  final String digits = negative ? whole.substring(1) : whole;
  final StringBuffer out = StringBuffer();

  for (int index = 0; index < digits.length; index += 1) {
    if (index > 0 && (digits.length - index) % 3 == 0) {
      out.write(',');
    }

    out.write(digits[index]);
  }

  return '${negative ? '-' : ''}$out$rest';
}

/// A count, grouped the way the reader's language groups one.
String formatCount(int count, DiffineLocale locale) {
  return _grouped(count.toDouble(), 0);
}

/// A number with a fraction, for a share of a picture rather than a count of
/// anything.
///
/// Two decimals, because the interesting answer is often a small one: a hundred
/// pixels of a photograph is `0.01`, and rounding that to a whole number turns
/// "something changed" into "nothing did". Trailing zeros come off, so a whole
/// number is written as one.
String formatNumber(double value, DiffineLocale locale, [int fraction = 2]) {
  final String written = _grouped(value, fraction);

  if (!written.contains('.')) {
    return written;
  }

  return written.replaceFirst(RegExp(r'\.?0+$'), '');
}

const List<String> _units = <String>['B', 'KB', 'MB', 'GB'];

/// A weight in bytes, in the largest unit that leaves a number worth reading.
///
/// Binary units, because this is the size of something held in memory rather
/// than the size of something a disk was sold by. Whole bytes below a kilobyte
/// and one decimal above it, which is as much precision as a status bar can
/// spend.
String formatBytes(int bytes, DiffineLocale locale) {
  double value = bytes.toDouble();
  int unit = 0;

  while (value >= 1024 && unit < _units.length - 1) {
    value /= 1024;
    unit += 1;
  }

  return '${_grouped(value, unit == 0 ? 0 : 1)} ${_units[unit]}';
}
