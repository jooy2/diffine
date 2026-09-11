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
/// a pane and the question is never about one of them.
library;

import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:diffine/src/internal/image/loupe.dart';
import 'package:diffine/src/theme/tokens.dart';
import 'package:diffine/src/types.dart';
import 'package:flutter/widgets.dart';

/// How large one magnified pixel is, in logical pixels.
const double _tile = 12;

/// The panel itself.
class ImageDiffLoupe extends StatelessWidget {
  /// One loupe.
  const ImageDiffLoupe({
    required this.theme,
    required this.samples,
    required this.at,
    required this.strings,
    super.key,
  });

  /// The palette it is drawn in.
  final DiffineTheme theme;

  /// Both sides, in the order they are read.
  final List<LoupeSample> samples;

  /// Where the pointer is, in the frame's own coordinates.
  final Offset at;

  /// The words.
  final DiffineStrings strings;

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: theme.surface,
          border: Border.all(color: theme.border),
          borderRadius: BorderRadius.circular(math.max(0, theme.radius - 2)),
          boxShadow: const <BoxShadow>[
            BoxShadow(color: Color(0x29000000), blurRadius: 8, offset: Offset(0, 2)),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                for (final LoupeSample sample in samples) ...<Widget>[
                  _Side(theme: theme, sample: sample, at: at),
                  if (sample != samples.last) const SizedBox(width: 6),
                ],
              ],
            ),
            const SizedBox(height: 4),
            Text(
              '${strings.at} ${at.dx.floor()}, ${at.dy.floor()}',
              style: TextStyle(
                fontFamily: theme.fontFamily,
                fontFamilyFallback: theme.fontFamilyFallback,
                fontSize: 11,
                height: 1.2,
                color: theme.muted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// One picture's square, and the colour of the pixel in the middle of it.
class _Side extends StatelessWidget {
  const _Side({required this.theme, required this.sample, required this.at});

  final DiffineTheme theme;
  final LoupeSample sample;
  final Offset at;

  @override
  Widget build(BuildContext context) {
    final double size = kLoupeSpan * _tile;
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
              painter: _TilesPainter(theme: theme, sample: sample, at: at),
              size: Size(size, size),
            ),
          ),
        ),
        const SizedBox(height: 4),
        SizedBox(
          width: size,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(
                sample.label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontFamily: theme.fontFamily,
                  fontFamilyFallback: theme.fontFamilyFallback,
                  fontSize: 11,
                  height: 1.2,
                  color: theme.muted,
                ),
              ),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: <Widget>[
                  if (colour != null) ...<Widget>[
                    Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: colour,
                        border: Border.all(color: theme.border),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(width: 4),
                  ],
                  Text(
                    colour == null ? '—' : hexOf(colour),
                    style: TextStyle(
                      fontFamily: theme.fontFamily,
                      fontFamilyFallback: theme.fontFamilyFallback,
                      fontSize: 11,
                      height: 1.2,
                      color: theme.text,
                    ),
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
class _TilesPainter extends CustomPainter {
  const _TilesPainter({required this.theme, required this.sample, required this.at});

  final DiffineTheme theme;
  final LoupeSample sample;
  final Offset at;

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
    final ({int x, int y}) middle = pixelAt(sample, at.dx, at.dy);
    final double fromX = middle.x - (kLoupeSpan - 1) / 2;
    final double fromY = middle.y - (kLoupeSpan - 1) / 2;
    final double left = math.max(0, fromX);
    final double top = math.max(0, fromY);
    final double right = math.min(sample.picture.drawable.width.toDouble(), fromX + kLoupeSpan);
    final double bottom = math.min(sample.picture.drawable.height.toDouble(), fromY + kLoupeSpan);

    if (right > left && bottom > top) {
      canvas.drawImageRect(
        sample.picture.drawable,
        Rect.fromLTRB(left, top, right, bottom),
        Rect.fromLTWH(
          (left - fromX) * _tile,
          (top - fromY) * _tile,
          (right - left) * _tile,
          (bottom - top) * _tile,
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

    for (int line = 1; line < kLoupeSpan; line += 1) {
      canvas
        ..drawLine(Offset(line * _tile + 0.5, 0), Offset(line * _tile + 0.5, size.height), grid)
        ..drawLine(Offset(0, line * _tile + 0.5), Offset(size.width, line * _tile + 0.5), grid);
    }

    final double centre = ((kLoupeSpan - 1) / 2) * _tile;
    final Rect box = Rect.fromLTWH(centre - 0.5, centre - 0.5, _tile + 1, _tile + 1);

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
      old.sample != sample || old.at != at || old.theme != theme;
}
