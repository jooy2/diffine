/// Several pictures compared at once, out of the comparison of two.
///
/// Nothing here compares a pixel. Every pair is [comparePixels], exactly as a
/// pair on its own would be, and what this adds is the two things a list needs
/// that a pair does not: one frame large enough for all of them, and one mask
/// that says which of them disagree rather than that two of them do.
///
/// Built that way on purpose. A second comparison loop would be a second place
/// for the tolerance, the smoothing test and the frame arithmetic to be right
/// in, and the two would drift. It costs the mask of one pair at a time, which
/// is merged and let go before the next pair is compared.
library;

import 'dart:math' as math;
import 'dart:typed_data';

import 'package:diffine/src/internal/image/compare.dart';
import 'package:diffine/src/internal/image/regions.dart';
import 'package:diffine/src/types.dart';

/// Everything a comparison of several needs, already settled.
class ManyOptions {
  /// Every option.
  const ManyOptions({
    required this.tolerance,
    required this.ignoreAntialiasing,
    required this.blockSize,
    required this.maxRegions,
    required this.baseline,
    required this.offsets,
  });

  /// How different two pixels have to be before it counts.
  final double tolerance;

  /// Whether an edge drawn smooth a second way is left out.
  final bool ignoreAntialiasing;

  /// How coarse the grid the changed pixels are grouped on is.
  final int blockSize;

  /// The most regions that come back.
  final int maxRegions;

  /// Which picture the rest are counted against.
  final int baseline;

  /// How far each picture sits from the baseline, in the order they were given.
  final List<DiffImageOffset> offsets;
}

/// The frame that holds every picture once its offset is applied.
({int width, int height, List<DiffImageArea> areas}) _frameOfAll(
  List<DiffPixels> pictures,
  List<DiffImageOffset> offsets,
) {
  int left = 0;
  int top = 0;
  int right = 0;
  int bottom = 0;

  for (int at = 0; at < pictures.length; at += 1) {
    final DiffImageOffset offset = offsets[at];

    left = math.min(left, offset.x);
    top = math.min(top, offset.y);
    right = math.max(right, offset.x + pictures[at].width);
    bottom = math.max(bottom, offset.y + pictures[at].height);
  }

  return (
    width: right - left,
    height: bottom - top,
    areas: <DiffImageArea>[
      for (int at = 0; at < pictures.length; at += 1)
        DiffImageArea(
          x: offsets[at].x - left,
          y: offsets[at].y - top,
          width: pictures[at].width,
          height: pictures[at].height,
        ),
    ],
  );
}

/// How many pixels of one row at least one picture reaches.
///
/// Counted from the rectangles rather than from the pixels, because a rectangle
/// knows where it starts and stops and a pixel has to be asked. The spans are
/// put in order and run together, which for the usual list — pictures of one
/// size laid corner to corner — is one span the width of the frame.
int _coveredIn(List<DiffImageArea> areas, int y, int width) {
  final List<List<int>> spans = <List<int>>[];

  for (final DiffImageArea area in areas) {
    if (y < area.y || y >= area.y + area.height) {
      continue;
    }

    final int from = math.max(0, area.x);
    final int to = math.min(width, area.x + area.width);

    if (to > from) {
      spans.add(<int>[from, to]);
    }
  }

  spans.sort((List<int> one, List<int> other) => one[0] - other[0]);

  int counted = 0;
  int reached = -1;

  for (final List<int> span in spans) {
    final int start = math.max(span[0], reached);

    if (span[1] > start) {
      counted += span[1] - start;
      reached = span[1];
    }
  }

  return counted;
}

/// Several pictures, compared against the one named as the baseline.
DiffImagesResult compareMany(List<DiffPixels> pictures, ManyOptions options) {
  final int baseline = options.baseline;
  final ({int width, int height, List<DiffImageArea> areas}) frame = _frameOfAll(
    pictures,
    options.offsets,
  );
  final int width = frame.width;
  final int height = frame.height;
  final Uint8List mask = Uint8List(width * height);
  final List<int> apart = List<int>.filled(pictures.length, 0);

  for (int at = 0; at < pictures.length; at += 1) {
    if (at == baseline) {
      continue;
    }

    // The pair, in its own frame, and where that frame sits in the large one. A
    // pair holds the baseline and one picture, so its frame is a part of the
    // frame that holds all of them, and never the other way round.
    final DiffImageResult pair = comparePixels(
      pictures[baseline],
      pictures[at],
      CompareOptions(
        tolerance: options.tolerance,
        ignoreAntialiasing: options.ignoreAntialiasing,
        blockSize: options.blockSize,
        maxRegions: options.maxRegions,
        offset: options.offsets[at],
      ),
    );
    final int left = frame.areas[baseline].x - pair.before.x;
    final int top = frame.areas[baseline].y - pair.before.y;
    final int bit = 1 << at;

    int counted = 0;

    for (int y = 0; y < pair.height; y += 1) {
      final int from = y * pair.width;
      final int into = (y + top) * width + left;

      for (int x = 0; x < pair.width; x += 1) {
        if (pair.mask[from + x] != 0) {
          mask[into + x] |= bit;
          counted += 1;
        }
      }
    }

    apart[at] = counted;
  }

  // What came out, read back once: where the changes are, and how much of the
  // frame any picture reaches. Neither is a pair's answer — a pair's frame is
  // smaller and its regions are only its own.
  final Cells cells = createCells(width, height, math.max(1, options.blockSize));

  int changed = 0;
  int covered = 0;

  for (int y = 0; y < height; y += 1) {
    final int row = y * width;

    covered += _coveredIn(frame.areas, y, width);

    for (int x = 0; x < width; x += 1) {
      if (mask[row + x] != 0) {
        changed += 1;
        markPixel(cells, x, y);
      }
    }
  }

  final DiffImagesStats stats = DiffImagesStats(
    pixels: width * height,
    covered: covered,
    unchanged: covered - changed,
    changed: changed,
    ratio: covered == 0 ? 0 : changed / covered,
    apart: apart,
  );
  final RegionResult found = regionsOf(cells, math.max(1, options.maxRegions));

  return DiffImagesResult(
    width: width,
    height: height,
    areas: frame.areas,
    offsets: List<DiffImageOffset>.of(options.offsets),
    baseline: baseline,
    mask: mask,
    regions: found.regions,
    stats: stats,
    complete: found.complete,
  );
}
