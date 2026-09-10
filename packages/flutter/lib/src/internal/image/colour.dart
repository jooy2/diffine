/// How far apart two pixels are, as one number between 0 and 1.
///
/// A comparison of two pictures is this arithmetic run a few million times, so
/// what it costs is most of what the comparison costs. That is why everything
/// here reads a buffer at an offset instead of taking anything that would have
/// to be built for it, and why the answer is a weighted distance between two
/// colours rather than a trip through a perceptual colour space: the question
/// is "are these two the same pixel", not "how much lighter is this red".
///
/// The weights are the ones that turn red, green and blue into brightness. An
/// eye takes most of its detail from green and very little from blue, so the
/// same step in each channel is not the same change to look at, and weighting
/// them is what keeps a picture saved twice by the same encoder from lighting
/// up along every blue gradient in it.
library;

import 'dart:math' as math;
import 'dart:typed_data';

/// What red contributes to brightness.
const double _red = 0.299;

/// What green contributes.
const double _green = 0.587;

/// What blue contributes.
const double _blue = 0.114;

/// The largest distance the weighted sum can reach, so the answer lands in
/// 0..1.
const double _full = 255;

/// One channel of a pixel blended onto white.
///
/// Blending is what makes transparency comparable at all: a pixel that is half
/// red over nothing and a pixel that is half red over white are the same pixel
/// to look at, and only one of them has a colour written in the buffer. White
/// is the ground because it is what a picture is put on more often than not.
///
/// A fully transparent pixel therefore reads as white — which would lose the
/// difference between nothing and a white page, if the transparency itself were
/// not compared as well. See [distanceBetween].
double _blend(int channel, double alpha) {
  return _full + (channel - _full) * alpha;
}

/// How far apart the pixel at `first` in one buffer and the pixel at `second`
/// in another are, from 0 for the same pixel to 1 for black against white.
///
/// The further apart of two things: how different the two colours look once
/// both are on white, and how different their transparency is. Taking the
/// larger of the two rather than adding them is what keeps a change from
/// nothing to white — no change in colour at all, once both are blended — from
/// disappearing.
///
/// Both indices are byte offsets, so they are the pixel number times four.
double distanceBetween(Uint8List before, int first, Uint8List after, int second) {
  final double beforeAlpha = before[first + 3] / _full;
  final double afterAlpha = after[second + 3] / _full;

  final double red = _blend(before[first], beforeAlpha) - _blend(after[second], afterAlpha);
  final double green =
      _blend(before[first + 1], beforeAlpha) - _blend(after[second + 1], afterAlpha);
  final double blue =
      _blend(before[first + 2], beforeAlpha) - _blend(after[second + 2], afterAlpha);

  final double colour =
      math.sqrt(_red * red * red + _green * green * green + _blue * blue * blue) / _full;

  return math.max(colour, (beforeAlpha - afterAlpha).abs());
}

/// How bright one pixel is once it is on white, from 0 to 255.
double brightnessAt(Uint8List data, int at) {
  final double alpha = data[at + 3] / _full;

  return _red * _blend(data[at], alpha) +
      _green * _blend(data[at + 1], alpha) +
      _blue * _blend(data[at + 2], alpha);
}

/// The same picture in one byte a pixel, for the alignment search.
///
/// Brightness on white, by the weights above. What the search is looking for is
/// where the edges of one picture fall on the edges of the other, and an edge
/// is a step in brightness whatever colour either side of it happens to be — so
/// three quarters of the reading can go, and the search runs on a quarter of
/// the memory.
Uint8List brightnessOf(Uint8List data, int width, int height) {
  final Uint8List grey = Uint8List(width * height);

  for (int pixel = 0; pixel < grey.length; pixel += 1) {
    grey[pixel] = brightnessAt(data, pixel * 4).toInt();
  }

  return grey;
}
