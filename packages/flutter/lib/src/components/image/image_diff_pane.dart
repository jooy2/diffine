/// One pane of a picture comparison: a canvas, and every way a reader has of
/// moving around inside it.
///
/// The pane owns nothing about the comparison. It is handed a frame, a viewport
/// and a list of things to draw, and it hands back what a reader did — which is
/// what makes a split view work without a line of code to keep two panes in
/// step. Both are given the same viewport, so there is no second position to
/// synchronise.
library;

import 'dart:ui' as ui;

import 'package:diffine/src/components/shared/diffine_controls.dart';
import 'package:diffine/src/internal/i18n.dart';
import 'package:diffine/src/internal/image/paint.dart';
import 'package:diffine/src/internal/image/viewport.dart';
import 'package:diffine/src/internal/scale.dart';
import 'package:diffine/src/theme/tokens.dart';
import 'package:diffine/src/types.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

/// How far an arrow key moves the picture, in the pane's own pixels.
///
/// A distance travelled over the picture rather than a size of anything drawn,
/// so the comparison's scale leaves it alone.
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
    required this.absent,
    required this.loading,
    required this.failed,
    required this.strings,
    super.key,
    this.mask,
    this.unchanged = DiffineImageUnchanged.keep,
    this.stencil,
    this.wheel = DiffineImageWheel.zoom,
    this.onLook,
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

  /// Whether this side has no picture because there is none, rather than none
  /// yet. An empty pane is otherwise a pane still waiting for something.
  final bool absent;

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

  /// What the wheel does: zoom about the pointer, or move the picture and leave
  /// the screen to scroll once the whole frame is in view.
  final DiffineImageWheel wheel;

  /// Where a pointer is over this pane, in the frame's own coordinates, or
  /// `null` where it has left.
  ///
  /// The loupe is drawn by the comparison rather than by a pane, because it
  /// shows both pictures and sits over both panes. What a pane knows and the
  /// comparison does not is where a pointer is inside it, so a pane reports
  /// that and nothing else. `null` turns the reporting off.
  final ValueChanged<Offset?>? onLook;

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

  /// Where the last move this frame left the view, until the frame that draws
  /// it has been built.
  ///
  /// A browser hands over every pointer move since the last frame in one go,
  /// and a fast mouse makes several of those a frame. The widget still holds
  /// the viewport it was built with while they arrive, so each one worked out
  /// from [ImageDiffPane.viewport] undid the one before it and only the last
  /// counted — which is a picture that moves a fraction of the way the mouse
  /// did, and a wheel that loses most of its notches. Each move starts from
  /// this instead, where the one before it ended.
  DiffineImageViewport? _pending;

  /// The view as it stands, moves this frame included.
  DiffineImageViewport get _viewport => _pending ?? widget.viewport;

  @override
  void didUpdateWidget(ImageDiffPane old) {
    super.didUpdateWidget(old);

    // Built again, so the viewport it was handed is the answer to every move
    // so far, or the one the application kept instead of them.
    _pending = null;
  }

  @override
  void dispose() {
    _focus.dispose();
    super.dispose();
  }

  void _move(DiffineImageViewport next) {
    if (_pending == null) {
      // An application holding the viewport is free to refuse the move and not
      // build at all, and the next frame is where that has been decided.
      WidgetsBinding.instance
        ..addPostFrameCallback((Duration _) => _pending = null)
        ..ensureVisualUpdate();
    }

    _pending = next;
    widget.onViewport(next);
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

  /// The same view at a scale `by` times this one, with the point of the pane
  /// at `at` left where it was.
  void _zoomAt(double by, Offset at) {
    _move(
      zoomAbout(
        viewport: _viewport,
        frame: widget.frame,
        pane: _box,
        scale: _viewport.scale * by,
        paneX: at.dx,
        paneY: at.dy,
      ),
    );
  }

  /// The wheel, and a pinch on a trackpad in a browser.
  ///
  /// What the wheel does is [ImageDiffPane.wheel]: zoom about the pointer,
  /// which is what a picture viewer does, or move a picture larger than its
  /// pane and leave the screen to scroll when the whole frame is already in
  /// view. Shift moves it in the first, the modifier zooms in the second, so
  /// either way both are within reach.
  ///
  /// A pinch zooms whichever of the two it is. A browser hands one over as the
  /// wheel with Control held, and the engine turns that into a change of scale
  /// rather than a scroll — which this ignored, so the fingers did nothing.
  void _onPointerSignal(PointerSignalEvent event) {
    _onHover(event);

    if (event is PointerScaleEvent) {
      _zoomAt(pinchStep(event.scale), event.localPosition);

      return;
    }

    if (event is! PointerScrollEvent) {
      return;
    }

    final bool zooming = widget.wheel == DiffineImageWheel.zoom
        ? !HardwareKeyboard.instance.isShiftPressed
        : HardwareKeyboard.instance.isControlPressed || HardwareKeyboard.instance.isMetaPressed;

    if (!zooming &&
        widget.wheel == DiffineImageWheel.pan &&
        _viewport.scale <= fitScale(widget.frame, _box)) {
      return;
    }

    if (zooming) {
      _zoomAt(wheelStep(event.scrollDelta.dy), event.localPosition);

      return;
    }

    _move(panBy(_viewport, widget.frame, -event.scrollDelta.dx, -event.scrollDelta.dy));
  }

  /// How far apart the fingers of a pinch had moved at its last update, as a
  /// multiple of where they started.
  double _pinched = 1;

  /// A trackpad gesture began, on a desktop.
  ///
  /// There the platform hands a pinch over as a gesture with a scale that runs
  /// from its start, rather than as the wheel. The movement of the same two
  /// fingers is the drag below, so this only has the scale to answer.
  void _onPanZoomStart(PointerPanZoomStartEvent event) {
    _pinched = 1;
  }

  void _onPanZoomUpdate(PointerPanZoomUpdateEvent event) {
    if (event.scale <= 0 || event.scale == _pinched) {
      return;
    }

    final double by = event.scale / _pinched;

    _pinched = event.scale;
    _zoomAt(by, event.localPosition);
  }

  /// Where the pointer is in the pane, for the loupe, or `null` when it has
  /// left. A finger is not a pointer: it is where the picture is being dragged
  /// from, and a panel following it would be a panel under the hand.
  void _onHover(PointerEvent event) {
    final ValueChanged<Offset?>? tell = widget.onLook;

    if (tell == null || event.kind == PointerDeviceKind.touch || _box.isEmpty) {
      return;
    }

    tell(frameAt(_viewport, _box, event.localPosition.dx, event.localPosition.dy));
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
      _move(panBy(_viewport, widget.frame, move.dx, move.dy));

      return KeyEventResult.handled;
    }

    final double zooming =
        event.logicalKey == LogicalKeyboardKey.equal || event.logicalKey == LogicalKeyboardKey.add
        ? kZoomStep
        : event.logicalKey == LogicalKeyboardKey.minus
        ? 1 / kZoomStep
        : 0;

    if (zooming != 0) {
      _zoomAt(zooming, _box.center(Offset.zero));

      return KeyEventResult.handled;
    }

    return KeyEventResult.ignored;
  }

  @override
  Widget build(BuildContext context) {
    final DiffineTheme theme = widget.theme;
    final double scale = DiffineScale.of(context);

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

            return MouseRegion(
              onExit: (PointerExitEvent _) => widget.onLook?.call(null),
              child: Listener(
                onPointerSignal: _onPointerSignal,
                onPointerPanZoomStart: _onPanZoomStart,
                onPointerPanZoomUpdate: _onPanZoomUpdate,
                onPointerHover: _onHover,
                onPointerMove: _onHover,
                child: GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: _focus.requestFocus,
                  onPanUpdate: widget.blank
                      ? null
                      : (DragUpdateDetails details) => _move(
                          panBy(_viewport, widget.frame, details.delta.dx, details.delta.dy),
                        ),
                  child: Stack(
                    children: <Widget>[
                      Positioned.fill(
                        child: CustomPaint(
                          painter: _PanePainter(
                            options: PaneOptions(
                              frame: widget.frame,
                              // What the comparison says, rather than a move
                              // it has not answered yet.
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
                      if (widget.blank) Positioned.fill(child: Center(child: _blank(theme, scale))),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  /// What a pane with no picture says, which is one of three things.
  ///
  /// Which one it is, is the whole difference between a comparison that is
  /// waiting and a comparison that has its answer. There is no picture yet, or
  /// there is no picture at all — and the second is what a file that arrived or
  /// went away looks like from this side.
  Widget _blank(DiffineTheme theme, double scale) {
    final DiffineStrings strings = widget.strings;
    final TextStyle message = TextStyle(fontSize: 12 * scale, color: theme.muted);

    if (widget.loading) {
      return Text(strings.loading, style: message);
    }

    if (widget.absent) {
      return Text(
        fill(strings.absent, <String, String>{'label': widget.name}),
        textAlign: TextAlign.center,
        style: message,
      );
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        if (widget.failed)
          Padding(
            padding: EdgeInsets.only(bottom: 8 * scale),
            child: Text(strings.unsupported, style: message.copyWith(color: theme.deleteText)),
          ),
        if (widget.editable && widget.onChoose != null)
          DiffineTextButton(theme: theme, label: strings.choose, onPressed: widget.onChoose)
        else if (!widget.failed)
          Text(strings.empty, style: message),
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
    final double scale = DiffineScale.of(context);
    // The room a pointer has to take hold of the line, centred on it.
    final double reach = 24 * scale;

    return Positioned(
      left: widget.wipe * widget.width - reach / 2,
      top: 0,
      bottom: 0,
      width: reach,
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
                      width: 14 * scale,
                      height: 28 * scale,
                      decoration: BoxDecoration(
                        color: widget.theme.image.marker,
                        borderRadius: BorderRadius.circular(7 * scale),
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
