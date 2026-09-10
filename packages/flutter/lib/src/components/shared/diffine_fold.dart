/// One row's worth of band, standing in for the lines a pane is not drawing.
///
/// It takes a line's place and a line's height, which is what lets everything
/// around it carry on unchanged: the rows are still all the same height, and a
/// band is still one entry in the list a search and the navigation count
/// through.
///
/// A run that was folded away is a button, because the lines are in hand and a
/// reader can ask for them. A run that is missing — the lines between one hunk
/// of a patch and the next — is not, because there is nothing to open. Both say
/// how many lines they stand for, which is the part a reader needs either way.
library;

import 'package:diffine/src/internal/fold.dart';
import 'package:diffine/src/internal/i18n.dart';
import 'package:diffine/src/theme/tokens.dart';
import 'package:diffine/src/types.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/widgets.dart';

/// One band.
class DiffineFoldBand extends StatefulWidget {
  /// One band.
  const DiffineFoldBand({
    required this.theme,
    required this.fold,
    required this.strings,
    super.key,
    this.onExpand,
  });

  /// The palette it is drawn in.
  final DiffineTheme theme;

  /// The run it stands in for.
  final FoldRun fold;

  /// The words.
  final DiffineStrings strings;

  /// Opens the run. Left out for a run whose lines nobody has.
  final void Function(FoldRun fold)? onExpand;

  @override
  State<DiffineFoldBand> createState() => _DiffineFoldBandState();
}

class _DiffineFoldBandState extends State<DiffineFoldBand> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    final DiffineTheme theme = widget.theme;
    final String text = fill(widget.strings.folded, <String, Object>{'lines': widget.fold.lines});
    final bool openable = widget.fold.expandable && widget.onExpand != null;

    final Widget band = Container(
      height: theme.lineHeight,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: _hovered && openable ? theme.border.withValues(alpha: 0.4) : theme.gutter,
        border: Border(
          top: BorderSide(color: theme.border),
          bottom: BorderSide(color: theme.border),
        ),
      ),
      child: Text(
        text,
        style: theme.lineStyle.copyWith(color: theme.muted, fontSize: theme.fontSize - 1),
      ),
    );

    if (!openable) {
      return SelectionContainer.disabled(child: band);
    }

    return SelectionContainer.disabled(
      child: Semantics(
        container: true,
        button: true,
        label: fill(widget.strings.expand, <String, Object>{'lines': widget.fold.lines}),
        child: MouseRegion(
          cursor: SystemMouseCursors.click,
          onEnter: (PointerEnterEvent _) => setState(() => _hovered = true),
          onExit: (PointerExitEvent _) => setState(() => _hovered = false),
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () => widget.onExpand!(widget.fold),
            // The band says the count again, and the label above has already
            // said it as the thing pressing the band would do.
            child: ExcludeSemantics(child: band),
          ),
        ),
      ),
    );
  }
}
