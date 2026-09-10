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

/// How much of a blend one pixel is, and how strong the step it sits on.
///
/// Zero when it is not a blend at all. A pixel that is brighter than everything
/// around it, or darker than everything around it, is a colour of its own; a
/// pixel that lies between its neighbours is what a renderer writes when a line
/// falls between two of them. What comes back for the second kind is the range
/// of brightness across the neighbourhood, which is the largest change the edge
/// running through it could account for.
double _blendAt(DiffPixels image, int x, int y) {
  final double centre = brightnessAt(image.data, _indexIn(image, x, y));

  double low = 255;
  double high = 0;

  for (int dy = -1; dy <= 1; dy += 1) {
    for (int dx = -1; dx <= 1; dx += 1) {
      if (dx == 0 && dy == 0) {
        continue;
      }

      final double beside = brightnessAt(image.data, _indexIn(image, x + dx, y + dy));

      if (beside < low) {
        low = beside;
      }

      if (beside > high) {
        high = beside;
      }
    }
  }

  return centre > low && centre < high ? (high - low) / 255 : 0;
}

/// The test for a pixel that only differs because an edge was drawn smooth.
///
/// A renderer draws a diagonal by putting part of the line's colour into the
/// pixels either side of where it really falls, and how much each one gets is
/// its own arithmetic. So the same screen drawn twice by two of them differs
/// along every letter and every curve, in a way that has nothing to do with the
/// screen having changed.
///
/// What tells that apart from a real change is what the pixel is. Two things
/// have to hold. It has to be a blend in at least one of the two pictures —
/// lying between its neighbours rather than being the brightest or the darkest
/// thing among them, which is what a colour of its own looks like. And the
/// change has to be no larger than the step it is sitting on, so that moving
/// the edge under it accounts for what happened. A pixel that went from white
/// to black in the middle of a white field passes neither, and a photograph's
/// own gradients pass the first and fail the second.
bool _isSmoothing(
  DiffPixels before,
  DiffPixels after,
  int bx,
  int by,
  int ax,
  int ay,
  double distance,
) {
  final double step = math.max(_blendAt(before, bx, by), _blendAt(after, ax, ay));

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
            _isSmoothing(before, after, beforeColumn, beforeRow, afterColumn, afterRow, distance)) {
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
