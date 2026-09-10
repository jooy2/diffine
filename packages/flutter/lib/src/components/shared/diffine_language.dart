/// What the documents are being coloured as, at the right end of the bar above
/// them.
///
/// Two widgets draw this and they draw it differently, which is the whole of
/// why there are two here rather than one with a boolean. A viewer is given its
/// language by the application and says which one it is; an editor is given a
/// document somebody pasted and has no idea what it is, so it asks.
///
/// The menu is an [OverlayPortal] rather than a list laid out in the bar,
/// because the bar clips what overflows it — taken out of the flow, the menu is
/// bounded by the screen instead, and it opens upwards when there is more room
/// above than below.
library;

import 'dart:math' as math;

import 'package:diffine/src/components/shared/diffine_icons.dart';
import 'package:diffine/src/internal/highlight/catalogue.dart';
import 'package:diffine/src/internal/scroll.dart';
import 'package:diffine/src/theme/tokens.dart';
import 'package:diffine/src/types.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

/// How far the menu is held off the control, and off the edge of the screen.
const double _gap = 4;

/// The tallest the menu is allowed to be before it scrolls inside itself.
const double _tallest = 288;

/// How tall one option is.
const double _optionHeight = 28;

/// How long a run of typed letters is still one word.
const Duration _typing = Duration(milliseconds: 600);

/// The name of the language, for a view an application already decided about.
class DiffineLanguageName extends StatelessWidget {
  /// One name.
  const DiffineLanguageName({
    required this.theme,
    required this.language,
    required this.strings,
    super.key,
  });

  /// The palette it is drawn in.
  final DiffineTheme theme;

  /// What the documents are being coloured as.
  final String? language;

  /// The words.
  final DiffineStrings strings;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: strings.language,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 6),
        child: Text(
          languageName(language),
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: theme.muted),
        ),
      ),
    );
  }
}

/// The same name, as a menu, for a view whose documents arrive by being typed
/// in.
///
/// Everything a reader expects from a menu is written out: the arrow keys and
/// Home and End move through the list, Enter and Space take the one under the
/// cursor, Escape leaves without taking it, and typing a letter jumps to the
/// language that starts with it — which is how anybody actually finds one of
/// thirty-five.
class DiffineLanguagePicker extends StatefulWidget {
  /// One menu.
  const DiffineLanguagePicker({
    required this.theme,
    required this.language,
    required this.onLanguageChange,
    required this.strings,
    super.key,
  });

  /// The palette it is drawn in.
  final DiffineTheme theme;

  /// What the documents are being coloured as.
  final String language;

  /// A language was chosen.
  final ValueChanged<String> onLanguageChange;

  /// The words.
  final DiffineStrings strings;

  @override
  State<DiffineLanguagePicker> createState() => _DiffineLanguagePickerState();
}

class _DiffineLanguagePickerState extends State<DiffineLanguagePicker> {
  final OverlayPortalController _menu = OverlayPortalController();
  final LayerLink _link = LayerLink();
  final FocusNode _focus = FocusNode(debugLabel: 'diffine language');
  final ScrollController _scroller = ScrollController();

  /// Which option the keyboard is on, which is not yet which one is chosen.
  int _active = 0;
  String _typed = '';
  DateTime _typedAt = DateTime.fromMillisecondsSinceEpoch(0);
  bool _open = false;

  @override
  void dispose() {
    _focus.dispose();
    _scroller.dispose();
    super.dispose();
  }

  int get _chosen {
    final int found = kDiffineLanguages.indexWhere(
      (DiffineLanguageOption option) => option.id == widget.language,
    );

    return found < 0 ? 0 : found;
  }

  void _show() {
    setState(() {
      _active = _chosen;
      _open = true;
    });
    _menu.show();
    WidgetsBinding.instance.addPostFrameCallback((Duration _) => _reveal());
  }

  void _hide() {
    if (!_open) {
      return;
    }

    setState(() => _open = false);
    _menu.hide();
  }

  void _choose(int index) {
    _hide();

    final DiffineLanguageOption option = kDiffineLanguages[index];

    if (option.id != widget.language) {
      widget.onLanguageChange(option.id);
    }
  }

  /// Moves `by` options, stopping at either end rather than wrapping.
  void _move(int by) {
    setState(() => _active = math.min(kDiffineLanguages.length - 1, math.max(0, _active + by)));
    _reveal();
  }

  /// Scrolls the menu, and only the menu, until the active option is in it.
  void _reveal() {
    final ScrollPosition? position = scrollPositionOf(_scroller);

    if (position == null) {
      return;
    }

    final double top = _active * _optionHeight;
    final double bottom = top + _optionHeight;

    if (top < position.pixels) {
      _scroller.jumpTo(math.min(top, position.maxScrollExtent));
    } else if (bottom > position.pixels + position.viewportDimension) {
      _scroller.jumpTo(math.min(bottom - position.viewportDimension, position.maxScrollExtent));
    }
  }

  /// Jumps to the language a run of typed letters names.
  void _jump(String letter) {
    final DateTime now = DateTime.now();
    final String letters = now.difference(_typedAt) > _typing ? letter : '$_typed$letter';

    _typed = letters;
    _typedAt = now;

    final int found = kDiffineLanguages.indexWhere(
      (DiffineLanguageOption option) => option.name.toLowerCase().startsWith(letters.toLowerCase()),
    );

    if (found >= 0) {
      setState(() => _active = found);

      if (!_open) {
        _show();
      } else {
        _reveal();
      }
    }
  }

  KeyEventResult _onKey(FocusNode node, KeyEvent event) {
    if (event is! KeyDownEvent && event is! KeyRepeatEvent) {
      return KeyEventResult.ignored;
    }

    final LogicalKeyboardKey key = event.logicalKey;

    if (key == LogicalKeyboardKey.arrowDown || key == LogicalKeyboardKey.arrowUp) {
      if (_open) {
        _move(key == LogicalKeyboardKey.arrowDown ? 1 : -1);
      } else {
        _show();
      }

      return KeyEventResult.handled;
    }

    if (_open && (key == LogicalKeyboardKey.home || key == LogicalKeyboardKey.end)) {
      setState(() => _active = key == LogicalKeyboardKey.home ? 0 : kDiffineLanguages.length - 1);
      _reveal();

      return KeyEventResult.handled;
    }

    if (key == LogicalKeyboardKey.enter || key == LogicalKeyboardKey.space) {
      if (_open) {
        _choose(_active);
      } else {
        _show();
      }

      return KeyEventResult.handled;
    }

    if (key == LogicalKeyboardKey.escape && _open) {
      _hide();

      return KeyEventResult.handled;
    }

    final String? character = event.character;

    if (character != null &&
        character.length == 1 &&
        character.trim().isNotEmpty &&
        !HardwareKeyboard.instance.isControlPressed &&
        !HardwareKeyboard.instance.isMetaPressed &&
        !HardwareKeyboard.instance.isAltPressed) {
      _jump(character);

      return KeyEventResult.handled;
    }

    return KeyEventResult.ignored;
  }

  @override
  Widget build(BuildContext context) {
    final DiffineTheme theme = widget.theme;

    return CompositedTransformTarget(
      link: _link,
      child: OverlayPortal(
        controller: _menu,
        overlayChildBuilder: _buildMenu,
        child: Focus(
          focusNode: _focus,
          onKeyEvent: _onKey,
          onFocusChange: (bool has) {
            if (!has) {
              _hide();
            }
          },
          child: Semantics(
            button: true,
            expanded: _open,
            label: widget.strings.language,
            child: MouseRegion(
              cursor: SystemMouseCursors.click,
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () {
                  _focus.requestFocus();

                  if (_open) {
                    _hide();
                  } else {
                    _show();
                  }
                },
                child: Container(
                  height: 26,
                  padding: const EdgeInsets.symmetric(horizontal: 6),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: _focus.hasFocus ? theme.accent : theme.border),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: <Widget>[
                      Text(
                        languageName(widget.language),
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: theme.muted,
                        ),
                      ),
                      const SizedBox(width: 4),
                      DiffineIcons(DiffineIcon.chevronDown, size: 11, color: theme.muted),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMenu(BuildContext context) {
    final DiffineTheme theme = widget.theme;
    final RenderBox? box = context.findRenderObject() as RenderBox?;
    final Size screen = MediaQuery.sizeOf(context);
    final double below = screen.height - (box?.size.height ?? 0);
    final double height = math.min(
      _tallest,
      math.max(_optionHeight, math.min(below, kDiffineLanguages.length * _optionHeight)),
    );

    return Stack(
      children: <Widget>[
        // A press anywhere else closes the menu, which is what a menu that is
        // not a modal does.
        Positioned.fill(
          child: GestureDetector(behavior: HitTestBehavior.translucent, onTap: _hide),
        ),
        CompositedTransformFollower(
          link: _link,
          targetAnchor: Alignment.bottomRight,
          followerAnchor: Alignment.topRight,
          offset: const Offset(0, _gap),
          child: Align(
            alignment: Alignment.topRight,
            child: Container(
              width: 176,
              height: height,
              decoration: BoxDecoration(
                color: theme.surface,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: theme.border),
                boxShadow: <BoxShadow>[
                  BoxShadow(
                    color: const Color(0xff000000).withValues(alpha: 0.18),
                    blurRadius: 14,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              clipBehavior: Clip.antiAlias,
              child: ListView.builder(
                controller: _scroller,
                itemCount: kDiffineLanguages.length,
                itemExtent: _optionHeight,
                padding: EdgeInsets.zero,
                itemBuilder: (BuildContext context, int index) {
                  final DiffineLanguageOption option = kDiffineLanguages[index];
                  final bool active = index == _active;
                  final bool current = index == _chosen;

                  return Semantics(
                    selected: current,
                    button: true,
                    label: option.name,
                    child: MouseRegion(
                      cursor: SystemMouseCursors.click,
                      onEnter: (PointerEnterEvent _) => setState(() => _active = index),
                      child: GestureDetector(
                        behavior: HitTestBehavior.opaque,
                        onTap: () => _choose(index),
                        child: Container(
                          alignment: Alignment.centerLeft,
                          padding: const EdgeInsets.symmetric(horizontal: 10),
                          color: active ? theme.accent.withValues(alpha: 0.14) : null,
                          child: Text(
                            option.name,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: current ? FontWeight.w700 : FontWeight.w400,
                              color: current ? theme.accent : theme.text,
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        ),
      ],
    );
  }
}
