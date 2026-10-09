/// One line of one side, and the columns beside it.
///
/// `kind` is the row's rather than the line's, so a blank knows what happened
/// opposite it: a blank across from an inserted line and a blank across from
/// nothing at all are two different things, and drawing both as empty loses
/// which of the two a reader is looking at.
library;

import 'package:diffine/src/internal/copy.dart';
import 'package:diffine/src/internal/pieces.dart';
import 'package:diffine/src/internal/rows.dart';
import 'package:diffine/src/internal/scale.dart';
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
///
/// The digits are measured in a typeface that is already at the comparison's
/// scale, and the room either side of them is multiplied here.
double numberColumnWidth({
  required double characterWidth,
  required int digits,
  required double scale,
}) {
  return characterWidth * digits + 20 * scale;
}

/// How wide the marker column is, at a scale of 1.
const double kMarkerWidth = 20;

/// How far in from the gutter the text starts, at a scale of 1.
///
/// The field an editor lays over its lines is inset by the same multiple of
/// this, which is what keeps the two on top of each other at any scale.
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
    required this.characterWidth,
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
    this.row = -1,
    this.selection,
  });

  /// The palette it is drawn in.
  final DiffineTheme theme;

  /// The line the pane is drawing here.
  final PaneLine drawn;

  /// The words, for what a screen reader hears in front of a changed line.
  final DiffineStrings strings;

  /// How wide one character of the monospaced typeface is, measured.
  final double characterWidth;

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

  /// Where the line sits in its pane's own list.
  final int row;

  /// The pane's record of which lines a selection has reached, which this line
  /// joins. Left out where nothing is copied out of the line this way.
  final PaneSelection? selection;

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
    final MergedLine? merged = drawn.merged;
    // A line drawn from two belongs to neither side, so it takes neither
    // side's tint: most of it is text that did not change.
    final Color? tint = merged != null
        ? null
        : rowTint(theme, drawn.kind, drawn.side, line == null);
    final double scale = DiffineScale.of(context);
    final Widget? drawnText = merged != null
        ? _MergedText(
            theme: theme,
            merged: merged,
            strings: strings,
            wrap: wrap,
            highlight: highlight,
            matches: matches,
            match: match,
            invisibles: invisibles,
            scale: scale,
          )
        : line != null
        ? _LineText(
            theme: theme,
            line: line,
            side: drawn.side,
            wrap: wrap,
            highlight: highlight,
            matches: matches,
            match: match,
            invisibles: invisibles,
            scale: scale,
          )
        : null;
    final PaneSelection? pane = selection;
    final Widget? text = drawnText == null || pane == null
        ? drawnText
        : _SelectableLine(drawn: drawn, row: row, selection: pane, child: drawnText);

    final Widget body = Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        if (lineNumbers || markers || slot != null)
          _Gutter(
            theme: theme,
            drawn: drawn,
            characterWidth: characterWidth,
            digits: digits,
            lineNumbers: lineNumbers,
            markers: markers,
            slot: slot,
            scale: scale,
          ),
        Expanded(
          child: Padding(
            padding: EdgeInsets.only(left: kTextGap * scale, right: kTextGap * scale),
            child: text ?? const SizedBox.shrink(),
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
    required this.characterWidth,
    required this.digits,
    required this.lineNumbers,
    required this.markers,
    required this.slot,
    required this.scale,
  });

  final DiffineTheme theme;
  final PaneLine drawn;
  final double characterWidth;
  final int digits;
  final bool lineNumbers;
  final bool markers;
  final Widget? slot;
  final double scale;

  @override
  Widget build(BuildContext context) {
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
                    width: numberColumnWidth(
                      characterWidth: characterWidth,
                      digits: digits,
                      scale: scale,
                    ),
                    height: theme.lineHeight,
                    child: Padding(
                      padding: EdgeInsets.only(right: 10 * scale),
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
                  width: kMarkerWidth * scale,
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
    required this.scale,
    this.highlight,
    this.matches,
    this.match,
  });

  final DiffineTheme theme;
  final DiffLine line;
  final DiffineSide side;
  final bool wrap;
  final bool invisibles;
  final double scale;
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
                TextSpan(text: piece.text, style: _styleOf(theme, piece, base)),
            ],
          );

    return _drawLine(
      context,
      theme: theme,
      span: span,
      text: line.text,
      wrap: wrap,
      invisibles: invisibles,
      scale: scale,
    );
  }
}

/// The style one piece of a line is drawn in.
///
/// [struck] is for a line drawn from two, where a run that went out sits on the
/// same line as one that came in and the colour is all that would tell them
/// apart. So what went out is struck through as well, which is the mark for
/// text that is not there any more in every medium a reader has met it in.
TextStyle _styleOf(DiffineTheme theme, LinePiece piece, TextStyle base, {bool struck = false}) {
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
  TextStyle style = own ?? (kind == null ? base : base.copyWith(color: theme.code.of(kind)));

  if (struck && piece.kind == DiffEditKind.delete) {
    style = style.copyWith(decoration: TextDecoration.lineThrough);
  }

  return background == null ? style : style.copyWith(backgroundColor: background);
}

/// The text of a line, with the marks for its spaces and tabs behind it where
/// they are drawn.
Widget _drawLine(
  BuildContext context, {
  required DiffineTheme theme,
  required InlineSpan span,
  required String text,
  required bool wrap,
  required bool invisibles,
  required double scale,
}) {
  final Widget drawn = Text.rich(
    span,
    softWrap: wrap,
    overflow: wrap ? TextOverflow.clip : TextOverflow.visible,
    maxLines: wrap ? null : 1,
  );

  if (!invisibles || !text.contains(RegExp(r'[ \t]'))) {
    return drawn;
  }

  return CustomPaint(
    painter: _InvisiblesPainter(
      span: span,
      text: text,
      colour: theme.invisible,
      direction: Directionality.of(context),
      wrap: wrap,
      scale: scale,
    ),
    child: drawn,
  );
}

/// A pair of lines drawn as one: the text both share, with what went out and
/// what came in next to each other where they differ.
///
/// Each run that went out or came in has the word for it in front where only a
/// screen reader hears it. On a line that only went out or only came in, the
/// word in front of the line says which, and the marks inside it only say
/// where. Here the two are mixed in one line, and without a word on each run a
/// reader hears both versions run together as one sentence that neither
/// document holds.
///
/// What a reader copies out of it is the line of `after` it stands for. See
/// `copy.dart`.
class _MergedText extends StatelessWidget {
  const _MergedText({
    required this.theme,
    required this.merged,
    required this.strings,
    required this.wrap,
    required this.invisibles,
    required this.scale,
    this.highlight,
    this.matches,
    this.match,
  });

  final DiffineTheme theme;
  final MergedLine merged;
  final DiffineStrings strings;
  final bool wrap;
  final bool invisibles;
  final double scale;
  final DiffineHighlight? highlight;
  final List<SearchMatch>? matches;
  final SearchMatch? match;

  @override
  Widget build(BuildContext context) {
    final TextStyle base = theme.lineStyle;
    final List<SearchMatch>? matches = this.matches;
    final List<LineRange>? found = matches == null
        ? null
        : disjointRanges(<LineRange>[
            for (final SearchMatch each in matches)
              for (final LineSpan part in each.parts ?? <LineSpan>[LineSpan(each.start, each.end)])
                LineRange(part.start, part.end, current: each == match),
          ]);
    final DiffineHighlight? highlight = this.highlight;
    final List<DiffineToken>? tokens = highlight == null
        ? null
        : mergeTokens(
            merged,
            highlight(merged.before, DiffineSide.before),
            highlight(merged.after, DiffineSide.after),
          );
    final List<LinePiece> pieces = splitLine(merged.drawn, tokens, found) ?? const <LinePiece>[];
    final List<InlineSpan> children = <InlineSpan>[];
    DiffEditKind? previous;

    for (final LinePiece piece in pieces) {
      // Two runs next to each other are never the same kind, so a piece of a
      // different kind from the one before it is where a run starts.
      final bool starts = piece.kind != previous && piece.kind != DiffEditKind.equal;
      final String? word = !starts
          ? null
          : piece.kind == DiffEditKind.delete
          ? strings.removed
          : strings.added;

      children.add(
        TextSpan(
          text: piece.text,
          style: _styleOf(theme, piece, base, struck: true),
          semanticsLabel: word == null ? null : '$word: ${piece.text}',
        ),
      );
      previous = piece.kind;
    }

    return _drawLine(
      context,
      theme: theme,
      span: TextSpan(style: base, children: children),
      text: merged.drawn.text,
      wrap: wrap,
      invisibles: invisibles,
      scale: scale,
    );
  }
}

/// A line's text, registered with the pane's record of what is selected.
class _SelectableLine extends StatefulWidget {
  const _SelectableLine({
    required this.drawn,
    required this.row,
    required this.selection,
    required this.child,
  });

  final PaneLine drawn;
  final int row;
  final PaneSelection selection;
  final Widget child;

  @override
  State<_SelectableLine> createState() => _SelectableLineState();
}

class _SelectableLineState extends State<_SelectableLine> {
  late final LineSelection _line = LineSelection(
    drawn: widget.drawn,
    row: widget.row,
    pane: widget.selection,
  );

  @override
  void initState() {
    super.initState();
    widget.selection.attach(widget.row, _line);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _line.parent = SelectionContainer.maybeOf(context);
  }

  @override
  void didUpdateWidget(_SelectableLine old) {
    super.didUpdateWidget(old);

    if (old.row != widget.row || !identical(old.selection, widget.selection)) {
      old.selection.detach(old.row, _line);
      widget.selection.attach(widget.row, _line);
    }

    _line
      ..drawn = widget.drawn
      ..row = widget.row
      ..pane = widget.selection;
  }

  @override
  void dispose() {
    widget.selection.detach(widget.row, _line);
    _line.parent = null;
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SelectionRegistrarScope(registrar: _line, child: widget.child);
  }
}

/// The dots and rules that stand for a space and a tab.
///
/// Drawn behind the text rather than written into it, so what a reader copies
/// out is the line as it was written rather than a line with dots in it. The
/// boxes come from laying the same spans out again at the same width, which is
/// what makes the marks follow a line that wrapped.
///
/// The dot and the height of the rule off the bottom of the line are sized to
/// the text, so they are multiplied with it. The rule itself stays a hairline.
class _InvisiblesPainter extends CustomPainter {
  const _InvisiblesPainter({
    required this.span,
    required this.text,
    required this.colour,
    required this.direction,
    required this.wrap,
    required this.scale,
  });

  final InlineSpan span;
  final String text;
  final Color colour;
  final TextDirection direction;
  final bool wrap;
  final double scale;

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
            Rect.fromLTWH(box.left + 1, box.bottom - 3 * scale, (box.right - box.left) - 2, 1),
            brush,
          );
          continue;
        }

        final double step = (box.right - box.left) / (run.end - run.start);
        final double middle = (box.top + box.bottom) / 2;

        for (int at = 0; at < run.end - run.start; at += 1) {
          canvas.drawCircle(Offset(box.left + step * (at + 0.5), middle), 0.9 * scale, brush);
        }
      }
    }

    painter.dispose();
  }

  @override
  bool shouldRepaint(_InvisiblesPainter old) {
    return old.text != text || old.colour != colour || old.wrap != wrap || old.scale != scale;
  }
}
