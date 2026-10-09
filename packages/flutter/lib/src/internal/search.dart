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

import 'dart:math' as math;

import 'package:diffine/src/internal/rows.dart';
import 'package:diffine/src/types.dart';

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

/// A range inside one line.
class LineSpan {
  /// One range.
  const LineSpan(this.start, this.end);

  /// Where it starts.
  final int start;

  /// Where it ends, exclusive.
  final int end;

  @override
  bool operator ==(Object other) {
    return other is LineSpan && other.start == start && other.end == end;
  }

  @override
  int get hashCode => Object.hash(start, end);
}

/// Where one match sits: which line of the pane, and the range inside it.
class SearchMatch {
  /// One match.
  const SearchMatch(this.row, this.start, this.end, [this.parts]);

  /// Where the line sits in the pane's own list, which is what is scrolled to.
  final int row;

  /// Where the match starts in that line.
  final int start;

  /// Where it ends, exclusive.
  final int end;

  /// The runs the match covers, where it does not cover all of [start] to
  /// [end].
  ///
  /// Only a line drawn from two has these. A match in the text of `after` that
  /// runs across a word that went out is drawn either side of that word and
  /// not over it, because the word is not part of what was found.
  final List<LineSpan>? parts;

  @override
  bool operator ==(Object other) {
    return other is SearchMatch &&
        other.row == row &&
        other.start == start &&
        other.end == end &&
        _sameParts(other.parts, parts);
  }

  @override
  int get hashCode => Object.hash(row, start, end, parts == null ? null : Object.hashAll(parts!));
}

bool _sameParts(List<LineSpan>? a, List<LineSpan>? b) {
  if (a == null || b == null) {
    return a == b;
  }

  if (a.length != b.length) {
    return false;
  }

  for (int index = 0; index < a.length; index += 1) {
    if (a[index] != b[index]) {
      return false;
    }
  }

  return true;
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

/// Every match in one run of text, up to [most] of them.
///
/// A match of no width is skipped rather than collected. `a*` matches the empty
/// string between every pair of characters, and a search bar that answers "four
/// hundred matches" to a pattern that found nothing is worse than one that
/// answers none.
///
/// The limit is checked inside the line rather than after it, because a single
/// line can be the whole of a minified file, and one letter typed into the box
/// is a match every few characters of it.
List<LineSpan> _spansIn(String text, RegExp pattern, bool wholeWord, int most) {
  if (text.isEmpty || most <= 0) {
    return const <LineSpan>[];
  }

  final List<LineSpan> spans = <LineSpan>[];

  for (final RegExpMatch found in pattern.allMatches(text)) {
    // A match of no width is not a match. `allMatches` moves on by one
    // character of its own accord, so there is nothing to do but skip it.
    if (found.end == found.start) {
      continue;
    }

    if (!wholeWord || _bounded(text, found.start, found.end)) {
      spans.add(LineSpan(found.start, found.end));

      if (spans.length >= most) {
        break;
      }
    }
  }

  return spans;
}

/// A range of one of the two lines, as the runs of the drawn line it lands on.
///
/// A run whose text is drawn from the other side — an equal run, when
/// whitespace or case was ignored and the two spellings differ in length — is
/// landed on by the same distance into it, held inside it.
List<LineSpan> _partsOf(MergedLine merged, DiffineSide side, LineSpan span) {
  final List<LineSpan> parts = <LineSpan>[];
  final DiffEditKind other = side == DiffineSide.before ? DiffEditKind.insert : DiffEditKind.delete;

  for (final MergedRun run in merged.runs) {
    if (run.edit.kind == other) {
      continue;
    }

    final int from = side == DiffineSide.before ? run.edit.beforeStart : run.edit.afterStart;
    final int to = side == DiffineSide.before ? run.edit.beforeEnd : run.edit.afterEnd;

    if (to <= span.start || from >= span.end) {
      continue;
    }

    final int width = run.end - run.start;
    final int start = run.start + math.min(width, math.max(0, span.start - from));
    final int end = run.start + math.min(width, math.min(to, span.end) - from);

    if (end <= start) {
      continue;
    }

    if (parts.isNotEmpty && parts.last.end == start) {
      parts.last = LineSpan(parts.last.start, end);
    } else {
      parts.add(LineSpan(start, end));
    }
  }

  return parts;
}

/// Every match in a line drawn from two, as ranges of what is drawn.
///
/// The two lines are searched one at a time, so what is found is text one of
/// the documents actually holds. Searching the drawn line instead would find
/// text that is in neither — the end of a word that went out run into the
/// start of the one that came in — and miss a word of `after` with a deletion
/// in the middle of it.
///
/// What the two lines share is found in both, and counted once.
List<SearchMatch> _mergedMatches(
  int row,
  MergedLine merged,
  RegExp pattern,
  bool wholeWord,
  int most,
) {
  final List<SearchMatch> found = <SearchMatch>[];
  final Set<String> seen = <String>{};

  for (final DiffineSide side in const <DiffineSide>[DiffineSide.after, DiffineSide.before]) {
    final String text = side == DiffineSide.after ? merged.after.text : merged.before.text;

    for (final LineSpan span in _spansIn(text, pattern, wholeWord, most)) {
      final List<LineSpan> parts = _partsOf(merged, side, span);
      final String key = parts.map((LineSpan part) => '${part.start}:${part.end}').join(' ');

      if (parts.isEmpty || !seen.add(key)) {
        continue;
      }

      found.add(
        SearchMatch(row, parts.first.start, parts.last.end, parts.length > 1 ? parts : null),
      );
    }
  }

  found.sort((SearchMatch a, SearchMatch b) {
    final int byStart = a.start.compareTo(b.start);

    return byStart != 0 ? byStart : a.end.compareTo(b.end);
  });

  return found;
}

/// Every match in a pane's lines, in the order the pane draws them.
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
    final MergedLine? merged = lines[row].merged;
    final int most = limit - matches.length;
    final List<SearchMatch> found = merged != null
        ? _mergedMatches(row, merged, pattern, wholeWord, most)
        : <SearchMatch>[
            for (final LineSpan span in _spansIn(
              lines[row].line?.text ?? '',
              pattern,
              wholeWord,
              most,
            ))
              SearchMatch(row, span.start, span.end),
          ];

    for (final SearchMatch match in found) {
      matches.add(match);

      if (matches.length >= limit) {
        return SearchResult(matches, true);
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
