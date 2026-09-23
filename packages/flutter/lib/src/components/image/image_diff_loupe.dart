/// The pixels under the pointer, at the size a reader can count them.
///
/// Two panes at four hundred per cent answer "these are different" and stop
/// there. What is asked next is what the two actually are, and no amount of
/// zoom answers it: a pixel on a screen is a colour a reader has to take a
/// guess at. So the loupe says both — a square of each picture magnified far
/// enough that a pixel is a tile, and underneath it the colour of the middle
/// one written out.
///
/// Both sides, whichever pane the pointer is over. A split view has one picture
/// a pane and the question is never about one of them, which is also why the
/// panel belongs to the comparison rather than to a pane: it sits over both.
///
/// It stays where it is put. A panel that moves itself out from under the
/// pointer is a panel a reader watches instead of the picture, so it starts on
/// the side away from the pane being read and then only moves when it is
/// dragged.
library;

import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:diffine/src/components/shared/diffine_icons.dart';
import 'package:diffine/src/internal/image/loupe.dart';
import 'package:diffine/src/internal/scale.dart';
import 'package:diffine/src/theme/tokens.dart';
import 'package:diffine/src/types.dart';
import 'package:flutter/widgets.dart';

/// How large one magnified pixel is, in logical pixels at a scale of 1.
const double _tile = 12;

/// How few pixels fit across one square.
const int kLeastLoupeSpan = 3;

/// And how many.
const int kMostLoupeSpan = 41;

/// How large one magnified pixel is at a scale.
///
/// A whole number of logical pixels, so that the grid between the tiles lands
/// on the same place in every one of them rather than drifting across the
/// square — which is also what the React package draws.
double _tileAt(double scale) => math.max(1, (_tile * scale).roundToDouble());

/// The size a span comes out as, in logical pixels.
double _sizeOf(int span, double scale) => span * _tileAt(scale);

/// A span a reader dragged to: odd, so that one pixel is the middle one.
///
/// Counted in tiles at the scale they are drawn at, so a pull of the corner
/// adds a pixel for every tile it crosses whatever size the tiles are.
int _spanOf(double size, double scale) {
  final int tiles = (size / _tileAt(scale)).round();
  final int odd = tiles.isEven ? tiles + 1 : tiles;

  return odd.clamp(kLeastLoupeSpan, kMostLoupeSpan);
}

/// The panel itself.
class ImageDiffLoupe extends StatefulWidget {
  /// One loupe.
  const ImageDiffLoupe({
    required this.theme,
    required this.samples,
    required this.at,
    required this.span,
    required this.onSpan,
    required this.onMove,
    required this.onGrabbed,
    required this.strings,
    super.key,
  });

  /// The palette it is drawn in.
  final DiffineTheme theme;

  /// Both sides, in the order they are read.
  final List<LoupeSample> samples;

  /// Where the pointer is, in the frame's own coordinates.
  final Offset at;

  /// How many pixels across one square shows.
  final int span;

  /// A reader pulled the corner.
  final ValueChanged<int> onSpan;

  /// A reader dragged the handle, to somewhere in the comparison's own pixels.
  final ValueChanged<Offset> onMove;

  /// A handle was taken hold of, or let go.
  ///
  /// A drag that ends past the edge of the comparison is a pointer that has
  /// left it, and the panel would go away under the hand that was moving it.
  /// This is what says to keep it until the hand lets go.
  final ValueChanged<bool> onGrabbed;

  /// The words.
  final DiffineStrings strings;

  @override
  State<ImageDiffLoupe> createState() => _ImageDiffLoupeState();
}

class _ImageDiffLoupeState extends State<ImageDiffLoupe> {
  Offset _from = Offset.zero;
  Offset _place = Offset.zero;
  int _span = 0;

  void _grab(DragStartDetails details) {
    final RenderBox? panel = context.findRenderObject() as RenderBox?;
    final RenderBox? within = panel?.parent as RenderBox?;

    _from = details.globalPosition;
    _span = widget.span;
    _place = panel == null || within == null
        ? Offset.zero
        : within.globalToLocal(panel.localToGlobal(Offset.zero));
    widget.onGrabbed(true);
  }

  void _move(DragUpdateDetails details) {
    final RenderBox? panel = context.findRenderObject() as RenderBox?;
    final RenderBox? within = panel?.parent as RenderBox?;
    final Offset moved = details.globalPosition - _from;
    final Size room = panel == null || within == null
        ? Size.zero
        : Size(
            math.max(0, within.size.width - panel.size.width),
            math.max(0, within.size.height - panel.size.height),
          );

    widget.onMove(
      Offset(
        (_place.dx + moved.dx).clamp(0, room.width),
        (_place.dy + moved.dy).clamp(0, room.height),
      ),
    );
  }

  void _resize(DragUpdateDetails details) {
    final Offset moved = details.globalPosition - _from;
    // The panel is as many squares wide as there are sides, so a pull sideways
    // is shared between them and a pull downwards is not.
    final double across = widget.samples.isEmpty ? moved.dx : moved.dx / widget.samples.length;
    final double scale = DiffineScale.of(context);

    widget.onSpan(_spanOf(_sizeOf(_span, scale) + math.max(across, moved.dy), scale));
  }

  void _letGo() => widget.onGrabbed(false);

  @override
  Widget build(BuildContext context) {
    final DiffineTheme theme = widget.theme;
    final double scale = DiffineScale.of(context);
    final TextStyle caption = TextStyle(
      fontFamily: theme.fontFamily,
      fontFamilyFallback: theme.fontFamilyFallback,
      fontSize: 11 * scale,
      height: 1.2,
      color: theme.muted,
    );

    return Container(
      padding: EdgeInsets.all(6 * scale),
      decoration: BoxDecoration(
        color: theme.surface,
        border: Border.all(color: theme.border),
        // Less round than the frame by a step the panel draws itself. The
        // frame's radius stays what the theme says, and the step follows the
        // scale.
        borderRadius: BorderRadius.circular(math.max(0, theme.radius - 2 * scale)),
        boxShadow: const <BoxShadow>[
          BoxShadow(color: Color(0x29000000), blurRadius: 8, offset: Offset(0, 2)),
        ],
      ),
      child: Stack(
        children: <Widget>[
          Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                mainAxisSize: MainAxisSize.min,
                children: <Widget>[
                  _Handle(
                    colour: theme.muted,
                    label: widget.strings.loupeMove,
                    cursor: SystemMouseCursors.move,
                    onStart: _grab,
                    onUpdate: _move,
                    onEnd: _letGo,
                    child: const DiffineIcons(DiffineIcon.move),
                  ),
                  SizedBox(width: 4 * scale),
                  Text(
                    '${widget.strings.at} ${widget.at.dx.floor()}, ${widget.at.dy.floor()}',
                    style: caption,
                  ),
                ],
              ),
              SizedBox(height: 4 * scale),
              Row(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  for (final LoupeSample sample in widget.samples) ...<Widget>[
                    _Side(
                      theme: theme,
                      sample: sample,
                      at: widget.at,
                      span: widget.span,
                      style: caption,
                      scale: scale,
                    ),
                    if (sample != widget.samples.last) SizedBox(width: 6 * scale),
                  ],
                ],
              ),
            ],
          ),
          Positioned(
            right: 0,
            bottom: 0,
            child: _Handle(
              colour: theme.muted,
              label: widget.strings.loupeSize,
              cursor: SystemMouseCursors.resizeDownRight,
              onStart: _grab,
              onUpdate: _resize,
              onEnd: _letGo,
              child: const DiffineIcons(DiffineIcon.grip),
            ),
          ),
        ],
      ),
    );
  }
}

/// One of the two things a reader can take hold of.
class _Handle extends StatelessWidget {
  const _Handle({
    required this.colour,
    required this.label,
    required this.cursor,
    required this.onStart,
    required this.onUpdate,
    required this.onEnd,
    required this.child,
  });

  final Color colour;
  final String label;
  final MouseCursor cursor;
  final GestureDragStartCallback onStart;
  final GestureDragUpdateCallback onUpdate;
  final VoidCallback onEnd;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final double scale = DiffineScale.of(context);

    return Semantics(
      label: label,
      child: MouseRegion(
        cursor: cursor,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onPanStart: onStart,
          onPanUpdate: onUpdate,
          onPanEnd: (DragEndDetails _) => onEnd(),
          onPanCancel: onEnd,
          child: Padding(
            padding: EdgeInsets.all(2 * scale),
            child: DefaultTextStyle.merge(
              style: TextStyle(color: colour),
              child: child,
            ),
          ),
        ),
      ),
    );
  }
}

/// One picture's square, and the colour of the pixel in the middle of it.
class _Side extends StatelessWidget {
  const _Side({
    required this.theme,
    required this.sample,
    required this.at,
    required this.span,
    required this.style,
    required this.scale,
  });

  final DiffineTheme theme;
  final LoupeSample sample;
  final Offset at;
  final int span;

  /// What the panel writes its words in, already at the comparison's scale.
  final TextStyle style;
  final double scale;

  @override
  Widget build(BuildContext context) {
    final double size = _sizeOf(span, scale);
    final ui.Color? colour = colourAt(sample, at.dx, at.dy);

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            border: Border.all(color: theme.border),
            borderRadius: BorderRadius.circular(2),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(2),
            child: CustomPaint(
              painter: _TilesPainter(
                theme: theme,
                sample: sample,
                at: at,
                span: span,
                scale: scale,
              ),
              size: Size(size, size),
            ),
          ),
        ),
        SizedBox(height: 4 * scale),
        SizedBox(
          width: size,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(sample.label, maxLines: 1, overflow: TextOverflow.ellipsis, style: style),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: <Widget>[
                  if (colour != null) ...<Widget>[
                    Container(
                      width: 10 * scale,
                      height: 10 * scale,
                      decoration: BoxDecoration(
                        color: colour,
                        border: Border.all(color: theme.border),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    SizedBox(width: 4 * scale),
                  ],
                  Text(
                    colour == null ? '—' : hexOf(colour),
                    style: style.copyWith(color: theme.text),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// The square of the picture around the pointer, a tile a pixel.
///
/// The tiles are drawn at the comparison's scale, since they are the panel's
/// own size. The grid and the box round the middle one are lines, and stay as
/// thick as they are.
class _TilesPainter extends CustomPainter {
  const _TilesPainter({
    required this.theme,
    required this.sample,
    required this.at,
    required this.span,
    required this.scale,
  });

  final DiffineTheme theme;
  final LoupeSample sample;
  final Offset at;
  final int span;
  final double scale;

  @override
  void paint(Canvas canvas, Size size) {
    /*
     * Drawn without interpolation — a tile a pixel is the whole point, and a
     * renderer asked to make it smooth would give back the blur a reader zoomed
     * in to see past.
     *
     * Clipped by hand rather than by the renderer, which would take a source
     * rectangle hanging off the edge of a picture and fit what it found to the
     * whole destination — sliding every tile off the grid at the one place a
     * reader is most likely to be looking.
     */
    final double tile = _tileAt(scale);
    final ({int x, int y}) middle = pixelAt(sample, at.dx, at.dy);
    final double fromX = middle.x - (span - 1) / 2;
    final double fromY = middle.y - (span - 1) / 2;
    final double left = math.max(0, fromX);
    final double top = math.max(0, fromY);
    final double right = math.min(sample.picture.drawable.width.toDouble(), fromX + span);
    final double bottom = math.min(sample.picture.drawable.height.toDouble(), fromY + span);

    if (right > left && bottom > top) {
      canvas.drawImageRect(
        sample.picture.drawable,
        Rect.fromLTRB(left, top, right, bottom),
        Rect.fromLTWH(
          (left - fromX) * tile,
          (top - fromY) * tile,
          (right - left) * tile,
          (bottom - top) * tile,
        ),
        Paint()..filterQuality = FilterQuality.none,
      );
    }

    // The grid, which is what turns a magnified picture into pixels somebody
    // can count, and then the box round the one the pointer is on.
    final Paint grid = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1
      ..color = theme.image.outline.withValues(alpha: theme.image.outline.a * 0.35);

    for (int line = 1; line < span; line += 1) {
      canvas
        ..drawLine(Offset(line * tile + 0.5, 0), Offset(line * tile + 0.5, size.height), grid)
        ..drawLine(Offset(0, line * tile + 0.5), Offset(size.width, line * tile + 0.5), grid);
    }

    final double centre = ((span - 1) / 2) * tile;
    final Rect box = Rect.fromLTWH(centre - 0.5, centre - 0.5, tile + 1, tile + 1);

    canvas
      ..drawRect(
        box,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 3
          ..color = theme.image.halo,
      )
      ..drawRect(
        box,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.5
          ..color = theme.image.marker,
      );
  }

  @override
  bool shouldRepaint(_TilesPainter old) =>
      old.sample != sample ||
      old.at != at ||
      old.span != span ||
      old.theme != theme ||
      old.scale != scale;
}
