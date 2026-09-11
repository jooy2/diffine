/// The comparison itself: two buffers of pixels in, one byte a pixel out.
///
/// Everything expensive about comparing two pictures is in the loop below, so
/// the loop is written for a machine rather than for a reader. What keeps it
/// affordable is the order the tests are in. Two pixels with the same four
/// bytes are settled in one comparison of one 32-bit word, which is what most
/// of a picture is; a pair that differs is measured; only a pair that differs
/// by more than the tolerance is looked at with its neighbours. A photograph
/// saved twice pays for the first test on nearly every pixel and for the third
/// on almost none.
///
/// Everything above the loop is the frame. Two pictures of the same size laid
/// corner to corner need none of it, but two of different sizes, or two held a
/// few pixels apart, do not agree about where a pixel is — so both are placed
/// in a frame large enough to hold them, and the answer is written in the
/// frame's coordinates rather than in either picture's.
library;

import 'dart:math' as math;
import 'dart:typed_data';

import 'package:diffine/src/internal/image/colour.dart';
import 'package:diffine/src/internal/image/regions.dart';
import 'package:diffine/src/types.dart';

/// The byte a changed pixel is marked with. Nothing writes `equal`: a fresh
/// mask is already all of it.
const int kChanged = 1;

/// The byte a pixel only the second picture covers is marked with.
const int kAdded = 2;

/// The byte a pixel only the first one covers is marked with.
const int kRemoved = 3;

/// Everything the comparison needs, already settled.
class CompareOptions {
  /// Every option.
  const CompareOptions({
    required this.tolerance,
    required this.ignoreAntialiasing,
    required this.blockSize,
    required this.maxRegions,
    required this.offset,
  });

  /// How different two pixels have to be before the difference counts.
  final double tolerance;

  /// Whether a pixel that only differs because an edge was drawn smooth is left
  /// out.
  final bool ignoreAntialiasing;

  /// How coarse the grid changed pixels are grouped on is.
  final int blockSize;

  /// The most regions to return.
  final int maxRegions;

  /// How far the second picture is held from the first.
  final DiffImageOffset offset;
}

/// The frame the two pictures are compared in, and where each one sits in it.
class Frame {
  /// One frame.
  const Frame({
    required this.width,
    required this.height,
    required this.before,
    required this.after,
  });

  /// How wide it is.
  final int width;

  /// How tall.
  final int height;

  /// Where the first picture sits.
  final DiffImageArea before;

  /// Where the second one does.
  final DiffImageArea after;
}

/// A frame large enough for both pictures, with the second one moved by
/// `offset`.
///
/// The two are placed rather than resized. Where only one of them reaches, the
/// comparison has nothing to compare and says so — those pixels come back as
/// added or removed, which is the same answer the text engine gives a line with
/// nothing opposite it.
Frame frameOf(DiffPixels before, DiffPixels after, DiffImageOffset offset) {
  final int left = math.min(0, offset.x);
  final int top = math.min(0, offset.y);
  final int right = math.max(before.width, offset.x + after.width);
  final int bottom = math.max(before.height, offset.y + after.height);

  return Frame(
    width: right - left,
    height: bottom - top,
    before: DiffImageArea(x: -left, y: -top, width: before.width, height: before.height),
    after: DiffImageArea(
      x: offset.x - left,
      y: offset.y - top,
      width: after.width,
      height: after.height,
    ),
  );
}

/// The same buffer read four bytes at a time, so that two pixels can be told
/// apart in one comparison.
///
/// A typed list can only be read as words when it starts on a boundary of four,
/// which is true of everything a decode hands back and not guaranteed of a view
/// somebody built themselves. The rare buffer that is not gets copied into one
/// that is, which costs a pass over the picture and saves three quarters of the
/// comparisons after it.
Uint32List _wordsOf(Uint8List data) {
  if (data.offsetInBytes % 4 == 0) {
    return Uint32List.view(data.buffer, data.offsetInBytes, data.lengthInBytes >> 2);
  }

  return Uint32List.view(Uint8List.fromList(data).buffer);
}

/// Where a pixel is in a picture, in bytes, with anything outside it clamped
/// in.
int _indexIn(DiffPixels image, int x, int y) {
  final int column = x < 0
      ? 0
      : x >= image.width
      ? image.width - 1
      : x;
  final int row = y < 0
      ? 0
      : y >= image.height
      ? image.height - 1
      : y;

  return (row * image.width + column) * 4;
}

/// How many of the eight pixels around one have to be exactly its colour.
const int _alike = 2;

/// Whether one pixel sits inside something level: two of the pixels around it
/// are exactly the colour it is.
///
/// Exactly rather than nearly, because "nearly" is what a texture is made of.
/// Two pixels of a photograph beside each other are almost always close and
/// almost never equal, and two pixels of a screen a renderer filled are equal
/// to the byte.
bool _levelAt(Uint32List words, int width, int height, int x, int y) {
  final int colour = words[y * width + x];

  int same = 0;

  for (int dy = -1; dy <= 1; dy += 1) {
    final int row = y + dy;

    if (row < 0 || row >= height) {
      continue;
    }

    final int at = row * width;

    for (int dx = -1; dx <= 1; dx += 1) {
      final int column = x + dx;

      if ((dx == 0 && dy == 0) || column < 0 || column >= width) {
        continue;
      }

      if (words[at + column] == colour) {
        same += 1;

        if (same == _alike) {
          return true;
        }
      }
    }
  }

  return false;
}

/// Whether there is anything level in reach of one pixel: any of the nine
/// pixels about it sits inside something level.
///
/// Any of the nine rather than the pixel itself, because the pixel itself never
/// is — it is the blend, and a blend is by definition unlike everything around
/// it. What is being asked is whether there is a flat area nearby for an edge
/// to be the edge of. Small text is the case that decides the reach: a letter
/// at sixteen pixels is thin enough that the darkest pixel beside a blend is
/// often another blend, and the page it is printed on is one pixel further out.
bool _levelAround(Uint32List words, int width, int height, int x, int y) {
  for (int dy = -1; dy <= 1; dy += 1) {
    final int row = y + dy;

    if (row < 0 || row >= height) {
      continue;
    }

    for (int dx = -1; dx <= 1; dx += 1) {
      final int column = x + dx;

      if (column < 0 || column >= width) {
        continue;
      }

      if (_levelAt(words, width, height, column, row)) {
        return true;
      }
    }
  }

  return false;
}

/// How strong the edge one pixel is sitting on is, and zero when it is not
/// sitting on one.
///
/// Two things have to hold. The pixel has to lie between its neighbours rather
/// than be the brightest or the darkest thing among them, which is what a
/// colour of its own looks like. And there has to be something level in reach
/// of it, so that the step it lies across is the edge of something rather than
/// two pixels that happen to be unalike.
///
/// The second test is the one that matters on a photograph. Nearly every pixel
/// of a textured picture lies between the pixels around it and the range across
/// a texture is most of the scale, so without it the allowance below is wide
/// enough to swallow a change that really happened — a patch cloned over a
/// rainy window came back as a fifth of the pixels it covers. What comes back
/// is the range of brightness across the neighbourhood, which is the largest
/// change the edge running through it could account for.
double _blendAt(DiffPixels image, Uint32List words, int x, int y) {
  final double centre = brightnessAt(image.data, _indexIn(image, x, y));

  double low = 256;
  double high = -1;

  for (int dy = -1; dy <= 1; dy += 1) {
    final int row = y + dy < 0
        ? 0
        : y + dy >= image.height
        ? image.height - 1
        : y + dy;

    for (int dx = -1; dx <= 1; dx += 1) {
      if (dx == 0 && dy == 0) {
        continue;
      }

      final int column = x + dx < 0
          ? 0
          : x + dx >= image.width
          ? image.width - 1
          : x + dx;
      final double beside = brightnessAt(image.data, (row * image.width + column) * 4);

      if (beside < low) {
        low = beside;
      }

      if (beside > high) {
        high = beside;
      }
    }
  }

  if (centre <= low || centre >= high) {
    return 0;
  }

  return _levelAround(words, image.width, image.height, x, y) ? (high - low) / 255 : 0;
}

/// The test for a pixel that only differs because an edge was drawn smooth.
///
/// A renderer draws a diagonal by putting part of the line's colour into the
/// pixels either side of where it really falls, and how much each one gets is
/// its own arithmetic. So the same screen drawn twice by two of them differs
/// along every letter and every curve, in a way that has nothing to do with the
/// screen having changed.
///
/// What tells that apart from a real change is what the pixel is. It has to be
/// sitting on an edge in at least one of the two pictures — see [_blendAt] —
/// and the change has to be no larger than the step that edge is, so that
/// moving the line under it accounts for what happened. A pixel that went from
/// white to black in the middle of a white field is on no edge at all, and a
/// pixel of a texture is on a step that belongs to no edge either.
bool _isSmoothing(
  DiffPixels before,
  Uint32List beforeWords,
  DiffPixels after,
  Uint32List afterWords,
  int bx,
  int by,
  int ax,
  int ay,
  double distance,
) {
  final double step = math.max(
    _blendAt(before, beforeWords, bx, by),
    _blendAt(after, afterWords, ax, ay),
  );

  return step > 0 && distance <= step;
}

/// Two pictures, compared pixel by pixel in the frame that holds both.
DiffImageResult comparePixels(DiffPixels before, DiffPixels after, CompareOptions options) {
  final Frame frame = frameOf(before, after, options.offset);
  final int width = frame.width;
  final int height = frame.height;
  final Uint8List mask = Uint8List(width * height);
  final Cells cells = createCells(width, height, math.max(1, options.blockSize));

  final Uint32List beforeWords = _wordsOf(before.data);
  final Uint32List afterWords = _wordsOf(after.data);

  int changed = 0;
  int added = 0;
  int removed = 0;

  for (int y = 0; y < height; y += 1) {
    final int beforeRow = y - frame.before.y;
    final int afterRow = y - frame.after.y;
    final bool onBefore = beforeRow >= 0 && beforeRow < before.height;
    final bool onAfter = afterRow >= 0 && afterRow < after.height;

    if (!onBefore && !onAfter) {
      continue;
    }

    final int row = y * width;

    for (int x = 0; x < width; x += 1) {
      final int beforeColumn = x - frame.before.x;
      final int afterColumn = x - frame.after.x;
      final bool inBefore = onBefore && beforeColumn >= 0 && beforeColumn < before.width;
      final bool inAfter = onAfter && afterColumn >= 0 && afterColumn < after.width;

      if (inBefore && inAfter) {
        final int first = beforeRow * before.width + beforeColumn;
        final int second = afterRow * after.width + afterColumn;

        if (beforeWords[first] == afterWords[second]) {
          continue;
        }

        final double distance = distanceBetween(before.data, first * 4, after.data, second * 4);

        if (distance <= options.tolerance) {
          continue;
        }

        if (options.ignoreAntialiasing &&
            _isSmoothing(
              before,
              beforeWords,
              after,
              afterWords,
              beforeColumn,
              beforeRow,
              afterColumn,
              afterRow,
              distance,
            )) {
          continue;
        }

        mask[row + x] = kChanged;
        changed += 1;
      } else if (inAfter) {
        mask[row + x] = kAdded;
        added += 1;
      } else if (inBefore) {
        mask[row + x] = kRemoved;
        removed += 1;
      } else {
        continue;
      }

      markPixel(cells, x, y);
    }
  }

  final int pixels = width * height;
  final DiffImageStats stats = DiffImageStats(
    pixels: pixels,
    unchanged: pixels - changed - added - removed,
    changed: changed,
    added: added,
    removed: removed,
    ratio: pixels == 0 ? 0 : (changed + added + removed) / pixels,
  );
  final RegionResult found = regionsOf(cells, math.max(1, options.maxRegions));

  return DiffImageResult(
    width: width,
    height: height,
    before: frame.before,
    after: frame.after,
    offset: options.offset,
    mask: mask,
    regions: found.regions,
    stats: stats,
    complete: found.complete,
  );
}
