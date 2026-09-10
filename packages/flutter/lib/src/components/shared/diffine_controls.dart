/// The buttons and the boxes, built on the widgets layer.
///
/// Nothing here imports `package:flutter/material.dart` or
/// `package:flutter/cupertino.dart`, which is the same promise the React
/// package makes with its stylesheet: a comparison dropped into somebody else's
/// screen brings no second design system with it, and it looks like the palette
/// it was handed rather than like the toolkit it was built with.
library;

import 'package:diffine/src/theme/tokens.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

/// How large the square a small button occupies is.
const double kDiffineControlSize = 26;

/// A button with one of the marks in it.
class DiffineIconButton extends StatefulWidget {
  /// One button.
  const DiffineIconButton({
    required this.theme,
    required this.label,
    required this.child,
    super.key,
    this.onPressed,
    this.pressed,
    this.expanded,
    this.size = kDiffineControlSize,
  });

  /// The palette it is drawn in.
  final DiffineTheme theme;

  /// What it does, which is what a screen reader is told and what a pointer
  /// held over it shows.
  final String label;

  /// The mark inside it.
  final Widget child;

  /// What it does. `null` disables it.
  final VoidCallback? onPressed;

  /// Whether it is a switch that is on, for the three in the search box.
  final bool? pressed;

  /// Whether it opens something that is open, for the two that do.
  final bool? expanded;

  /// How large the square it occupies is.
  final double size;

  @override
  State<DiffineIconButton> createState() => _DiffineIconButtonState();
}

class _DiffineIconButtonState extends State<DiffineIconButton> {
  bool _hovered = false;
  bool _focused = false;

  @override
  Widget build(BuildContext context) {
    final DiffineTheme theme = widget.theme;
    final bool disabled = widget.onPressed == null;
    final bool on = widget.pressed ?? false;
    final Color colour = disabled
        ? theme.muted.withValues(alpha: 0.45)
        : on
        ? theme.accent
        : theme.muted;

    return Semantics(
      container: true,
      button: true,
      enabled: !disabled,
      label: widget.label,
      toggled: widget.pressed,
      expanded: widget.expanded,
      child: FocusableActionDetector(
        enabled: !disabled,
        onShowHoverHighlight: (bool value) => setState(() => _hovered = value),
        onShowFocusHighlight: (bool value) => setState(() => _focused = value),
        mouseCursor: disabled ? MouseCursor.defer : SystemMouseCursors.click,
        actions: <Type, Action<Intent>>{
          ActivateIntent: CallbackAction<ActivateIntent>(
            onInvoke: (ActivateIntent intent) {
              widget.onPressed?.call();

              return null;
            },
          ),
        },
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: widget.onPressed,
          child: Container(
            width: widget.size,
            height: widget.size,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(6),
              color: on
                  ? theme.accent.withValues(alpha: 0.14)
                  : _hovered && !disabled
                  ? theme.border.withValues(alpha: 0.5)
                  : null,
              border: _focused ? Border.all(color: theme.accent, width: 1.5) : null,
            ),
            // The mark says what the button does a second time, and the label
            // above has already said it in words. A screen reader that read
            // both would say "Match case Aa".
            child: ExcludeSemantics(
              child: DefaultTextStyle(
                style: TextStyle(color: colour, fontSize: 11, fontWeight: FontWeight.w600),
                child: IconTheme(
                  data: IconThemeData(color: colour),
                  child: widget.child,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// A button with a word in it, for Replace and Replace all.
class DiffineTextButton extends StatefulWidget {
  /// One button.
  const DiffineTextButton({required this.theme, required this.label, super.key, this.onPressed});

  /// The palette it is drawn in.
  final DiffineTheme theme;

  /// What it says, and what it does.
  final String label;

  /// What it does. `null` disables it.
  final VoidCallback? onPressed;

  @override
  State<DiffineTextButton> createState() => _DiffineTextButtonState();
}

class _DiffineTextButtonState extends State<DiffineTextButton> {
  bool _hovered = false;
  bool _focused = false;

  @override
  Widget build(BuildContext context) {
    final DiffineTheme theme = widget.theme;
    final bool disabled = widget.onPressed == null;

    return Semantics(
      button: true,
      enabled: !disabled,
      label: widget.label,
      container: true,
      child: FocusableActionDetector(
        enabled: !disabled,
        onShowHoverHighlight: (bool value) => setState(() => _hovered = value),
        onShowFocusHighlight: (bool value) => setState(() => _focused = value),
        mouseCursor: disabled ? MouseCursor.defer : SystemMouseCursors.click,
        actions: <Type, Action<Intent>>{
          ActivateIntent: CallbackAction<ActivateIntent>(
            onInvoke: (ActivateIntent intent) {
              widget.onPressed?.call();

              return null;
            },
          ),
        },
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: widget.onPressed,
          child: Container(
            height: kDiffineControlSize,
            padding: const EdgeInsets.symmetric(horizontal: 10),
            alignment: Alignment.center,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(6),
              color: _hovered && !disabled ? theme.border.withValues(alpha: 0.5) : null,
              border: Border.all(
                color: _focused ? theme.accent : theme.border,
                width: _focused ? 1.5 : 1,
              ),
            ),
            child: Text(
              widget.label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: disabled ? theme.muted.withValues(alpha: 0.45) : theme.muted,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// One of the three switches inside the search box: case, whole words,
/// expression.
class DiffineFlagButton extends StatelessWidget {
  /// One switch.
  const DiffineFlagButton({
    required this.theme,
    required this.mark,
    required this.label,
    required this.on,
    required this.onToggle,
    super.key,
  });

  /// The palette it is drawn in.
  final DiffineTheme theme;

  /// The two characters that stand for it.
  final String mark;

  /// What it does.
  final String label;

  /// Whether it is on.
  final bool on;

  /// Flips it.
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    return DiffineIconButton(
      theme: theme,
      label: label,
      pressed: on,
      size: 22,
      onPressed: onToggle,
      child: Text(mark),
    );
  }
}

/// A one-line box to type into.
///
/// [EditableText] rather than a `TextField`, that being Material's — see the
/// note at the top of this file.
class DiffineField extends StatefulWidget {
  /// One box.
  const DiffineField({
    required this.theme,
    required this.controller,
    required this.focusNode,
    required this.label,
    super.key,
    this.placeholder,
    this.invalid = false,
    this.onChanged,
    this.onSubmitted,
  });

  /// The palette it is drawn in.
  final DiffineTheme theme;

  /// What it holds.
  final TextEditingController controller;

  /// Its focus.
  final FocusNode focusNode;

  /// What it is called to a screen reader.
  final String label;

  /// What it says before anybody has typed into it.
  final String? placeholder;

  /// Whether what is in it cannot be read, which is drawn rather than said.
  final bool invalid;

  /// Somebody typed.
  final ValueChanged<String>? onChanged;

  /// Enter, with whether Shift was held.
  final void Function({required bool shift})? onSubmitted;

  @override
  State<DiffineField> createState() => _DiffineFieldState();
}

class _DiffineFieldState extends State<DiffineField> {
  @override
  void initState() {
    super.initState();
    widget.focusNode.addListener(_onFocus);
  }

  @override
  void dispose() {
    widget.focusNode.removeListener(_onFocus);
    super.dispose();
  }

  void _onFocus() {
    if (mounted) {
      setState(() {});
    }
  }

  @override
  Widget build(BuildContext context) {
    final DiffineTheme theme = widget.theme;
    final bool empty = widget.controller.text.isEmpty;
    final String? placeholder = widget.placeholder;

    return Semantics(
      textField: true,
      label: widget.label,
      child: Container(
        height: kDiffineControlSize,
        padding: const EdgeInsets.symmetric(horizontal: 8),
        alignment: Alignment.centerLeft,
        decoration: BoxDecoration(
          color: theme.surface,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(
            color: widget.invalid
                ? theme.deleteText
                : widget.focusNode.hasFocus
                ? theme.accent
                : theme.border,
            width: widget.focusNode.hasFocus || widget.invalid ? 1.5 : 1,
          ),
        ),
        child: Stack(
          alignment: Alignment.centerLeft,
          children: <Widget>[
            if (empty && placeholder != null)
              Text(
                placeholder,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(fontSize: 12, color: theme.muted.withValues(alpha: 0.65)),
              ),
            EditableText(
              controller: widget.controller,
              focusNode: widget.focusNode,
              style: TextStyle(fontSize: 12, color: theme.text),
              cursorColor: theme.accent,
              backgroundCursorColor: theme.border,
              selectionColor: theme.selection,
              selectionControls: emptyTextSelectionControls,
              maxLines: 1,
              // The action rather than a raw Enter, because on the web a field
              // with the focus is a real input and the browser keeps the
              // keystroke. `unspecified` is the one that does not tell the
              // platform the person is finished — which is exactly what Enter
              // in a find bar does not mean.
              textInputAction: TextInputAction.unspecified,
              onChanged: widget.onChanged,
              onSubmitted: (String _) =>
                  widget.onSubmitted?.call(shift: HardwareKeyboard.instance.isShiftPressed),
              rendererIgnoresPointer: false,
            ),
          ],
        ),
      ),
    );
  }
}
