import 'package:diffine/diffine.dart';
import 'package:diffine/src/internal/scale.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('draws anything that is not a positive, finite number at 1', () {
    expect(usableScale(1.25), 1.25);
    expect(usableScale(0.875), 0.875);

    for (final double given in <double>[
      0,
      -1,
      double.nan,
      double.infinity,
      double.negativeInfinity,
    ]) {
      expect(usableScale(given), 1, reason: '$given');
    }
  });

  test('multiplies the measurements a line is drawn from, and not the box', () {
    final DiffineTheme given = DiffineTheme.light.copyWith(letterSpacing: 0.5);
    final DiffineTheme scaled = ScaledTheme().resolve(given, 2);

    expect(scaled.fontSize, given.fontSize * 2);
    expect(scaled.lineHeight, given.lineHeight * 2);
    expect(scaled.linksWidth, given.linksWidth * 2);

    expect(scaled.height, given.height);
    expect(scaled.radius, given.radius);
    expect(scaled.letterSpacing, given.letterSpacing);
    expect(scaled.tabSize, given.tabSize);
  });

  test('hands back the same theme until the theme or the scale changes', () {
    // A painter compares its theme by identity, so a copy made on every build
    // would paint the picture again on every build.
    final ScaledTheme scaler = ScaledTheme();

    expect(scaler.resolve(DiffineTheme.light, 1), same(DiffineTheme.light));

    final DiffineTheme first = scaler.resolve(DiffineTheme.light, 2);

    expect(scaler.resolve(DiffineTheme.light, 2), same(first));
    expect(scaler.resolve(DiffineTheme.dark, 2), isNot(same(first)));
    expect(scaler.resolve(DiffineTheme.dark, 1.5).fontSize, DiffineTheme.dark.fontSize * 1.5);
  });
}
