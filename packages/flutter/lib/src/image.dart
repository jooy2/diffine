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
import 'package:diffine/src/internal/image/many.dart';
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

/// How alike two pictures are, as one number and the counts behind it.
///
/// [diffImage] answers "where did these two differ", which is the question a
/// reader looking at them has. A build with a threshold in it, a report ranking
/// a hundred screenshots and a badge on a screen are all asking the shorter one
/// instead, and this is the shorter one:
///
/// ```dart
/// final DiffImageSimilarity alike = imageSimilarity(before, after);
///
/// if (alike.similarity < 0.995) {
///   throw StateError('${alike.changed} pixels moved — '
///       '${(alike.similarity * 100).toStringAsFixed(2)}% alike');
/// }
/// ```
///
/// It is the whole comparison underneath, so every option means what it means
/// there: the tolerance decides how much of a difference counts against the
/// number, [DiffImageAlign.shift] lines two shots up before anything is
/// counted, and a pixel only one of the two covers counts against it — two
/// pictures of different sizes cannot be 1.
///
/// A comparison already worked out has all of this on `result.stats` and needs
/// no second pass: `1 - stats.ratio` is the same number.
DiffImageSimilarity imageSimilarity(
  DiffPixels before,
  DiffPixels after, [
  DiffImageOptions? options,
]) {
  final DiffImageStats stats = diffImage(before, after, options).stats;

  return DiffImageSimilarity(
    similarity: 1 - stats.ratio,
    identical: stats.changed == 0 && stats.added == 0 && stats.removed == 0,
    pixels: stats.covered,
    matched: stats.unchanged,
    changed: stats.changed,
    added: stats.added,
    removed: stats.removed,
    distance: stats.distance,
    before: DiffImageSize(width: before.width, height: before.height),
    after: DiffImageSize(width: after.width, height: after.height),
  );
}

/// Compares several pictures at once and returns where any of them disagree.
///
/// ```dart
/// final DiffImagesResult result = diffImages(<DiffPixels>[one, two, three]);
///
/// debugPrint('${result.regions.length} areas, '
///     '${(result.stats.ratio * 100).round()}%');
/// ```
///
/// Three renderings of one screen, four exports of one asset, a saved version
/// against the last five runs: what is wanted there is one frame with every
/// disagreement on it, and [diffImage] cannot give that because a pair has no
/// room for a third.
///
/// Each picture is compared with the baseline exactly as [diffImage] would
/// compare it, so every option means what it means there — and a list of two is
/// the same answer in a different shape. What the list adds is the mask: a bit
/// a picture rather than a kind, so that `mask[pixel] != 0` is "does anything
/// disagree here" and `mask[pixel] & (1 << i)` is "does this one".
///
/// At most [kMostPictures], because a bit a picture is what a byte holds.
DiffImagesResult diffImages(List<DiffPixels> pictures, [DiffImagesOptions? options]) {
  final DiffImagesOptions settled = options ?? const DiffImagesOptions();
  final int baseline = settled.baseline;

  if (pictures.length < 2 || pictures.length > kMostPictures) {
    throw RangeError(
      'diffine: ${pictures.length} pictures were given, and a comparison takes '
      '2 to $kMostPictures.',
    );
  }

  if (baseline < 0 || baseline >= pictures.length) {
    throw RangeError(
      'diffine: the baseline is $baseline, which is not one of the '
      '${pictures.length} pictures.',
    );
  }

  for (int at = 0; at < pictures.length; at += 1) {
    _check(pictures[at], 'picture $at');
  }

  return compareMany(
    pictures,
    ManyOptions(
      tolerance: settled.tolerance,
      ignoreAntialiasing: settled.ignoreAntialiasing,
      blockSize: settled.blockSize,
      maxRegions: settled.maxRegions,
      baseline: baseline,
      offsets: <DiffImageOffset>[
        for (int at = 0; at < pictures.length; at += 1)
          if (at == baseline || settled.align != DiffImageAlign.shift)
            DiffImageOffset.zero
          else
            findOffset(pictures[baseline], pictures[at], settled.alignRadius),
      ],
    ),
  );
}

/// How alike several pictures are, as one number and the counts behind it.
///
/// The same shorter question [imageSimilarity] asks about a pair. A build
/// comparing one screen drawn on four machines wants one number to put a
/// threshold on and a list saying which of the four is the odd one out:
///
/// ```dart
/// final DiffImagesSimilarity alike = imagesSimilarity(shots);
///
/// if (alike.similarity < 0.995) {
///   final double worst = alike.each.reduce(math.min);
///
///   debugPrint('the odd one out is ${alike.each.indexOf(worst)}');
/// }
/// ```
///
/// One picture disagreeing in a corner costs the set exactly as much as all of
/// them disagreeing there, because the question [DiffImagesSimilarity.similarity]
/// asks is whether they agree. [DiffImagesSimilarity.each] is what says which
/// of them did not.
DiffImagesSimilarity imagesSimilarity(List<DiffPixels> pictures, [DiffImagesOptions? options]) {
  final DiffImagesResult result = diffImages(pictures, options);
  final DiffImagesStats stats = result.stats;

  return DiffImagesSimilarity(
    similarity: 1 - stats.ratio,
    identical: stats.changed == 0,
    pixels: stats.covered,
    matched: stats.unchanged,
    changed: stats.changed,
    baseline: result.baseline,
    each: <double>[
      for (final int apart in stats.apart) stats.covered == 0 ? 1 : 1 - apart / stats.covered,
    ],
    sizes: <DiffImageSize>[
      for (final DiffPixels picture in pictures)
        DiffImageSize(width: picture.width, height: picture.height),
    ],
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

/// The mask of several pictures as a picture of its own.
///
/// The same step between an answer and a file that [paintDiffImage] is, for a
/// comparison of a list. With no [picture] it paints every pixel any of them
/// disagrees about, which is the one image a build attaches to a run that
/// compared four. With one, it paints what that picture alone disagrees with
/// the baseline about — four files, one a picture, saying who is the odd one
/// out where.
///
/// `added` and `removed` do not apply: whose arrival a pixel is depends on
/// which of the pictures is being asked about, and the answer for a list is
/// that they disagree.
DiffPixels paintDiffImages(DiffImagesResult result, {DiffImagePaint? paint, int? picture}) {
  final int width = result.width;
  final int height = result.height;
  final Uint8List data = Uint8List(width * height * 4);
  final ui.Color changed = paint?.changed ?? _paint.changed!;
  final ui.Color unchanged = paint?.unchanged ?? _paint.unchanged!;
  final int wanted = picture == null ? 0xff : 1 << picture;

  for (int pixel = 0; pixel < result.mask.length; pixel += 1) {
    final ui.Color colour = (result.mask[pixel] & wanted) == 0 ? unchanged : changed;
    final int at = pixel * 4;

    data[at] = (colour.r * 255).round();
    data[at + 1] = (colour.g * 255).round();
    data[at + 2] = (colour.b * 255).round();
    data[at + 3] = (colour.a * 255).round();
  }

  return DiffPixels(data: data, width: width, height: height);
}

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
