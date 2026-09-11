/// The pixels under the pointer, read rather than drawn.
///
/// A comparison zoomed to four hundred per cent says two pixels are different
/// and stops there. What a reader is asking at that point is what the two
/// actually are — is this the same grey a shade darker, or a different colour
/// altogether — and the answer is a number, not a picture. So this is the half
/// of the loupe that has nothing to do with a canvas: where the pointer is in
/// each picture, and what the pixel there is.
library;

import 'dart:ui' as ui;

import 'package:diffine/src/internal/image/decode.dart';
import 'package:diffine/src/types.dart';

/// How many pixels across the loupe shows. Odd, so that one of them is the
/// middle.
const int kLoupeSpan = 9;

/// One side under the pointer: what it is called, what to draw, and what it is.
class LoupeSample {
  /// One side.
  const LoupeSample({required this.label, required this.picture, required this.area});

  /// What the side is called, which is the name over its pane.
  final String label;

  /// The picture itself, to draw from and to read.
  final Picture picture;

  /// Where the picture sits in the frame.
  final DiffImageArea area;

  @override
  bool operator ==(Object other) =>
      other is LoupeSample &&
      other.label == label &&
      other.picture == picture &&
      other.area.x == area.x &&
      other.area.y == area.y;

  @override
  int get hashCode => Object.hash(label, picture, area.x, area.y);
}

/// Where a point of the frame falls in one picture.
({int x, int y}) pixelAt(LoupeSample sample, double frameX, double frameY) =>
    (x: frameX.floor() - sample.area.x, y: frameY.floor() - sample.area.y);

/// The colour of one pixel of a picture, or `null` where the picture does not
/// reach.
ui.Color? colourAt(LoupeSample sample, double frameX, double frameY) {
  final ({int x, int y}) at = pixelAt(sample, frameX, frameY);
  final DiffPixels pixels = sample.picture.pixels;

  if (at.x < 0 || at.y < 0 || at.x >= pixels.width || at.y >= pixels.height) {
    return null;
  }

  final int byte = (at.y * pixels.width + at.x) * 4;

  return ui.Color.fromARGB(
    pixels.data[byte + 3],
    pixels.data[byte],
    pixels.data[byte + 1],
    pixels.data[byte + 2],
  );
}

/// A colour as the string a reader would type back into a stylesheet.
///
/// Eight digits where there is transparency and six where there is none,
/// because `#1a7f4bff` is a thing nobody writes and `#1a7f4b80` is a thing they
/// have to.
String hexOf(ui.Color colour) {
  String digits(double channel) => (channel * 255).round().toRadixString(16).padLeft(2, '0');

  final String rgb = '#${digits(colour.r)}${digits(colour.g)}${digits(colour.b)}';

  return colour.a == 1 ? rgb : '$rgb${digits(colour.a)}';
}
