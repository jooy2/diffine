/// Two pictures, what changed between them, and every way of looking at that.
///
/// ```dart
/// import 'package:diffine/diffine.dart';
///
/// ImageDiff(
///   before: DiffineEncodedImage(saved),
///   after: DiffineEncodedImage(rendered),
///   diff: const DiffImageOptions(align: DiffImageAlign.shift),
/// );
/// ```
///
/// The comparison is [diffImage] and nothing else: the same mask, the same
/// regions, the same counts an application would get from calling it itself.
/// What the widget adds is everything that turns those into something a person
/// can read — the changed pixels tinted over the pictures, a box round each
/// change, buttons that step from one to the next, and one zoom shared by both
/// panes so that two pictures are never looking at different parts of
/// themselves.
///
/// Four views rather than one, because no single one of them answers the
/// question. Side by side says what each picture is; fading between them says
/// whether something moved; wiping one across the other lines an edge up
/// against its own edge; and the mask on its own says where to point the other
/// three.
library;

import 'dart:async';
import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:diffine/src/components/image/image_diff_pane.dart';
import 'package:diffine/src/components/image/image_diff_summary.dart';
import 'package:diffine/src/components/shared/diffine_controls.dart';
import 'package:diffine/src/components/shared/diffine_icons.dart';
import 'package:diffine/src/components/shared/diffine_nav.dart';
import 'package:diffine/src/image.dart';
import 'package:diffine/src/internal/i18n.dart';
import 'package:diffine/src/internal/image/decode.dart';
import 'package:diffine/src/internal/image/paint.dart';
import 'package:diffine/src/internal/image/viewport.dart';
import 'package:diffine/src/internal/measure.dart';
import 'package:diffine/src/theme/tokens.dart';
import 'package:diffine/src/types.dart';
import 'package:flutter/widgets.dart';

/// How tall the bar above the panes is.
const double _headerHeight = 34;

/// Two pictures, and what changed between them.
class ImageDiff extends StatefulWidget {
  /// One comparison.
  const ImageDiff({
    super.key,
    this.mode = DiffineMode.viewer,
    this.before,
    this.after,
    this.beforeLabel,
    this.afterLabel,
    this.onDiff,
    this.result,
    this.diff = kDiffineImageDefaults,
    this.view = DiffineImageView.split,
    this.fade,
    this.onFadeChanged,
    this.wipe,
    this.onWipeChanged,
    this.maxPixels = 4000000,
    this.marks = true,
    this.outlines = true,
    this.header = true,
    this.navigation = true,
    this.zoom = true,
    this.summary = true,
    this.viewport,
    this.onViewportChanged,
    this.selected,
    this.defaultSelected = -1,
    this.onSelectedChanged,
    this.onChoose,
    this.colorScheme = DiffineColorScheme.system,
    this.theme,
    this.height,
    this.locale = DiffineLocale.en,
    this.strings,
  });

  /// Whether the two pictures are only looked at, or chosen as well.
  ///
  /// [DiffineMode.viewer] draws what the application passed.
  /// [DiffineMode.editor] draws the same thing with a button on an empty pane —
  /// and what that button does is [onChoose], because opening a file is the
  /// application's to do and not a diff viewer's.
  final DiffineMode mode;

  /// The picture on the left.
  ///
  /// There is no URL among the shapes it can arrive in, on purpose — see
  /// [DiffineImageContent]. An application that has a URL fetches it and passes
  /// what comes back, which is one line, and the difference is that the line is
  /// the application's.
  final DiffineImageContent? before;

  /// The picture on the right.
  final DiffineImageContent? after;

  /// What the header calls the left side.
  final String? beforeLabel;

  /// What it calls the right side.
  final String? afterLabel;

  /// The comparison, every time it is worked out again, and `null` while there
  /// are not two pictures to compare.
  final ValueChanged<DiffImageResult?>? onDiff;

  /// A comparison that has already been worked out, drawn as it is.
  ///
  /// Which is worth more here than it is for text: comparing two photographs is
  /// a few million pieces of arithmetic, and this is how that happens in an
  /// isolate, on a server, or once for a screen that draws the same pair twice.
  ///
  /// The pictures are still needed. A result says what happened to each pixel
  /// and holds none of them, so both sides go on being decoded to be drawn.
  final DiffImageResult? result;

  /// How the two are compared.
  final DiffImageOptions diff;

  /// How the two are laid out: side by side, one faded over the other, one
  /// wiped across the other, or neither of them and only what changed.
  final DiffineImageView view;

  /// How much of the second picture is let through in
  /// [DiffineImageView.overlay], from 0 to 1.
  final double? fade;

  /// The overlay was faded.
  final ValueChanged<double>? onFadeChanged;

  /// Where the line between the two pictures is in [DiffineImageView.wipe],
  /// from 0 for the left edge to 1 for the right.
  final double? wipe;

  /// The line was moved.
  final ValueChanged<double>? onWipeChanged;

  /// How many pixels a picture is decoded at, at most.
  ///
  /// A photograph out of a modern camera is twenty-four million pixels, and two
  /// of them held as images and as buffers is most of a gigabyte before
  /// anything has been compared. Past this a picture is decoded smaller, which
  /// costs a little sharpness at a high zoom and is the difference between an
  /// app that answers and an app that stops.
  final int maxPixels;

  /// Whether the pixels that changed are tinted.
  final bool marks;

  /// Whether a box is drawn round each change.
  ///
  /// The tint says which pixels; the boxes say where to look, and they are what
  /// stays visible when a comparison is zoomed out far enough that a changed
  /// word is three pixels wide.
  final bool outlines;

  /// Whether each side is named above it.
  final bool header;

  /// Whether the buttons for moving between the changes are drawn.
  final bool navigation;

  /// Whether the zoom controls are drawn.
  final bool zoom;

  /// Whether the bar under the panes is drawn.
  final bool summary;

  /// Where a reader is looking, or `null` for the whole frame in the pane.
  ///
  /// Passing it makes it the application's: the pane reports where a drag, a
  /// wheel or a button would have taken it and does not move on its own.
  final DiffineImageViewport? viewport;

  /// A reader moved or zoomed, or a button did.
  final ValueChanged<DiffineImageViewport>? onViewportChanged;

  /// Which change a reader has stepped to, as an index into
  /// [DiffImageResult.regions], or -1.
  final int? selected;

  /// Which change to start on, when the widget is to keep it.
  final int defaultSelected;

  /// A change was stepped to, by the buttons or by the application.
  final void Function(int selected, DiffImageRegion? region)? onSelectedChanged;

  /// Asks the application for a picture, in [DiffineMode.editor].
  ///
  /// Opening a file needs a picker, and a picker is a plugin — so the widget
  /// draws the button and the application answers it. Returning `null` leaves
  /// the pane as it was.
  final Future<DiffineImageContent?> Function(DiffineSide side)? onChoose;

  /// Which palette to draw in.
  final DiffineColorScheme colorScheme;

  /// The whole palette, for an application that wants its own.
  final DiffineTheme? theme;

  /// How tall the whole comparison is.
  final double? height;

  /// The language of the widget's own words.
  final DiffineLocale locale;

  /// Words to use instead of the locale's.
  final DiffineStrings? strings;

  @override
  State<ImageDiff> createState() => _ImageDiffState();
}

class _ImageDiffState extends State<ImageDiff> {
  Picture? _beforePicture;
  Picture? _afterPicture;
  DiffineImageContent? _beforeContent;
  DiffineImageContent? _afterContent;
  DiffineImageContent? _beforeChosen;
  DiffineImageContent? _afterChosen;
  bool _beforeLoading = false;
  bool _afterLoading = false;
  bool _beforeFailed = false;
  bool _afterFailed = false;

  DiffImageResult? _comparison;
  ui.Image? _mask;
  Brightness? _maskBrightness;

  Size _box = Size.zero;
  DiffineImageViewport? _viewport;
  double _fade = 0.5;
  double _wipe = 0.5;
  int _selected = -1;

  late final bool _viewportControlled = widget.viewport != null;
  late final bool _selectionControlled = widget.selected != null;

  @override
  void initState() {
    super.initState();
    _selected = widget.defaultSelected;
    _fade = widget.fade ?? 0.5;
    _wipe = widget.wipe ?? 0.5;
    _load();
  }

  @override
  void didUpdateWidget(ImageDiff old) {
    super.didUpdateWidget(old);
    _load();
  }

  @override
  void dispose() {
    releasePicture(_beforePicture);
    releasePicture(_afterPicture);
    _mask?.dispose();
    super.dispose();
  }

  DiffineImageContent? get _wantedBefore => _beforeChosen ?? widget.before;

  DiffineImageContent? get _wantedAfter => _afterChosen ?? widget.after;

  bool get _split => widget.view == DiffineImageView.split;

  void _load() {
    _loadSide(DiffineSide.before);
    _loadSide(DiffineSide.after);
  }

  void _loadSide(DiffineSide side) {
    final DiffineImageContent? wanted = side == DiffineSide.before ? _wantedBefore : _wantedAfter;
    final DiffineImageContent? held = side == DiffineSide.before ? _beforeContent : _afterContent;

    if (wanted == held) {
      return;
    }

    if (side == DiffineSide.before) {
      _beforeContent = wanted;
      _beforeFailed = false;
      _beforeLoading = wanted != null;
    } else {
      _afterContent = wanted;
      _afterFailed = false;
      _afterLoading = wanted != null;
    }

    if (wanted == null) {
      _settle(side, null, failed: false);

      return;
    }

    unawaited(_decode(side, wanted));
  }

  Future<void> _decode(DiffineSide side, DiffineImageContent content) async {
    try {
      final Picture picture = await decodeImage(content, widget.maxPixels);

      if (!mounted) {
        releasePicture(picture);

        return;
      }

      final DiffineImageContent? still = side == DiffineSide.before
          ? _beforeContent
          : _afterContent;

      if (still != content) {
        releasePicture(picture);

        return;
      }

      _settle(side, picture, failed: false);
    } on Object {
      if (mounted) {
        _settle(side, null, failed: true);
      }
    }
  }

  void _settle(DiffineSide side, Picture? picture, {required bool failed}) {
    setState(() {
      if (side == DiffineSide.before) {
        releasePicture(_beforePicture);
        _beforePicture = picture;
        _beforeLoading = false;
        _beforeFailed = failed;
      } else {
        releasePicture(_afterPicture);
        _afterPicture = picture;
        _afterLoading = false;
        _afterFailed = failed;
      }
    });

    _recompare();
  }

  void _recompare() {
    final Picture? before = _beforePicture;
    final Picture? after = _afterPicture;
    final DiffImageResult? given = widget.result;
    final DiffImageResult? worked =
        given ??
        (before == null || after == null
            ? null
            : diffImage(before.pixels, after.pixels, widget.diff));

    setState(() {
      _comparison = worked;
      _mask?.dispose();
      _mask = null;
    });

    WidgetsBinding.instance.addPostFrameCallback((Duration _) {
      if (mounted) {
        widget.onDiff?.call(worked);
      }
    });
  }

  Future<void> _buildMask(DiffineTheme theme) async {
    final DiffImageResult? found = _comparison;

    if (found == null) {
      return;
    }

    final ui.Image? painted = await paintMask(found, theme.image);

    if (!mounted || painted == null) {
      painted?.dispose();

      return;
    }

    setState(() {
      _mask?.dispose();
      _mask = painted;
      _maskBrightness = theme.brightness;
    });
  }

  Future<void> _choose(DiffineSide side) async {
    final Future<DiffineImageContent?> Function(DiffineSide)? ask = widget.onChoose;

    if (ask == null) {
      return;
    }

    final DiffineImageContent? chosen = await ask(side);

    if (!mounted || chosen == null) {
      return;
    }

    setState(() {
      if (side == DiffineSide.before) {
        _beforeChosen = chosen;
      } else {
        _afterChosen = chosen;
      }
    });
    _load();
  }

  Size get _frame {
    final DiffImageResult? found = _comparison;

    if (found != null) {
      return Size(found.width.toDouble(), found.height.toDouble());
    }

    return Size(
      math.max(_beforePicture?.width ?? 0, _afterPicture?.width ?? 0).toDouble(),
      math.max(_beforePicture?.height ?? 0, _afterPicture?.height ?? 0).toDouble(),
    );
  }

  DiffineImageViewport get _look {
    final DiffineImageViewport? held = _viewportControlled ? widget.viewport : _viewport;

    return held ?? fitViewport(_frame, _box);
  }

  void _setLook(DiffineImageViewport next) {
    if (!_viewportControlled) {
      setState(() => _viewport = next);
    }

    widget.onViewportChanged?.call(next);
  }

  void _step(int direction, List<DiffImageRegion> regions) {
    if (regions.isEmpty) {
      return;
    }

    final int from = _current(regions);
    final int next = from < 0
        ? (direction == 1 ? 0 : regions.length - 1)
        : (from + direction + regions.length) % regions.length;

    if (!_selectionControlled) {
      setState(() => _selected = next);
    }

    widget.onSelectedChanged?.call(next, regions[next]);
    _setLook(viewportOn(viewport: _look, frame: _frame, pane: _box, area: regions[next]));
  }

  int _current(List<DiffImageRegion> regions) {
    final int held = _selectionControlled ? (widget.selected ?? -1) : _selected;

    return held >= 0 && held < regions.length ? held : -1;
  }

  void _scale(double by) {
    _setLook(
      zoomAbout(
        viewport: _look,
        frame: _frame,
        pane: _box,
        scale: _look.scale * by,
        paneX: _box.width / 2,
        paneY: _box.height / 2,
      ),
    );
  }

  void _onBox(Size size) {
    if (_box != size) {
      setState(() => _box = size);
    }
  }

  @override
  Widget build(BuildContext context) {
    final DiffineStrings strings = stringsFor(widget.locale, widget.strings);
    final DiffineTheme theme = widget.theme ?? DiffineTheme.resolve(context, widget.colorScheme);
    final String beforeLabel = widget.beforeLabel ?? strings.before;
    final String afterLabel = widget.afterLabel ?? strings.after;
    final String bothLabel = '$beforeLabel → $afterLabel';
    final bool editing = widget.mode == DiffineMode.editor;

    if (_comparison != null && (_mask == null || _maskBrightness != theme.brightness)) {
      unawaited(_buildMask(theme));
    }

    final DiffImageResult? comparison = _comparison;
    final List<DiffImageRegion> regions = comparison?.regions ?? const <DiffImageRegion>[];
    final int current = _current(regions);
    final Size frame = _frame;
    final DiffineImageViewport viewport = _look;
    final _Layers layers = _layers(frame);
    final bool blank = _beforePicture == null && _afterPicture == null;
    final bool tools =
        (widget.navigation && regions.isNotEmpty) || widget.zoom || (editing && !_split);

    final Widget frameBox = DecoratedBox(
      decoration: BoxDecoration(
        color: theme.surface,
        border: Border.all(color: theme.border),
        borderRadius: BorderRadius.circular(theme.radius),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(theme.radius),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            if (widget.header || tools)
              _header(
                theme: theme,
                strings: strings,
                regions: regions,
                current: current,
                viewport: viewport,
                editing: editing,
                tools: tools,
                beforeLabel: beforeLabel,
                afterLabel: afterLabel,
                bothLabel: bothLabel,
              ),
            Expanded(
              child: _split
                  ? Row(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: <Widget>[
                        Expanded(
                          child: _pane(
                            theme: theme,
                            strings: strings,
                            name: beforeLabel,
                            frame: frame,
                            viewport: viewport,
                            layers: layers.before,
                            regions: regions,
                            current: current,
                            blank: _beforePicture == null,
                            loading: _beforeLoading,
                            failed: _beforeFailed,
                            editing: editing,
                            side: DiffineSide.before,
                          ),
                        ),
                        _Rule(colour: theme.border),
                        Expanded(
                          child: _pane(
                            theme: theme,
                            strings: strings,
                            name: afterLabel,
                            frame: frame,
                            viewport: viewport,
                            layers: layers.after,
                            regions: regions,
                            current: current,
                            blank: _afterPicture == null,
                            loading: _afterLoading,
                            failed: _afterFailed,
                            editing: editing,
                            side: DiffineSide.after,
                          ),
                        ),
                      ],
                    )
                  : _pane(
                      theme: theme,
                      strings: strings,
                      name: bothLabel,
                      frame: frame,
                      viewport: viewport,
                      layers: layers.both,
                      regions: regions,
                      current: current,
                      blank: blank,
                      loading: _beforeLoading || _afterLoading,
                      failed: _beforeFailed || _afterFailed,
                      editing: editing,
                      side: _beforePicture == null ? DiffineSide.before : DiffineSide.after,
                      wipe: widget.view == DiffineImageView.wipe ? _wipeValue : null,
                    ),
            ),
            if (widget.summary)
              ImageDiffSummary(
                theme: theme,
                split: _split,
                locale: widget.locale,
                strings: strings,
                before: _metricsOf(_beforePicture, beforeLabel),
                after: _metricsOf(_afterPicture, afterLabel),
                result: comparison,
              ),
          ],
        ),
      ),
    );

    return widget.height == double.infinity
        ? frameBox
        : SizedBox(height: widget.height ?? theme.height, child: frameBox);
  }

  double get _wipeValue => widget.wipe ?? _wipe;

  double get _fadeValue => widget.fade ?? _fade;

  ImageMetrics? _metricsOf(Picture? picture, String label) {
    if (picture == null) {
      return null;
    }

    return ImageMetrics(
      label: label,
      width: picture.width,
      height: picture.height,
      bytes: picture.bytes,
    );
  }

  _Layers _layers(Size frame) {
    final DiffImageResult? found = _comparison;
    final DiffImageArea beforeArea =
        found?.before ??
        DiffImageArea(
          x: 0,
          y: 0,
          width: _beforePicture?.width ?? 0,
          height: _beforePicture?.height ?? 0,
        );
    final DiffImageArea afterArea =
        found?.after ??
        DiffImageArea(
          x: 0,
          y: 0,
          width: _afterPicture?.width ?? 0,
          height: _afterPicture?.height ?? 0,
        );

    final Picture? before = _beforePicture;
    final Picture? after = _afterPicture;
    final Layer? first = before == null ? null : Layer(picture: before, area: beforeArea);
    final Layer? second = after == null ? null : Layer(picture: after, area: afterArea);

    if (widget.view == DiffineImageView.mask) {
      return const _Layers(<Layer>[], <Layer>[], <Layer>[]);
    }

    final List<Layer> both;

    switch (widget.view) {
      case DiffineImageView.overlay:
        both = <Layer>[
          ?first,
          if (second != null) Layer(picture: second.picture, area: second.area, alpha: _fadeValue),
        ];
      case DiffineImageView.wipe:
        both = <Layer>[
          if (first != null) Layer(picture: first.picture, area: first.area, to: _wipeValue),
          if (second != null) Layer(picture: second.picture, area: second.area, from: _wipeValue),
        ];
      case DiffineImageView.split:
      case DiffineImageView.mask:
        both = <Layer>[?first, ?second];
    }

    return _Layers(
      first == null ? const <Layer>[] : <Layer>[first],
      second == null ? const <Layer>[] : <Layer>[second],
      both,
    );
  }

  Widget _pane({
    required DiffineTheme theme,
    required DiffineStrings strings,
    required String name,
    required Size frame,
    required DiffineImageViewport viewport,
    required List<Layer> layers,
    required List<DiffImageRegion> regions,
    required int current,
    required bool blank,
    required bool loading,
    required bool failed,
    required bool editing,
    required DiffineSide side,
    double? wipe,
  }) {
    return ImageDiffPane(
      theme: theme,
      name: name,
      frame: frame,
      viewport: viewport,
      onViewport: _setLook,
      onBox: _onBox,
      layers: layers,
      mask: widget.marks ? _mask : null,
      regions: widget.outlines ? regions : const <DiffImageRegion>[],
      current: current,
      blank: blank,
      loading: loading,
      failed: failed,
      strings: strings,
      editable: editing,
      onChoose: editing && widget.onChoose != null ? () => _choose(side) : null,
      wipe: wipe,
      onWipe: wipe == null
          ? null
          : (double value) {
              if (widget.wipe == null) {
                setState(() => _wipe = value);
              }

              widget.onWipeChanged?.call(value);
            },
    );
  }

  Widget _header({
    required DiffineTheme theme,
    required DiffineStrings strings,
    required List<DiffImageRegion> regions,
    required int current,
    required DiffineImageViewport viewport,
    required bool editing,
    required bool tools,
    required String beforeLabel,
    required String afterLabel,
    required String bothLabel,
  }) {
    return Container(
      height: _headerHeight,
      decoration: BoxDecoration(
        color: theme.gutter,
        border: Border(bottom: BorderSide(color: theme.border)),
      ),
      child: Row(
        children: <Widget>[
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Row(
                children: <Widget>[
                  if (widget.header)
                    Flexible(
                      child: Text(
                        _split ? beforeLabel : bothLabel,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: theme.text,
                        ),
                      ),
                    ),
                  const Spacer(),
                  if (editing && _split && widget.onChoose != null)
                    DiffineTextButton(
                      theme: theme,
                      label: strings.choose,
                      onPressed: () => _choose(DiffineSide.before),
                    ),
                  if (!_split && tools)
                    ..._tools(
                      theme: theme,
                      strings: strings,
                      regions: regions,
                      current: current,
                      viewport: viewport,
                      fading: widget.view == DiffineImageView.overlay,
                      editing: editing,
                    ),
                ],
              ),
            ),
          ),
          if (_split)
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: Row(
                  children: <Widget>[
                    if (widget.header)
                      Flexible(
                        child: Text(
                          afterLabel,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: theme.text,
                          ),
                        ),
                      ),
                    const Spacer(),
                    if (editing && widget.onChoose != null)
                      DiffineTextButton(
                        theme: theme,
                        label: strings.choose,
                        onPressed: () => _choose(DiffineSide.after),
                      ),
                    if (tools)
                      ..._tools(
                        theme: theme,
                        strings: strings,
                        regions: regions,
                        current: current,
                        viewport: viewport,
                        fading: false,
                        editing: editing,
                      ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  List<Widget> _tools({
    required DiffineTheme theme,
    required DiffineStrings strings,
    required List<DiffImageRegion> regions,
    required int current,
    required DiffineImageViewport viewport,
    required bool fading,
    required bool editing,
  }) {
    return <Widget>[
      if (fading)
        SizedBox(
          width: 96,
          child: _Fade(
            theme: theme,
            value: _fadeValue,
            label: strings.fade,
            onChanged: (double value) {
              if (widget.fade == null) {
                setState(() => _fade = value);
              }

              widget.onFadeChanged?.call(value);
            },
          ),
        ),
      if (widget.navigation && regions.isNotEmpty)
        DiffineNav(
          theme: theme,
          total: regions.length,
          current: current,
          onStep: (int direction) => _step(direction, regions),
          strings: strings,
        ),
      if (widget.zoom) ...<Widget>[
        DiffineIconButton(
          theme: theme,
          label: strings.zoomOut,
          onPressed: () => _scale(1 / kZoomStep),
          child: const DiffineIcons(DiffineIcon.minus),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 2),
          child: Text(
            fill(strings.zoomLevel, <String, Object>{
              'percent': formatNumber(viewport.scale * 100, widget.locale, 0),
            }),
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: theme.muted,
              fontFeatures: const <FontFeature>[FontFeature.tabularFigures()],
            ),
          ),
        ),
        DiffineIconButton(
          theme: theme,
          label: strings.zoomIn,
          onPressed: () => _scale(kZoomStep),
          child: const DiffineIcons(DiffineIcon.plus),
        ),
        DiffineIconButton(
          theme: theme,
          label: strings.zoomFit,
          onPressed: () => _setLook(fitViewport(_frame, _box)),
          child: const DiffineIcons(DiffineIcon.frame),
        ),
      ],
    ];
  }
}

/// What each pane draws, and in what order.
class _Layers {
  const _Layers(this.before, this.after, this.both);

  final List<Layer> before;
  final List<Layer> after;
  final List<Layer> both;
}

/// A one-pixel rule between two panes.
class _Rule extends StatelessWidget {
  const _Rule({required this.colour});

  final Color colour;

  @override
  Widget build(BuildContext context) {
    return SizedBox(width: 1, child: ColoredBox(color: colour));
  }
}

/// The slider that fades the second picture over the first.
///
/// Built rather than taken from Material, for the same reason nothing else here
/// is: a comparison dropped into somebody else's screen should not bring a
/// second design system with it.
class _Fade extends StatelessWidget {
  const _Fade({
    required this.theme,
    required this.value,
    required this.label,
    required this.onChanged,
  });

  final DiffineTheme theme;
  final double value;
  final String label;
  final ValueChanged<double> onChanged;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      slider: true,
      label: label,
      value: '${(value * 100).round()}%',
      child: LayoutBuilder(
        builder: (BuildContext context, BoxConstraints constraints) {
          void move(double x) {
            if (constraints.maxWidth > 0) {
              onChanged((x / constraints.maxWidth).clamp(0, 1));
            }
          }

          return GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTapDown: (TapDownDetails details) => move(details.localPosition.dx),
            onHorizontalDragUpdate: (DragUpdateDetails details) => move(details.localPosition.dx),
            child: SizedBox(
              height: kDiffineControlSize,
              child: Center(
                child: Stack(
                  clipBehavior: Clip.none,
                  children: <Widget>[
                    Container(
                      height: 3,
                      decoration: BoxDecoration(
                        color: theme.border,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    Positioned(
                      left: (constraints.maxWidth - 10) * value,
                      top: -4,
                      child: Container(
                        width: 10,
                        height: 10,
                        decoration: BoxDecoration(color: theme.accent, shape: BoxShape.circle),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
