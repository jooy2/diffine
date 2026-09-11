/// The comparison of two pictures, on its own.
///
/// The same bargain `diff.dart` makes for text, made again for pixels: nothing
/// here touches a widget, and what comes back is a value rather than a picture.
/// Which matters more here than it does there. Comparing two photographs is a
/// few million pieces of arithmetic, and an application that wants that off the
/// thread its screen is drawn on can put this call in an isolate — the buffers
/// go in, the mask comes out, and `ImageDiff` is handed the result instead of
/// the two files.
///
/// What it does not do is open a file. A picture reaches this as pixels, and
/// turning a PNG into pixels is a decoder — the engine's, an isolate's, or a
/// server's, and never something a comparison should have an opinion about.
library;

import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:diffine/src/internal/image/align.dart';
import 'package:diffine/src/internal/image/compare.dart';
import 'package:diffine/src/types.dart';

/// What each byte of [DiffImageResult.mask] means, in the order the bytes
/// count: `kDiffPixelKinds[mask[pixel]]`.
const List<DiffPixelKind> kDiffPixelKinds = <DiffPixelKind>[
  DiffPixelKind.equal,
  DiffPixelKind.changed,
  DiffPixelKind.added,
  DiffPixelKind.removed,
];

/// What every option falls back to.
const DiffImageOptions kDiffineImageDefaults = DiffImageOptions();

/// Compares two pictures and returns everything worked out about them: what
/// happened to each pixel, where the changes are, and how much of the frame
/// they cover.
///
/// ```dart
/// final DiffImageResult result = diffImage(
///   before,
///   after,
///   const DiffImageOptions(align: DiffImageAlign.shift),
/// );
///
/// debugPrint('${result.regions.length} areas, '
///     '${(result.stats.ratio * 100).round()}%');
/// ```
///
/// Both sides are buffers of pixels. The two do not have to be the same size:
/// what only one of them covers comes back as added or removed rather than as
/// an error.
DiffImageResult diffImage(DiffPixels before, DiffPixels after, [DiffImageOptions? options]) {
  _check(before, 'before');
  _check(after, 'after');

  final DiffImageOptions settled = options ?? kDiffineImageDefaults;

  return comparePixels(
    before,
    after,
    CompareOptions(
      tolerance: settled.tolerance,
      ignoreAntialiasing: settled.ignoreAntialiasing,
      blockSize: settled.blockSize,
      maxRegions: settled.maxRegions,
      offset: settled.align == DiffImageAlign.shift
          ? findOffset(before, after, settled.alignRadius)
          : DiffImageOffset.zero,
    ),
  );
}

/// That a picture is as large as it says it is, checked once before anything
/// reads it.
///
/// The loop underneath reads a buffer at `(y * width + x) * 4` and never asks
/// whether the buffer reaches that far, because asking a few million times is
/// most of what a comparison would cost. So it is asked here instead, where a
/// buffer one row short is a sentence naming the side it arrived on rather than
/// an index error out of the middle of the arithmetic.
void _check(DiffPixels pixels, String side) {
  if (pixels.width < 0 || pixels.height < 0) {
    throw RangeError(
      'diffine: the $side picture is ${pixels.width} × ${pixels.height}, which is not a size.',
    );
  }

  final int wanted = pixels.width * pixels.height * 4;

  if (pixels.data.length < wanted) {
    throw RangeError(
      'diffine: the $side picture is ${pixels.width} × ${pixels.height}, '
      'which is $wanted bytes, and ${pixels.data.length} arrived.',
    );
  }
}

/// What each kind of pixel is painted in, where nothing else was asked for.
const DiffImagePaint _paint = DiffImagePaint(
  changed: ui.Color(0xffe83e8c),
  added: ui.Color(0xff1a7f4b),
  removed: ui.Color(0xffc2333f),
  unchanged: ui.Color(0x00000000),
);

/// The mask as a picture of its own: what changed, on a ground that is
/// see-through.
///
/// This is the comparison in the one shape everything outside a screen can
/// read. A build that compares two screenshots has an answer nobody can look at
/// until it is a file, and the step between the two is this — the pixels go to
/// a buffer, the buffer goes through `ui.decodeImageFromPixels`, and the
/// picture writes the PNG that ends up attached to the run.
///
/// ```dart
/// final DiffPixels picture = paintDiffImage(diffImage(before, after));
///
/// ui.decodeImageFromPixels(
///   picture.data,
///   picture.width,
///   picture.height,
///   ui.PixelFormat.rgba8888,
///   (ui.Image image) async {
///     final ByteData? png = await image.toByteData(format: ui.ImageByteFormat.png);
///     // …
///   },
/// );
/// ```
///
/// Writing that file is the application's, for the same reason decoding one is:
/// a screen, an isolate and a server each have their own way of doing it, and
/// none of them is the comparison's business.
DiffPixels paintDiffImage(DiffImageResult result, [DiffImagePaint? paint]) {
  final int width = result.width;
  final int height = result.height;
  final Uint8List mask = result.mask;
  final Uint8List data = Uint8List(width * height * 4);
  final List<ui.Color> colours = <ui.Color>[
    paint?.unchanged ?? _paint.unchanged!,
    paint?.changed ?? _paint.changed!,
    paint?.added ?? _paint.added!,
    paint?.removed ?? _paint.removed!,
  ];

  for (int pixel = 0; pixel < mask.length; pixel += 1) {
    final int kind = mask[pixel];
    final ui.Color colour = kind < colours.length ? colours[kind] : _paint.unchanged!;
    final int at = pixel * 4;

    data[at] = (colour.r * 255).round();
    data[at + 1] = (colour.g * 255).round();
    data[at + 2] = (colour.b * 255).round();
    data[at + 3] = (colour.a * 255).round();
  }

  return DiffPixels(data: data, width: width, height: height);
}
