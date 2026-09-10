/// One line of one side, and the columns beside it.
///
/// `kind` is the row's rather than the line's, so a blank knows what happened
/// opposite it: a blank across from an inserted line and a blank across from
/// nothing at all are two different things, and drawing both as empty loses
/// which of the two a reader is looking at.
library;

import 'package:diffine/src/internal/pieces.dart';
import 'package:diffine/src/internal/rows.dart';
import 'package:diffine/src/internal/search.dart';
import 'package:diffine/src/theme/tokens.dart';
import 'package:diffine/src/types.dart';
import 'package:flutter/widgets.dart';

/// What is drawn in the marker column, per side.
const Map<DiffineSide, Map<DiffRowKind, String>> _markers = <DiffineSide, Map<DiffRowKind, String>>{
  DiffineSide.before: <DiffRowKind, String>{DiffRowKind.delete: '−', DiffRowKind.replace: '~'},
  DiffineSide.after: <DiffRowKind, String>{DiffRowKind.insert: '+', DiffRowKind.replace: '~'},
};

/// Runs of spaces, and runs of tabs, which are drawn rather than left invisible.
final RegExp _blanks = RegExp(r' +|\t+');

/// How wide the column of numbers is, for one number of `digits` digits.
double numberColumnWidth(double characterWidth, int digits) {
  return characterWidth * digits + 20;
}

/// How wide the marker column is.
const double kMarkerWidth = 20;

/// How far in from the gutter the text starts.
const double kTextGap = 8;

/// Which word a screen reader hears in front of the line.
String? _labelFor(DiffineStrings strings, DiffRowKind kind, DiffineSide side) {
  if (kind == DiffRowKind.replace) {
    return strings.changed;
  }

  if (kind == DiffRowKind.insert && side == DiffineSide.after) {
    return strings.added;
  }

  if (kind == DiffRowKind.delete && side == DiffineSide.before) {
    return strings.removed;
  }

  return null;
}

/// The tint a whole row is drawn on.
Color? rowTint(DiffineTheme theme, DiffRowKind kind, DiffineSide side, bool blank) {
  if (blank) {
    return kind == DiffRowKind.equal ? null : theme.blank;
  }

  switch (kind) {
    case DiffRowKind.equal:
      return null;
    case DiffRowKind.replace:
      return side == DiffineSide.before ? theme.deleteLine : theme.insertLine;
    case DiffRowKind.delete:
      return side == DiffineSide.before ? theme.deleteLine : null;
    case DiffRowKind.insert:
      return side == DiffineSide.after ? theme.insertLine : null;
  }
}

/// One drawn line.
class DiffineLineWidget extends StatelessWidget {
  /// One line, or the blank opposite a line with no counterpart.
  const DiffineLineWidget({
    required this.theme,
    required this.drawn,
    required this.strings,
    required this.digits,
    required this.lineNumbers,
    required this.markers,
    required this.current,
    required this.wrap,
    super.key,
    this.highlight,
    this.matches,
    this.match,
    this.renderGutter,
    this.renderWidget,
    this.invisibles = false,
  });

  /// The palette it is drawn in.
  final DiffineTheme theme;

  /// The line the pane is drawing here.
  final PaneLine drawn;

  /// The words, for what a screen reader hears in front of a changed line.
  final DiffineStrings strings;

  /// How wide the column of numbers has to be, in digits.
  final int digits;

  /// Whether each line carries its number.
  final bool lineNumbers;

  /// Whether a changed line carries a mark beside it.
  final bool markers;

  /// Whether this is the change a reader has moved to.
  final bool current;

  /// Whether a line too long for the pane wraps or runs off the side.
  final bool wrap;

  /// How the line is coloured beyond what the comparison says about it.
  final DiffineHighlight? highlight;

  /// What a search found in this line, or nothing when it found nothing here.
  final List<SearchMatch>? matches;

  /// The match a reader is on, which is the one drawn differently from the
  /// rest.
  final SearchMatch? match;

  /// Something of the application's own for the gutter.
  final DiffineRender? renderGutter;

  /// Something of the application's own for under the line.
  final DiffineRender? renderWidget;

  /// Whether the spaces and tabs inside the line are drawn.
  final bool invisibles;

  @override
  Widget build(BuildContext context) {
    final DiffLine? line = drawn.line;
    final Widget? slot = line != null && renderGutter != null
        ? renderGutter!(line, drawn.side)
        : null;
    final Widget? extra = line != null && renderWidget != null
        ? renderWidget!(line, drawn.side)
        : null;
    final String? said = line != null ? _labelFor(strings, drawn.kind, drawn.side) : null;
    final Color? tint = rowTint(theme, drawn.kind, drawn.side, line == null);

    final Widget body = Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        if (lineNumbers || markers || slot != null)
          _Gutter(
            theme: theme,
            drawn: drawn,
            digits: digits,
            lineNumbers: lineNumbers,
            markers: markers,
            slot: slot,
          ),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(left: kTextGap, right: kTextGap),
            child: line == null
                ? const SizedBox.shrink()
                : _LineText(
                    theme: theme,
                    line: line,
                    side: drawn.side,
                    wrap: wrap,
                    highlight: highlight,
                    matches: matches,
                    match: match,
                    invisibles: invisibles,
                  ),
          ),
        ),
      ],
    );

    return Semantics(
      label: said,
      container: said != null,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: tint,
          border: current ? Border(left: BorderSide(color: theme.accent, width: 2)) : null,
        ),
        child: extra == null
            ? SizedBox(height: wrap ? null : theme.lineHeight, child: body)
            : Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                mainAxisSize: MainAxisSize.min,
                children: <Widget>[
                  SizedBox(height: wrap ? null : theme.lineHeight, child: body),
                  extra,
                ],
              ),
      ),
    );
  }
}

/// The numbers, the marker and whatever the application put beside them.
///
/// One element around all three, so that the whole of it can be held against
/// the left edge while a long line is scrolled past it.
class _Gutter extends StatelessWidget {
  const _Gutter({
    required this.theme,
    required this.drawn,
    required this.digits,
    required this.lineNumbers,
    required this.markers,
    required this.slot,
  });

  final DiffineTheme theme;
  final PaneLine drawn;
  final int digits;
  final bool lineNumbers;
  final bool markers;
  final Widget? slot;

  @override
  Widget build(BuildContext context) {
    final double characterWidth = theme.fontSize * 0.6;
    final TextStyle style = theme.lineStyle.copyWith(color: theme.muted);
    final String marker = drawn.line == null ? '' : _markers[drawn.side]?[drawn.kind] ?? '';

    return SelectionContainer.disabled(
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: theme.gutter,
          border: Border(right: BorderSide(color: theme.border)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            // The numbers and the marker are the colours said again, and a
            // screen reader is told what happened to the line by the line. The
            // slot is not: it is the one part of a gutter meant to be reached.
            if (lineNumbers)
              for (final int? number in drawn.numbers)
                ExcludeSemantics(
                  child: SizedBox(
                    width: numberColumnWidth(characterWidth, digits),
                    height: theme.lineHeight,
                    child: Padding(
                      padding: const EdgeInsets.only(right: 10),
                      child: Align(
                        alignment: Alignment.centerRight,
                        child: Text(number == null ? '' : '$number', style: style),
                      ),
                    ),
                  ),
                ),
            if (markers)
              ExcludeSemantics(
                child: SizedBox(
                  width: kMarkerWidth,
                  height: theme.lineHeight,
                  child: Center(
                    child: Text(
                      marker,
                      style: style.copyWith(
                        color: drawn.kind == DiffRowKind.insert
                            ? theme.insertText
                            : drawn.kind == DiffRowKind.delete
                            ? theme.deleteText
                            : theme.muted,
                      ),
                    ),
                  ),
                ),
              ),
            ?slot,
          ],
        ),
      ),
    );
  }
}

/// The line itself, with whatever moved inside it — and whatever marks it.
class _LineText extends StatelessWidget {
  const _LineText({
    required this.theme,
    required this.line,
    required this.side,
    required this.wrap,
    required this.invisibles,
    this.highlight,
    this.matches,
    this.match,
  });

  final DiffineTheme theme;
  final DiffLine line;
  final DiffineSide side;
  final bool wrap;
  final bool invisibles;
  final DiffineHighlight? highlight;
  final List<SearchMatch>? matches;
  final SearchMatch? match;

  @override
  Widget build(BuildContext context) {
    final TextStyle base = theme.lineStyle;
    final List<LineRange>? found = matches
        ?.map((SearchMatch each) => LineRange(each.start, each.end, current: each == match))
        .toList();
    final List<LinePiece>? pieces = splitLine(line, highlight?.call(line, side), found);
    final InlineSpan span = pieces == null
        ? TextSpan(text: line.text, style: base)
        : TextSpan(
            style: base,
            children: <InlineSpan>[
              for (final LinePiece piece in pieces)
                TextSpan(text: piece.text, style: _styleOf(piece, base)),
            ],
          );
    final Widget text = Text.rich(
      span,
      softWrap: wrap,
      overflow: wrap ? TextOverflow.clip : TextOverflow.visible,
      maxLines: wrap ? null : 1,
    );

    if (!invisibles || !line.text.contains(RegExp(r'[ \t]'))) {
      return text;
    }

    return CustomPaint(
      painter: _InvisiblesPainter(
        span: span,
        text: line.text,
        colour: theme.invisible,
        direction: Directionality.of(context),
        wrap: wrap,
      ),
      child: text,
    );
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
}

/// The dots and rules that stand for a space and a tab.
///
/// Drawn behind the text rather than written into it, so what a reader copies
/// out is the line as it was written rather than a line with dots in it. The
/// boxes come from laying the same spans out again at the same width, which is
/// what makes the marks follow a line that wrapped.
class _InvisiblesPainter extends CustomPainter {
  const _InvisiblesPainter({
    required this.span,
    required this.text,
    required this.colour,
    required this.direction,
    required this.wrap,
  });

  final InlineSpan span;
  final String text;
  final Color colour;
  final TextDirection direction;
  final bool wrap;

  @override
  void paint(Canvas canvas, Size size) {
    final TextPainter painter = TextPainter(
      text: span,
      textDirection: direction,
      maxLines: wrap ? null : 1,
    )..layout(maxWidth: wrap ? size.width : double.infinity);
    final Paint brush = Paint()
      ..color = colour
      ..style = PaintingStyle.fill;

    for (final RegExpMatch run in _blanks.allMatches(text)) {
      final bool tab = text[run.start] == '\t';
      final List<TextBox> boxes = painter.getBoxesForSelection(
        TextSelection(baseOffset: run.start, extentOffset: run.end),
      );

      for (final TextBox box in boxes) {
        if (tab) {
          canvas.drawRect(
            Rect.fromLTWH(box.left + 1, box.bottom - 3, (box.right - box.left) - 2, 1),
            brush,
          );
          continue;
        }

        final double step = (box.right - box.left) / (run.end - run.start);
        final double middle = (box.top + box.bottom) / 2;

        for (int at = 0; at < run.end - run.start; at += 1) {
          canvas.drawCircle(Offset(box.left + step * (at + 0.5), middle), 0.9, brush);
        }
      }
    }

    painter.dispose();
  }

  @override
  bool shouldRepaint(_InvisiblesPainter old) {
    return old.text != text || old.colour != colour || old.wrap != wrap;
  }
}
