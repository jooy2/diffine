/// Two documents, turned into the rows a reader looks at.
///
/// The lines are matched first, which says where the changes are. Then every
/// pair of lines inside a change is compared again, one level down, which says
/// what happened inside them. The result is one flat list of rows in document
/// order, each holding whichever side has a line on it — the shape a
/// side-by-side view can draw straight through, and the shape a unified view
/// gets by reading the same rows and putting one side under the other.
library;

import 'package:diffine/src/internal/diff/format.dart';
import 'package:diffine/src/internal/diff/inline.dart';
import 'package:diffine/src/internal/diff/myers.dart';
import 'package:diffine/src/internal/diff/pair.dart';
import 'package:diffine/src/internal/diff/tokens.dart';
import 'package:diffine/src/types.dart';

/// Every option settled, with nothing left to fall back on.
class TextOptions extends InlineOptions {
  /// Every option, already settled.
  const TextOptions({
    required super.mode,
    required super.whitespace,
    required super.ignoreCase,
    required super.maxCost,
    required this.inlineThreshold,
    required this.ignore,
  });

  /// How alike a pair of lines has to be before its words are marked.
  final double inlineThreshold;

  /// The patterns whose matches do not count.
  ///
  /// On [TextOptions] rather than on [InlineOptions], and that is the whole of
  /// the reason it is here: a pattern written for a line is not a pattern about
  /// one word of it, so the comparison inside a pair of lines never sees these.
  final List<RegExp> ignore;
}

/// What every option falls back to.
const DiffOptions kTextDefaults = DiffOptions();

/// The options as they were given, with the defaults filled in behind them.
TextOptions settleOptions(DiffOptions? options) {
  final DiffOptions given = options ?? kTextDefaults;

  return TextOptions(
    mode: given.inline,
    whitespace: given.whitespace,
    ignoreCase: given.ignoreCase,
    maxCost: given.maxCost,
    inlineThreshold: given.inlineThreshold,
    ignore: given.ignore,
  );
}

/// The rows for one run of lines that went out and one run that came in.
class ChangeRows {
  /// One run's worth of rows.
  const ChangeRows(this.kind, this.rows);

  /// What happened over the run.
  final DiffChangeKind kind;

  /// The rows it is drawn as.
  final List<DiffRow> rows;
}

/// The rows for one run of lines that went out and one run that came in.
///
/// Both the engine and the patch reader arrive at the same question here — a
/// handful of lines were removed and a handful were added, so which of them
/// goes opposite which, and what changed inside each pair. The offsets say
/// where each run starts in its own document, so the lines come back carrying
/// the number they have there rather than the number they have in the run.
ChangeRows changeRows(
  List<String> before,
  List<String> after,
  int beforeOffset,
  int afterOffset,
  TextOptions options,
) {
  final DiffChangeKind kind = before.isEmpty
      ? DiffChangeKind.insert
      : after.isEmpty
      ? DiffChangeKind.delete
      : DiffChangeKind.replace;
  final List<DiffRow> rows = <DiffRow>[];

  // Which line goes opposite which, in the order they were written. See
  // `pair.dart`: taking them straight down the run is right until a run both
  // edits lines and inserts them, and from there every row after the insertion
  // is a pair of lines that have nothing to do with each other.
  for (final LinePair slot in pairLines(before, after)) {
    if (slot.before >= 0 && slot.after >= 0) {
      final DiffInlineResult inside = compareInline(
        before[slot.before],
        after[slot.after],
        options,
      );
      final bool worthMarking = inside.similarity >= options.inlineThreshold;

      rows.add(
        DiffRow(
          kind: DiffRowKind.replace,
          before: DiffLine(
            index: beforeOffset + slot.before,
            text: before[slot.before],
            segments: worthMarking ? inside.before : const <DiffSegment>[],
          ),
          after: DiffLine(
            index: afterOffset + slot.after,
            text: after[slot.after],
            segments: worthMarking ? inside.after : const <DiffSegment>[],
          ),
        ),
      );
    } else if (slot.before >= 0) {
      rows.add(
        DiffRow(
          kind: DiffRowKind.delete,
          before: DiffLine(index: beforeOffset + slot.before, text: before[slot.before]),
        ),
      );
    } else {
      rows.add(
        DiffRow(
          kind: DiffRowKind.insert,
          after: DiffLine(index: afterOffset + slot.after, text: after[slot.after]),
        ),
      );
    }
  }

  return ChangeRows(kind, rows);
}

/// The four counts a result carries, while they are still being added up.
class RunningStats {
  /// Nothing counted yet.
  RunningStats();

  /// Lines that are the same on both sides.
  int unchanged = 0;

  /// Pairs of lines that sit opposite each other and differ.
  int changed = 0;

  /// Lines that are only in `after`.
  int inserted = 0;

  /// Lines that are only in `before`.
  int deleted = 0;

  /// The counts as the value a result holds.
  DiffStats get settled =>
      DiffStats(unchanged: unchanged, changed: changed, inserted: inserted, deleted: deleted);
}

/// Counts a run of changed rows into the totals a result carries.
void countRows(List<DiffRow> rows, RunningStats stats) {
  for (final DiffRow row in rows) {
    switch (row.kind) {
      case DiffRowKind.replace:
        stats.changed += 1;
      case DiffRowKind.delete:
        stats.deleted += 1;
      case DiffRowKind.insert:
        stats.inserted += 1;
      case DiffRowKind.equal:
        stats.unchanged += 1;
    }
  }
}

/// Two documents, compared.
DiffResult compareText(String before, String after, TextOptions options) {
  final List<String> beforeLines = splitLines(before);
  final List<String> afterLines = splitLines(after);
  String key(String line) =>
      comparisonKey(line, options.whitespace, options.ignoreCase, options.ignore);
  final DiffMatchResult found = matchSequences(
    beforeLines.map(key).toList(),
    afterLines.map(key).toList(),
    options.maxCost,
  );

  final List<DiffRow> rows = <DiffRow>[];
  final List<DiffChange> changes = <DiffChange>[];
  final RunningStats stats = RunningStats();

  int beforeCursor = 0;
  int afterCursor = 0;

  /// The rows for everything between the last match and the next one.
  void pushChange(int beforeEnd, int afterEnd) {
    if (beforeEnd == beforeCursor && afterEnd == afterCursor) {
      return;
    }

    final int rowStart = rows.length;
    final ChangeRows built = changeRows(
      beforeLines.sublist(beforeCursor, beforeEnd),
      afterLines.sublist(afterCursor, afterEnd),
      beforeCursor,
      afterCursor,
      options,
    );

    rows.addAll(built.rows);
    countRows(built.rows, stats);

    changes.add(
      DiffChange(
        kind: built.kind,
        beforeStart: beforeCursor,
        beforeEnd: beforeEnd,
        afterStart: afterCursor,
        afterEnd: afterEnd,
        rowStart: rowStart,
        rowEnd: rows.length,
      ),
    );

    beforeCursor = beforeEnd;
    afterCursor = afterEnd;
  }

  for (final DiffMatch match in found.matches) {
    pushChange(match.beforeStart, match.afterStart);

    for (int offset = 0; offset < match.length; offset += 1) {
      rows.add(
        DiffRow(
          kind: DiffRowKind.equal,
          before: DiffLine(
            index: match.beforeStart + offset,
            text: beforeLines[match.beforeStart + offset],
          ),
          after: DiffLine(
            index: match.afterStart + offset,
            text: afterLines[match.afterStart + offset],
          ),
        ),
      );
    }

    stats.unchanged += match.length;
    beforeCursor = match.beforeStart + match.length;
    afterCursor = match.afterStart + match.length;
  }

  pushChange(beforeLines.length, afterLines.length);

  return DiffResult(
    before: beforeLines,
    after: afterLines,
    rows: rows,
    changes: changes,
    stats: stats.settled,
    complete: found.complete,
    format: DiffDocumentFormat(before: formatOf(before), after: formatOf(after)),
  );
}
