/// The comparison, on its own.
///
/// Nothing here touches a widget, which is the point of it being its own
/// library: these are the functions for an application that wants the answer
/// rather than the picture — a summary line, a count in a badge, a patch
/// written out somewhere else. The viewer is one consumer of what they return.
library;

import 'package:diffine/src/internal/diff/inline.dart';
import 'package:diffine/src/internal/diff/myers.dart';
import 'package:diffine/src/internal/diff/text.dart';
import 'package:diffine/src/internal/diff/tokens.dart';
import 'package:diffine/src/types.dart';

/// What every option falls back to.
const DiffOptions kDiffineDefaults = kTextDefaults;

/// Compares two documents and returns everything worked out about them: the
/// lines each was split into, the rows a viewer draws, the changes in order,
/// and the counts.
///
/// ```dart
/// final DiffResult result = diffText(before, after);
///
/// debugPrint('${result.changes.length} changes, ${result.stats.inserted} added');
/// ```
DiffResult diffText(String before, String after, [DiffOptions? options]) {
  return compareText(before, after, settleOptions(options));
}

/// Compares two lines a word at a time — runs of letters and digits, runs of
/// whitespace, and every other character on its own.
///
/// This is the comparison [diffText] runs inside a pair of changed lines,
/// reachable on its own for a heading, a title, a cell of a table.
DiffInlineResult diffWords(String before, String after, [DiffOptions? options]) {
  final TextOptions settled = settleOptions(options);

  return compareInline(
    before,
    after,
    InlineOptions(
      mode: DiffInlineMode.word,
      whitespace: settled.whitespace,
      ignoreCase: settled.ignoreCase,
      maxCost: settled.maxCost,
    ),
  );
}

/// Compares two lines a grapheme at a time.
DiffInlineResult diffCharacters(String before, String after, [DiffOptions? options]) {
  final TextOptions settled = settleOptions(options);

  return compareInline(
    before,
    after,
    InlineOptions(
      mode: DiffInlineMode.character,
      whitespace: settled.whitespace,
      ignoreCase: settled.ignoreCase,
      maxCost: settled.maxCost,
    ),
  );
}

/// Compares two sequences of tokens and returns the edits between them.
///
/// The engine underneath everything else, for an application whose tokens are
/// not lines and not words: cells of a row, names in a list, the steps of a
/// recipe. Both sides are compared as strings, so whatever the tokens are, they
/// arrive here as the text that identifies them.
///
/// ```dart
/// diffSequence(<String>['a', 'b', 'c'], <String>['a', 'c']);
/// // equal  0..1 / 0..1
/// // delete 1..2 / 1..1
/// // equal  2..3 / 1..2
/// ```
List<DiffEdit> diffSequence(List<String> before, List<String> after, [DiffOptions? options]) {
  final TextOptions settled = settleOptions(options);
  String key(String token) =>
      comparisonKey(token, settled.whitespace, settled.ignoreCase, settled.ignore);
  final DiffMatchResult found = matchSequences(
    before.map(key).toList(),
    after.map(key).toList(),
    settled.maxCost,
  );

  final List<DiffEdit> edits = <DiffEdit>[];
  int beforeCursor = 0;
  int afterCursor = 0;

  void push(DiffEditKind kind, int beforeEnd, int afterEnd) {
    if (beforeEnd == beforeCursor && afterEnd == afterCursor) {
      return;
    }

    edits.add(
      DiffEdit(
        kind: kind,
        beforeStart: beforeCursor,
        beforeEnd: beforeEnd,
        afterStart: afterCursor,
        afterEnd: afterEnd,
      ),
    );

    beforeCursor = beforeEnd;
    afterCursor = afterEnd;
  }

  for (final DiffMatch match in found.matches) {
    push(DiffEditKind.delete, match.beforeStart, afterCursor);
    push(DiffEditKind.insert, beforeCursor, match.afterStart);
    push(DiffEditKind.equal, match.beforeStart + match.length, match.afterStart + match.length);
  }

  push(DiffEditKind.delete, before.length, afterCursor);
  push(DiffEditKind.insert, beforeCursor, after.length);

  return edits;
}
