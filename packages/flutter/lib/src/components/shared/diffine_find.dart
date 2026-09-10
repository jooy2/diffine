/// Looking for a run of text in one pane, and reading what turned up.
///
/// There is one of these per pane rather than one per widget, and everything
/// about it follows from that. Each side of a split view is opened, typed into,
/// counted and closed on its own, because the two documents are two documents:
/// a name a reader is chasing through the version on the left is not a name
/// they are chasing through the version on the right, and one box over both of
/// them would answer the wrong question twice.
///
/// The bar sits under the pane it belongs to, on the same grid the header and
/// the bar of counts are on, so the half of the widget it is under is the half
/// it searches.
library;

import 'package:diffine/src/components/shared/diffine_controls.dart';
import 'package:diffine/src/components/shared/diffine_icons.dart';
import 'package:diffine/src/internal/i18n.dart';
import 'package:diffine/src/internal/pane_search.dart';
import 'package:diffine/src/theme/tokens.dart';
import 'package:diffine/src/types.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

/// The button in the bar above the panes that opens one pane's search.
class DiffineFindToggle extends StatelessWidget {
  /// One button.
  const DiffineFindToggle({
    required this.theme,
    required this.search,
    required this.label,
    required this.strings,
    super.key,
  });

  /// The palette it is drawn in.
  final DiffineTheme theme;

  /// The search it opens.
  final PaneSearch search;

  /// What the pane being searched is called, so two buttons are told apart.
  final String label;

  /// The words.
  final DiffineStrings strings;

  @override
  Widget build(BuildContext context) {
    return DiffineIconButton(
      theme: theme,
      label: fill(strings.searchIn, <String, Object>{'label': label}),
      expanded: search.open,
      onPressed: () => search.open ? search.hide() : search.show(),
      child: const DiffineIcons(DiffineIcon.magnifier),
    );
  }
}

/// One pane's search bar: the query, what it found, and the way through it.
class DiffineFind extends StatelessWidget {
  /// One bar.
  const DiffineFind({
    required this.theme,
    required this.search,
    required this.label,
    required this.replaceable,
    required this.onClose,
    required this.strings,
    super.key,
    this.onReplace,
    this.onReplaceAll,
  });

  /// The palette it is drawn in.
  final DiffineTheme theme;

  /// The search it draws.
  final PaneSearch search;

  /// What this pane is called, which is what names the bar to a screen reader.
  final String label;

  /// Whether there is a document here to write into, which a viewer has not.
  final bool replaceable;

  /// Puts the focus back where a reader would want it, once the bar has closed.
  final VoidCallback onClose;

  /// The words.
  final DiffineStrings strings;

  /// Writes the replacement over the match being read.
  final VoidCallback? onReplace;

  /// Writes it over every match.
  final VoidCallback? onReplaceAll;

  void _close() {
    search.hide();
    onClose();
  }

  @override
  Widget build(BuildContext context) {
    final int total = search.found.matches.length;
    final String counted = search.found.capped ? '$total+' : '$total';
    final bool nothing = search.query.text.isNotEmpty && total == 0;

    return Semantics(
      container: true,
      label: fill(strings.searchIn, <String, Object>{'label': label}),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 5),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            if (replaceable)
              Padding(
                padding: const EdgeInsets.only(right: 4),
                child: DiffineIconButton(
                  theme: theme,
                  label: strings.replace,
                  expanded: search.replacing,
                  onPressed: () {
                    search.replacing = !search.replacing;
                    search.onChanged();
                  },
                  child: DiffineIcons(
                    search.replacing ? DiffineIcon.chevronUp : DiffineIcon.chevronDown,
                  ),
                ),
              ),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                mainAxisSize: MainAxisSize.min,
                children: <Widget>[
                  _queryRow(total, counted, nothing),
                  if (replaceable && search.replacing)
                    Padding(padding: const EdgeInsets.only(top: 4), child: _replaceRow(total)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _queryRow(int total, String counted, bool nothing) {
    return Row(
      children: <Widget>[
        Expanded(
          child: Stack(
            alignment: Alignment.centerRight,
            children: <Widget>[
              Shortcuts(
                shortcuts: const <ShortcutActivator, Intent>{
                  SingleActivator(LogicalKeyboardKey.escape): DismissIntent(),
                },
                child: Actions(
                  actions: <Type, Action<Intent>>{
                    DismissIntent: CallbackAction<DismissIntent>(
                      onInvoke: (DismissIntent intent) {
                        _close();

                        return null;
                      },
                    ),
                  },
                  child: DiffineField(
                    theme: theme,
                    controller: search.query,
                    focusNode: search.queryFocus,
                    label: strings.search,
                    placeholder: strings.search,
                    invalid: search.invalid || nothing,
                    onChanged: (String _) => search.retype(),
                    onSubmitted: ({required bool shift}) => search.step(shift ? -1 : 1),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(right: 4),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: <Widget>[
                    DiffineFlagButton(
                      theme: theme,
                      mark: 'Aa',
                      label: strings.matchCase,
                      on: search.options.matchCase,
                      onToggle: () => search.setOptions(
                        search.options.copyWith(matchCase: !search.options.matchCase),
                      ),
                    ),
                    DiffineFlagButton(
                      theme: theme,
                      mark: 'ab',
                      label: strings.wholeWord,
                      on: search.options.wholeWord,
                      onToggle: () => search.setOptions(
                        search.options.copyWith(wholeWord: !search.options.wholeWord),
                      ),
                    ),
                    DiffineFlagButton(
                      theme: theme,
                      mark: '.*',
                      label: strings.regex,
                      on: search.options.regex,
                      onToggle: () =>
                          search.setOptions(search.options.copyWith(regex: !search.options.regex)),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        // Drawn for the eye and hidden from a screen reader, which is told the
        // same thing in a sentence when it changes.
        Semantics(
          liveRegion: true,
          label: search.query.text.isEmpty
              ? ''
              : total == 0
              ? strings.searchEmpty
              : fill(strings.searchPosition, <String, Object>{
                  'position': search.current + 1,
                  'total': counted,
                }),
          child: ExcludeSemantics(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Text(
                '${total == 0 ? 0 : search.current + 1} / $counted',
                style: TextStyle(
                  fontSize: 11,
                  color: theme.muted,
                  fontFeatures: const <FontFeature>[FontFeature.tabularFigures()],
                ),
              ),
            ),
          ),
        ),
        DiffineIconButton(
          theme: theme,
          label: strings.searchPrevious,
          onPressed: total == 0 ? null : () => search.step(-1),
          child: const DiffineIcons(DiffineIcon.chevronUp),
        ),
        DiffineIconButton(
          theme: theme,
          label: strings.searchNext,
          onPressed: total == 0 ? null : () => search.step(1),
          child: const DiffineIcons(DiffineIcon.chevronDown),
        ),
        DiffineIconButton(
          theme: theme,
          label: strings.searchClose,
          onPressed: _close,
          child: const DiffineIcons(DiffineIcon.cross),
        ),
      ],
    );
  }

  Widget _replaceRow(int total) {
    return Row(
      children: <Widget>[
        Expanded(
          child: Shortcuts(
            shortcuts: const <ShortcutActivator, Intent>{
              SingleActivator(LogicalKeyboardKey.escape): DismissIntent(),
            },
            child: Actions(
              actions: <Type, Action<Intent>>{
                DismissIntent: CallbackAction<DismissIntent>(
                  onInvoke: (DismissIntent intent) {
                    _close();

                    return null;
                  },
                ),
              },
              child: DiffineField(
                theme: theme,
                controller: search.replacement,
                focusNode: search.replacementFocus,
                label: strings.replaceWith,
                placeholder: strings.replaceWith,
                onSubmitted: ({required bool shift}) =>
                    shift ? onReplaceAll?.call() : onReplace?.call(),
              ),
            ),
          ),
        ),
        const SizedBox(width: 4),
        DiffineTextButton(
          theme: theme,
          label: strings.replace,
          onPressed: total == 0 ? null : onReplace,
        ),
        const SizedBox(width: 4),
        DiffineTextButton(
          theme: theme,
          label: strings.replaceAll,
          onPressed: total == 0 ? null : onReplaceAll,
        ),
      ],
    );
  }
}
