/// The column between the two panes, and the shape each change makes across it.
///
/// This is the part of a side-by-side view that a list of rows cannot say. Two
/// documents that are not the same length do not line up, and a reader looking
/// at the left pane has no way of telling which part of the right one answers
/// it. A band drawn from where a run of lines was to where it ended up says
/// that, and says it in one glance.
///
/// Three paths rather than one. A single closed path stroked all the way round
/// puts half of that stroke outside the column on the left-hand and right-hand
/// edges, where it is clipped — so the two curves that carry the meaning come
/// out thinner than the two edges that carry none. Drawn apart, the fill is a
/// fill and the curves are the only thing with a line on them.
library;

import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:diffine/src/components/shared/diffine_controls.dart';
import 'package:diffine/src/components/shared/diffine_icons.dart';
import 'package:diffine/src/internal/i18n.dart';
import 'package:diffine/src/internal/metrics.dart';
import 'package:diffine/src/internal/rows.dart';
import 'package:diffine/src/theme/tokens.dart';
import 'package:diffine/src/types.dart';
import 'package:flutter/widgets.dart';

/// How far above and below the column a shape is still worth drawing.
const double _margin = 48;

/// Where a change sits in one pane, in that pane's own coordinates.
class _Band {
  const _Band(this.top, this.bottom);

  final double top;
  final double bottom;
}

/// The rows of one change on one side, as a single band.
///
/// A change that took lines out of one document put none into that side of the
/// view, so there is nothing to point at — and the honest answer for it is not
/// "nowhere" but "here, between these two lines". The band collapses to the
/// bottom edge of the last line before the change, which is where a reader
/// would point.
_Band _bandFor(PaneLayout layout, RowHeights heights, int rowStart, int rowEnd) {
  double top = double.infinity;
  double bottom = double.negativeInfinity;

  for (int row = rowStart; row < rowEnd && row < layout.positions.length; row += 1) {
    final int position = layout.positions[row];

    if (position < 0) {
      continue;
    }

    top = math.min(top, heights.top(position));
    bottom = math.max(bottom, heights.top(position) + heights.height(position));
  }

  if (top != double.infinity) {
    return _Band(top, bottom);
  }

  for (int row = math.min(rowStart, layout.positions.length) - 1; row >= 0; row -= 1) {
    final int position = layout.positions[row];

    if (position >= 0) {
      final double edge = heights.top(position) + heights.height(position);

      return _Band(edge, edge);
    }
  }

  return const _Band(0, 0);
}

/// One change, as the shape between where it left and where it arrived.
class DiffineLink {
  /// One shape.
  const DiffineLink({
    required this.index,
    required this.kind,
    required this.current,
    required this.middle,
    required this.leftTop,
    required this.leftBottom,
    required this.rightTop,
    required this.rightBottom,
  });

  /// Which change this is, as an index into the comparison's own list.
  final int index;

  /// What happened over it.
  final DiffChangeKind kind;

  /// Whether it is the one a reader has moved to.
  final bool current;

  /// Where the middle of the band is, for the buttons that take it across.
  final double middle;

  /// Where the band starts on the left-hand edge.
  final double leftTop;

  /// Where it ends there.
  final double leftBottom;

  /// Where it starts on the right-hand edge.
  final double rightTop;

  /// Where it ends there.
  final double rightBottom;
}

/// The column itself.
class DiffineLinks extends StatelessWidget {
  /// One column.
  const DiffineLinks({
    required this.theme,
    required this.changes,
    required this.beforeLayout,
    required this.afterLayout,
    required this.beforeHeights,
    required this.afterHeights,
    required this.beforeOffset,
    required this.afterOffset,
    required this.current,
    required this.strings,
    super.key,
    this.onApply,
    this.writableBefore = false,
    this.writableAfter = false,
    this.beforeLabel = '',
    this.afterLabel = '',
  });

  /// The palette it is drawn in.
  final DiffineTheme theme;

  /// The changes it draws a band for.
  final List<DiffChange> changes;

  /// What the left pane draws.
  final PaneLayout beforeLayout;

  /// What the right one draws.
  final PaneLayout afterLayout;

  /// Where the left pane's rows are.
  final RowHeights beforeHeights;

  /// Where the right one's are.
  final RowHeights afterHeights;

  /// How far the left pane has been scrolled.
  final double beforeOffset;

  /// How far the right one has.
  final double afterOffset;

  /// Which change a reader has moved to, or -1.
  final int current;

  /// The words, for the name of the button that writes a change across.
  final DiffineStrings strings;

  /// Writes one change into one of the two documents. Left out where nothing
  /// can be written, which is every viewer and an editor that was not asked for
  /// the buttons.
  final void Function(DiffChange change, DiffineSide into)? onApply;

  /// Whether the left document can be written into at all.
  final bool writableBefore;

  /// Whether the right one can.
  final bool writableAfter;

  /// What the left side is called.
  final String beforeLabel;

  /// What the right one is called.
  final String afterLabel;

  List<DiffineLink> _shapes(double height) {
    final List<DiffineLink> links = <DiffineLink>[];

    for (int index = 0; index < changes.length; index += 1) {
      final DiffChange change = changes[index];
      final _Band left = _bandFor(beforeLayout, beforeHeights, change.rowStart, change.rowEnd);
      final _Band right = _bandFor(afterLayout, afterHeights, change.rowStart, change.rowEnd);
      final double leftTop = left.top - beforeOffset;
      final double leftBottom = left.bottom - beforeOffset;
      final double rightTop = right.top - afterOffset;
      final double rightBottom = right.bottom - afterOffset;

      if (math.max(leftBottom, rightBottom) < -_margin ||
          math.min(leftTop, rightTop) > height + _margin) {
        continue;
      }

      links.add(
        DiffineLink(
          index: index,
          kind: change.kind,
          current: index == current,
          middle: (math.min(leftTop, rightTop) + math.max(leftBottom, rightBottom)) / 2,
          leftTop: leftTop,
          leftBottom: leftBottom,
          rightTop: rightTop,
          rightBottom: rightBottom,
        ),
      );
    }

    return links;
  }

  @override
  Widget build(BuildContext context) {
    final bool applying =
        onApply != null && (writableBefore || writableAfter) && changes.isNotEmpty;

    return LayoutBuilder(
      builder: (BuildContext context, BoxConstraints constraints) {
        final List<DiffineLink> links = _shapes(constraints.maxHeight);

        return DecoratedBox(
          decoration: BoxDecoration(
            color: theme.gutter,
            border: Border.symmetric(vertical: BorderSide(color: theme.border)),
          ),
          child: Stack(
            children: <Widget>[
              Positioned.fill(
                child: CustomPaint(
                  painter: _LinksPainter(theme: theme, links: links),
                ),
              ),
              if (applying)
                for (final DiffineLink link in links)
                  Positioned(
                    top: link.middle - 13,
                    left: 0,
                    right: 0,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: <Widget>[
                        if (writableBefore)
                          DiffineIconButton(
                            theme: theme,
                            size: 22,
                            label: fill(strings.applyChange, <String, Object>{
                              'label': beforeLabel,
                            }),
                            onPressed: () => onApply!(changes[link.index], DiffineSide.before),
                            child: const DiffineIcons(DiffineIcon.arrowLeft, size: 12),
                          ),
                        if (writableAfter)
                          DiffineIconButton(
                            theme: theme,
                            size: 22,
                            label: fill(strings.applyChange, <String, Object>{'label': afterLabel}),
                            onPressed: () => onApply!(changes[link.index], DiffineSide.after),
                            child: const DiffineIcons(DiffineIcon.arrowRight, size: 12),
                          ),
                      ],
                    ),
                  ),
            ],
          ),
        );
      },
    );
  }
}

class _LinksPainter extends CustomPainter {
  const _LinksPainter({required this.theme, required this.links});

  final DiffineTheme theme;
  final List<DiffineLink> links;

  @override
  void paint(Canvas canvas, Size size) {
    final double bend = size.width / 2;

    for (final DiffineLink link in links) {
      final Path top = Path()
        ..moveTo(0, link.leftTop)
        ..cubicTo(bend, link.leftTop, bend, link.rightTop, size.width, link.rightTop);
      final Path bottom = Path()
        ..moveTo(0, link.leftBottom)
        ..cubicTo(bend, link.leftBottom, bend, link.rightBottom, size.width, link.rightBottom);
      final Path area = Path.from(top)
        ..lineTo(size.width, link.rightBottom)
        ..cubicTo(bend, link.rightBottom, bend, link.leftBottom, 0, link.leftBottom)
        ..close();

      // An edit went out on one side and came in on the other, so its band is
      // not one colour. It is the colour it left as on the left-hand edge and
      // the colour it arrived as on the right, and the two run into each other
      // across the column — which says in one shape what a red band with a
      // green outline said in two contradictory ones.
      final Rect box = Rect.fromLTWH(0, 0, size.width, size.height);
      final Paint fill = Paint()..style = PaintingStyle.fill;
      final Paint edge = Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = link.current ? 1.6 : 1
        ..isAntiAlias = true;

      switch (link.kind) {
        case DiffChangeKind.replace:
          fill.shader = ui.Gradient.linear(box.centerLeft, box.centerRight, <Color>[
            theme.deleteLine,
            theme.insertLine,
          ]);
          edge.shader = ui.Gradient.linear(box.centerLeft, box.centerRight, <Color>[
            theme.deleteText,
            theme.insertText,
          ]);
        case DiffChangeKind.insert:
          fill.color = theme.insertLine;
          edge.color = theme.insertText;
        case DiffChangeKind.delete:
          fill.color = theme.deleteLine;
          edge.color = theme.deleteText;
      }

      canvas
        ..drawPath(area, fill)
        ..drawPath(top, edge)
        ..drawPath(bottom, edge);
    }
  }

  @override
  bool shouldRepaint(_LinksPainter old) => true;
}
