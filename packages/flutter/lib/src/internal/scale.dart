/// How large a comparison draws its own text and controls, handed down to
/// every part of it that draws a size.
///
/// Nearly every widget a comparison is built from has a size of its own
/// written into it: a button's square, a bar's height, a label's type, the
/// room between two of them. Passing the multiple to each of those as an
/// argument would thread one number through every constructor in the package,
/// and a token on the theme would make it something an application sets
/// twice. An inherited widget reaches all of them from the one place that
/// knows it — including the language menu, which is drawn in an overlay but
/// inherits from where it was opened.
library;

import 'package:diffine/src/theme/tokens.dart';
import 'package:flutter/widgets.dart';

/// A multiple a comparison can actually be drawn at: `given` where it is a
/// positive, finite number, and 1 where it is anything else.
///
/// Zero would draw nothing, a negative number would draw everything inside
/// out, and neither is what anybody who passed one meant.
double usableScale(double given) {
  return given.isFinite && given > 0 ? given : 1;
}

/// The multiple, for everything under the comparison that draws a size.
class DiffineScale extends InheritedWidget {
  /// One multiple, over one comparison.
  const DiffineScale({required this.scale, required super.child, super.key});

  /// How large the text and the controls are drawn, as a multiple of their
  /// default size.
  final double scale;

  /// The multiple over `context`, or 1 where no comparison has set one.
  static double of(BuildContext context) {
    final DiffineScale? found = context.dependOnInheritedWidgetOfExactType<DiffineScale>();

    return found?.scale ?? 1;
  }

  @override
  bool updateShouldNotify(DiffineScale old) => old.scale != scale;
}

/// The theme a comparison draws with at one scale, worked out again only when
/// the theme or the scale it came from changes.
///
/// The size of a line and the width of the column between the panes are
/// tokens, so they are multiplied on the theme and everything measured from
/// them follows. The height of the box, its corners, the spacing between
/// letters and the width of a tab are tokens too, and are left alone.
///
/// Kept rather than made again on every build, because a theme is compared by
/// identity wherever a painter decides whether to paint again — and a copy
/// made per build would repaint a picture on every move of the pointer.
class ScaledTheme {
  DiffineTheme? _given;
  double _scale = 1;
  DiffineTheme? _scaled;

  /// `given`, with its measurements multiplied by `scale`.
  DiffineTheme resolve(DiffineTheme given, double scale) {
    if (scale == 1) {
      return given;
    }

    final DiffineTheme? held = _scaled;

    if (held != null && identical(given, _given) && scale == _scale) {
      return held;
    }

    final DiffineTheme scaled = given.copyWith(
      fontSize: given.fontSize * scale,
      lineHeight: given.lineHeight * scale,
      linksWidth: given.linksWidth * scale,
    );

    _given = given;
    _scale = scale;
    _scaled = scaled;

    return scaled;
  }
}
