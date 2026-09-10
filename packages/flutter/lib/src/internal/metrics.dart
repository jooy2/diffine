/// How tall each row of a pane is, and where it sits.
///
/// Everything that points at a row from outside it — the band a change makes
/// between two panes, the button that jumps to the next change, the search
/// bringing a match onto the screen — needs to know where a row is without
/// looking at it, because most of the time it is not on the screen to look at.
///
/// There are three answers and they are the whole of this file. Every row the
/// same height, which is a pane that is not wrapping: arithmetic. Rows of their
/// own heights, which is a pane that is: the text is laid out again at the
/// pane's width and the taller of the two sides wins, so both panes agree
/// without either measuring the other. And a row with something of the
/// application's own under it, whose height nothing here can know until it has
/// been drawn — so the row reports it and the opposite side is told.
///
/// One of these is shared by both panes of a split view. That is what holds the
/// two level: they are not two measurements kept in step, they are one.
library;

import 'dart:math' as math;
import 'dart:typed_data';

import 'package:diffine/src/internal/rows.dart';
import 'package:flutter/widgets.dart';

/// The heights of one comparison's rows, as both panes read them.
class RowHeights extends ChangeNotifier {
  /// One table.
  RowHeights({
    required this.count,
    required this.lineHeight,
    required this.wrap,
    required this.style,
    required this.direction,
  });

  /// How many rows there are.
  final int count;

  /// How tall one unwrapped line is.
  final double lineHeight;

  /// Whether a line too long for the pane wraps.
  final bool wrap;

  /// What the lines are drawn in, for the measurement.
  final TextStyle style;

  /// Which way the text runs, for the same.
  final TextDirection direction;

  /// The lines of each pane, in the order they are drawn.
  final List<PaneLayout> panes = <PaneLayout>[];

  /// How wide the text of each pane is, once its width is known.
  final List<double> widths = <double>[];

  /// What the application drew under a row, per pane, once it has been drawn.
  final List<Map<int, double>> widgets = <Map<int, double>>[];

  final Map<int, double> _measured = <int, double>{};
  Float64List? _tops;

  /// Whether every row is the same height, which is the common case and the
  /// one the list can be told about in a single number.
  bool get uniform => !wrap && widgets.every((Map<int, double> held) => held.isEmpty);

  /// Tells the table which lines each pane draws, and how wide its text is.
  ///
  /// Returns whether anything it had measured is now out of date.
  bool describe(int pane, PaneLayout layout, double width) {
    while (panes.length <= pane) {
      panes.add(PaneLayout.none);
      widths.add(0);
      widgets.add(<int, double>{});
    }

    final bool moved = !identical(panes[pane], layout) || widths[pane] != width;

    panes[pane] = layout;
    widths[pane] = width;

    if (moved) {
      _measured.clear();
      _tops = null;
    }

    return moved;
  }

  /// A row of a pane reported how tall what the application drew under it is.
  void reportWidget(int pane, int row, double height) {
    if (pane >= widgets.length || widgets[pane][row] == height) {
      return;
    }

    widgets[pane][row] = height;
    _measured.remove(row);
    _tops = null;
    notifyListeners();
  }

  /// How tall a row is, on both panes at once.
  double height(int row) {
    if (row < 0 || row >= count) {
      return lineHeight;
    }

    final double? held = _measured[row];

    if (held != null) {
      return held;
    }

    double tallest = lineHeight;

    for (int pane = 0; pane < panes.length; pane += 1) {
      double own = wrap ? _textHeight(pane, row) : lineHeight;

      own += widgets[pane][row] ?? 0;

      if (own > tallest) {
        tallest = own;
      }
    }

    _measured[row] = tallest;

    return tallest;
  }

  /// Where a row starts, counted from the top of the column.
  double top(int row) {
    final Float64List tops = _tops ??= _buildTops();

    return tops[row.clamp(0, count)];
  }

  /// How tall the whole column is.
  double get total => top(count);

  Float64List _buildTops() {
    final Float64List tops = Float64List(count + 1);

    for (int row = 0; row < count; row += 1) {
      tops[row + 1] = tops[row] + height(row);
    }

    return tops;
  }

  /// Which row is at a point down the column.
  int at(double offset) {
    if (count == 0) {
      return -1;
    }

    final Float64List tops = _tops ??= _buildTops();
    int low = 0;
    int high = count - 1;

    while (low < high) {
      final int middle = (low + high + 1) >> 1;

      if (tops[middle] <= offset) {
        low = middle;
      } else {
        high = middle - 1;
      }
    }

    return math.max(0, low);
  }

  double _textHeight(int pane, int row) {
    final PaneLayout layout = panes[pane];

    if (row >= layout.lines.length) {
      return lineHeight;
    }

    final String? text = layout.lines[row].line?.text;
    final double width = widths[pane];

    if (text == null || text.isEmpty || width <= 0) {
      return lineHeight;
    }

    final TextPainter painter = TextPainter(
      text: TextSpan(text: text, style: style),
      textDirection: direction,
    )..layout(maxWidth: width);
    final double height = painter.height;

    painter.dispose();

    return math.max(lineHeight, height);
  }
}
