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

import 'dart:typed_data';

import 'package:diffine/src/internal/fold.dart';
import 'package:diffine/src/types.dart';

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

    if (line != null && (widest == null || line.text.length > (widest.line?.text.length ?? 0))) {
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
/// [PaneLayout.positions] is filled in for the sake of the type it shares with
/// a split pane. Nothing in a unified view points at a row from outside it:
/// there is one pane, so there is nothing to hold level and nothing to draw a
/// band between.
PaneLayout unifiedLayout(
  List<DiffRow> rows,
  List<DiffChange> changes,
  Int32List owner,
  FoldPlan? plan,
) {
  final List<PaneLine> lines = <PaneLine>[];
  final Int32List positions = Int32List(rows.length);
  PaneLine? widest;
  int cursor = 0;

  positions.fillRange(0, rows.length, -1);

  void push(DiffRowKind kind, DiffineSide side, DiffLine line, List<int?> numbers, int row) {
    final PaneLine drawn = PaneLine(
      kind: kind,
      side: side,
      line: line,
      numbers: numbers,
      change: owner[row],
    );

    if (positions[row] < 0) {
      positions[row] = lines.length;
    }

    lines.add(drawn);

    if (line.text.length > (widest?.line?.text.length ?? 0)) {
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
        push(DiffRowKind.equal, DiffineSide.before, before, <int?>[
          before.index + 1,
          after.index + 1,
        ], cursor);
      }
    }
  }

  for (final DiffChange change in changes) {
    pushUnchanged(change.rowStart);
    band(change.rowStart);

    for (int row = change.rowStart; row < change.rowEnd; row += 1) {
      final DiffLine? line = rows[row].before;

      if (line != null) {
        push(DiffRowKind.delete, DiffineSide.before, line, <int?>[line.index + 1, null], row);
      }
    }

    for (int row = change.rowStart; row < change.rowEnd; row += 1) {
      final DiffLine? line = rows[row].after;

      if (line != null) {
        push(DiffRowKind.insert, DiffineSide.after, line, <int?>[null, line.index + 1], row);
      }
    }

    cursor = change.rowEnd;
  }

  pushUnchanged(rows.length);
  band(rows.length);

  return PaneLayout(lines, positions, widest);
}
