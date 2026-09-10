/// An overlay of its own, so that a comparison works wherever it is dropped.
///
/// Two things inside a text comparison need one: selecting text out of a pane,
/// and the editor's menu of languages, which is drawn out of the flow so that
/// the bar it sits in does not clip it. An application built on `MaterialApp`
/// has an overlay already and one built on a bare `WidgetsApp` has none, and a
/// widget that worked in the first and threw in the second would be a widget
/// nobody could rely on.
///
/// `Overlay` only ever reads `initialEntries` once, so the entry cannot be the
/// place the content is written: an entry built in the first frame would go on
/// drawing the first frame for ever. The content is handed down past it
/// instead, through an inherited widget the entry reads — which is what makes
/// the entry's builder run again whenever the content changes.
library;

import 'package:flutter/widgets.dart';

/// One overlay, with the content inside it.
class DiffineSurface extends StatefulWidget {
  /// One surface.
  const DiffineSurface({required this.child, super.key});

  /// What is drawn inside the overlay.
  final Widget child;

  @override
  State<DiffineSurface> createState() => _DiffineSurfaceState();
}

class _DiffineSurfaceState extends State<DiffineSurface> {
  late final OverlayEntry _entry = OverlayEntry(
    builder: (BuildContext context) => _DiffineSurfaceScope.of(context),
  );

  @override
  Widget build(BuildContext context) {
    return _DiffineSurfaceScope(
      content: widget.child,
      // `Clip.none`, because the menu is the thing that has to reach past the
      // edge — clipping it here would put back exactly the problem taking it
      // out of the flow solved.
      child: Overlay(clipBehavior: Clip.none, initialEntries: <OverlayEntry>[_entry]),
    );
  }
}

class _DiffineSurfaceScope extends InheritedWidget {
  const _DiffineSurfaceScope({required this.content, required super.child});

  final Widget content;

  static Widget of(BuildContext context) {
    final _DiffineSurfaceScope? scope = context
        .dependOnInheritedWidgetOfExactType<_DiffineSurfaceScope>();

    return scope?.content ?? const SizedBox.shrink();
  }

  @override
  bool updateShouldNotify(_DiffineSurfaceScope old) => old.content != content;
}
