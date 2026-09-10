/// Where the changes are, worked out from where the changed pixels are.
///
/// A mask is an answer no reader can act on. Ten thousand lit pixels scattered
/// over a photograph and ten thousand in one corner of a screenshot are the
/// same number and not the same news, and what turns one into the other is
/// grouping: pixels are counted into squares of a fixed size as the comparison
/// runs, the squares that touch each other are one change, and each change
/// comes out as the smallest rectangle that holds the pixels inside it.
///
/// The grid is what keeps this affordable. Joining up ten million pixels one at
/// a time is a graph with ten million nodes in it; joining up the squares of a
/// sixteen-pixel grid is a graph with forty thousand, and the boxes that come
/// out are tight either way because each square remembers the pixels it
/// actually saw rather than its own corners.
library;

import 'dart:math' as math;
import 'dart:typed_data';

import 'package:diffine/src/types.dart';

/// The grid, and what each square of it has seen.
class Cells {
  /// One grid.
  Cells({
    required this.columns,
    required this.rows,
    required this.size,
    required this.pixels,
    required this.left,
    required this.top,
    required this.right,
    required this.bottom,
  });

  /// How many squares across.
  final int columns;

  /// How many down.
  final int rows;

  /// How large one square is, in pixels.
  final int size;

  /// How many changed pixels fell in each square.
  final Int32List pixels;

  /// The left edge of the box those pixels actually covered, per square.
  final Int32List left;

  /// Its top edge.
  final Int32List top;

  /// Its right edge.
  final Int32List right;

  /// Its bottom edge.
  final Int32List bottom;
}

/// An empty grid over a frame of `width` by `height`.
Cells createCells(int width, int height, int size) {
  final int columns = math.max(1, (width / size).ceil());
  final int rows = math.max(1, (height / size).ceil());
  final int count = columns * rows;

  return Cells(
    columns: columns,
    rows: rows,
    size: size,
    pixels: Int32List(count),
    left: Int32List(count),
    top: Int32List(count),
    right: Int32List(count),
    bottom: Int32List(count),
  );
}

/// Counts one changed pixel into the square it falls in.
void markPixel(Cells cells, int x, int y) {
  final int at = (y ~/ cells.size) * cells.columns + (x ~/ cells.size);
  final int seen = cells.pixels[at];

  cells.pixels[at] = seen + 1;

  if (seen == 0) {
    cells.left[at] = x;
    cells.top[at] = y;
    cells.right[at] = x;
    cells.bottom[at] = y;

    return;
  }

  if (x < cells.left[at]) {
    cells.left[at] = x;
  } else if (x > cells.right[at]) {
    cells.right[at] = x;
  }

  if (y < cells.top[at]) {
    cells.top[at] = y;
  } else if (y > cells.bottom[at]) {
    cells.bottom[at] = y;
  }
}

/// What came out of the grid, and whether it is the whole of it.
class RegionResult {
  /// One grouping.
  const RegionResult(this.regions, this.complete);

  /// The changes, in reading order.
  final List<DiffImageRegion> regions;

  /// Whether the list holds every one of them.
  final bool complete;
}

/// The squares that hold something, joined into regions.
///
/// Two squares belong to the same change when they touch, corners included — a
/// diagonal line crosses a grid one square at a time and would otherwise come
/// back as a staircase of separate findings.
///
/// Past `maxRegions` the largest are kept and [RegionResult.complete] says so.
/// Which is the honest answer for two photographs that differ everywhere: the
/// mask still holds every pixel, and a list of forty thousand rectangles is not
/// a list anybody was going to step through.
RegionResult regionsOf(Cells cells, int maxRegions) {
  final int columns = cells.columns;
  final int rows = cells.rows;
  final Int32List pixels = cells.pixels;
  final Uint8List seen = Uint8List(pixels.length);
  // One entry a square at the very worst, which is a change that fills the
  // frame — and that is the case where growing a list would hurt most.
  final Int32List stack = Int32List(pixels.length);
  final List<DiffImageRegion> regions = <DiffImageRegion>[];

  for (int start = 0; start < pixels.length; start += 1) {
    if (pixels[start] == 0 || seen[start] == 1) {
      continue;
    }

    int depth = 0;
    int count = 0;
    int left = 1 << 30;
    int top = 1 << 30;
    int right = -(1 << 30);
    int bottom = -(1 << 30);

    stack[depth] = start;
    depth += 1;
    seen[start] = 1;

    while (depth > 0) {
      depth -= 1;

      final int at = stack[depth];
      final int column = at % columns;
      final int row = at ~/ columns;

      count += pixels[at];
      left = math.min(left, cells.left[at]);
      top = math.min(top, cells.top[at]);
      right = math.max(right, cells.right[at]);
      bottom = math.max(bottom, cells.bottom[at]);

      for (int dy = -1; dy <= 1; dy += 1) {
        for (int dx = -1; dx <= 1; dx += 1) {
          final int nextColumn = column + dx;
          final int nextRow = row + dy;

          if (nextColumn < 0 || nextColumn >= columns || nextRow < 0 || nextRow >= rows) {
            continue;
          }

          final int next = nextRow * columns + nextColumn;

          if (pixels[next] == 0 || seen[next] == 1) {
            continue;
          }

          seen[next] = 1;
          stack[depth] = next;
          depth += 1;
        }
      }
    }

    regions.add(
      DiffImageRegion(
        x: left,
        y: top,
        width: right - left + 1,
        height: bottom - top + 1,
        pixels: count,
      ),
    );
  }

  final bool complete = regions.length <= maxRegions;

  if (!complete) {
    regions.sort((DiffImageRegion one, DiffImageRegion other) => other.pixels - one.pixels);
    regions.removeRange(maxRegions, regions.length);
  }

  // Reading order, which is the order a reader steps through them in. The
  // largest-first sort above is only ever a way of choosing which ones to keep.
  regions.sort(
    (DiffImageRegion one, DiffImageRegion other) =>
        one.y != other.y ? one.y - other.y : one.x - other.x,
  );

  return RegionResult(regions, complete);
}
