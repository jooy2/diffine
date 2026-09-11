/// One scrolling column of lines that a reader reads — a side of a split view,
/// or the single column of a unified one.
///
/// The pane is what the keyboard lands on, so it is a named region with a focus
/// of its own: a comparison is a document to read through, and a box a keyboard
/// cannot reach is a document a keyboard cannot read. Where the same column can
/// be typed into instead, `TextDiffField` draws it.
library;

import 'dart:math' as math;

import 'package:diffine/src/components/shared/diffine_fold.dart';
import 'package:diffine/src/components/shared/diffine_line.dart';
import 'package:diffine/src/internal/fold.dart';
import 'package:diffine/src/internal/metrics.dart';
import 'package:diffine/src/internal/rows.dart';
import 'package:diffine/src/internal/search.dart';
import 'package:diffine/src/theme/tokens.dart';
import 'package:diffine/src/types.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/widgets.dart';

/// How wide one character of the monospaced typeface is.
///
/// Measured rather than guessed, because it is what the width of a pane's
/// content is worked out from — and it is measured once per style rather than
/// once per line.
double characterWidthOf(TextStyle style, TextDirection direction) {
  final TextPainter painter = TextPainter(
    text: TextSpan(text: 'M' * 32, style: style),
    textDirection: direction,
  )..layout();
  final double width = painter.width / 32;

  painter.dispose();

  return width;
}

/// How wide the columns down the side of a pane come to.
double gutterWidthOf({
  required double characterWidth,
  required int digits,
  required int columns,
  required bool lineNumbers,
  required bool markers,
}) {
  if (!lineNumbers && !markers) {
    return 0;
  }

  return (lineNumbers ? numberColumnWidth(characterWidth, digits) * columns : 0) +
      (markers ? kMarkerWidth : 0);
}

/// How wide a pane's content is, which is what there is to scroll across.
double contentWidthOf({
  required double paneWidth,
  required double gutter,
  required double characterWidth,
  required int longest,
  required bool wrap,
}) {
  if (wrap) {
    return paneWidth;
  }

  return math.max(paneWidth, gutter + longest * characterWidth + kTextGap * 2 + 4);
}

/// One column of drawn lines.
class TextDiffPane extends StatelessWidget {
  /// One pane.
  const TextDiffPane({
    required this.theme,
    required this.name,
    required this.layout,
    required this.heights,
    required this.pane,
    required this.controller,
    required this.horizontal,
    required this.strings,
    required this.characterWidth,
    required this.digits,
    required this.lineNumbers,
    required this.markers,
    required this.wrap,
    required this.current,
    required this.contentWidth,
    required this.gutterWidth,
    super.key,
    this.highlight,
    this.matches,
    this.match,
    this.onExpand,
    this.renderGutter,
    this.renderWidget,
    this.invisibles = false,
  });

  /// The palette it is drawn in.
  final DiffineTheme theme;

  /// What this pane is called, which is what a screen reader is told it is.
  final String name;

  /// The lines it draws.
  final PaneLayout layout;

  /// Where its rows are.
  final RowHeights heights;

  /// Which pane of the shared table this is.
  final int pane;

  /// How far down it has been scrolled.
  final ScrollController controller;

  /// How far across, for a pane that is not wrapping.
  final ScrollController horizontal;

  /// The words.
  final DiffineStrings strings;

  /// How wide one character of the monospaced typeface is, measured.
  final double characterWidth;

  /// How wide the column of numbers has to be, in digits.
  final int digits;

  /// Whether each line carries its number.
  final bool lineNumbers;

  /// Whether a changed line carries a mark beside it.
  final bool markers;

  /// Whether a line too long for the pane wraps or runs off the side.
  final bool wrap;

  /// Which change a reader has moved to, or -1.
  final int current;

  /// How wide its content is, worked out by whatever holds both panes so that
  /// the two agree before either is laid out.
  final double contentWidth;

  /// How wide the columns down its left-hand side come to.
  final double gutterWidth;

  /// How a line is coloured beyond what the comparison says about it.
  final DiffineHighlight? highlight;

  /// What a search found, keyed by the line it found it in.
  final Map<int, List<SearchMatch>>? matches;

  /// The match a reader is on.
  final SearchMatch? match;

  /// Opens a folded run.
  final void Function(FoldRun fold)? onExpand;

  /// Something of the application's own for the gutter of each line.
  final DiffineRender? renderGutter;

  /// Something of the application's own for under each line.
  final DiffineRender? renderWidget;

  /// Whether the spaces and tabs inside each line are drawn.
  final bool invisibles;

  @override
  Widget build(BuildContext context) {
    final Widget list = CustomPaint(
      painter: _GutterColumn(
        colour: theme.gutter,
        rule: theme.border,
        width: lineNumbers || markers ? gutterWidth : 0,
      ),
      child: ListView.builder(
        controller: controller,
        itemCount: layout.lines.length,
        itemExtentBuilder: (int index, SliverLayoutDimensions dimensions) => heights.height(index),
        padding: EdgeInsets.zero,
        itemBuilder: (BuildContext context, int index) => _row(index),
      ),
    );

    return Semantics(
      label: name,
      container: true,
      child: wrap
          ? list
          : RawScrollbar(
              controller: horizontal,
              thumbColor: theme.muted.withValues(alpha: 0.4),
              thickness: 6,
              radius: const Radius.circular(3),
              child: SingleChildScrollView(
                controller: horizontal,
                scrollDirection: Axis.horizontal,
                child: SizedBox(width: contentWidth, child: list),
              ),
            ),
    );
  }

  Widget _row(int index) {
    final PaneLine drawn = layout.lines[index];
    final FoldRun? fold = drawn.fold;

    if (fold != null) {
      return DiffineFoldBand(theme: theme, fold: fold, strings: strings, onExpand: onExpand);
    }

    return DiffineLineWidget(
      theme: theme,
      drawn: drawn,
      strings: strings,
      characterWidth: characterWidth,
      digits: digits,
      lineNumbers: lineNumbers,
      markers: markers,
      current: drawn.change >= 0 && drawn.change == current,
      wrap: wrap,
      highlight: highlight,
      matches: matches?[index],
      match: match,
      renderGutter: renderGutter,
      renderWidget: renderWidget == null ? null : _widgetFor(index),
      invisibles: invisibles,
    );
  }

  DiffineRender _widgetFor(int index) {
    return (DiffLine line, DiffineSide side) {
      final Widget? built = renderWidget!(line, side);

      return built == null
          ? null
          : SizeReporter(
              onSize: (Size size) => heights.reportWidget(pane, index, size.height),
              child: built,
            );
    };
  }
}

/// The gutter, carried on to the bottom of the pane.
///
/// A gutter is drawn by each line, so it stops where the document does — and a
/// pane is nearly always taller than the document in it, which left the column
/// a reader reads the numbers down ending part-way with bare paper under it.
/// This is that column with no lines on it: the same width, the same rule down
/// its right-hand side, painted under the rows rather than by anything in them.
///
/// It sits inside whatever scrolls the pane sideways, so it keeps step with the
/// gutters above it when a long line is scrolled past. Only what the numbers
/// and the marks come to is drawn: a column an application added with
/// `renderGutter` is its own, and nothing here knows how wide it is.
class _GutterColumn extends CustomPainter {
  const _GutterColumn({required this.colour, required this.rule, required this.width});

  final Color colour;
  final Color rule;
  final double width;

  @override
  void paint(Canvas canvas, Size size) {
    if (width <= 0) {
      return;
    }

    canvas
      ..drawRect(Rect.fromLTWH(0, 0, width, size.height), Paint()..color = colour)
      ..drawRect(Rect.fromLTWH(width - 1, 0, 1, size.height), Paint()..color = rule);
  }

  @override
  bool shouldRepaint(_GutterColumn old) =>
      old.colour != colour || old.rule != rule || old.width != width;
}

/// Tells its parent how tall its child turned out to be.
///
/// Which is the one measurement nothing here can work out on its own: what the
/// application draws under a line is the application's, and the opposite pane
/// has to be that much taller for the two sides to stay level.
class SizeReporter extends SingleChildRenderObjectWidget {
  /// One reporter.
  const SizeReporter({required this.onSize, required Widget super.child, super.key});

  /// Told the size, after every layout that changed it.
  final ValueChanged<Size> onSize;

  @override
  RenderObject createRenderObject(BuildContext context) => _RenderSizeReporter(onSize);

  @override
  void updateRenderObject(BuildContext context, RenderObject renderObject) {
    (renderObject as _RenderSizeReporter).onSize = onSize;
  }
}

class _RenderSizeReporter extends RenderProxyBox {
  _RenderSizeReporter(this.onSize);

  ValueChanged<Size> onSize;
  Size? _last;

  @override
  void performLayout() {
    super.performLayout();

    if (_last != size) {
      _last = size;

      // After the layout rather than inside it: telling the table now would ask
      // for a rebuild in the middle of one.
      final Size measured = size;

      WidgetsBinding.instance.addPostFrameCallback((Duration _) => onSize(measured));
    }
  }
}
