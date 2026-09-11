/// One editable document, drawn twice: once as text somebody can type into, and
/// once as the comparison underneath it.
///
/// The two are the same surface as far as a reader is concerned, and keeping
/// them that way is the whole of what this widget does. The field's own text is
/// see-through and its caret is not, so what a reader sees is the lines behind
/// it — where a changed row can be tinted, a moved word marked, and a line
/// coloured by whatever highlighter the application handed over. None of that
/// is possible inside a text field, and everything else about one is: the undo
/// stack, the input method, the selection, the accessibility.
///
/// Which leaves one thing to get right, and it is not negotiable. The field is
/// laid over the lines exactly, so every measurement either of them makes has
/// to come out the same — the same typeface at the same size, one line as tall
/// as the next, the text starting the same distance in past the gutter. That is
/// why the lines behind are painted rather than built: a painter is handed the
/// same [TextStyle] and the same width the field is laid out at, so the two
/// break in the same places by construction.
///
/// The lines are hidden from a screen reader. They are a second copy of a
/// document it is already being handed, and the field is the copy that can be
/// read a line at a time and edited.
library;

import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:diffine/src/components/shared/diffine_line.dart';
import 'package:diffine/src/internal/metrics.dart';
import 'package:diffine/src/internal/pieces.dart';
import 'package:diffine/src/internal/rows.dart';
import 'package:diffine/src/internal/scroll.dart';
import 'package:diffine/src/internal/search.dart';
import 'package:diffine/src/theme/tokens.dart';
import 'package:diffine/src/types.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

/// Runs of spaces, and runs of tabs, which are drawn rather than left
/// invisible.
final RegExp _blankRuns = RegExp(r' +|\t+');

/// One pane of the editor.
class TextDiffField extends StatelessWidget {
  /// One field over one set of lines.
  const TextDiffField({
    required this.theme,
    required this.side,
    required this.name,
    required this.controller,
    required this.focusNode,
    required this.layout,
    required this.heights,
    required this.pane,
    required this.vertical,
    required this.horizontal,
    required this.strings,
    required this.digits,
    required this.lineNumbers,
    required this.markers,
    required this.wrap,
    required this.current,
    required this.contentWidth,
    required this.characterWidth,
    required this.gutterWidth,
    required this.readOnly,
    super.key,
    this.highlight,
    this.matches,
    this.match,
    this.invisibles = false,
    this.indentWithTab = false,
    this.onChanged,
  });

  /// The palette it is drawn in.
  final DiffineTheme theme;

  /// Which side this is.
  final DiffineSide side;

  /// What this side is called, which is the field's name to a screen reader.
  final String name;

  /// What it holds.
  final TextEditingController controller;

  /// Its focus.
  final FocusNode focusNode;

  /// The lines drawn behind it.
  final PaneLayout layout;

  /// Where those rows are.
  final RowHeights heights;

  /// Which pane of the table this is.
  final int pane;

  /// How far down it has been scrolled.
  final ScrollController vertical;

  /// How far across, for a pane that is not wrapping.
  final ScrollController horizontal;

  /// The words.
  final DiffineStrings strings;

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

  /// How wide its content is.
  final double contentWidth;

  /// How wide one character of the monospaced typeface is, measured.
  final double characterWidth;

  /// How wide the columns down its side are.
  final double gutterWidth;

  /// Whether this side can be typed into at all.
  final bool readOnly;

  /// How a line is coloured beyond what the comparison says about it.
  final DiffineHighlight? highlight;

  /// What a search found, keyed by the line it found it in.
  final Map<int, List<SearchMatch>>? matches;

  /// The match a reader is on.
  final SearchMatch? match;

  /// Whether the spaces and tabs inside each line are drawn.
  final bool invisibles;

  /// Whether Tab types a tab instead of moving to the next control.
  final bool indentWithTab;

  /// Somebody typed.
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    final TextDirection direction = Directionality.of(context);
    final double height = math.max(heights.total, theme.lineHeight);
    final Widget body = SizedBox(
      width: contentWidth,
      height: height,
      child: Stack(
        children: <Widget>[
          Positioned.fill(
            child: ExcludeSemantics(
              child: IgnorePointer(
                child: CustomPaint(
                  painter: _BackdropPainter(
                    theme: theme,
                    layout: layout,
                    heights: heights,
                    strings: strings,
                    direction: direction,
                    digits: digits,
                    lineNumbers: lineNumbers,
                    markers: markers,
                    wrap: wrap,
                    current: current,
                    characterWidth: characterWidth,
                    gutterWidth: gutterWidth,
                    invisibles: invisibles,
                    highlight: highlight,
                    matches: matches,
                    match: match,
                    scroller: vertical,
                  ),
                ),
              ),
            ),
          ),
          Padding(
            padding: EdgeInsets.only(left: gutterWidth + kTextGap, right: kTextGap),
            child: _field(context),
          ),
        ],
      ),
    );

    final Widget scrolled = SingleChildScrollView(controller: vertical, child: body);

    if (wrap) {
      return scrolled;
    }

    return RawScrollbar(
      controller: horizontal,
      thumbColor: theme.muted.withValues(alpha: 0.4),
      thickness: 6,
      radius: const Radius.circular(3),
      child: SingleChildScrollView(
        controller: horizontal,
        scrollDirection: Axis.horizontal,
        child: SizedBox(width: contentWidth, child: scrolled),
      ),
    );
  }

  Widget _field(BuildContext context) {
    final Widget field = EditableText(
      controller: controller,
      focusNode: focusNode,
      readOnly: readOnly,
      // See-through, so what a reader reads is the painted line underneath —
      // the tint, the marked words and the colours the highlighter chose. The
      // caret and the selection are not, which is the whole of what the field
      // is here to draw.
      style: theme.lineStyle.copyWith(color: const Color(0x00000000)),
      cursorColor: theme.accent,
      backgroundCursorColor: theme.border,
      selectionColor: theme.selection,
      selectionControls: emptyTextSelectionControls,
      maxLines: null,
      expands: true,
      textDirection: Directionality.of(context),
      // A selection is a run of text and not a row of boxes. The default fits a
      // box to each run's own glyphs, so a line of Hangul and a line of Latin
      // are highlighted at two different heights with a gap between the lines.
      selectionHeightStyle: ui.BoxHeightStyle.max,
      selectionWidthStyle: ui.BoxWidthStyle.max,
      scrollPhysics: const NeverScrollableScrollPhysics(),
      rendererIgnoresPointer: false,
      onChanged: onChanged,
    );

    return Semantics(
      textField: true,
      label: name,
      child: indentWithTab && !readOnly
          ? _Indenting(controller: controller, onChanged: onChanged, child: field)
          : field,
    );
  }
}

/// Tab types a tab, and two ways out of a control nothing could be tabbed out
/// of.
///
/// Off by default, because a control a keyboard cannot leave is a screen a
/// keyboard cannot leave. On, there are two ways out and both are the ones
/// somebody would try: Shift+Tab always moves back a control, and Escape hands
/// the next Tab to the framework.
class _Indenting extends StatefulWidget {
  const _Indenting({required this.controller, required this.child, this.onChanged});

  final TextEditingController controller;
  final Widget child;
  final ValueChanged<String>? onChanged;

  @override
  State<_Indenting> createState() => _IndentingState();
}

class _IndentingState extends State<_Indenting> {
  bool _escaped = false;

  KeyEventResult _onKey(FocusNode node, KeyEvent event) {
    if (event is! KeyDownEvent && event is! KeyRepeatEvent) {
      return KeyEventResult.ignored;
    }

    if (event.logicalKey == LogicalKeyboardKey.escape) {
      _escaped = true;

      return KeyEventResult.ignored;
    }

    if (event.logicalKey != LogicalKeyboardKey.tab) {
      _escaped = false;

      return KeyEventResult.ignored;
    }

    if (_escaped || HardwareKeyboard.instance.isShiftPressed) {
      return KeyEventResult.ignored;
    }

    final TextEditingValue value = widget.controller.value;
    final TextSelection selection = value.selection;

    if (!selection.isValid) {
      return KeyEventResult.ignored;
    }

    final String text = value.text.replaceRange(selection.start, selection.end, '\t');

    widget.controller.value = TextEditingValue(
      text: text,
      selection: TextSelection.collapsed(offset: selection.start + 1),
    );
    widget.onChanged?.call(text);

    return KeyEventResult.handled;
  }

  @override
  Widget build(BuildContext context) {
    return Focus(
      onKeyEvent: _onKey,
      skipTraversal: true,
      canRequestFocus: false,
      child: widget.child,
    );
  }
}

/// The comparison, painted under the field.
///
/// Only the rows a reader can see are painted, which is what stands in for the
/// virtualising a list of widgets would get for free — and the field above
/// holds the whole document either way, because that part is the framework's.
class _BackdropPainter extends CustomPainter {
  _BackdropPainter({
    required this.theme,
    required this.layout,
    required this.heights,
    required this.strings,
    required this.direction,
    required this.digits,
    required this.lineNumbers,
    required this.markers,
    required this.wrap,
    required this.current,
    required this.characterWidth,
    required this.gutterWidth,
    required this.invisibles,
    required this.scroller,
    this.highlight,
    this.matches,
    this.match,
  }) : super(repaint: scroller);

  final DiffineTheme theme;
  final PaneLayout layout;
  final RowHeights heights;
  final DiffineStrings strings;
  final TextDirection direction;
  final int digits;
  final bool lineNumbers;
  final bool markers;
  final bool wrap;
  final int current;
  final double characterWidth;
  final double gutterWidth;
  final bool invisibles;
  final ScrollController scroller;
  final DiffineHighlight? highlight;
  final Map<int, List<SearchMatch>>? matches;
  final SearchMatch? match;

  @override
  void paint(Canvas canvas, Size size) {
    final double offset = scrollOffsetOf(scroller);
    final double measured = scrollViewportOf(scroller);
    final double viewport = measured > 0 ? measured : size.height;
    final int first = math.max(0, heights.at(offset) - 1);
    final TextStyle numbers = theme.lineStyle.copyWith(color: theme.muted);

    if (gutterWidth > 0) {
      canvas
        ..drawRect(Rect.fromLTWH(0, 0, gutterWidth, size.height), Paint()..color = theme.gutter)
        ..drawRect(
          Rect.fromLTWH(gutterWidth - 1, 0, 1, size.height),
          Paint()..color = theme.border,
        );
    }

    for (int row = first; row < layout.lines.length; row += 1) {
      final double top = heights.top(row);

      if (top > offset + viewport) {
        break;
      }

      final double height = heights.height(row);
      final PaneLine drawn = layout.lines[row];
      final Color? tint = rowTint(theme, drawn.kind, drawn.side, drawn.line == null);

      if (tint != null) {
        canvas.drawRect(Rect.fromLTWH(0, top, size.width, height), Paint()..color = tint);
      }

      if (drawn.change >= 0 && drawn.change == current) {
        canvas.drawRect(Rect.fromLTWH(0, top, 2, height), Paint()..color = theme.accent);
      }

      if (lineNumbers) {
        for (int column = 0; column < drawn.numbers.length; column += 1) {
          final int? number = drawn.numbers[column];

          if (number == null) {
            continue;
          }

          final double width = numberColumnWidth(characterWidth, digits);
          final TextPainter painter = TextPainter(
            text: TextSpan(text: '$number', style: numbers),
            textDirection: direction,
            textAlign: TextAlign.right,
          )..layout(maxWidth: width - 10);

          painter.paint(canvas, Offset(width * column + width - 10 - painter.width, top));
          painter.dispose();
        }
      }

      final DiffLine? line = drawn.line;

      if (line == null) {
        continue;
      }

      if (markers) {
        final String mark = _markerFor(drawn);

        if (mark.isNotEmpty) {
          final double left = lineNumbers
              ? numberColumnWidth(characterWidth, digits) * drawn.numbers.length
              : 0;
          final TextPainter painter = TextPainter(
            text: TextSpan(
              text: mark,
              style: numbers.copyWith(
                color: drawn.kind == DiffRowKind.insert
                    ? theme.insertText
                    : drawn.kind == DiffRowKind.delete
                    ? theme.deleteText
                    : theme.muted,
              ),
            ),
            textDirection: direction,
          )..layout();

          painter.paint(canvas, Offset(left + (kMarkerWidth - painter.width) / 2, top));
          painter.dispose();
        }
      }

      _paintLine(canvas, size, line, drawn, row, top);
    }
  }

  String _markerFor(PaneLine drawn) {
    if (drawn.kind == DiffRowKind.replace) {
      return '~';
    }

    if (drawn.kind == DiffRowKind.insert && drawn.side == DiffineSide.after) {
      return '+';
    }

    if (drawn.kind == DiffRowKind.delete && drawn.side == DiffineSide.before) {
      return '−';
    }

    return '';
  }

  void _paintLine(Canvas canvas, Size size, DiffLine line, PaneLine drawn, int row, double top) {
    final double left = gutterWidth + kTextGap;
    final double width = math.max(1, size.width - left - kTextGap);
    final List<SearchMatch>? found = matches?[row];
    final List<LineRange>? ranges = found
        ?.map((SearchMatch each) => LineRange(each.start, each.end, current: each == match))
        .toList();
    final List<LinePiece>? pieces = splitLine(line, highlight?.call(line, drawn.side), ranges);
    final TextStyle base = theme.lineStyle;
    final InlineSpan span = pieces == null
        ? TextSpan(text: line.text, style: base)
        : TextSpan(
            style: base,
            children: <InlineSpan>[
              for (final LinePiece piece in pieces)
                TextSpan(text: piece.text, style: _styleOf(piece, base)),
            ],
          );
    final TextPainter painter = TextPainter(
      text: span,
      textDirection: direction,
      maxLines: wrap ? null : 1,
    )..layout(maxWidth: wrap ? width : double.infinity);

    painter.paint(canvas, Offset(left, top));

    if (invisibles) {
      _paintInvisibles(canvas, painter, line.text, left, top);
    }

    painter.dispose();
  }

  /// The dots and rules that stand for a space and a tab, drawn from the boxes
  /// the same layout gives — so they follow a line that wrapped.
  void _paintInvisibles(Canvas canvas, TextPainter painter, String text, double left, double top) {
    final Paint brush = Paint()..color = theme.invisible;

    for (final RegExpMatch run in _blankRuns.allMatches(text)) {
      final bool tab = text[run.start] == '\t';

      for (final TextBox box in painter.getBoxesForSelection(
        TextSelection(baseOffset: run.start, extentOffset: run.end),
      )) {
        if (tab) {
          canvas.drawRect(
            Rect.fromLTWH(left + box.left + 1, top + box.bottom - 3, (box.right - box.left) - 2, 1),
            brush,
          );
          continue;
        }

        final int count = run.end - run.start;
        final double step = (box.right - box.left) / count;

        for (int at = 0; at < count; at += 1) {
          canvas.drawCircle(
            Offset(left + box.left + step * (at + 0.5), top + (box.top + box.bottom) / 2),
            0.9,
            brush,
          );
        }
      }
    }
  }

  TextStyle _styleOf(LinePiece piece, TextStyle base) {
    Color? background;

    if (piece.kind == DiffEditKind.delete) {
      background = theme.deletePiece;
    } else if (piece.kind == DiffEditKind.insert) {
      background = theme.insertPiece;
    }

    if (piece.match == PieceMatch.current) {
      background = theme.searchCurrent;
    } else if (piece.match == PieceMatch.found) {
      background = theme.search;
    }

    final TextStyle? own = piece.style;
    final DiffineTokenKind? kind = piece.tokenKind;
    final TextStyle style =
        own ?? (kind == null ? base : base.copyWith(color: theme.code.of(kind)));

    return background == null ? style : style.copyWith(backgroundColor: background);
  }

  @override
  bool shouldRepaint(_BackdropPainter old) => true;
}
