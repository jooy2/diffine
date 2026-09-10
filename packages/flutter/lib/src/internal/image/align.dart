/// Where the second picture has to be put for the two to line up.
///
/// A picture moved one pixel to the right is, to a comparison that starts both
/// of them at the top-left corner, a picture where every edge in it changed.
/// That is the honest answer to the question that was asked and almost never
/// the one anybody wanted, and it is what this exists to avoid: before the
/// pixels are compared, an offset is looked for that puts the most of one
/// picture on top of the most of the other.
///
/// The search is coarse first. Trying every offset within sixteen pixels of the
/// corner is a thousand-odd whole-picture comparisons, which costs more than
/// the comparison it is preparing for; trying them on a picture shrunk to a
/// thumbnail costs nothing, and the answer that comes back is right to within a
/// pixel of the thumbnail — so the picture is halved until it is small, the
/// offset is found there, and each step back up refines it by one pixel on the
/// finer grid. What that turns a thousand comparisons into is a few dozen.
library;

import 'dart:math' as math;
import 'dart:typed_data';

import 'package:diffine/src/internal/image/colour.dart';
import 'package:diffine/src/types.dart';

/// One picture in one byte a pixel, at one size.
class _Level {
  const _Level(this.grey, this.width, this.height);

  final Uint8List grey;
  final int width;
  final int height;
}

/// Nothing smaller than this is worth halving again.
const int _smallest = 24;

/// How many times a picture may be halved, however wide the search is.
const int _deepest = 5;

/// The share of the smaller picture an offset has to keep overlapping to count.
const double _enough = 0.25;

/// How many pixels one candidate offset is scored over, at most.
///
/// The finest level of the pyramid is the whole picture, and scoring nine
/// candidates across ten million pixels costs more than the comparison this is
/// preparing for. Every fourth pixel of a large one says the same thing about
/// where an edge falls as all of them do, so past this the level is sampled.
const int _samples = 250000;

/// How far apart the pixels a level is scored over are.
int _strideOf(_Level level) {
  return math.max(1, math.sqrt(level.width * level.height / _samples).round());
}

/// The same picture at half the width and half the height, averaged four to
/// one.
_Level _halve(_Level level) {
  final int next = math.max(1, level.width >> 1);
  final int lines = math.max(1, level.height >> 1);
  final Uint8List smaller = Uint8List(next * lines);

  for (int y = 0; y < lines; y += 1) {
    final int top = math.min(y * 2, level.height - 1) * level.width;
    final int bottom = math.min(y * 2 + 1, level.height - 1) * level.width;

    for (int x = 0; x < next; x += 1) {
      final int left = math.min(x * 2, level.width - 1);
      final int right = math.min(x * 2 + 1, level.width - 1);

      smaller[y * next + x] =
          (level.grey[top + left] +
              level.grey[top + right] +
              level.grey[bottom + left] +
              level.grey[bottom + right]) >>
          2;
    }
  }

  return _Level(smaller, next, lines);
}

/// How badly the two line up at this offset, as the average difference in
/// brightness over the part where they overlap.
///
/// [double.infinity] when they barely overlap at all. Without that floor the
/// search would find that sliding one picture off the side of the other leaves
/// four pixels in perfect agreement, and report it as the best answer it could
/// find.
double _costOf(_Level before, _Level after, int dx, int dy, int stride) {
  final int fromX = math.max(0, dx);
  final int toX = math.min(before.width, dx + after.width);
  final int fromY = math.max(0, dy);
  final int toY = math.min(before.height, dy + after.height);

  final int covered = (toX - fromX) * (toY - fromY);
  final int smaller = math.min(before.width * before.height, after.width * after.height);

  if (covered <= 0 || covered < smaller * _enough) {
    return double.infinity;
  }

  int total = 0;
  int counted = 0;

  for (int y = fromY; y < toY; y += stride) {
    final int beforeRow = y * before.width;
    final int afterRow = (y - dy) * after.width - dx;

    for (int x = fromX; x < toX; x += stride) {
      final int step = before.grey[beforeRow + x] - after.grey[afterRow + x];

      total += step < 0 ? -step : step;
      counted += 1;
    }
  }

  return counted == 0 ? double.infinity : total / counted;
}

/// The offset with the least cost, preferring the smallest one where two tie.
DiffImageOffset _search(_Level before, _Level after, DiffImageOffset around, int reach) {
  final int stride = _strideOf(before);

  DiffImageOffset best = around;
  double least = double.infinity;
  int nearest = 1 << 30;

  for (int dy = around.y - reach; dy <= around.y + reach; dy += 1) {
    for (int dx = around.x - reach; dx <= around.x + reach; dx += 1) {
      final double cost = _costOf(before, after, dx, dy, stride);

      if (cost == double.infinity) {
        continue;
      }

      // A picture with a flat area in it lines up equally well several ways.
      // The smallest of those is the one that is true, and every other one is
      // the search reading a coincidence as evidence.
      final int distance = dx.abs() + dy.abs();

      if (cost < least || (cost == least && distance < nearest)) {
        best = DiffImageOffset(dx, dy);
        least = cost;
        nearest = distance;
      }
    }
  }

  return least == double.infinity ? around : best;
}

/// The offset that lines the second picture up with the first, within `radius`
/// pixels of where it started.
///
/// How far down the pyramid the search starts is decided by that radius rather
/// than fixed: halving the picture halves the distance an offset has to travel,
/// so a search that has to reach sixteen pixels starts four halvings down where
/// sixteen pixels is one, and a search that only has to reach two starts one
/// halving down. Anything the pyramid overshoots is clipped at the end, so the
/// answer is always inside what was asked for.
DiffImageOffset findOffset(DiffPixels before, DiffPixels after, int radius) {
  final int reach = math.max(0, radius);

  if (reach == 0 || before.width == 0 || before.height == 0) {
    return DiffImageOffset.zero;
  }

  final List<_Level> first = <_Level>[
    _Level(brightnessOf(before.data, before.width, before.height), before.width, before.height),
  ];
  final List<_Level> second = <_Level>[
    _Level(brightnessOf(after.data, after.width, after.height), after.width, after.height),
  ];

  final int deepest = math.min(_deepest, math.max(0, (math.log(reach) / math.ln2).floor()));

  for (int level = 0; level < deepest; level += 1) {
    final _Level one = first[level];
    final _Level other = second[level];

    if (math.min(math.min(one.width, one.height), math.min(other.width, other.height)) <=
        _smallest) {
      break;
    }

    first.add(_halve(one));
    second.add(_halve(other));
  }

  final int built = first.length - 1;
  DiffImageOffset found = _search(
    first[built],
    second[built],
    DiffImageOffset.zero,
    math.max(1, (reach / math.pow(2, built)).ceil()),
  );

  // Back up the pyramid: what was one pixel down there is two up here, and one
  // step either way is all that is left to decide.
  for (int level = built - 1; level >= 0; level -= 1) {
    found = _search(first[level], second[level], DiffImageOffset(found.x * 2, found.y * 2), 1);
  }

  int clamp(int value) => math.max(-reach, math.min(reach, value));

  return DiffImageOffset(clamp(found.x), clamp(found.y));
}
