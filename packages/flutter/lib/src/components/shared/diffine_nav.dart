/// Two buttons and a count, for reading a long comparison one change at a time.
///
/// They wrap. A reader working down a file wants the next change rather than a
/// button that stops working at the bottom, and the count beside them is what
/// makes that unambiguous — going from `4 / 4` to `1 / 4` says what happened.
///
/// The count is drawn for the eye and hidden from a screen reader, which is
/// told the same thing in a sentence when it changes. A fraction read out as
/// "one slash four" is not what anybody meant by it.
library;

import 'package:diffine/src/components/shared/diffine_controls.dart';
import 'package:diffine/src/components/shared/diffine_icons.dart';
import 'package:diffine/src/internal/i18n.dart';
import 'package:diffine/src/theme/tokens.dart';
import 'package:diffine/src/types.dart';
import 'package:flutter/widgets.dart';

/// The pair of buttons and the count between them.
class DiffineNav extends StatelessWidget {
  /// One set of controls.
  const DiffineNav({
    required this.theme,
    required this.total,
    required this.current,
    required this.onStep,
    required this.strings,
    super.key,
  });

  /// The palette it is drawn in.
  final DiffineTheme theme;

  /// How many changes there are.
  final int total;

  /// Which one a reader has moved to, or -1 before they have moved to any.
  final int current;

  /// Which way to move. Where that lands is the widget's to work out.
  final void Function(int direction) onStep;

  /// The words.
  final DiffineStrings strings;

  @override
  Widget build(BuildContext context) {
    final bool none = total == 0;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        DiffineIconButton(
          theme: theme,
          label: strings.previousChange,
          onPressed: none ? null : () => onStep(-1),
          child: const DiffineIcons(DiffineIcon.chevronUp),
        ),
        Semantics(
          liveRegion: true,
          label: current < 0
              ? ''
              : fill(strings.changePosition, <String, Object>{
                  'position': current + 1,
                  'total': total,
                }),
          child: ExcludeSemantics(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Text(
                '${current < 0 ? '–' : current + 1} / $total',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: theme.muted,
                  fontFeatures: const <FontFeature>[FontFeature.tabularFigures()],
                ),
              ),
            ),
          ),
        ),
        DiffineIconButton(
          theme: theme,
          label: strings.nextChange,
          onPressed: none ? null : () => onStep(1),
          child: const DiffineIcons(DiffineIcon.chevronDown),
        ),
      ],
    );
  }
}
