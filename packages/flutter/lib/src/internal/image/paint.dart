/// Putting a comparison on a canvas.
///
/// Two jobs, and they run at different times. The mask is turned into something
/// drawable once, when the comparison changes or the palette does — it is a
/// picture the size of the frame, and building it is not something to do while
/// a reader is dragging. The pane is painted on every frame of that drag, and
/// does as little as a paint can: set a transform, draw two or three images
/// through it, stroke a few rectangles.
///
/// Everything is drawn through the same transform rather than cut out and
/// scaled by hand. The engine clips and samples an image far better than
/// arithmetic here would, and it does it on the graphics card — which is the
/// difference between a picture that follows the pointer and one that catches
/// up with it.
library;

import 'dart:async';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:diffine/src/internal/image/compare.dart';
import 'package:diffine/src/internal/image/decode.dart';
import 'package:diffine/src/internal/image/viewport.dart';
import 'package:diffine/src/theme/tokens.dart';
import 'package:diffine/src/types.dart';
import 'package:flutter/widgets.dart';

/// One colour, packed the way a premultiplied `rgba8888` buffer wants it.
int _packed(Color colour) {
  final double alpha = colour.a;
  final int red = (colour.r * alpha * 255).round();
  final int green = (colour.g * alpha * 255).round();
  final int blue = (colour.b * alpha * 255).round();
  final int opacity = (alpha * 255).round();

  return (opacity << 24) | (blue << 16) | (green << 8) | red;
}

/// The mask as a picture the size of the frame, ready to be drawn over either
/// side.
///
/// Written a word at a time rather than a byte at a time. The mask is one byte
/// a pixel and the surface is four, so the loop is a lookup and a store per
/// pixel — which is what keeps a frame of ten million pixels somewhere around a
/// hundredth of what comparing it cost.
Future<ui.Image?> paintMask(DiffImageResult result, DiffineImageColours colours) {
  final int width = result.width;
  final int height = result.height;

  if (width <= 0 || height <= 0) {
    return Future<ui.Image?>.value();
  }

  final Uint8List painted = Uint8List(width * height * 4);
  final Uint32List words = Uint32List.view(painted.buffer);
  final Uint32List paints = Uint32List(4);

  paints[kChanged] = _packed(colours.changed);
  paints[kAdded] = _packed(colours.added);
  paints[kRemoved] = _packed(colours.removed);

  for (int pixel = 0; pixel < words.length; pixel += 1) {
    final int kind = result.mask[pixel];

    if (kind != 0) {
      words[pixel] = paints[kind];
    }
  }

  final Completer<ui.Image?> done = Completer<ui.Image?>();

  ui.decodeImageFromPixels(painted, width, height, ui.PixelFormat.rgba8888, done.complete);

  return done.future;
}

/// One picture drawn into a pane, and how much of the pane it is drawn in.
class Layer {
  /// One layer.
  const Layer({required this.picture, required this.area, this.alpha = 1, this.from, this.to});

  /// What is drawn.
  final Picture picture;

  /// Where it sits in the frame.
  final DiffImageArea area;

  /// How much of it is let through, from 0 to 1.
  final double alpha;

  /// The slice of the pane it is drawn in, across from 0 to 1.
  final double? from;

  /// And where that slice ends.
  final double? to;

  @override
  bool operator ==(Object other) =>
      other is Layer &&
      other.picture == picture &&
      other.area.x == area.x &&
      other.area.y == area.y &&
      other.area.width == area.width &&
      other.area.height == area.height &&
      other.alpha == alpha &&
      other.from == from &&
      other.to == to;

  @override
  int get hashCode =>
      Object.hash(picture, area.x, area.y, area.width, area.height, alpha, from, to);
}

/// Everything one frame of a pane is painted from.
class PaneOptions {
  /// One frame's worth.
  const PaneOptions({
    required this.frame,
    required this.viewport,
    required this.layers,
    required this.regions,
    required this.current,
    required this.theme,
    this.mask,
  });

  /// How large the frame is.
  final Size frame;

  /// Where the reader is looking.
  final DiffineImageViewport viewport;

  /// What is drawn, in order.
  final List<Layer> layers;

  /// The boxes round the changes.
  final List<DiffImageRegion> regions;

  /// Which region a reader has stepped to, or -1.
  final int current;

  /// The palette.
  final DiffineTheme theme;

  /// The mask as a picture, or `null` where the marks are turned off.
  final ui.Image? mask;

  /// Whether the next frame would draw exactly what this one did.
  ///
  /// This is what `shouldRepaint` reads, and it is worth the lines. A pane is
  /// handed a new options object on every build of whatever screen it is on,
  /// and a comparison of two photographs painted again is three images through
  /// a transform and a box for every change in them — for a rebuild that had
  /// nothing to do with the pictures.
  @override
  bool operator ==(Object other) =>
      other is PaneOptions &&
      other.frame == frame &&
      other.viewport == viewport &&
      other.current == current &&
      other.theme == theme &&
      other.mask == mask &&
      _same(other.layers, layers) &&
      _same(other.regions, regions);

  @override
  int get hashCode => Object.hash(
    frame,
    viewport,
    current,
    theme,
    mask,
    Object.hashAll(layers),
    Object.hashAll(regions),
  );
}

/// Whether two lists hold the same things in the same order.
bool _same<T>(List<T> one, List<T> other) {
  if (identical(one, other)) {
    return true;
  }

  if (one.length != other.length) {
    return false;
  }

  for (int at = 0; at < one.length; at += 1) {
    if (one[at] != other[at]) {
      return false;
    }
  }

  return true;
}

/// How large one square of the transparency chequer is, in pane pixels.
const double _chequer = 8;

/// Puts the frame's coordinates under the drawing commands that follow.
void _look(Canvas canvas, DiffineImageViewport viewport, Size pane) {
  canvas
    ..translate(pane.width / 2, pane.height / 2)
    ..scale(viewport.scale)
    ..translate(-viewport.x, -viewport.y);
}

/// The squares that say a picture is see-through.
///
/// In the pane's own pixels rather than the frame's, so that the squares stay
/// the size of squares however far a reader has zoomed in — what they are
/// saying is "there is nothing here", and nothing does not have a resolution.
void _paintChequer(Canvas canvas, Rect box, DiffineImageColours colours) {
  canvas
    ..save()
    ..clipRect(box)
    ..drawRect(box, Paint()..color = colours.ground);

  final Paint square = Paint()..color = colours.chequer;
  final int columns = (box.width / _chequer).ceil() + 1;
  final int rows = (box.height / _chequer).ceil() + 1;

  for (int row = 0; row < rows; row += 1) {
    for (int column = row.isEven ? 0 : 1; column < columns; column += 2) {
      canvas.drawRect(
        Rect.fromLTWH(box.left + column * _chequer, box.top + row * _chequer, _chequer, _chequer),
        square,
      );
    }
  }

  canvas.restore();
}

/// One frame of the pane: the pictures, what changed, and where.
void paintPane(Canvas canvas, Size pane, PaneOptions options) {
  final DiffineImageViewport viewport = options.viewport;
  final Offset topLeft = paneAt(viewport, pane, 0, 0);
  final Offset bottomRight = paneAt(viewport, pane, options.frame.width, options.frame.height);

  canvas.clipRect(Offset.zero & pane);

  if (bottomRight.dx > topLeft.dx && bottomRight.dy > topLeft.dy) {
    _paintChequer(canvas, Rect.fromPoints(topLeft, bottomRight), options.theme.image);
  }

  // Crisp above its own size and smooth below it. A reader who has zoomed in to
  // four hundred per cent is counting pixels, and interpolation is exactly what
  // they zoomed in to see past.
  final FilterQuality quality = viewport.scale < 1 ? FilterQuality.medium : FilterQuality.none;

  for (final Layer layer in options.layers) {
    final double? from = layer.from;
    final double? to = layer.to;

    if (layer.alpha == 0 || (from != null && to != null && from >= to)) {
      continue;
    }

    canvas.save();

    if (from != null || to != null) {
      final double left = (from ?? 0) * pane.width;

      canvas.clipRect(Rect.fromLTWH(left, 0, (to ?? 1) * pane.width - left, pane.height));
    }

    _look(canvas, viewport, pane);
    canvas.drawImageRect(
      layer.picture.drawable,
      Rect.fromLTWH(
        0,
        0,
        layer.picture.drawable.width.toDouble(),
        layer.picture.drawable.height.toDouble(),
      ),
      Rect.fromLTWH(
        layer.area.x.toDouble(),
        layer.area.y.toDouble(),
        layer.area.width.toDouble(),
        layer.area.height.toDouble(),
      ),
      Paint()
        ..filterQuality = quality
        ..color = Color.fromRGBO(0, 0, 0, layer.alpha),
    );
    canvas.restore();
  }

  final ui.Image? mask = options.mask;

  if (mask != null) {
    canvas.save();
    _look(canvas, viewport, pane);
    canvas.drawImageRect(
      mask,
      Rect.fromLTWH(0, 0, mask.width.toDouble(), mask.height.toDouble()),
      Rect.fromLTWH(0, 0, options.frame.width, options.frame.height),
      Paint()..filterQuality = quality,
    );
    canvas.restore();
  }

  if (options.regions.isEmpty) {
    return;
  }

  // The outlines are drawn in the pane's own pixels rather than the frame's, so
  // that a box round a change is a line one pixel wide however far in a reader
  // has gone — and not a line sixteen pixels wide with a picture behind it.
  //
  // Each one is drawn twice: a wider line in the colour that contrasts with the
  // palette, and the line itself on top of it. A single line cannot be seen on
  // every picture, because a picture is whatever colour it is — a dark box on
  // the dark half of a photograph is a box nobody finds, and it was exactly
  // where the changes tend to be. A pair always shows, whichever of the two the
  // picture underneath happens to match.
  for (int index = 0; index < options.regions.length; index += 1) {
    final DiffImageRegion region = options.regions[index];
    final Offset start = paneAt(viewport, pane, region.x.toDouble(), region.y.toDouble());
    final Offset end = paneAt(
      viewport,
      pane,
      (region.x + region.width).toDouble(),
      (region.y + region.height).toDouble(),
    );

    if (end.dx < 0 || end.dy < 0 || start.dx > pane.width || start.dy > pane.height) {
      continue;
    }

    final bool chosen = index == options.current;
    final Rect box = Rect.fromLTWH(
      start.dx.roundToDouble() - 0.5,
      start.dy.roundToDouble() - 0.5,
      (end.dx - start.dx).roundToDouble().clamp(2, double.infinity) + 1,
      (end.dy - start.dy).roundToDouble().clamp(2, double.infinity) + 1,
    );

    canvas.drawRect(
      box,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = chosen ? 4 : 3
        ..color = options.theme.image.halo,
    );
    canvas.drawRect(
      box,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = chosen ? 2 : 1
        ..color = chosen ? options.theme.image.marker : options.theme.image.outline,
    );
  }
}
