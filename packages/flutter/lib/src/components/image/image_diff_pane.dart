/// One pane of a picture comparison: a canvas, and every way a reader has of
/// moving around inside it.
///
/// The pane owns nothing about the comparison. It is handed a frame, a viewport
/// and a list of things to draw, and it hands back what a reader did — which is
/// what makes a split view work without a line of code to keep two panes in
/// step. Both are given the same viewport, so there is no second position to
/// synchronise.
library;

import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:diffine/src/components/shared/diffine_controls.dart';
import 'package:diffine/src/internal/image/paint.dart';
import 'package:diffine/src/internal/image/viewport.dart';
import 'package:diffine/src/theme/tokens.dart';
import 'package:diffine/src/types.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

/// How far an arrow key moves the picture, in the pane's own pixels.
const double _nudge = 48;

/// One pane.
class ImageDiffPane extends StatefulWidget {
  /// One pane.
  const ImageDiffPane({
    required this.theme,
    required this.name,
    required this.frame,
    required this.viewport,
    required this.onViewport,
    required this.onBox,
    required this.layers,
    required this.regions,
    required this.current,
    required this.blank,
    required this.loading,
    required this.failed,
    required this.strings,
    super.key,
    this.mask,
    this.unchanged = DiffineImageUnchanged.keep,
    this.stencil,
    this.editable = false,
    this.onChoose,
    this.wipe,
    this.onWipe,
  });

  /// The palette it is drawn in.
  final DiffineTheme theme;

  /// What it is called, which is what a screen reader is told it is.
  final String name;

  /// How large the frame both pictures are compared in is.
  final Size frame;

  /// Where the reader is looking.
  final DiffineImageViewport viewport;

  /// A reader moved or zoomed.
  final ValueChanged<DiffineImageViewport> onViewport;

  /// The pane measured itself, which is what a fitted view is worked out from.
  final ValueChanged<Size> onBox;

  /// What it draws, in order.
  final List<Layer> layers;

  /// The boxes round the changes.
  final List<DiffImageRegion> regions;

  /// Which one a reader has stepped to, or -1.
  final int current;

  /// Whether there is anything to draw at all.
  final bool blank;

  /// Nothing to draw yet.
  final bool loading;

  /// Nothing to draw, and what arrived was not a picture.
  final bool failed;

  /// The words.
  final DiffineStrings strings;

  /// The mask as a picture, or `null` where the marks are turned off.
  final ui.Image? mask;

  /// What is done with the pixels nothing happened to.
  final DiffineImageUnchanged unchanged;

  /// The mask as something to cut the pictures down to, for the modes that do.
  final ui.Image? stencil;

  /// Whether a picture can be put into it.
  final bool editable;

  /// Asks the application for a picture, since choosing a file is the
  /// application's to do.
  final VoidCallback? onChoose;

  /// Where the line between the two pictures is, for the view that draws one.
  final double? wipe;

  /// The line was moved.
  final ValueChanged<double>? onWipe;

  @override
  State<ImageDiffPane> createState() => _ImageDiffPaneState();
}

class _ImageDiffPaneState extends State<ImageDiffPane> {
  final FocusNode _focus = FocusNode(debugLabel: 'diffine picture');
  Size _box = Size.zero;

  @override
  void dispose() {
    _focus.dispose();
    super.dispose();
  }

  void _measure(Size size) {
    if (_box == size) {
      return;
    }

    _box = size;
    WidgetsBinding.instance.addPostFrameCallback((Duration _) {
      if (mounted) {
        widget.onBox(size);
      }
    });
  }

  /// The wheel, which does one of three things.
  ///
  /// Held with the modifier, it zooms about the pointer. On a picture larger
  /// than the pane it moves it. On a picture that is already all in view it
  /// does nothing at all — the screen it is on scrolls instead, which is what a
  /// reader scrolling past a comparison meant.
  void _onPointerSignal(PointerSignalEvent event) {
    if (event is! PointerScrollEvent) {
      return;
    }

    final bool zooming =
        HardwareKeyboard.instance.isControlPressed || HardwareKeyboard.instance.isMetaPressed;

    if (!zooming && widget.viewport.scale <= fitScale(widget.frame, _box)) {
      return;
    }

    if (zooming) {
      widget.onViewport(
        zoomAbout(
          viewport: widget.viewport,
          frame: widget.frame,
          pane: _box,
          // A wheel notch is not a step of a button, and it is not the same
          // size on two devices. Reading it as an exponent is what keeps a
          // trackpad's hundred small deltas smooth and a mouse's three large
          // ones from crossing the whole range.
          scale: widget.viewport.scale * math.exp(-event.scrollDelta.dy / 320),
          paneX: event.localPosition.dx,
          paneY: event.localPosition.dy,
        ),
      );

      return;
    }

    widget.onViewport(
      panBy(widget.viewport, widget.frame, -event.scrollDelta.dx, -event.scrollDelta.dy),
    );
  }

  KeyEventResult _onKey(FocusNode node, KeyEvent event) {
    if (event is! KeyDownEvent && event is! KeyRepeatEvent) {
      return KeyEventResult.ignored;
    }

    final double step = HardwareKeyboard.instance.isShiftPressed ? _nudge * 4 : _nudge;
    final Map<LogicalKeyboardKey, Offset> moves = <LogicalKeyboardKey, Offset>{
      LogicalKeyboardKey.arrowLeft: Offset(step, 0),
      LogicalKeyboardKey.arrowRight: Offset(-step, 0),
      LogicalKeyboardKey.arrowUp: Offset(0, step),
      LogicalKeyboardKey.arrowDown: Offset(0, -step),
    };
    final Offset? move = moves[event.logicalKey];

    if (move != null) {
      widget.onViewport(panBy(widget.viewport, widget.frame, move.dx, move.dy));

      return KeyEventResult.handled;
    }

    final double zooming =
        event.logicalKey == LogicalKeyboardKey.equal || event.logicalKey == LogicalKeyboardKey.add
        ? kZoomStep
        : event.logicalKey == LogicalKeyboardKey.minus
        ? 1 / kZoomStep
        : 0;

    if (zooming != 0) {
      widget.onViewport(
        zoomAbout(
          viewport: widget.viewport,
          frame: widget.frame,
          pane: _box,
          scale: widget.viewport.scale * zooming,
          paneX: _box.width / 2,
          paneY: _box.height / 2,
        ),
      );

      return KeyEventResult.handled;
    }

    return KeyEventResult.ignored;
  }

  @override
  Widget build(BuildContext context) {
    final DiffineTheme theme = widget.theme;

    return Semantics(
      image: true,
      label: widget.name,
      child: Focus(
        focusNode: _focus,
        onKeyEvent: _onKey,
        child: LayoutBuilder(
          builder: (BuildContext context, BoxConstraints constraints) {
            final Size size = Size(constraints.maxWidth, constraints.maxHeight);

            _measure(size);

            return Listener(
              onPointerSignal: _onPointerSignal,
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: _focus.requestFocus,
                onPanUpdate: widget.blank
                    ? null
                    : (DragUpdateDetails details) => widget.onViewport(
                        panBy(widget.viewport, widget.frame, details.delta.dx, details.delta.dy),
                      ),
                child: Stack(
                  children: <Widget>[
                    Positioned.fill(
                      child: CustomPaint(
                        painter: _PanePainter(
                          options: PaneOptions(
                            frame: widget.frame,
                            viewport: widget.viewport,
                            layers: widget.layers,
                            regions: widget.regions,
                            current: widget.current,
                            theme: theme,
                            mask: widget.mask,
                            unchanged: widget.unchanged,
                            stencil: widget.stencil,
                          ),
                        ),
                      ),
                    ),
                    if (widget.wipe != null && widget.onWipe != null)
                      _WipeHandle(
                        theme: theme,
                        wipe: widget.wipe!,
                        onWipe: widget.onWipe!,
                        label: widget.strings.wipe,
                        width: size.width,
                      ),
                    if (widget.blank) Positioned.fill(child: Center(child: _blank(theme))),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _blank(DiffineTheme theme) {
    final DiffineStrings strings = widget.strings;

    if (widget.loading) {
      return Text(strings.loading, style: TextStyle(fontSize: 12, color: theme.muted));
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        if (widget.failed)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(
              strings.unsupported,
              style: TextStyle(fontSize: 12, color: theme.deleteText),
            ),
          ),
        if (widget.editable && widget.onChoose != null)
          DiffineTextButton(theme: theme, label: strings.choose, onPressed: widget.onChoose)
        else if (!widget.failed)
          Text(strings.empty, style: TextStyle(fontSize: 12, color: theme.muted)),
      ],
    );
  }
}

class _PanePainter extends CustomPainter {
  const _PanePainter({required this.options});

  final PaneOptions options;

  @override
  void paint(Canvas canvas, Size size) {
    paintPane(canvas, size, options);
  }

  @override
  bool shouldRepaint(_PanePainter old) => old.options != options;
}

/// The line between the two pictures, and the grip that moves it.
///
/// A slider in every sense a screen reader cares about, and a bar with a handle
/// on it to everybody else. The arrow keys move it a hundredth of the way
/// across and Home and End take it to either end.
class _WipeHandle extends StatefulWidget {
  const _WipeHandle({
    required this.theme,
    required this.wipe,
    required this.onWipe,
    required this.label,
    required this.width,
  });

  final DiffineTheme theme;
  final double wipe;
  final ValueChanged<double> onWipe;
  final String label;
  final double width;

  @override
  State<_WipeHandle> createState() => _WipeHandleState();
}

class _WipeHandleState extends State<_WipeHandle> {
  final FocusNode _focus = FocusNode(debugLabel: 'diffine wipe');

  @override
  void dispose() {
    _focus.dispose();
    super.dispose();
  }

  void _move(double dx) {
    if (widget.width <= 0) {
      return;
    }

    widget.onWipe((widget.wipe + dx / widget.width).clamp(0, 1));
  }

  KeyEventResult _onKey(FocusNode node, KeyEvent event) {
    if (event is! KeyDownEvent && event is! KeyRepeatEvent) {
      return KeyEventResult.ignored;
    }

    final Map<LogicalKeyboardKey, double> steps = <LogicalKeyboardKey, double>{
      LogicalKeyboardKey.arrowLeft: widget.wipe - 0.01,
      LogicalKeyboardKey.arrowRight: widget.wipe + 0.01,
      LogicalKeyboardKey.home: 0,
      LogicalKeyboardKey.end: 1,
    };
    final double? next = steps[event.logicalKey];

    if (next == null) {
      return KeyEventResult.ignored;
    }

    widget.onWipe(next.clamp(0, 1));

    return KeyEventResult.handled;
  }

  @override
  Widget build(BuildContext context) {
    return Positioned(
      left: widget.wipe * widget.width - 12,
      top: 0,
      bottom: 0,
      width: 24,
      child: Semantics(
        slider: true,
        label: widget.label,
        value: '${(widget.wipe * 100).round()}%',
        child: Focus(
          focusNode: _focus,
          onKeyEvent: _onKey,
          child: MouseRegion(
            cursor: SystemMouseCursors.resizeLeftRight,
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onHorizontalDragStart: (DragStartDetails _) => _focus.requestFocus(),
              onHorizontalDragUpdate: (DragUpdateDetails details) => _move(details.delta.dx),
              child: Center(
                child: Container(
                  width: 2,
                  decoration: BoxDecoration(color: widget.theme.image.marker),
                  child: Center(
                    child: Container(
                      width: 14,
                      height: 28,
                      decoration: BoxDecoration(
                        color: widget.theme.image.marker,
                        borderRadius: BorderRadius.circular(7),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
