import 'dart:math' as math;
import 'dart:typed_data';
import 'dart:ui' show Color;

import 'package:diffine/diffine.dart';
import 'package:diffine/src/internal/image/compare.dart';
import 'package:flutter_test/flutter_test.dart';

/// A picture written as rows of characters, so that a test reads as the thing
/// it is testing.
///
/// A digit is a shade of grey, `0` black and `9` white, which is what an edge
/// drawn smooth is made of. The letters are the colours worth naming, and a
/// space is nothing at all — a pixel with no alpha behind it.
const Map<String, List<int>> _paints = <String, List<int>>{
  '.': <int>[255, 255, 255, 255],
  '#': <int>[0, 0, 0, 255],
  'r': <int>[255, 0, 0, 255],
  'g': <int>[0, 128, 0, 255],
  ' ': <int>[0, 0, 0, 0],
};

List<int> paintOf(String mark) {
  final int code = mark.codeUnitAt(0);

  if (code >= 0x30 && code <= 0x39) {
    final int grey = ((code - 0x30) / 9 * 255).round();

    return <int>[grey, grey, grey, 255];
  }

  final List<int>? paint = _paints[mark];

  if (paint == null) {
    throw ArgumentError("No paint for '$mark'");
  }

  return paint;
}

DiffPixels picture(List<String> rows) {
  final int width = rows.isEmpty ? 0 : rows.first.length;
  final Uint8List data = Uint8List(width * rows.length * 4);

  for (int y = 0; y < rows.length; y += 1) {
    if (rows[y].length != width) {
      throw ArgumentError('every row of a picture has to be the same width');
    }

    for (int x = 0; x < width; x += 1) {
      data.setRange((y * width + x) * 4, (y * width + x) * 4 + 4, paintOf(rows[y][x]));
    }
  }

  return DiffPixels(data: data, width: width, height: rows.length);
}

/// The mask read back as characters, one a pixel: `.` equal, `~+-` the rest.
List<String> marks(DiffImageResult result) {
  const Map<DiffPixelKind, String> letters = <DiffPixelKind, String>{
    DiffPixelKind.equal: '.',
    DiffPixelKind.changed: '~',
    DiffPixelKind.added: '+',
    DiffPixelKind.removed: '-',
  };

  return <String>[
    for (int y = 0; y < result.height; y += 1)
      <String>[
        for (int x = 0; x < result.width; x += 1)
          letters[kDiffPixelKinds[result.mask[y * result.width + x]]]!,
      ].join(),
  ];
}

String regionOf(DiffImageRegion region) =>
    '${region.x},${region.y} ${region.width}x${region.height} (${region.pixels})';

void main() {
  group('diffImage', () {
    test('finds nothing between two copies of the same picture', () {
      final DiffImageResult result = diffImage(
        picture(<String>['.#.', '#.#']),
        picture(<String>['.#.', '#.#']),
      );

      expect(result.stats.pixels, 6);
      expect(result.stats.covered, 6);
      expect(result.stats.unchanged, 6);
      expect(result.stats.changed, 0);
      expect(result.stats.ratio, 0);
      expect(result.stats.distance, 0);
      expect(result.regions, isEmpty);
      expect(result.complete, isTrue);
    });

    test('refuses a buffer that is shorter than the size it was given', () {
      final DiffPixels short = DiffPixels(data: Uint8List(4 * 3), width: 2, height: 2);
      final DiffPixels whole = picture(<String>['..', '..']);

      expect(() => diffImage(short, whole), throwsA(isA<RangeError>()));
      expect(() => diffImage(whole, short), throwsA(isA<RangeError>()));
    });

    test('takes a buffer with room to spare', () {
      final DiffPixels roomy = DiffPixels(data: Uint8List(4 * 8), width: 2, height: 2);

      expect(diffImage(roomy, roomy).stats.changed, 0);
    });

    test('marks the pixel that changed and nothing else', () {
      final DiffImageResult result = diffImage(
        picture(<String>['...', '...', '...']),
        picture(<String>['...', '.r.', '...']),
      );

      expect(marks(result), <String>['...', '.~.', '...']);
      expect(result.stats.changed, 1);
      expect(result.regions.map(regionOf).toList(), <String>['1,1 1x1 (1)']);
    });

    test('puts every pixel of the frame in the right one of the four kinds', () {
      // The frame arithmetic decides which picture covers which pixel, and it
      // is the part of the loop that is written for speed rather than for
      // reading. So it is checked against the plain answer: for every pixel of
      // the frame, is it inside the first rectangle, the second, both, or
      // neither.
      const List<List<int>> sizes = <List<int>>[
        <int>[4, 3],
        <int>[3, 4],
        <int>[5, 5],
        <int>[1, 6],
      ];
      const List<List<int>> offsets = <List<int>>[
        <int>[0, 0],
        <int>[2, 1],
        <int>[-2, 1],
        <int>[1, -3],
        <int>[-4, -4],
        <int>[6, 6],
      ];

      DiffPixels flat(int width, int height, String mark) =>
          picture(List<String>.filled(height, mark * width));

      for (final List<int> first in sizes) {
        for (final List<int> second in sizes) {
          for (final List<int> offset in offsets) {
            // Two colours nothing could call equal, so every shared pixel is a
            // changed one and the four kinds are decided by the frame alone.
            final DiffPixels before = flat(first[0], first[1], '#');
            final DiffPixels after = flat(second[0], second[1], '.');
            final int dx = offset[0];
            final int dy = offset[1];
            final int left = math.min(0, dx);
            final int top = math.min(0, dy);
            final DiffImageResult result = comparePixels(
              before,
              after,
              CompareOptions(
                tolerance: 0,
                ignoreAntialiasing: false,
                blockSize: 16,
                maxRegions: 200,
                offset: DiffImageOffset(dx, dy),
              ),
            );
            final List<String> wanted = <String>[];

            for (int y = 0; y < result.height; y += 1) {
              final StringBuffer row = StringBuffer();

              for (int x = 0; x < result.width; x += 1) {
                final bool inBefore =
                    x + left >= 0 && x + left < first[0] && y + top >= 0 && y + top < first[1];
                final bool inAfter =
                    x + left >= dx &&
                    x + left < dx + second[0] &&
                    y + top >= dy &&
                    y + top < dy + second[1];

                row.write(
                  inBefore && inAfter
                      ? '~'
                      : inAfter
                      ? '+'
                      : inBefore
                      ? '-'
                      : '.',
                );
              }

              wanted.add(row.toString());
            }

            expect(
              marks(result),
              wanted,
              reason: '${first[0]}×${first[1]} ${second[0]}×${second[1]} $dx,$dy',
            );
          }
        }
      }
    });

    test('leaves out the corner of the frame neither picture reaches', () {
      // One is wider and the other is taller, so the bottom-right corner of the
      // frame is nothing at all rather than two pixels that agree.
      final DiffImageResult result = diffImage(
        picture(<String>['....', '....']),
        picture(<String>['..', '..', '..', '..']),
      );

      expect(result.stats.pixels, 16);
      expect(result.stats.covered, 12);
      expect(result.stats.unchanged, 4);
      expect(result.stats.added + result.stats.removed, 8);
      expect(result.stats.ratio, 8 / 12);
    });

    test('measures how far apart the pixels both cover are', () {
      final DiffImageResult result = diffImage(
        picture(<String>['..', '..']),
        picture(<String>['.8', '..']),
        const DiffImageOptions(tolerance: 1),
      );

      // One pixel of four moved from white to a shade of grey, and the other
      // three did not move at all.
      expect(result.stats.distance, greaterThan(0));
      expect(result.stats.distance, closeTo((255 - 226) / 255 / 4, 0.01));
    });

    test('counts a pixel that only one of the two pictures has', () {
      final DiffImageResult result = diffImage(
        picture(<String>['..', '..']),
        picture(<String>['...', '...', '...']),
      );

      expect(result.width, 3);
      expect(result.height, 3);
      expect(marks(result), <String>['..+', '..+', '+++']);
      expect(result.stats.added, 5);
      expect(result.stats.removed, 0);
    });

    test('reads a picture that lost a row as pixels that were removed', () {
      final DiffImageResult result = diffImage(
        picture(<String>['..', '..']),
        picture(<String>['..']),
      );

      expect(marks(result), <String>['..', '--']);
      expect(result.stats.removed, 2);
    });

    test('lets a difference under the tolerance go', () {
      final DiffPixels before = picture(<String>['55']);
      final DiffPixels after = picture(<String>['56']);

      expect(diffImage(before, after, const DiffImageOptions(tolerance: 0.2)).stats.changed, 0);
      expect(diffImage(before, after, const DiffImageOptions(tolerance: 0)).stats.changed, 1);
    });

    test('tells nothing at all from a white pixel', () {
      // Both are white once they are blended onto white, and only the
      // transparency says otherwise.
      final DiffImageResult result = diffImage(
        picture(<String>[' ']),
        picture(<String>['.']),
        const DiffImageOptions(tolerance: 0),
      );

      expect(result.stats.changed, 1);
    });

    test('ignores an edge that was drawn smooth a second way', () {
      // A black bar on a white screen, with the column the edge falls in drawn
      // as a blend of the two — and drawn again with the blend weighted
      // otherwise.
      final DiffPixels before = picture(<String>[
        '..5###..',
        '..5###..',
        '..5###..',
        '..5###..',
        '..5###..',
      ]);
      final DiffPixels after = picture(<String>[
        '..8###..',
        '..8###..',
        '..8###..',
        '..8###..',
        '..8###..',
      ]);

      expect(diffImage(before, after).stats.changed, 0);
      expect(
        diffImage(before, after, const DiffImageOptions(ignoreAntialiasing: false)).stats.changed,
        5,
      );
    });

    test('ignores a hairline drawn smooth a second way', () {
      // One pixel wide, so the line itself is not level. The screen either side
      // of it is, which is what says there is an edge here at all.
      final DiffPixels before = picture(<String>[
        '..5#5..',
        '..5#5..',
        '..5#5..',
        '..5#5..',
        '..5#5..',
      ]);
      final DiffPixels after = picture(<String>[
        '..8#3..',
        '..8#3..',
        '..8#3..',
        '..8#3..',
        '..8#3..',
      ]);

      expect(diffImage(before, after).stats.changed, 0);
    });

    test('keeps the edge of something pasted over a level area', () {
      // The edge arrived with the patch. The first picture is level here and
      // has no edge to answer it with, so the step belongs to what changed
      // rather than excusing it — taking the stronger of the two steps let the
      // boundary of a cloned patch come back as pixels that had not changed.
      const String flat = '55555555';
      const String pasted = '55552100';
      final DiffPixels before = picture(<String>[flat, flat, flat, flat, flat, flat]);
      final DiffPixels after = picture(<String>[pasted, pasted, pasted, pasted, pasted, pasted]);

      // Four columns differ, and every row of every one of them counts.
      expect(diffImage(before, after).stats.changed, 4 * 6);
    });

    test('keeps a change inside a texture, where no edge runs', () {
      // Every pixel of this lies between the pixels around it and nothing in it
      // is level, so there is no edge for a change to hide under. The pixel in
      // the middle moved two shades, which the range across the texture would
      // otherwise be wide enough to account for.
      final DiffPixels before = picture(<String>['04836', '71592', '28364', '59107', '13649']);
      final DiffPixels after = picture(<String>['04836', '71592', '28764', '59107', '13649']);

      expect(diffImage(before, after).stats.changed, 1);
    });

    test('keeps a pixel that took a colour of its own', () {
      // Nothing around it is darker, so it is not a blend of anything: this is
      // a mark that arrived rather than an edge that moved.
      expect(
        diffImage(
          picture(<String>['...', '...', '...']),
          picture(<String>['...', '.#.', '...']),
        ).stats.changed,
        1,
      );
    });

    test('groups the changed pixels into one region a change', () {
      final DiffImageResult result = diffImage(
        picture(<String>['.......', '.......', '.......', '.......']),
        picture(<String>['r......', '.......', '.......', '.....g.']),
        const DiffImageOptions(blockSize: 2),
      );

      expect(result.regions.map(regionOf).toList(), <String>['0,0 1x1 (1)', '5,3 1x1 (1)']);
    });

    test('joins what falls in one square of the grid, and splits what does not', () {
      final DiffPixels before = picture(<String>['.....', '.....', '.....']);
      final DiffPixels after = picture(<String>['r...r', '.....', '.....']);

      expect(
        diffImage(
          before,
          after,
          const DiffImageOptions(blockSize: 8),
        ).regions.map(regionOf).toList(),
        <String>['0,0 5x1 (2)'],
      );
      expect(diffImage(before, after, const DiffImageOptions(blockSize: 2)).regions, hasLength(2));
    });

    test('keeps the largest regions and says the list is not all of them', () {
      final DiffImageResult result = diffImage(
        picture(<String>['.....', '.....', '.....']),
        picture(<String>['r.r.r', '.....', 'r.r.r']),
        const DiffImageOptions(blockSize: 1, maxRegions: 2),
      );

      expect(result.regions, hasLength(2));
      expect(result.complete, isFalse);
      // The mask still holds every one of them.
      expect(result.stats.changed, 6);
    });

    group('with align: shift', () {
      final DiffPixels before = picture(<String>[
        '.......',
        '.#####.',
        '.#...#.',
        '.#.#.#.',
        '.#...#.',
        '.#####.',
        '.......',
      ]);
      // The same drawing, one pixel to the right and one down.
      final DiffPixels moved = picture(<String>[
        '........',
        '........',
        '..#####.',
        '..#...#.',
        '..#.#.#.',
        '..#...#.',
        '..#####.',
        '........',
      ]);

      test('reads a picture that moved as a picture that changed, left alone', () {
        expect(diffImage(before, moved).stats.changed, greaterThan(10));
      });

      test('finds the offset and compares what actually overlaps', () {
        final DiffImageResult result = diffImage(
          before,
          moved,
          const DiffImageOptions(align: DiffImageAlign.shift),
        );

        // The drawing sits a pixel further right and down, so the picture
        // holding it is moved a pixel back to put the two on top of each other.
        expect(result.offset.x, -1);
        expect(result.offset.y, -1);
        expect(result.stats.changed, 0);
        expect(<int>[result.before.x, result.before.y], <int>[1, 1]);
        expect(<int>[result.after.x, result.after.y], <int>[0, 0]);
      });

      test('stays where it is when the two are already lined up', () {
        final DiffImageResult result = diffImage(
          before,
          before,
          const DiffImageOptions(align: DiffImageAlign.shift),
        );

        expect(<int>[result.offset.x, result.offset.y], <int>[0, 0]);
      });

      test('goes no further than the radius it was given', () {
        final DiffImageResult result = diffImage(
          before,
          moved,
          const DiffImageOptions(align: DiffImageAlign.shift, alignRadius: 0),
        );

        expect(<int>[result.offset.x, result.offset.y], <int>[0, 0]);
      });
    });
  });

  group('paintDiffImage', () {
    test('paints what changed and leaves the rest see-through', () {
      final DiffImageResult result = diffImage(
        picture(<String>['..', '..']),
        picture(<String>['r.', '..']),
      );
      final DiffPixels painted = paintDiffImage(result);

      expect(painted.width, 2);
      expect(painted.height, 2);
      // The first pixel changed, so it is painted; the second did not.
      expect(painted.data[3], 255);
      expect(painted.data[7], 0);
    });

    test('takes the colours it is given', () {
      final DiffImageResult result = diffImage(picture(<String>['.']), picture(<String>['r']));
      final DiffPixels painted = paintDiffImage(
        result,
        const DiffImagePaint(changed: Color(0xff0000ff)),
      );

      expect(painted.data.sublist(0, 4), <int>[0, 0, 255, 255]);
    });
  });

  group('imageSimilarity', () {
    test('says two copies of the same picture are the same picture', () {
      final DiffImageSimilarity result = imageSimilarity(
        picture(<String>['.#.', '#.#']),
        picture(<String>['.#.', '#.#']),
      );

      expect(result.similarity, 1);
      expect(result.identical, isTrue);
      expect(result.pixels, 6);
      expect(result.matched, 6);
      expect(result.changed, 0);
      expect(result.distance, 0);
      expect(result.before, const DiffImageSize(width: 3, height: 2));
      expect(result.after, const DiffImageSize(width: 3, height: 2));
    });

    test('counts a changed pixel against the share', () {
      final DiffImageSimilarity result = imageSimilarity(
        picture(<String>['....', '....']),
        picture(<String>['....', '..r.']),
      );

      expect(result.changed, 1);
      expect(result.matched, 7);
      expect(result.similarity, 7 / 8);
      expect(result.identical, isFalse);
    });

    test('counts a pixel only one of the two covers against it', () {
      final DiffImageSimilarity result = imageSimilarity(
        picture(<String>['..']),
        picture(<String>['..', '..']),
      );

      expect(result.added, 2);
      expect(result.pixels, 4);
      expect(result.similarity, 0.5);
      expect(result.before, const DiffImageSize(width: 2, height: 1));
      expect(result.after, const DiffImageSize(width: 2, height: 2));
    });

    test('reads the options the comparison reads', () {
      final DiffPixels before = picture(<String>['55', '55']);
      final DiffPixels after = picture(<String>['56', '55']);

      expect(imageSimilarity(before, after, const DiffImageOptions(tolerance: 0)).similarity, 0.75);
      expect(imageSimilarity(before, after, const DiffImageOptions(tolerance: 0.2)).similarity, 1);
    });

    test('tells a picture that is unalike everywhere from one that is far apart', () {
      final DiffPixels flat = picture(<String>['....', '....']);
      // Every pixel moved, and only a little.
      final DiffPixels dimmed = picture(<String>['8888', '8888']);
      // A quarter of the pixels moved, and all the way.
      final DiffPixels painted = picture(<String>['##..', '....']);

      final DiffImageSimilarity little = imageSimilarity(
        flat,
        dimmed,
        const DiffImageOptions(tolerance: 0),
      );
      final DiffImageSimilarity lot = imageSimilarity(flat, painted);

      expect(little.similarity, lessThan(lot.similarity));
      expect(little.distance, lessThan(lot.distance));
    });
  });
}
