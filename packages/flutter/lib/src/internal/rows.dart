/// The comparison's rows, turned into what one pane actually draws.
///
/// A row belongs to both documents at once, and a pane draws one of them. That
/// is one step of translation on its own — but it is also where two other
/// things are settled, and both of them are needed before a single line is on
/// the screen.
///
/// Which line sits where. With the two sides held level, a pane draws every row
/// and a line's position is its row's number. Without, a pane draws only the
/// rows it has a line for, and the two numbers part company. Anything that has
/// to point at a row from outside the pane — the band a change makes between
/// the panes, the button that moves to the next one — needs the second number,
/// so it is worked out once here rather than counted again by each of them.
///
/// And how wide the pane's content is. The widest line of the whole document is
/// kept for that, so a pane that only draws what is on the screen still scrolls
/// as far sideways as the document goes.
library;

import 'dart:math' as math;
import 'dart:typed_data';

import 'package:diffine/src/internal/fold.dart';
import 'package:diffine/src/types.dart';

/// One run of a line drawn from two, and where it sits in all three.
class MergedRun {
  /// One run.
  const MergedRun({required this.edit, required this.start, required this.end});

  /// Where it sits in the two lines, and what happened to it.
  final DiffEdit edit;

  /// Where it starts in the line as it is drawn.
  final int start;

  /// Where it ends there, exclusive.
  final int end;
}

/// A pair of lines drawn as one.
///
/// The drawn line is neither of the two: it is the text they share, with what
/// went out and what came in next to each other where they differ. So it is
/// kept apart from [PaneLine.line], which stays the line of `after` that this
/// stands for — the one a reader copies, and the one handed to anything of the
/// application's own.
class MergedLine {
  /// One pair.
  const MergedLine({
    required this.drawn,
    required this.before,
    required this.after,
    required this.runs,
  });

  /// The line as it is drawn, cut into its equal, deleted and inserted runs.
  final DiffLine drawn;

  /// The line from `before`.
  final DiffLine before;

  /// The line from `after`.
  final DiffLine after;

  /// Where each run of the drawn line came from, in order.
  final List<MergedRun> runs;

  /// Where a point of the drawn line falls in the line of `after`.
  ///
  /// A point inside a run that went out falls where that run was, which is
  /// where the text after it starts.
  int afterOffset(int offset) {
    for (final MergedRun run in runs) {
      if (offset < run.end) {
        return run.edit.kind == DiffEditKind.delete
            ? run.edit.afterStart
            : run.edit.afterStart + math.max(0, offset - run.start);
      }
    }

    return after.text.length;
  }
}

/// One line as a pane draws it.
class PaneLine {
  /// One drawn line, or a band standing in for a run of them.
  const PaneLine({
    required this.kind,
    required this.side,
    required this.line,
    required this.numbers,
    required this.change,
    this.fold,
    this.merged,
  });

  /// What happened to the row this came from.
  final DiffRowKind kind;

  /// Which document the line is from, which decides its colour and its marker.
  final DiffineSide side;

  /// The line, or `null` for the blank opposite a line with no counterpart.
  final DiffLine? line;

  /// The numbers down the side: one for a split view, two for a unified one.
  final List<int?> numbers;

  /// Which change this belongs to, or -1 for a line that did not change.
  final int change;

  /// The run of rows this stands in for, for a band rather than a line.
  ///
  /// A band takes a line's place in the list and a line's height on the screen,
  /// so everything that counts lines or measures one of them carries on working
  /// without knowing this is here.
  final FoldRun? fold;

  /// The pair this line draws as one, for a line of [DiffineView.merged].
  final MergedLine? merged;

  /// The text as it is drawn, which is what sets how wide and how tall the
  /// line is.
  String? get drawnText => merged?.drawn.text ?? line?.text;
}

/// Everything a pane needs to draw, and to be pointed at from outside.
class PaneLayout {
  /// One pane's worth of lines.
  const PaneLayout(this.lines, this.positions, this.widest);

  /// Nothing at all, for a layout the drawn view has no use for.
  static final PaneLayout none = PaneLayout(const <PaneLine>[], Int32List(0), null);

  /// The lines, in the order the pane draws them.
  final List<PaneLine> lines;

  /// Where a comparison row sits in [lines], or -1 for a row this pane skips.
  final Int32List positions;

  /// The longest line in the document, which is what sets the width to scroll.
  final PaneLine? widest;
}

/// How many characters a line takes up on the screen.
int _drawnLength(PaneLine? drawn) {
  return drawn?.drawnText?.length ?? 0;
}

/// The pair of lines in a row drawn as one, or `null` where it cannot be.
///
/// Only a row the engine laid the two lines against each other for can be, and
/// only when what it laid out covers both lines in order. A row comes from
/// outside as often as from the engine — a `result` worked out somewhere else,
/// one read back from storage — and runs that point past the end of a line
/// would draw text that is in neither document. A row like that is drawn as two
/// lines instead, which is always true.
MergedLine? mergeRow(DiffRow row) {
  final DiffLine? before = row.before;
  final DiffLine? after = row.after;
  final List<DiffEdit>? edits = row.edits;

  if (row.kind != DiffRowKind.replace ||
      before == null ||
      after == null ||
      edits == null ||
      edits.isEmpty) {
    return null;
  }

  final List<MergedRun> runs = <MergedRun>[];
  final List<DiffSegment> segments = <DiffSegment>[];
  final StringBuffer text = StringBuffer();
  int beforeAt = 0;
  int afterAt = 0;
  int cursor = 0;

  for (final DiffEdit edit in edits) {
    final int beforeLength = edit.beforeEnd - edit.beforeStart;
    final int afterLength = edit.afterEnd - edit.afterStart;
    final bool fits =
        edit.beforeStart == beforeAt &&
        edit.afterStart == afterAt &&
        beforeLength >= 0 &&
        afterLength >= 0 &&
        edit.beforeEnd <= before.text.length &&
        edit.afterEnd <= after.text.length &&
        switch (edit.kind) {
          DiffEditKind.equal => true,
          DiffEditKind.delete => afterLength == 0,
          DiffEditKind.insert => beforeLength == 0,
        };

    if (!fits) {
      return null;
    }

    final String piece = edit.kind == DiffEditKind.delete
        ? before.text.substring(edit.beforeStart, edit.beforeEnd)
        : after.text.substring(edit.afterStart, edit.afterEnd);

    runs.add(MergedRun(edit: edit, start: cursor, end: cursor + piece.length));
    segments.add(DiffSegment(edit.kind, piece));
    text.write(piece);
    beforeAt = edit.beforeEnd;
    afterAt = edit.afterEnd;
    cursor += piece.length;
  }

  if (beforeAt != before.text.length || afterAt != after.text.length) {
    return null;
  }

  return MergedLine(
    drawn: DiffLine(index: after.index, text: text.toString(), segments: segments),
    before: before,
    after: after,
    runs: runs,
  );
}

/// Which change each row belongs to, or -1 where a row did not change.
Int32List changeOfRow(int rowCount, List<DiffChange> changes) {
  final Int32List owner = Int32List(rowCount);

  owner.fillRange(0, rowCount, -1);

  for (int index = 0; index < changes.length; index += 1) {
    final DiffChange change = changes[index];

    owner.fillRange(change.rowStart, change.rowEnd, index);
  }

  return owner;
}

/// One side of a split view.
PaneLayout splitLayout(
  List<DiffRow> rows,
  Int32List owner,
  DiffineSide side,
  bool blanks,
  FoldPlan? plan,
) {
  final List<PaneLine> lines = <PaneLine>[];
  final Int32List positions = Int32List(rows.length);
  PaneLine? widest;

  positions.fillRange(0, rows.length, -1);

  /// The band that stands in front of a row, where the plan puts one there.
  void band(int row) {
    final FoldRun? fold = plan?.bands[row];

    if (fold != null) {
      lines.add(
        PaneLine(
          kind: DiffRowKind.equal,
          side: side,
          line: null,
          numbers: const <int?>[],
          change: -1,
          fold: fold,
        ),
      );
    }
  }

  for (int row = 0; row < rows.length; row += 1) {
    band(row);

    if (plan != null && plan.hidden[row] == 1) {
      continue;
    }

    final DiffLine? line = rows[row].side(side);

    if (line == null && !blanks) {
      continue;
    }

    final PaneLine drawn = PaneLine(
      kind: rows[row].kind,
      side: side,
      line: line,
      numbers: <int?>[line == null ? null : line.index + 1],
      change: owner[row],
    );

    positions[row] = lines.length;
    lines.add(drawn);

    if (line != null && (widest == null || line.text.length > _drawnLength(widest))) {
      widest = drawn;
    }
  }

  band(rows.length);

  return PaneLayout(lines, positions, widest);
}

/// One side of a split view, with the line the caret can reach at the end of
/// it.
///
/// A comparison has no line after the last newline, and it is right not to: two
/// documents that both end in one have nothing there to compare. A field does —
/// put the caret at the end of `one\ntwo\n` and it sits on a third line, and an
/// empty document is one empty line rather than none.
///
/// So the editor draws that line even though the comparison never mentions it.
/// Without it the field would be exactly one line taller than the lines drawn
/// behind it, which is the one thing that cannot differ: the text a reader
/// types and the tint under it would come apart at the bottom of the document.
///
/// It is appended, so nothing that points into [PaneLayout.positions] moves.
PaneLayout fieldLayout(List<DiffRow> rows, Int32List owner, DiffineSide side, String text) {
  final PaneLayout layout = splitLayout(rows, owner, side, false, null);
  final int last = text.isEmpty ? 0 : text.codeUnitAt(text.length - 1);

  if (text.isNotEmpty && last != 10 && last != 13) {
    return layout;
  }

  layout.lines.add(
    PaneLine(
      kind: DiffRowKind.equal,
      side: side,
      line: DiffLine(index: layout.lines.length, text: ''),
      numbers: <int?>[layout.lines.length + 1],
      change: -1,
    ),
  );

  return layout;
}

/// The two documents in one column, with what went out above what came in.
///
/// A change that edited three lines into two is drawn as three lines going out
/// and then two coming in, rather than as pairs — which is the shape a patch
/// has, and the shape a reader of one expects. The words picked out inside
/// those lines are the same ones a split view marks, because they were worked
/// out before either view got hold of them.
///
/// With [merge], a pair of lines that were edited rather than replaced is drawn
/// once instead: the text both share, with what went out and what came in next
/// to each other inside it. The lines either side of such a pair are drawn the
/// unified way, a run of them at a time, so a change with nothing worth merging
/// in it — compared as whole lines, or too far apart to mark — comes out
/// exactly as it does without [merge].
///
/// [PaneLayout.positions] is filled in for the sake of the type it shares with
/// a split pane. Nothing in a one-column view points at a row from outside it:
/// there is one pane, so there is nothing to hold level and nothing to draw a
/// band between.
PaneLayout unifiedLayout(
  List<DiffRow> rows,
  List<DiffChange> changes,
  Int32List owner,
  FoldPlan? plan, {
  bool merge = false,
}) {
  final List<PaneLine> lines = <PaneLine>[];
  final Int32List positions = Int32List(rows.length);
  PaneLine? widest;
  int cursor = 0;

  positions.fillRange(0, rows.length, -1);

  void push(PaneLine drawn, int row) {
    if (positions[row] < 0) {
      positions[row] = lines.length;
    }

    lines.add(drawn);

    if (_drawnLength(drawn) > _drawnLength(widest)) {
      widest = drawn;
    }
  }

  /// The band that stands in front of a row, where the plan puts one there.
  void band(int row) {
    final FoldRun? fold = plan?.bands[row];

    if (fold != null) {
      lines.add(
        PaneLine(
          kind: DiffRowKind.equal,
          side: DiffineSide.before,
          line: null,
          numbers: const <int?>[],
          change: -1,
          fold: fold,
        ),
      );
    }
  }

  void pushUnchanged(int until) {
    for (; cursor < until; cursor += 1) {
      band(cursor);

      if (plan != null && plan.hidden[cursor] == 1) {
        continue;
      }

      final DiffRow row = rows[cursor];
      final DiffLine? before = row.before;
      final DiffLine? after = row.after;

      if (before != null && after != null) {
        push(
          PaneLine(
            kind: DiffRowKind.equal,
            side: DiffineSide.before,
            line: before,
            numbers: <int?>[before.index + 1, after.index + 1],
            change: owner[cursor],
          ),
          cursor,
        );
      }
    }
  }

  /// A run of changed rows the unified way: every line out, then every line in.
  void pushApart(int from, int to) {
    for (int row = from; row < to; row += 1) {
      final DiffLine? line = rows[row].before;

      if (line != null) {
        push(
          PaneLine(
            kind: DiffRowKind.delete,
            side: DiffineSide.before,
            line: line,
            numbers: <int?>[line.index + 1, null],
            change: owner[row],
          ),
          row,
        );
      }
    }

    for (int row = from; row < to; row += 1) {
      final DiffLine? line = rows[row].after;

      if (line != null) {
        push(
          PaneLine(
            kind: DiffRowKind.insert,
            side: DiffineSide.after,
            line: line,
            numbers: <int?>[null, line.index + 1],
            change: owner[row],
          ),
          row,
        );
      }
    }
  }

  for (final DiffChange change in changes) {
    pushUnchanged(change.rowStart);
    band(change.rowStart);

    // Where the run of rows not drawn yet starts. A pair drawn as one line ends
    // that run, so the lines around it stay on the side of it they belong to.
    int pending = change.rowStart;

    for (int row = change.rowStart; merge && row < change.rowEnd; row += 1) {
      final MergedLine? merged = mergeRow(rows[row]);

      if (merged == null) {
        continue;
      }

      pushApart(pending, row);
      push(
        PaneLine(
          kind: DiffRowKind.replace,
          side: DiffineSide.after,
          line: merged.after,
          numbers: <int?>[merged.before.index + 1, merged.after.index + 1],
          change: owner[row],
          merged: merged,
        ),
        row,
      );
      pending = row + 1;
    }

    pushApart(pending, change.rowEnd);
    cursor = change.rowEnd;
  }

  pushUnchanged(rows.length);
  band(rows.length);

  return PaneLayout(lines, positions, widest);
}
