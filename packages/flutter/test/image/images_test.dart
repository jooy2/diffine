import 'dart:typed_data';

import 'package:diffine/diffine.dart';
import 'package:flutter_test/flutter_test.dart';

/// A picture written as rows of characters, the same way `image_test.dart`
/// writes one.
const Map<String, List<int>> _paints = <String, List<int>>{
  '.': <int>[255, 255, 255, 255],
  '#': <int>[0, 0, 0, 255],
  'r': <int>[255, 0, 0, 255],
  'g': <int>[0, 128, 0, 255],
  'b': <int>[0, 0, 255, 255],
  ' ': <int>[0, 0, 0, 0],
};

DiffPixels picture(List<String> rows) {
  final int width = rows.isEmpty ? 0 : rows.first.length;
  final Uint8List data = Uint8List(width * rows.length * 4);

  for (int y = 0; y < rows.length; y += 1) {
    for (int x = 0; x < width; x += 1) {
      data.setRange((y * width + x) * 4, (y * width + x) * 4 + 4, _paints[rows[y][x]]!);
    }
  }

  return DiffPixels(data: data, width: width, height: rows.length);
}

/// The mask read back a pixel at a time, as the bits it holds.
List<String> bits(DiffImagesResult result) => <String>[
  for (int y = 0; y < result.height; y += 1)
    <String>[
      for (int x = 0; x < result.width; x += 1) result.mask[y * result.width + x].toRadixString(16),
    ].join(),
];

void main() {
  group('diffImages', () {
    test('finds nothing between three copies of the same picture', () {
      final DiffPixels same = picture(<String>['.#.', '#.#']);
      final DiffImagesResult result = diffImages(<DiffPixels>[same, same, same]);

      expect(result.stats.changed, 0);
      expect(result.stats.unchanged, 6);
      expect(result.stats.ratio, 0);
      expect(result.stats.apart, <int>[0, 0, 0]);
      expect(result.regions, isEmpty);
    });

    test('sets a bit for each picture that disagrees with the baseline', () {
      final DiffImagesResult result = diffImages(<DiffPixels>[
        picture(<String>['...', '...']),
        picture(<String>['r..', '...']),
        picture(<String>['..g', '...']),
      ]);

      // The second picture is bit 1 and the third is bit 2.
      expect(bits(result), <String>['204', '000']);
      expect(result.stats.changed, 2);
      expect(result.stats.apart, <int>[0, 1, 1]);
    });

    test('sets both bits where two of them disagree about the same pixel', () {
      final DiffImagesResult result = diffImages(<DiffPixels>[
        picture(<String>['..']),
        picture(<String>['r.']),
        picture(<String>['g.']),
      ]);

      expect(bits(result), <String>['60']);
    });

    test('counts a pixel only some of them cover', () {
      final DiffImagesResult result = diffImages(<DiffPixels>[
        picture(<String>['..']),
        picture(<String>['..']),
        picture(<String>['..', '..']),
      ]);

      expect(result.width, 2);
      expect(result.height, 2);
      // The third picture reaches the second row and the other two do not, so
      // it is the one that disagrees there.
      expect(bits(result), <String>['00', '44']);
      expect(result.stats.covered, 4);
      expect(result.stats.changed, 2);
    });

    test('reads the baseline the options name', () {
      final DiffImagesResult result = diffImages(<DiffPixels>[
        picture(<String>['r.']),
        picture(<String>['..']),
        picture(<String>['..']),
      ], const DiffImagesOptions(baseline: 1));

      expect(result.baseline, 1);
      // Counted against the second picture, the odd one out is the first.
      expect(bits(result), <String>['10']);
      expect(result.stats.apart, <int>[1, 0, 0]);
    });

    test('says the same thing about a pair as the comparison of two does', () {
      final DiffPixels before = picture(<String>['....', '.rg.', '....']);
      final DiffPixels after = picture(<String>['....', '.r..', '..b.']);
      final DiffImageResult pair = diffImage(before, after, const DiffImageOptions(tolerance: 0));
      final DiffImagesResult many = diffImages(<DiffPixels>[
        before,
        after,
      ], const DiffImagesOptions(tolerance: 0));

      expect(many.width, pair.width);
      expect(many.height, pair.height);
      expect(many.stats.changed, pair.stats.changed);
      expect(many.stats.covered, pair.stats.covered);
      expect(many.regions.length, pair.regions.length);
    });

    test('refuses a list that is not a comparison', () {
      final DiffPixels one = picture(<String>['..']);

      expect(() => diffImages(<DiffPixels>[one]), throwsA(isA<RangeError>()));
      expect(
        () => diffImages(List<DiffPixels>.filled(kMostPictures + 1, one)),
        throwsA(isA<RangeError>()),
      );
      expect(
        () => diffImages(<DiffPixels>[one, one], const DiffImagesOptions(baseline: 2)),
        throwsA(isA<RangeError>()),
      );
      expect(
        () => diffImages(<DiffPixels>[one, DiffPixels(data: Uint8List(4), width: 2, height: 2)]),
        throwsA(isA<RangeError>()),
      );
    });

    test('takes every picture up to the most it holds', () {
      final DiffImagesResult result = diffImages(<DiffPixels>[
        for (int at = 0; at < kMostPictures; at += 1)
          if (at == kMostPictures - 1) picture(<String>['r.']) else picture(<String>['..']),
      ]);

      // Only the last one differs, and its bit is the highest one a byte holds.
      expect(result.mask[0], 1 << (kMostPictures - 1));
      expect(result.mask[0], 128);
    });
  });

  group('imagesSimilarity', () {
    test('says three copies of the same picture are the same picture', () {
      final DiffPixels same = picture(<String>['.#.', '#.#']);
      final DiffImagesSimilarity result = imagesSimilarity(<DiffPixels>[same, same, same]);

      expect(result.similarity, 1);
      expect(result.identical, isTrue);
      expect(result.each, <double>[1, 1, 1]);
      expect(result.pixels, 6);
      expect(result.sizes.first, const DiffImageSize(width: 3, height: 2));
    });

    test('says which of them is the odd one out', () {
      final DiffImagesSimilarity result = imagesSimilarity(<DiffPixels>[
        picture(<String>['....', '....']),
        picture(<String>['r...', '....']),
        picture(<String>['rrrr', '....']),
      ]);

      expect(result.each[0], 1);
      expect(result.each[1], 7 / 8);
      expect(result.each[2], 0.5);
      // Four of the eight, because the two disagreements overlap: a pixel is
      // agreed about only when every picture agrees about it.
      expect(result.matched, 4);
      expect(result.similarity, 0.5);
    });
  });

  group('paintDiffImages', () {
    test('paints every pixel any of them disagrees about', () {
      final DiffImagesResult result = diffImages(<DiffPixels>[
        picture(<String>['..']),
        picture(<String>['r.']),
        picture(<String>['.g']),
      ]);
      final DiffPixels painted = paintDiffImages(result);

      expect(painted.data.sublist(0, 4), <int>[232, 62, 140, 255]);
      expect(painted.data.sublist(4, 8), <int>[232, 62, 140, 255]);
    });

    test('paints one picture on its own', () {
      final DiffImagesResult result = diffImages(<DiffPixels>[
        picture(<String>['..']),
        picture(<String>['r.']),
        picture(<String>['.g']),
      ]);
      final DiffPixels painted = paintDiffImages(result, picture: 1);

      expect(painted.data.sublist(0, 4), <int>[232, 62, 140, 255]);
      // The second pixel is the third picture's disagreement, not the second's.
      expect(painted.data.sublist(4, 8), <int>[0, 0, 0, 0]);
    });
  });
}
