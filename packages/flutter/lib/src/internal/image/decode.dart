/// Turning what an application handed over into something to draw and
/// something to compare.
///
/// Two answers come out of one decode, and they are not the same thing. A pane
/// draws a picture, which is a job for a [ui.Image] — held where the graphics
/// card can reach it. The engine reads a picture, which is four bytes a pixel
/// in ordinary memory. There is no representation that is both, so both are
/// made once and kept.
///
/// The cap on how large that is exists for the same reason. A photograph from a
/// modern camera is twenty-four million pixels; two of them, as images and as
/// buffers, is most of a gigabyte before anything has been compared. Past
/// `maxPixels` a picture is decoded smaller — which is a decision to draw a
/// picture slightly soft rather than to take the app down, and it is the
/// application's to change.
library;

import 'dart:async';
import 'dart:math' as math;
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:diffine/src/types.dart';
import 'package:flutter/foundation.dart' show kIsWeb;

/// A picture, ready to be drawn and ready to be compared.
class Picture {
  /// One decoded picture.
  const Picture({
    required this.drawable,
    required this.pixels,
    required this.width,
    required this.height,
    required this.bytes,
    required this.reduced,
    required this.owned,
  });

  /// What a pane draws.
  final ui.Image drawable;

  /// What the engine reads.
  final DiffPixels pixels;

  /// How wide it is, once any reduction has been applied.
  final int width;

  /// How tall.
  final int height;

  /// What the file weighed, or what the pixels weigh where there was no file.
  final int bytes;

  /// Whether it had to be decoded smaller than it is.
  final bool reduced;

  /// Whether the drawable is the widget's to throw away.
  ///
  /// A picture the application passed in is the application's, and disposing of
  /// it because an argument changed would break a picture somebody else is
  /// still holding. Everything decoded or redrawn here is ours, and is
  /// disposed.
  final bool owned;
}

/// How much smaller a picture has to be decoded to fit inside `maxPixels`.
double _reductionOf(int width, int height, int maxPixels) {
  final int area = width * height;

  return area > maxPixels && maxPixels > 0 ? math.sqrt(maxPixels / area) : 1;
}

/// The pixels of something already drawable.
Future<DiffPixels> _pixelsOf(ui.Image image) async {
  final ByteData? data = await image.toByteData(format: ui.ImageByteFormat.rawRgba);

  if (data == null) {
    throw StateError('diffine: that picture gave no pixels to compare.');
  }

  return DiffPixels(
    data: data.buffer.asUint8List(data.offsetInBytes, data.lengthInBytes),
    width: image.width,
    height: image.height,
  );
}

/// A buffer of pixels as something a canvas can draw.
Future<ui.Image> _imageOf(DiffPixels pixels) {
  final Completer<ui.Image> done = Completer<ui.Image>();

  ui.decodeImageFromPixels(
    pixels.data,
    pixels.width,
    pixels.height,
    ui.PixelFormat.rgba8888,
    done.complete,
  );

  return done.future;
}

/// The same picture, drawn smaller.
Future<ui.Image> _reduce(ui.Image source, int width, int height) async {
  final ui.PictureRecorder recorder = ui.PictureRecorder();
  final ui.Canvas canvas = ui.Canvas(recorder);

  canvas.drawImageRect(
    source,
    ui.Rect.fromLTWH(0, 0, source.width.toDouble(), source.height.toDouble()),
    ui.Rect.fromLTWH(0, 0, width.toDouble(), height.toDouble()),
    ui.Paint()..filterQuality = ui.FilterQuality.high,
  );

  final ui.Picture picture = recorder.endRecording();
  final ui.Image reduced = await picture.toImage(width, height);

  picture.dispose();

  return reduced;
}

/// A decoded picture, brought inside the cap where the decoder did not do it.
///
/// Asking the decoder for a smaller picture is always better than drawing one
/// and shrinking it, because the full-size picture is then never built at all.
/// It is not always possible, which is what this is for: whatever came out is
/// measured, and anything still over the cap is drawn once at the size it is
/// going to be used at.
Future<Picture> _fitted(ui.Image image, int maxPixels, int weight, {required bool reduced}) async {
  final double scale = _reductionOf(image.width, image.height, maxPixels);

  if (scale == 1) {
    return Picture(
      drawable: image,
      pixels: await _pixelsOf(image),
      width: image.width,
      height: image.height,
      bytes: weight,
      reduced: reduced,
      owned: true,
    );
  }

  final int width = math.max(1, (image.width * scale).round());
  final int height = math.max(1, (image.height * scale).round());
  final ui.Image smaller = await _reduce(image, width, height);

  image.dispose();

  return Picture(
    drawable: smaller,
    pixels: await _pixelsOf(smaller),
    width: width,
    height: height,
    bytes: weight,
    reduced: true,
    owned: true,
  );
}

/// Everything a pane and the engine need, out of whichever of the three shapes
/// the application passed.
///
/// A buffer of pixels goes onto an image and stays there, because it is already
/// the thing the engine wants and only the drawing is missing. A file or a
/// decoded picture goes the other way: the drawing is what arrived, and the
/// pixels are read back off it.
Future<Picture> decodeImage(DiffineImageContent content, int maxPixels) async {
  switch (content) {
    case DiffinePixelImage(:final DiffPixels pixels):
      final double scale = _reductionOf(pixels.width, pixels.height, maxPixels);
      final ui.Image full = await _imageOf(pixels);
      final int weight = pixels.width * pixels.height * 4;

      if (scale == 1) {
        return Picture(
          drawable: full,
          pixels: pixels,
          width: pixels.width,
          height: pixels.height,
          bytes: weight,
          reduced: false,
          owned: true,
        );
      }

      final int width = math.max(1, (pixels.width * scale).round());
      final int height = math.max(1, (pixels.height * scale).round());
      final ui.Image smaller = await _reduce(full, width, height);

      full.dispose();

      return Picture(
        drawable: smaller,
        pixels: await _pixelsOf(smaller),
        width: width,
        height: height,
        bytes: weight,
        reduced: true,
        owned: true,
      );

    case DiffineEncodedImage(:final Uint8List bytes):
      final ui.ImmutableBuffer buffer = await ui.ImmutableBuffer.fromUint8List(bytes);
      final ui.ImageDescriptor descriptor = await ui.ImageDescriptor.encoded(buffer);

      // How large a file is before it is decoded is not a question the web
      // answers: `ImageDescriptor.width` throws there, because the size is the
      // browser's to work out and it works it out by decoding. So the cap is
      // applied at whichever of the two moments it can be — asked of the
      // decoder where the size is there to ask about, and drawn smaller
      // afterwards where it is not. Asking is the better half, because the
      // full-size picture is then never built at all.
      final int? knownWidth = kIsWeb ? null : descriptor.width;
      final int? knownHeight = kIsWeb ? null : descriptor.height;
      final double asked = knownWidth == null || knownHeight == null
          ? 1
          : _reductionOf(knownWidth, knownHeight, maxPixels);

      final ui.Codec codec = await descriptor.instantiateCodec(
        targetWidth: asked == 1 ? null : math.max(1, (knownWidth! * asked).round()),
        targetHeight: asked == 1 ? null : math.max(1, (knownHeight! * asked).round()),
      );
      final ui.FrameInfo frame = await codec.getNextFrame();

      descriptor.dispose();
      codec.dispose();

      return _fitted(frame.image, maxPixels, bytes.lengthInBytes, reduced: asked != 1);

    case DiffineDecodedImage(:final ui.Image image):
      final double scale = _reductionOf(image.width, image.height, maxPixels);
      final int weight = image.width * image.height * 4;

      if (scale == 1) {
        return Picture(
          drawable: image,
          pixels: await _pixelsOf(image),
          width: image.width,
          height: image.height,
          bytes: weight,
          reduced: false,
          // The application's picture, and the application's to dispose of.
          owned: false,
        );
      }

      final int width = math.max(1, (image.width * scale).round());
      final int height = math.max(1, (image.height * scale).round());
      final ui.Image smaller = await _reduce(image, width, height);

      return Picture(
        drawable: smaller,
        pixels: await _pixelsOf(smaller),
        width: width,
        height: height,
        bytes: weight,
        reduced: true,
        owned: true,
      );
  }
}

/// Lets go of whatever the decode is holding that the collector will not.
void releasePicture(Picture? picture) {
  if (picture != null && picture.owned) {
    picture.drawable.dispose();
  }
}
