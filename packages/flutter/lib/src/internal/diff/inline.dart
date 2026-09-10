/// The comparison inside one pair of lines.
///
/// A row that says "this line changed" is half an answer. What a reader is
/// looking for is the word that changed, and finding it is the same search run
/// over a smaller alphabet: words instead of lines, or graphemes instead of
/// words.
///
/// The result has a side each rather than one list between them, and that is
/// not a convenience. With [DiffOptions.ignoreCase] on, or whitespace being
/// ignored, a run the engine calls equal is two different strings — `Title` on
/// one side and `title` on the other. One list would have to pick one of them
/// to hold, and whichever it picked would be text that was never in the other
/// document. Two lists each hold their own side, so joining a side back
/// together gives the line that was passed in.
library;

import 'package:diffine/src/internal/diff/myers.dart';
import 'package:diffine/src/internal/diff/tokens.dart';
import 'package:diffine/src/types.dart';

/// How the inside of a pair of lines is compared.
class InlineOptions {
  /// Every option, already settled.
  const InlineOptions({
    required this.mode,
    required this.whitespace,
    required this.ignoreCase,
    required this.maxCost,
  });

  /// What the tokens are.
  final DiffInlineMode mode;

  /// How much of the whitespace counts.
  final DiffWhitespace whitespace;

  /// Whether `Title` and `title` are the same token.
  final bool ignoreCase;

  /// The largest difference the engine will work through.
  final int maxCost;
}

const DiffInlineResult _nothingInCommon = DiffInlineResult(
  before: <DiffSegment>[],
  after: <DiffSegment>[],
  similarity: 0,
);

/// Appends text to a side, joining it to the piece before it where it can.
void _append(List<_Piece> segments, DiffEditKind kind, String text) {
  if (text.isEmpty) {
    return;
  }

  final _Piece? previous = segments.isEmpty ? null : segments.last;

  if (previous != null && previous.kind == kind) {
    previous.text.write(text);

    return;
  }

  segments.add(_Piece(kind, text));
}

/// A run being built up, which is a [DiffSegment] once it has stopped growing.
class _Piece {
  _Piece(this.kind, String text) : text = StringBuffer(text);

  final DiffEditKind kind;
  final StringBuffer text;

  DiffSegment get settled => DiffSegment(kind, text.toString());
}

/// Compares two lines with the tokens [InlineOptions.mode] asks for.
DiffInlineResult compareInline(String before, String after, InlineOptions options) {
  if (options.mode == DiffInlineMode.none) {
    return _nothingInCommon;
  }

  if (before == after) {
    return DiffInlineResult(
      before: before.isEmpty
          ? const <DiffSegment>[]
          : <DiffSegment>[DiffSegment(DiffEditKind.equal, before)],
      after: after.isEmpty
          ? const <DiffSegment>[]
          : <DiffSegment>[DiffSegment(DiffEditKind.equal, after)],
      similarity: 1,
    );
  }

  final List<String> Function(String) split = options.mode == DiffInlineMode.word
      ? splitWords
      : splitGraphemes;
  final List<String> beforeTokens = split(before);
  final List<String> afterTokens = split(after);
  String key(String token) => comparisonKey(token, options.whitespace, options.ignoreCase);
  final DiffMatchResult found = matchSequences(
    beforeTokens.map(key).toList(),
    afterTokens.map(key).toList(),
    options.maxCost,
  );

  final List<_Piece> beforeSegments = <_Piece>[];
  final List<_Piece> afterSegments = <_Piece>[];
  int beforeCursor = 0;
  int afterCursor = 0;
  int paired = 0;

  for (final DiffMatch match in found.matches) {
    _append(
      beforeSegments,
      DiffEditKind.delete,
      beforeTokens.sublist(beforeCursor, match.beforeStart).join(),
    );
    _append(
      afterSegments,
      DiffEditKind.insert,
      afterTokens.sublist(afterCursor, match.afterStart).join(),
    );

    final String beforeText = beforeTokens
        .sublist(match.beforeStart, match.beforeStart + match.length)
        .join();
    final String afterText = afterTokens
        .sublist(match.afterStart, match.afterStart + match.length)
        .join();

    _append(beforeSegments, DiffEditKind.equal, beforeText);
    _append(afterSegments, DiffEditKind.equal, afterText);
    paired += beforeText.length + afterText.length;

    beforeCursor = match.beforeStart + match.length;
    afterCursor = match.afterStart + match.length;
  }

  _append(beforeSegments, DiffEditKind.delete, beforeTokens.sublist(beforeCursor).join());
  _append(afterSegments, DiffEditKind.insert, afterTokens.sublist(afterCursor).join());

  final int total = before.length + after.length;

  return DiffInlineResult(
    before: beforeSegments.map((_Piece piece) => piece.settled).toList(),
    after: afterSegments.map((_Piece piece) => piece.settled).toList(),
    similarity: total == 0 ? 1 : paired / total,
  );
}
