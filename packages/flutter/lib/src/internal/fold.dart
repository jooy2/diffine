/// The runs of the comparison a pane stands a band in for instead of drawing.
///
/// There are two of them and they look the same on the screen, which is why
/// they are one thing here. A run of unchanged lines far from any change is a
/// run nobody reading a comparison is reading: `collapse` folds it away and
/// leaves a band a reader can open. A run that is missing altogether — the
/// lines between one hunk of a patch and the next — cannot be opened, because
/// nobody sent them, and it still has to be said rather than drawn over.
///
/// The plan is worked out from the rows, so both panes of a split view fold the
/// same rows and stay level with each other. It is not worked out from what is
/// on the screen, so a folded run costs nothing to scroll past.
library;

import 'dart:math' as math;
import 'dart:typed_data';

import 'package:diffine/src/internal/diff/gap.dart';
import 'package:diffine/src/types.dart';

/// A run of rows a pane does not draw, and what it stands in for.
class FoldRun {
  /// One run.
  const FoldRun({
    required this.start,
    required this.end,
    required this.lines,
    required this.expandable,
  });

  /// The first row it covers. Empty for a run that is missing.
  final int start;

  /// One past the last row it covers.
  final int end;

  /// How many lines of the document it stands in for.
  final int lines;

  /// Whether those lines are in hand, so a reader can open the band.
  final bool expandable;
}

/// Which rows are folded, in the shape a layout reads them in.
class FoldPlan {
  /// One plan.
  const FoldPlan(this.bands, this.hidden);

  /// The band drawn in front of each row, where there is one.
  ///
  /// One longer than the rows, because a run can end the document and its band
  /// still has to be drawn after the last line that is.
  final List<FoldRun?> bands;

  /// Whether each row is inside a run, and so is not drawn at all.
  final Uint8List hidden;
}

/// How a comparison is folded.
class FoldOptions {
  /// Every option.
  const FoldOptions({required this.collapse, required this.context, required this.opened});

  /// Whether runs of unchanged lines far from a change are folded away.
  final bool collapse;

  /// How many unchanged lines are kept either side of a change.
  final int context;

  /// The runs a reader has opened, by the row each one starts at.
  final Set<int> opened;
}

/// Every run the panes fold, in row order and never overlapping.
///
/// A missing run is found whatever `collapse` says, because it is not a choice
/// about how much to show: the lines are not there, and a view that drew line 7
/// above line 40 would be saying they were next to each other.
List<FoldRun> _foldRuns(List<DiffRow> rows, FoldOptions options) {
  final int kept = math.max(0, options.context);
  final List<FoldRun> runs = <FoldRun>[];
  int index = 0;

  while (index < rows.length) {
    // What is missing in front of this row, which is a band of its own.
    final int missing = index > 0 ? gapBetween(rows[index - 1], rows[index]) : 0;

    if (missing > 0) {
      runs.add(FoldRun(start: index, end: index, lines: missing, expandable: false));
    }

    if (rows[index].kind != DiffRowKind.equal) {
      index += 1;
      continue;
    }

    // The run of unchanged rows this one begins, up to the next change or the
    // next thing that is missing.
    int end = index + 1;

    while (end < rows.length &&
        rows[end].kind == DiffRowKind.equal &&
        follows(rows[end - 1], rows[end])) {
      end += 1;
    }

    // What is kept is what surrounds a change. A run that reaches the top or
    // the bottom of the comparison has nothing on that side to surround.
    final int keepStart = index > 0 && rows[index - 1].kind != DiffRowKind.equal ? kept : 0;
    final int keepEnd = end < rows.length && rows[end].kind != DiffRowKind.equal ? kept : 0;
    final int from = index + keepStart;
    final int to = end - keepEnd;

    // A band where something is missing already stands at this row. Two of them
    // in a row would say the same thing twice, so the lines that are in hand
    // are drawn instead.
    final bool taken = missing > 0 && from == index;

    if (options.collapse && to > from && !taken && !options.opened.contains(from)) {
      runs.add(FoldRun(start: from, end: to, lines: to - from, expandable: true));
    }

    index = end;
  }

  return runs;
}

/// The rows a pane draws and the bands that stand in for the rest, or `null`
/// where nothing is folded at all.
///
/// `null` rather than a plan that folds nothing, so that the common case — a
/// comparison of two whole documents, drawn whole — allocates nothing and every
/// layout takes the path it took before any of this existed.
FoldPlan? foldPlan(List<DiffRow> rows, FoldOptions options) {
  final List<FoldRun> runs = _foldRuns(rows, options);

  if (runs.isEmpty) {
    return null;
  }

  final List<FoldRun?> bands = List<FoldRun?>.filled(rows.length + 1, null);
  final Uint8List hidden = Uint8List(rows.length);

  for (final FoldRun run in runs) {
    bands[run.start] = run;

    for (int row = run.start; row < run.end; row += 1) {
      hidden[row] = 1;
    }
  }

  return FoldPlan(bands, hidden);
}
