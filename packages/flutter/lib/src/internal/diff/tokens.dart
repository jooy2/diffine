/// Cutting text into the pieces a comparison is made of.
///
/// Three sizes of piece, and the choice between them is the whole of what a
/// reader means by how detailed a comparison is: lines for the shape of the
/// document, words for what a person edited, graphemes for the one digit that
/// moved. Every one of them comes back as a list of strings, because that is
/// what the engine takes.
library;

import 'package:characters/characters.dart';
import 'package:diffine/src/types.dart';

/// Runs of letters and digits, runs of whitespace, everything else on its own.
final RegExp _word = RegExp(r'[\p{L}\p{N}_]+|\s+|[\s\S]', unicode: true);

/// Every line ending, so that a document written on one platform and edited on
/// another does not come back as one changed line per line.
final RegExp _breaks = RegExp(r'\r\n|\r|\n');

/// A document, one line at a time, with the line endings taken off.
///
/// `\r\n`, `\n` and a lone `\r` all end a line. The newline that ends the last
/// line is the end of that line rather than the start of an empty one, which is
/// why an empty document is no lines at all and `a\n` is one.
List<String> splitLines(String text) {
  if (text.isEmpty) {
    return <String>[];
  }

  final List<String> lines = text.split(_breaks);

  if (lines.isNotEmpty && lines.last.isEmpty) {
    lines.removeLast();
  }

  return lines;
}

/// A line, one word at a time, with the whitespace between them kept.
List<String> splitWords(String text) {
  return _word.allMatches(text).map((RegExpMatch found) => found[0]!).toList();
}

/// A line, one grapheme at a time.
List<String> splitGraphemes(String text) {
  return text.characters.toList();
}

/// What is left where a pattern matched: one character that is in no document.
///
/// Set aside rather than taken out, so that a line with a timestamp in it and a
/// line with the timestamp missing are still two different lines.
const String _mask = '\u0000';

final RegExp _trailingSpace = RegExp(r'\s+$', unicode: true);
final RegExp _anySpace = RegExp(r'\s+', unicode: true);

/// What a piece of text is compared as, once the things being ignored are gone.
///
/// This is only ever the key. Whatever comes off here is still drawn, so
/// turning whitespace off changes which lines are called equal and never what a
/// reader sees.
///
/// The patterns run first, on the text as it was written. Lowering the case or
/// dropping the whitespace before them would hand each pattern a line that is
/// not the line its author wrote it for.
String comparisonKey(
  String text,
  DiffWhitespace whitespace,
  bool ignoreCase, [
  List<RegExp>? ignore,
]) {
  String key = text;

  if (ignore != null) {
    for (final RegExp pattern in ignore) {
      key = key.replaceAll(pattern, _mask);
    }
  }

  switch (whitespace) {
    case DiffWhitespace.trailing:
      key = key.replaceAll(_trailingSpace, '');
    case DiffWhitespace.surrounding:
      key = key.trim();
    case DiffWhitespace.amount:
      key = key.trim().replaceAll(_anySpace, ' ');
    case DiffWhitespace.all:
      key = key.replaceAll(_anySpace, '');
    case DiffWhitespace.exact:
      break;
  }

  return ignoreCase ? key.toLowerCase() : key;
}
