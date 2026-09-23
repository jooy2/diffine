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
import 'dart:math' as math;
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

/// The mask of several pictures as something to draw over one of them.
///
/// [wanted] is which of the bits count: one picture's, for the pane that draws
/// that picture, or all of them for the pane that draws the baseline — because
/// the baseline is the one picture that disagrees with nothing, and a pane with
/// nothing marked on it is a pane that looks unchanged rather than agreed with.
///
/// One colour rather than three. `added` and `removed` are a pair's words:
/// whose arrival a pixel is depends on which picture is being asked about, and
/// the answer for a list is that they disagree.
Future<ui.Image?> paintBits(DiffImagesResult result, ui.Color colour, int wanted) {
  final int width = result.width;
  final int height = result.height;

  if (width <= 0 || height <= 0) {
    return Future<ui.Image?>.value();
  }

  final Uint8List painted = Uint8List(width * height * 4);
  final Uint32List words = Uint32List.view(painted.buffer);
  final int paint = _packed(colour);

  for (int pixel = 0; pixel < words.length; pixel += 1) {
    if ((result.mask[pixel] & wanted) != 0) {
      words[pixel] = paint;
    }
  }

  final Completer<ui.Image?> done = Completer<ui.Image?>();

  ui.decodeImageFromPixels(painted, width, height, ui.PixelFormat.rgba8888, done.complete);

  return done.future;
}

/// The same again, opaque, for cutting the pictures down to what disagrees.
Future<ui.Image?> stencilBits(DiffImagesResult result) =>
    paintBits(result, const ui.Color(0xffffffff), 0xff);

/// The mask again, opaque wherever anything happened and see-through
/// everywhere else.
///
/// What the tint above is for is saying which pixels changed. What this is for
/// is cutting the pictures down to them: drawn into a layer with
/// [BlendMode.dstIn], it leaves the parts of the picture that moved and takes
/// away the parts that did not. That is the whole of [DiffineImageUnchanged] —
/// the changed pixels of the picture itself, at full strength, over whatever
/// the rest of the frame has been reduced to.
///
/// A picture of its own rather than the tint drawn twice, because the tint
/// carries the palette's transparency in its pixels, and a stencil that is 55%
/// opaque cuts out a picture that is 55% there.
Future<ui.Image?> paintStencil(DiffImageResult result) {
  final int width = result.width;
  final int height = result.height;

  if (width <= 0 || height <= 0) {
    return Future<ui.Image?>.value();
  }

  final Uint8List painted = Uint8List(width * height * 4);
  final Uint32List words = Uint32List.view(painted.buffer);

  for (int pixel = 0; pixel < words.length; pixel += 1) {
    if (result.mask[pixel] != 0) {
      words[pixel] = 0xffffffff;
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
    this.unchanged = DiffineImageUnchanged.keep,
    this.mask,
    this.stencil,
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

  /// What is done with the pixels nothing happened to.
  final DiffineImageUnchanged unchanged;

  /// The mask as something to cut the pictures down to, for the modes that do.
  final ui.Image? stencil;

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
      other.unchanged == unchanged &&
      other.mask == mask &&
      other.stencil == stencil &&
      _same(other.layers, layers) &&
      _same(other.regions, regions);

  @override
  int get hashCode => Object.hash(
    frame,
    viewport,
    current,
    theme,
    unchanged,
    mask,
    stencil,
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

/// How much of a picture is left where the rest of it is drawn faint.
const double _faint = 0.2;

/// Puts the frame's coordinates under the drawing commands that follow.
void _look(Canvas canvas, DiffineImageViewport viewport, Size pane) {
  canvas
    ..translate(pane.width / 2, pane.height / 2)
    ..scale(viewport.scale)
    ..translate(-viewport.x, -viewport.y);
}

/// Two squares of the chequer and two of the ground, as a picture to repeat,
/// kept for each palette they have been drawn in.
final Map<(Color, Color), ui.Image> _tiles = <(Color, Color), ui.Image>{};

ui.Image _tileOf(DiffineImageColours colours) {
  return _tiles.putIfAbsent((colours.ground, colours.chequer), () {
    final ui.PictureRecorder recorder = ui.PictureRecorder();
    final Paint square = Paint()..color = colours.chequer;

    Canvas(recorder)
      ..drawRect(
        const Rect.fromLTWH(0, 0, _chequer * 2, _chequer * 2),
        Paint()..color = colours.ground,
      )
      ..drawRect(const Rect.fromLTWH(0, 0, _chequer, _chequer), square)
      ..drawRect(const Rect.fromLTWH(_chequer, _chequer, _chequer, _chequer), square);

    final ui.Picture picture = recorder.endRecording();
    final ui.Image tile = picture.toImageSync(_chequer.toInt() * 2, _chequer.toInt() * 2);

    picture.dispose();

    return tile;
  });
}

/// The squares that say a picture is see-through.
///
/// In the pane's own pixels rather than the frame's, so that the squares stay
/// the size of squares however far a reader has zoomed in — what they are
/// saying is "there is nothing here", and nothing does not have a resolution.
///
/// One rectangle filled with a repeated tile, over the part of the frame the
/// pane shows. It was a rectangle a square over the whole of the frame, which
/// is a number of draws that grows with the square of the zoom: a frame of a
/// few thousand pixels at eight times its size was two million of them, and
/// every one on each frame of a drag. The tile starts at the frame's corner, so
/// the squares move with the picture rather than with the pane.
void _paintChequer(Canvas canvas, Rect box, Size pane, DiffineImageColours colours) {
  final Rect shown = box.intersect(Offset.zero & pane);

  if (shown.isEmpty) {
    return;
  }

  canvas.drawRect(
    shown,
    Paint()
      ..shader = ImageShader(
        _tileOf(colours),
        TileMode.repeated,
        TileMode.repeated,
        Matrix4.translationValues(box.left, box.top, 0).storage,
        filterQuality: FilterQuality.none,
      ),
  );
}

/// One frame of the pane: the pictures, what changed, and where.
/// The pictures, drawn through the viewport onto whatever canvas is asked for.
///
/// [faint] is how much of each one is let through, on top of whatever the layer
/// itself asked for. It is what a picture whose unchanged half is being pushed
/// back is drawn at, and 1 everywhere else.
void _drawLayers(
  Canvas canvas,
  Size pane,
  PaneOptions options,
  FilterQuality quality,
  double faint,
) {
  final DiffineImageViewport viewport = options.viewport;

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
        ..color = Color.fromRGBO(0, 0, 0, layer.alpha * faint),
    );
    canvas.restore();
  }
}

/// One frame of the pane: the pictures, what changed, and where.
void paintPane(Canvas canvas, Size pane, PaneOptions options) {
  final DiffineImageViewport viewport = options.viewport;
  final Offset topLeft = paneAt(viewport, pane, 0, 0);
  final Offset bottomRight = paneAt(viewport, pane, options.frame.width, options.frame.height);
  final bool plain = options.unchanged != DiffineImageUnchanged.keep;

  canvas.clipRect(Offset.zero & pane);

  // The squares are the chequer's answer to "what is behind this picture", and
  // they are the wrong answer once the picture has been pushed back on purpose.
  // Then the ground is plain, and what it says is "this part did not change".
  if (bottomRight.dx > topLeft.dx && bottomRight.dy > topLeft.dy) {
    final Rect box = Rect.fromPoints(topLeft, bottomRight);

    if (plain) {
      canvas.drawRect(box, Paint()..color = options.theme.image.ground);
    } else {
      _paintChequer(canvas, box, pane, options.theme.image);
    }
  }

  // Crisp above its own size and smooth below it. A reader who has zoomed in to
  // four hundred per cent is counting pixels, and interpolation is exactly what
  // they zoomed in to see past.
  final FilterQuality quality = viewport.scale < 1 ? FilterQuality.medium : FilterQuality.none;
  final double faint = switch (options.unchanged) {
    DiffineImageUnchanged.keep => 1,
    DiffineImageUnchanged.dim => _faint,
    DiffineImageUnchanged.hide => 0,
  };

  if (faint > 0) {
    _drawLayers(canvas, pane, options, quality, faint);
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

  final ui.Image? stencil = options.stencil;

  /*
   * The pixels that changed, at full strength, over whatever the rest of the
   * frame was reduced to.
   *
   * Inside a layer of its own, because cutting a picture down to a shape means
   * taking away everything the shape does not cover — and on the canvas itself
   * that would take away the ground under it as well.
   */
  if (plain && stencil != null && options.layers.isNotEmpty) {
    canvas.saveLayer(Offset.zero & pane, Paint());
    _drawLayers(canvas, pane, options, quality, 1);

    canvas.save();
    _look(canvas, viewport, pane);
    canvas.drawImageRect(
      stencil,
      Rect.fromLTWH(0, 0, stencil.width.toDouble(), stencil.height.toDouble()),
      Rect.fromLTWH(0, 0, options.frame.width, options.frame.height),
      Paint()
        ..filterQuality = quality
        ..blendMode = BlendMode.dstIn,
    );
    canvas.restore();
    canvas.restore();
  }

  if (options.regions.isEmpty) {
    return;
  }

  /*
   * The outlines, in the pane's own pixels rather than the frame's, so that a
   * box round a change is a line one pixel wide however far in a reader has
   * gone — and not a line sixteen pixels wide with a picture behind it.
   *
   * One pixel wide, and two colours. A box has to be seen on whatever the
   * picture under it happens to be, and a picture is any colour it likes — a
   * dark box on the dark half of a photograph is a box nobody finds, and that
   * is where the changes are. So the line is drawn twice at the same width: the
   * contrasting colour solid, and the outline dashed over it. Whichever of the
   * two the picture matches, the other one is what shows, and what a reader
   * sees is one thin marquee rather than a border with a border round it.
   *
   * The change a reader has stepped to is solid rather than dashed, which is
   * what tells it from the rest without making it heavier.
   *
   * The dashes of every box go down in one call at the end, and only the ones
   * the pane can show are worked out at all. A change as large as the frame is
   * a box whose sides run far past the pane once a reader zooms in, and a dash
   * drawn apiece along the whole of them was thousands of calls a frame.
   */
  final Rect visible = (Offset.zero & pane).inflate(1);
  final List<double> dashes = <double>[];
  Paint? dashed;

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
    final Paint under = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = chosen ? 2 : 1
      ..color = options.theme.image.halo;
    final Paint over = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = chosen ? 2 : 1
      ..color = chosen ? options.theme.image.marker : options.theme.image.outline;

    canvas.drawRect(box, under);

    if (chosen) {
      canvas.drawRect(box, over);
    } else {
      dashed ??= over;
      _dashesOf(box, visible, dashes);
    }
  }

  if (dashed != null && dashes.isNotEmpty) {
    canvas.drawRawPoints(ui.PointMode.lines, Float32List.fromList(dashes), dashed);
  }
}

/// How long a dash is, and the gap after it.
const double _dash = 4;

/// The dashes of a rectangle that fall inside [visible], added to [into] as the
/// two ends of each, which is what [Canvas.drawRawPoints] draws lines between.
///
/// A canvas has no setting for a dashed stroke, so the pattern is worked out
/// here, and worked out from the rectangle's own corner rather than from
/// wherever the pane cuts it: a side that runs off the edge keeps its dashes
/// where they were, so they move with the picture instead of crawling along
/// the box as it is dragged. The phase carries from one side to the next, so
/// the four corners are not four places where the pattern starts again.
void _dashesOf(Rect box, Rect visible, List<double> into) {
  // Each side as where it starts, which way it runs, and how long it is.
  final List<(Offset, Offset, double)> sides = <(Offset, Offset, double)>[
    (box.topLeft, const Offset(1, 0), box.width),
    (box.topRight, const Offset(0, 1), box.height),
    (box.bottomRight, const Offset(-1, 0), box.width),
    (box.bottomLeft, const Offset(0, -1), box.height),
  ];
  double travelled = 0;

  for (final (Offset from, Offset step, double length) in sides) {
    final (double, double)? span = _spanWithin(from, step, length, visible);

    if (span != null) {
      final (double first, double last) = span;
      // The dash this stretch of the side starts in, counted round the box.
      double at = ((travelled + first) / (_dash * 2)).floorToDouble() * _dash * 2 - travelled;

      while (at <= last) {
        final double start = math.max(at, first);
        final double end = math.min(at + _dash, last);

        if (end > start) {
          final Offset a = from + step * start;
          final Offset b = from + step * end;

          into.addAll(<double>[a.dx, a.dy, b.dx, b.dy]);
        }

        at += _dash * 2;
      }
    }

    travelled += length;
  }
}

/// How far along a side it enters [visible] and how far along it leaves, or
/// `null` where it never does.
///
/// The sides of a box are level or upright, so one of the two directions
/// decides whether the side is in view at all and the other how much of it is.
(double, double)? _spanWithin(Offset from, Offset step, double length, Rect visible) {
  if (length <= 0) {
    return null;
  }

  final bool level = step.dy == 0;
  final double across = level ? from.dy : from.dx;

  if (across < (level ? visible.top : visible.left) ||
      across > (level ? visible.bottom : visible.right)) {
    return null;
  }

  final double start = level ? from.dx : from.dy;
  final double direction = level ? step.dx : step.dy;
  final double least = level ? visible.left : visible.top;
  final double most = level ? visible.right : visible.bottom;
  // Where the side crosses the two edges, as distances along it.
  final double one = (least - start) / direction;
  final double other = (most - start) / direction;
  final double first = math.max(0, math.min(one, other));
  final double last = math.min(length, math.max(one, other));

  return last > first ? (first, last) : null;
}
