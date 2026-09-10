/// Finding a run of text in a pane, and reading what turned up one match at a
/// time.
///
/// A pane is searched rather than a document, and the difference matters in
/// both views the widgets draw: the two sides of a split view are two searches
/// that open, close and count on their own, and a unified view is one search
/// over a column that happens to hold lines from both documents. So everything
/// here is written against [PaneLayout] — the lines a pane actually draws — and
/// a match is a range inside one of them rather than an offset into a string.
///
/// That is also what makes the highlighting free. The lines are already being
/// drawn a piece at a time, cut wherever the comparison or a syntax highlighter
/// had something to say; a match is a third thing with something to say about
/// the same line, and it is cut in at the same boundaries.
///
/// Where the caret has to move as well — an editable pane — the range is turned
/// back into an offset into the document with [rangeOf], which is the one
/// direction the translation runs in.
library;

import 'package:diffine/src/internal/rows.dart';

/// How a query is read.
class SearchOptions {
  /// One set of switches.
  const SearchOptions({this.matchCase = false, this.wholeWord = false, this.regex = false});

  /// Whether `Title` and `title` are the same word.
  final bool matchCase;

  /// Whether a match has to have something other than a letter either side.
  final bool wholeWord;

  /// Whether the query is a regular expression rather than the text to find.
  final bool regex;

  /// The same switches with whichever of them are given flipped.
  SearchOptions copyWith({bool? matchCase, bool? wholeWord, bool? regex}) {
    return SearchOptions(
      matchCase: matchCase ?? this.matchCase,
      wholeWord: wholeWord ?? this.wholeWord,
      regex: regex ?? this.regex,
    );
  }
}

/// Where one match sits: which line of the pane, and the range inside it.
class SearchMatch {
  /// One match.
  const SearchMatch(this.row, this.start, this.end);

  /// Where the line sits in the pane's own list, which is what is scrolled to.
  final int row;

  /// Where the match starts in that line.
  final int start;

  /// Where it ends, exclusive.
  final int end;

  @override
  bool operator ==(Object other) {
    return other is SearchMatch && other.row == row && other.start == start && other.end == end;
  }

  @override
  int get hashCode => Object.hash(row, start, end);
}

/// Every match, and whether the scan reached the end of the document.
class SearchResult {
  /// One scan.
  const SearchResult(this.matches, this.capped);

  /// Nothing found, as one value rather than a new empty list per build.
  static const SearchResult none = SearchResult(<SearchMatch>[], false);

  /// The matches, in the order the pane draws them.
  final List<SearchMatch> matches;

  /// Whether the scan stopped at [kMostMatches] rather than at the last line.
  ///
  /// A single letter typed into the box of a twenty-thousand-line document is a
  /// match every few characters, and counting all of them is work nobody asked
  /// for on the way to a query that has not been finished yet. The count says
  /// `+` when this is set, and Replace All works from a scan with no limit on
  /// it.
  final bool capped;
}

/// How many matches are worth collecting for a query somebody is still typing.
const int kMostMatches = 20000;

/// What has to be escaped for a query to be looked for as the text it is.
final RegExp _escape = RegExp(r'[.*+?^${}()|[\]\\]');

/// What counts as being inside a word, for a search that wants whole ones.
final RegExp _word = RegExp(r'[\p{L}\p{N}_]', unicode: true);

/// Every line ending, for finding where each line of a document starts.
final RegExp _breaks = RegExp(r'\r\n|\r|\n');

/// The expression a query means, or `null` when it does not mean one yet.
///
/// Which covers two cases the search bar draws differently: an empty box, where
/// there is nothing to look for, and an expression that cannot be read, where
/// there is something and it is not finished — `(` on the way to `(a|b)` is the
/// usual one, and it is not an error to put in front of somebody mid-word.
RegExp? patternFor(String query, SearchOptions options) {
  if (query.isEmpty) {
    return null;
  }

  final String source = options.regex
      ? query
      : query.replaceAllMapped(_escape, (Match found) => '\\${found[0]}');

  try {
    return RegExp(source, caseSensitive: options.matchCase, unicode: true);
  } on FormatException {
    try {
      return RegExp(source, caseSensitive: options.matchCase);
    } on FormatException {
      return null;
    }
  }
}

/// Whether there is something other than a letter or a digit either side.
bool _bounded(String text, int start, int end) {
  final String left = start > 0 ? text[start - 1] : '';
  final String right = end < text.length ? text[end] : '';

  return !_word.hasMatch(left) && !_word.hasMatch(right);
}

/// Every match in a pane's lines, in the order the pane draws them.
///
/// A match of no width is skipped rather than collected. `a*` matches the empty
/// string between every pair of characters, and a search bar that answers "four
/// hundred matches" to a pattern that found nothing is worse than one that
/// answers none.
SearchResult findMatches(
  List<PaneLine> lines,
  RegExp? pattern,
  bool wholeWord, [
  int limit = kMostMatches,
]) {
  if (pattern == null) {
    return SearchResult.none;
  }

  final List<SearchMatch> matches = <SearchMatch>[];

  for (int row = 0; row < lines.length; row += 1) {
    final String? text = lines[row].line?.text;

    if (text == null || text.isEmpty) {
      continue;
    }

    for (final RegExpMatch found in pattern.allMatches(text)) {
      // A match of no width is not a match. `allMatches` moves on by one
      // character of its own accord, so there is nothing to do but skip it.
      if (found.end == found.start) {
        continue;
      }

      if (!wholeWord || _bounded(text, found.start, found.end)) {
        matches.add(SearchMatch(row, found.start, found.end));

        if (matches.length >= limit) {
          return SearchResult(matches, true);
        }
      }
    }
  }

  return SearchResult(matches, false);
}

/// The matches of each line that has any, so a drawn line can ask for its own.
Map<int, List<SearchMatch>> matchRows(List<SearchMatch> matches) {
  final Map<int, List<SearchMatch>> rows = <int, List<SearchMatch>>{};

  for (final SearchMatch match in matches) {
    rows.putIfAbsent(match.row, () => <SearchMatch>[]).add(match);
  }

  return rows;
}

/// Where each line of a document starts, counted in characters.
///
/// `\r\n`, `\n` and a lone `\r` all end a line, exactly as they do where the
/// document is split for the comparison — and the offsets have to be measured
/// against the same reading of it, or a replace in a document written on
/// another platform would cut a line ending in half.
///
/// A document that ends in a newline gets one more entry than it has lines,
/// which is the empty line at the end that a field lets the caret sit on.
List<int> lineStarts(String text) {
  final List<int> starts = <int>[0];

  for (final RegExpMatch found in _breaks.allMatches(text)) {
    starts.add(found.end);
  }

  return starts;
}

/// A range in a document, counted from its first character.
class DocumentRange {
  /// One range.
  const DocumentRange(this.start, this.end);

  /// Where it starts.
  final int start;

  /// Where it ends, exclusive.
  final int end;
}

/// A range in the document rather than in a line, for a pane with a caret in
/// it.
DocumentRange? rangeOf(PaneLayout layout, List<int> starts, SearchMatch match) {
  final int? index = match.row < layout.lines.length ? layout.lines[match.row].line?.index : null;

  if (index == null || index >= starts.length) {
    return null;
  }

  final int base = starts[index];

  return DocumentRange(base + match.start, base + match.end);
}

/// A document with `text` written over every one of `ranges`, in order.
String replacedText(String text, List<DocumentRange> ranges, String replacement) {
  final StringBuffer out = StringBuffer();
  int cursor = 0;

  for (final DocumentRange range in ranges) {
    out
      ..write(text.substring(cursor, range.start))
      ..write(replacement);
    cursor = range.end;
  }

  out.write(text.substring(cursor));

  return out.toString();
}
