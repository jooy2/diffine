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

import 'package:diffine/src/components/image/image_diff_loupe.dart';
import 'package:diffine/src/components/image/image_diff_pane.dart';
import 'package:diffine/src/components/image/image_diff_summary.dart';
import 'package:diffine/src/components/shared/diffine_controls.dart';
import 'package:diffine/src/components/shared/diffine_icons.dart';
import 'package:diffine/src/components/shared/diffine_nav.dart';
import 'package:diffine/src/image.dart';
import 'package:diffine/src/internal/i18n.dart';
import 'package:diffine/src/internal/image/decode.dart';
import 'package:diffine/src/internal/image/loupe.dart';
import 'package:diffine/src/internal/image/paint.dart';
import 'package:diffine/src/internal/image/viewport.dart';
import 'package:diffine/src/internal/measure.dart';
import 'package:diffine/src/theme/tokens.dart';
import 'package:diffine/src/types.dart';
import 'package:flutter/gestures.dart';
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
    this.pictures,
    this.pictureLabels,
    this.baseline = 0,
    this.picturesResult,
    this.onPicturesDiff,
    this.beforeLabel,
    this.afterLabel,
    this.onDiff,
    this.result,
    this.diff = kDiffineImageDefaults,
    this.view = DiffineImageView.split,
    this.unchanged = DiffineImageUnchanged.keep,
    this.wheel = DiffineImageWheel.zoom,
    this.loupe = true,
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

  /// Several pictures rather than two, compared all at once.
  ///
  /// Three renderings of one screen from three machines, four exports of one
  /// asset, a saved version against the last five runs. Each is drawn in a pane
  /// of its own with what it disagrees with the baseline about marked on it,
  /// and the pane holding the baseline is marked with everywhere anything
  /// disagrees — because the baseline disagrees with nothing, and a pane with
  /// nothing on it reads as a pane nobody looked at.
  ///
  /// Passing it is what turns the list on: [before] and [after] are then
  /// ignored, and so is everything that names one of them. At most
  /// [kMostPictures], which is what the comparison holds.
  ///
  /// [DiffineImageView.overlay] and [DiffineImageView.wipe] are a question
  /// about two pictures and fall back to [DiffineImageView.split] for more than
  /// two. The other two work for any number.
  final List<DiffineImageContent>? pictures;

  /// What each of them is called, in the same order. A name it has no entry for
  /// falls back to its place in the list.
  final List<String>? pictureLabels;

  /// Which of them the rest are counted against, as an index into [pictures].
  ///
  /// Ignored without [pictures], where the first picture is always the one the
  /// second is compared with.
  final int baseline;

  /// A comparison of the list that has already been worked out, drawn as it is.
  final DiffImagesResult? picturesResult;

  /// The comparison of the list, every time it is worked out again.
  ///
  /// `onDiff` for a list. A comparison of several is a different answer from a
  /// comparison of two rather than a longer one, so it arrives through a
  /// different callback.
  final ValueChanged<DiffImagesResult?>? onPicturesDiff;

  /// How the two are compared.
  final DiffImageOptions diff;

  /// How the two are laid out: side by side, one faded over the other, one
  /// wiped across the other, or neither of them and only what changed.
  final DiffineImageView view;

  /// What is done with the parts of the picture nothing happened to.
  ///
  /// [DiffineImageUnchanged.keep] draws both pictures as they are, with the
  /// changed pixels tinted over them. [DiffineImageUnchanged.dim] draws them
  /// faint and draws what changed as it is, so the change is what the eye lands
  /// on and the rest of the picture is still there to say where in it the
  /// change was. [DiffineImageUnchanged.hide] draws only what changed, on a
  /// plain ground — the view for reading a change as a picture rather than as a
  /// mark on one, and the one to pair with `marks: false`.
  ///
  /// It is not part of [view] because it is a different question and holds
  /// across all four of those.
  final DiffineImageUnchanged unchanged;

  /// Whether the pixels under the pointer are shown magnified, with the colour
  /// of the one in the middle written out.
  ///
  /// Two panes at four hundred per cent say two pixels are different and stop
  /// there, and what a reader asks next is what the two actually are. Both
  /// sides are shown whichever pane the pointer is over, because a split view
  /// has one picture a pane and the question is never about one of them.
  ///
  /// It follows a pointer and not a finger, so a reader on a touch screen never
  /// sees it.
  final bool loupe;

  /// What the wheel does over a pane.
  ///
  /// [DiffineImageWheel.zoom] zooms about the pointer a notch at a time, which
  /// is what a picture viewer does, and Shift with it moves the picture
  /// instead. [DiffineImageWheel.pan] moves a picture larger than its pane and
  /// lets the screen scroll once the whole frame is in view, with the modifier
  /// to zoom — which is what a comparison sitting in the middle of an article
  /// wants, because a reader scrolling past it should scroll past it.
  final DiffineImageWheel wheel;

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
  /*
   * Every picture, in the order the panes draw them.
   *
   * A pair is the list of two the arguments name, so the loading, the frame and
   * the panes are written once for a list and a pair is a list of two. What the
   * pair keeps of its own is the comparison: `diffImage` answers more about two
   * pictures than `diffImages` does — which of them a pixel arrived in, and how
   * far apart the two are on average — and a list has nowhere to put either.
   */
  final List<Picture?> _held = <Picture?>[];
  final List<DiffineImageContent?> _contents = <DiffineImageContent?>[];
  final List<bool> _loading = <bool>[];
  final List<bool> _failed = <bool>[];

  DiffineImageContent? _beforeChosen;
  DiffineImageContent? _afterChosen;

  DiffImageResult? _comparison;
  DiffImagesResult? _several;
  ui.Image? _mask;
  List<ui.Image?> _masks = const <ui.Image?>[];
  Brightness? _maskBrightness;
  ui.Image? _stencil;

  /// What the loupe is looking at and which side reported it, or `null` where
  /// no pointer is over the comparison.
  ///
  /// The panel belongs to the comparison rather than to a pane because it shows
  /// both pictures and sits over both of them — and because a panel that jumped
  /// from pane to pane as the pointer crossed between them would be the thing a
  /// reader watched.
  _Looking? _looking;

  /// How many pixels across one of its squares shows.
  int _span = kLoupeSpan;

  /// Where a reader has put it, or `null` for wherever it starts.
  Offset? _loupePlace;

  /// Whether one of its handles is being held, in which case it stays put even
  /// when the drag leaves the comparison.
  bool _grabbed = false;

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
    for (final Picture? picture in _held) {
      releasePicture(picture);
    }

    _mask?.dispose();
    _stencil?.dispose();
    _disposeMasks();
    super.dispose();
  }

  void _disposeMasks() {
    for (final ui.Image? mask in _masks) {
      mask?.dispose();
    }

    _masks = const <ui.Image?>[];
  }

  DiffineImageContent? get _wantedBefore => _beforeChosen ?? widget.before;

  DiffineImageContent? get _wantedAfter => _afterChosen ?? widget.after;

  /// Whether the comparison is of a list rather than of a pair.
  bool get _many => widget.pictures != null;

  /// Every picture the arguments ask for, in the order the panes draw them.
  List<DiffineImageContent?> get _wanted => _many
      ? List<DiffineImageContent?>.of(widget.pictures!)
      : <DiffineImageContent?>[_wantedBefore, _wantedAfter];

  /// What each pane is called.
  List<String> get _labels {
    if (!_many) {
      final DiffineStrings strings = stringsFor(widget.locale, widget.strings);

      return <String>[widget.beforeLabel ?? strings.before, widget.afterLabel ?? strings.after];
    }

    final DiffineStrings strings = stringsFor(widget.locale, widget.strings);
    final List<String>? given = widget.pictureLabels;

    return <String>[
      for (int at = 0; at < widget.pictures!.length; at += 1)
        given != null && at < given.length
            ? given[at]
            : fill(strings.picture, <String, String>{'number': '${at + 1}'}),
    ];
  }

  /// How the pictures are laid out, which is [ImageDiff.view] unless that is a
  /// question about two of them.
  ///
  /// Fading one over another and wiping one across another both ask "which
  /// two", and a list of more than two has no answer — so they fall back to the
  /// panes, which is the view that says what every picture is.
  DiffineImageView get _laid =>
      _held.length > 2 &&
          (widget.view == DiffineImageView.overlay || widget.view == DiffineImageView.wipe)
      ? DiffineImageView.split
      : widget.view;

  bool get _laidSplit => _laid == DiffineImageView.split;

  void _load() {
    final List<DiffineImageContent?> wanted = _wanted;

    // The list can grow and shrink, and what is dropped off the end is a
    // picture nothing is going to draw again.
    while (_held.length > wanted.length) {
      releasePicture(_held.removeLast());
      _contents.removeLast();
      _loading.removeLast();
      _failed.removeLast();
    }

    while (_held.length < wanted.length) {
      _held.add(null);
      _contents.add(null);
      _loading.add(false);
      _failed.add(false);
    }

    for (int at = 0; at < wanted.length; at += 1) {
      _loadOne(at, wanted[at]);
    }
  }

  void _loadOne(int at, DiffineImageContent? wanted) {
    if (wanted == _contents[at]) {
      return;
    }

    _contents[at] = wanted;
    _failed[at] = false;
    _loading[at] = wanted != null;

    if (wanted == null) {
      _settle(at, null, failed: false);

      return;
    }

    unawaited(_decode(at, wanted));
  }

  Future<void> _decode(int at, DiffineImageContent content) async {
    try {
      final Picture picture = await decodeImage(content, widget.maxPixels);

      if (!mounted || at >= _contents.length || _contents[at] != content) {
        releasePicture(picture);

        return;
      }

      _settle(at, picture, failed: false);
    } on Object {
      if (mounted && at < _contents.length && _contents[at] == content) {
        _settle(at, null, failed: true);
      }
    }
  }

  void _settle(int at, Picture? picture, {required bool failed}) {
    setState(() {
      releasePicture(_held[at]);
      _held[at] = picture;
      _loading[at] = false;
      _failed[at] = failed;
    });

    _recompare();
  }

  void _recompare() {
    final List<Picture?> held = List<Picture?>.of(_held);
    final bool ready = held.length >= 2 && held.every((Picture? one) => one != null);
    final DiffImageResult? pair = _many || widget.result != null || !ready
        ? widget.result
        : diffImage(held[0]!.pixels, held[1]!.pixels, widget.diff);
    final DiffImagesResult? several = !_many || widget.picturesResult != null || !ready
        ? widget.picturesResult
        : diffImages(
            <DiffPixels>[for (final Picture? one in held) one!.pixels],
            DiffImagesOptions(
              baseline: widget.baseline.clamp(0, held.length - 1),
              tolerance: widget.diff.tolerance,
              ignoreAntialiasing: widget.diff.ignoreAntialiasing,
              align: widget.diff.align,
              alignRadius: widget.diff.alignRadius,
              blockSize: widget.diff.blockSize,
              maxRegions: widget.diff.maxRegions,
            ),
          );

    setState(() {
      _comparison = _many ? null : pair;
      _several = _many ? several : null;
      _mask?.dispose();
      _mask = null;
      _disposeMasks();
      _stencil?.dispose();
      _stencil = null;
    });

    WidgetsBinding.instance.addPostFrameCallback((Duration _) {
      if (mounted) {
        if (_many) {
          widget.onPicturesDiff?.call(several);
        } else {
          widget.onDiff?.call(pair);
        }
      }
    });
  }

  Future<void> _buildMask(DiffineTheme theme) async {
    final DiffImageResult? found = _comparison;
    final DiffImagesResult? several = _several;

    if (found != null) {
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

      return;
    }

    if (several == null) {
      return;
    }

    /*
     * One drawable per picture: where that picture disagrees with the baseline,
     * and everywhere anything disagrees for the pane holding the baseline —
     * because the baseline disagrees with nothing, and a pane with nothing
     * marked on it reads as a pane nobody looked at.
     */
    final List<ui.Image?> painted = <ui.Image?>[
      for (int at = 0; at < several.areas.length; at += 1)
        await paintBits(several, theme.image.changed, at == several.baseline ? 0xff : 1 << at),
    ];

    if (!mounted) {
      for (final ui.Image? one in painted) {
        one?.dispose();
      }

      return;
    }

    setState(() {
      _disposeMasks();
      _masks = painted;
      _maskBrightness = theme.brightness;
    });
  }

  /// The stencil, built only when one of the two modes that cut a picture down
  /// is asked for. It is a picture the size of the frame, and a comparison
  /// drawn the usual way has no use for one.
  Future<void> _buildStencil() async {
    final DiffImageResult? found = _comparison;
    final DiffImagesResult? several = _several;
    final ui.Image? painted = found != null
        ? await paintStencil(found)
        : several != null
        ? await stencilBits(several)
        : null;

    if (!mounted || painted == null) {
      painted?.dispose();

      return;
    }

    setState(() {
      _stencil?.dispose();
      _stencil = painted;
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
    final DiffImagesResult? several = _several;

    if (found != null) {
      return Size(found.width.toDouble(), found.height.toDouble());
    }

    if (several != null) {
      return Size(several.width.toDouble(), several.height.toDouble());
    }

    return Size(
      _held.fold<int>(0, (int most, Picture? one) => math.max(most, one?.width ?? 0)).toDouble(),
      _held.fold<int>(0, (int most, Picture? one) => math.max(most, one?.height ?? 0)).toDouble(),
    );
  }

  /// Where each picture sits in the frame, in the order the panes draw them.
  ///
  /// The comparison answers this once it has run, offsets and all. Until then —
  /// and there is always an until then, because the pictures are drawn before
  /// they are compared — every one of them is laid corner to corner, which is
  /// where they would be with no offset anyway.
  List<DiffImageArea> get _areas {
    final DiffImageResult? found = _comparison;
    final DiffImagesResult? several = _several;

    if (found != null) {
      return <DiffImageArea>[found.before, found.after];
    }

    if (several != null) {
      return several.areas;
    }

    return <DiffImageArea>[
      for (final Picture? one in _held)
        DiffImageArea(x: 0, y: 0, width: one?.width ?? 0, height: one?.height ?? 0),
    ];
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

    if (_comparison != null && _stencil == null && widget.unchanged != DiffineImageUnchanged.keep) {
      unawaited(_buildStencil());
    }

    final DiffImageResult? comparison = _comparison;
    final List<DiffImageRegion> regions = comparison?.regions ?? const <DiffImageRegion>[];
    final int current = _current(regions);
    final Size frame = _frame;
    final DiffineImageViewport viewport = _look;
    final _Layers layers = _layers();
    final List<DiffImageArea> areas = _areas;
    final List<String> labels = _labels;
    /*
     * Every picture for the loupe, whichever pane the pointer ends up over. The
     * areas are the frame's, so the same point of the frame reads the same
     * pixel of each picture however far apart they were held.
     */
    final List<LoupeSample> samples = !widget.loupe
        ? const <LoupeSample>[]
        : <LoupeSample>[
            for (int at = 0; at < _held.length; at += 1)
              if (_held[at] != null)
                LoupeSample(label: labels[at], picture: _held[at]!, area: areas[at]),
          ];
    final _Looking? looking = _looking;
    final bool blank = _held.every((Picture? one) => one == null);
    final bool tools =
        (widget.navigation && regions.isNotEmpty) || widget.zoom || (editing && !_laidSplit);
    /*
     * Where the controls go. A title has room for a name and a row of buttons
     * when there are two of them and none when there are five, so past two they
     * get a row of their own rather than squeezing the name out of the last
     * one.
     */
    final bool stacked = _laidSplit && labels.length > 2;

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
            if (widget.header || (tools && !stacked))
              _header(
                theme: theme,
                strings: strings,
                regions: regions,
                current: current,
                viewport: viewport,
                editing: editing,
                tools: tools && !stacked,
                labels: labels,
                bothLabel: bothLabel,
              ),
            if (tools && stacked)
              DecoratedBox(
                decoration: BoxDecoration(
                  color: theme.gutter,
                  border: Border(bottom: BorderSide(color: theme.border)),
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: _tools(
                      theme: theme,
                      strings: strings,
                      regions: regions,
                      current: current,
                      viewport: viewport,
                      fading: false,
                      chooser: null,
                    ),
                  ),
                ),
              ),
            Expanded(
              child: MouseRegion(
                onExit: (PointerExitEvent _) {
                  if (!_grabbed) {
                    setState(() => _looking = null);
                  }
                },
                child: Stack(
                  children: <Widget>[
                    Positioned.fill(
                      child: _laidSplit
                          ? Row(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: <Widget>[
                                for (int at = 0; at < _held.length; at += 1) ...<Widget>[
                                  if (at > 0) _Rule(colour: theme.border),
                                  Expanded(
                                    child: _pane(
                                      at: at,
                                      theme: theme,
                                      strings: strings,
                                      name: labels[at],
                                      frame: frame,
                                      viewport: viewport,
                                      layers: layers.each[at],
                                      regions: regions,
                                      current: current,
                                      blank: _held[at] == null,
                                      loading: _loading[at],
                                      failed: _failed[at],
                                      editing: editing,
                                    ),
                                  ),
                                ],
                              ],
                            )
                          : _pane(
                              at: -1,
                              theme: theme,
                              strings: strings,
                              name: bothLabel,
                              frame: frame,
                              viewport: viewport,
                              layers: layers.both,
                              regions: regions,
                              current: current,
                              blank: blank,
                              loading: _loading.any((bool one) => one),
                              failed: _failed.any((bool one) => one),
                              editing: editing,
                              wipe: _laid == DiffineImageView.wipe ? _wipeValue : null,
                            ),
                    ),
                    if (looking != null && samples.isNotEmpty && !blank)
                      _placedLoupe(
                        theme: theme,
                        strings: strings,
                        samples: samples,
                        looking: looking,
                      ),
                  ],
                ),
              ),
            ),
            if (widget.summary)
              ImageDiffSummary(
                theme: theme,
                split: _laidSplit,
                locale: widget.locale,
                strings: strings,
                pictures: <ImageMetrics?>[
                  for (int at = 0; at < _held.length; at += 1) _metricsOf(_held[at], labels[at]),
                ],
                changed: _ratio,
                regions: regions.length,
                complete: _whole,
                compared: _comparison != null || _several != null,
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

  _Layers _layers() {
    final List<DiffImageArea> areas = _areas;
    final List<Layer?> each = <Layer?>[
      for (int at = 0; at < _held.length; at += 1)
        if (_held[at] == null) null else Layer(picture: _held[at]!, area: areas[at]),
    ];
    final List<List<Layer>> alone = <List<Layer>>[
      for (final Layer? layer in each)
        if (layer == null) const <Layer>[] else <Layer>[layer],
    ];

    if (_laid == DiffineImageView.mask) {
      return _Layers(<List<Layer>>[for (final Layer? _ in each) const <Layer>[]], const <Layer>[]);
    }

    /*
     * The fade and the wipe are a question about two pictures — which of these
     * two is underneath, and where does one stop and the other start — so they
     * draw the first two and nothing else. A list of more than two never
     * reaches here: `_laid` sends it to the panes instead.
     */
    final Layer? first = each.isEmpty ? null : each[0];
    final Layer? second = each.length < 2 ? null : each[1];
    final List<Layer> both;

    switch (_laid) {
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
        both = <Layer>[for (final Layer? layer in each) ?layer];
    }

    return _Layers(alone, both);
  }

  Widget _placedLoupe({
    required DiffineTheme theme,
    required DiffineStrings strings,
    required List<LoupeSample> samples,
    required _Looking looking,
  }) {
    final Offset? place = _loupePlace;
    final bool left = looking.side != 0;

    return Positioned(
      left: place?.dx ?? (left ? 8 : null),
      right: place == null && !left ? 8 : null,
      top: place?.dy ?? 8,
      child: ImageDiffLoupe(
        theme: theme,
        samples: samples,
        at: looking.at,
        span: _span,
        onSpan: (int span) => setState(() => _span = span),
        onMove: (Offset moved) => setState(() => _loupePlace = moved),
        onGrabbed: (bool held) => _grabbed = held,
        strings: strings,
      ),
    );
  }

  /// Where a pointer is over one of the panes, in the frame's own coordinates.
  ///
  /// `side` is the pane's place in the list, or -1 for a pane drawing every
  /// picture at once.
  void _onLook(int side, Offset? at) {
    setState(() => _looking = at == null ? null : _Looking(side: side, at: at));
  }

  Widget _pane({
    required int at,
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
    double? wipe,
  }) {
    /*
     * What this pane draws over its own picture. A pair's two panes draw the
     * same mask, because a pair's mask says what happened between them and
     * belongs to neither; a list's pane draws what its own picture disagrees
     * with the baseline about.
     */
    final ui.Image? mask = _many
        ? (at >= 0 && at < _masks.length ? _masks[at] : _unionMask)
        : _mask;
    final DiffineSide side = at <= 0 ? DiffineSide.before : DiffineSide.after;

    return ImageDiffPane(
      theme: theme,
      name: name,
      frame: frame,
      viewport: viewport,
      onViewport: _setLook,
      onBox: _onBox,
      layers: layers,
      mask: widget.marks ? mask : null,
      unchanged: widget.unchanged,
      stencil: _stencil,
      wheel: widget.wheel,
      onLook: widget.loupe ? (Offset? where) => _onLook(at, where) : null,
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

  /// The mask a pane drawing every picture draws: everywhere anything
  /// disagrees, which is the baseline's own.
  ui.Image? get _unionMask {
    final DiffImagesResult? several = _several;

    if (several == null || _masks.isEmpty) {
      return null;
    }

    return _masks[several.baseline.clamp(0, _masks.length - 1)];
  }

  /// How much of the frame moved, and whether the list of areas is all of them.
  double get _ratio => _comparison?.stats.ratio ?? _several?.stats.ratio ?? 0;

  bool get _whole => _comparison?.complete ?? _several?.complete ?? true;

  Widget _header({
    required DiffineTheme theme,
    required DiffineStrings strings,
    required List<DiffImageRegion> regions,
    required int current,
    required DiffineImageViewport viewport,
    required bool editing,
    required bool tools,
    required List<String> labels,
    required String bothLabel,
  }) {
    final List<String> titles = _laidSplit ? labels : <String>[bothLabel];

    return Container(
      height: _headerHeight,
      decoration: BoxDecoration(
        color: theme.gutter,
        border: Border(bottom: BorderSide(color: theme.border)),
      ),
      // One title a pane, so that a name sits over the picture it belongs to
      // and the controls sit at the end of the row.
      child: Row(
        children: <Widget>[
          for (int at = 0; at < titles.length; at += 1)
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: Row(
                  children: <Widget>[
                    if (widget.header)
                      Flexible(
                        child: Text(
                          titles[at],
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: theme.text,
                          ),
                        ),
                      ),
                    const Spacer(),
                    if (editing && _laidSplit && at < titles.length - 1 && widget.onChoose != null)
                      DiffineTextButton(
                        theme: theme,
                        label: strings.choose,
                        onPressed: () => _choose(DiffineSide.before),
                      ),
                    if (at == titles.length - 1 && tools)
                      ..._tools(
                        theme: theme,
                        strings: strings,
                        regions: regions,
                        current: current,
                        viewport: viewport,
                        fading: _laid == DiffineImageView.overlay,
                        chooser: editing && widget.onChoose != null
                            ? DiffineTextButton(
                                theme: theme,
                                label: strings.choose,
                                onPressed: () =>
                                    _choose(_laidSplit ? DiffineSide.after : DiffineSide.before),
                              )
                            : null,
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
    required Widget? chooser,
  }) {
    return <Widget>[
      ?chooser,
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
  const _Layers(this.each, this.both);

  /// What each pane draws, in the order the panes are drawn.
  final List<List<Layer>> each;

  /// What one pane drawing every picture draws.
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

/// What the loupe is looking at, and which pane reported it.
class _Looking {
  const _Looking({required this.side, required this.at});

  /// The pane the pointer is over, as a place in the list, or -1 for a pane
  /// drawing every picture. It is the side the panel keeps away from.
  final int side;

  /// Where the pointer is, in the frame's own coordinates.
  final Offset at;
}
