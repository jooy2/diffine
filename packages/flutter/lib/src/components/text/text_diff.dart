/// Two documents, what happened between them, and — where it is asked for — a
/// way to type into either of them.
///
/// ```dart
/// import 'package:diffine/diffine.dart';
///
/// TextDiff(before: saved, after: draft);
/// TextDiff(mode: DiffineMode.editor, defaultBefore: saved, defaultAfter: draft);
/// ```
///
/// One widget rather than two, because reading a comparison and writing one
/// were never two things. Both draw the same rows out of the same engine, hold
/// them level or not, colour them with the same highlighter, step through the
/// changes with the same buttons and search them with the same bar. What the
/// editor adds is a field laid over each pane's lines, so that what a reader
/// sees is the comparison and what they type into is a plain field — with the
/// framework's undo, its input method and its selection left alone.
///
/// Which parts are drawn is entirely a matter of the arguments: every one of
/// them has a default, so the same widget covers a full side-by-side with
/// connectors and a bare column of lines in a panel too narrow for anything
/// else, without a colour being named.
library;

import 'dart:math' as math;
import 'dart:typed_data';

import 'package:diffine/src/components/shared/diffine_find.dart';
import 'package:diffine/src/components/shared/diffine_language.dart';
import 'package:diffine/src/components/shared/diffine_line.dart';
import 'package:diffine/src/components/shared/diffine_links.dart';
import 'package:diffine/src/components/shared/diffine_nav.dart';
import 'package:diffine/src/components/shared/diffine_summary.dart';
import 'package:diffine/src/components/shared/diffine_surface.dart';
import 'package:diffine/src/components/text/text_diff_field.dart';
import 'package:diffine/src/components/text/text_diff_pane.dart';
import 'package:diffine/src/diff.dart';
import 'package:diffine/src/internal/apply.dart';
import 'package:diffine/src/internal/fold.dart';
import 'package:diffine/src/internal/highlight/catalogue.dart';
import 'package:diffine/src/internal/i18n.dart';
import 'package:diffine/src/internal/metrics.dart';
import 'package:diffine/src/internal/pane_search.dart';
import 'package:diffine/src/internal/rows.dart';
import 'package:diffine/src/internal/scroll.dart';
import 'package:diffine/src/internal/search.dart';
import 'package:diffine/src/theme/tokens.dart';
import 'package:diffine/src/types.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

/// How tall the bar above the panes is.
const double _headerHeight = 34;

/// Two documents, and what happened between them.
class TextDiff extends StatefulWidget {
  /// One comparison.
  const TextDiff({
    super.key,
    this.mode = DiffineMode.viewer,
    this.before,
    this.after,
    this.beforeLabel,
    this.afterLabel,
    this.defaultBefore,
    this.defaultAfter,
    this.onBeforeChanged,
    this.onAfterChanged,
    this.onDiff,
    this.result,
    this.readOnly,
    this.diff = kDiffineDefaults,
    this.view = DiffineView.split,
    this.lineNumbers = true,
    this.markers = true,
    this.wrap = false,
    this.alignLines = true,
    this.collapse = false,
    this.context = 3,
    this.connectors = true,
    this.applyChanges = false,
    this.syncScroll = true,
    this.header = true,
    this.navigation = true,
    this.search = true,
    this.summary = true,
    this.showInvisibles = false,
    this.selected,
    this.defaultSelected = -1,
    this.onSelectedChanged,
    this.indentWithTab = false,
    this.colorScheme = DiffineColorScheme.system,
    this.font,
    this.theme,
    this.height,
    this.locale = DiffineLocale.en,
    this.strings,
    this.language,
    this.defaultLanguage = 'plain',
    this.onLanguageChanged,
    this.languageLabel = true,
    this.highlight,
    this.renderGutter,
    this.renderWidget,
  });

  /// Whether the two documents are read or written.
  ///
  /// [DiffineMode.viewer] draws them. [DiffineMode.editor] draws them with a
  /// field over each side, so the comparison is worked out again as somebody
  /// types into it — and that is the whole of the difference. The lines, the
  /// tints, the marked words, the bands between the panes, the buttons above
  /// them and the search under them are one widget's, and the mode decides
  /// which of its parts are on the screen.
  ///
  /// Three arguments belong to one mode and are ignored in the other, because
  /// there is no honest answer for them: [view] and [alignLines] in the editor,
  /// where a blank line put in to hold the two sides level would be a line
  /// somebody could put the caret in and a unified column is not a thing to
  /// type into; and [result] in the editor, where a comparison worked out
  /// elsewhere is a comparison of documents nobody has typed into yet.
  final DiffineMode mode;

  /// The document on the left.
  ///
  /// In [DiffineMode.editor], passing it makes the field a controlled one: it
  /// shows what it is given and reports what a reader typed through
  /// [onBeforeChanged], and it is the application's job to hand the new text
  /// back. Leave it out and pass [defaultBefore] instead to let the widget keep
  /// the document itself.
  final String? before;

  /// The document on the right.
  final String? after;

  /// What the header calls the left side. The word for it where nothing is
  /// given.
  final String? beforeLabel;

  /// What it calls the right side.
  final String? afterLabel;

  /// What the left field starts with, when the widget is to keep it. Editor
  /// only.
  final String? defaultBefore;

  /// What the right field starts with. Editor only.
  final String? defaultAfter;

  /// The left document was typed into.
  final ValueChanged<String>? onBeforeChanged;

  /// The right document was typed into.
  final ValueChanged<String>? onAfterChanged;

  /// The comparison, every time it is worked out again.
  ///
  /// For everything an application wants to say about the two documents outside
  /// the box they are in — a count in a heading, a button that is only worth
  /// pressing while the two differ.
  final ValueChanged<DiffResult>? onDiff;

  /// A comparison that has already been worked out, drawn as it is. Viewer
  /// only.
  ///
  /// [before] and [after] are ignored when this is passed, which is what makes
  /// it useful: the comparison of two large documents can be done in an
  /// isolate, on a server, or once for a list of views, and handed here as a
  /// value.
  final DiffResult? result;

  /// Which side cannot be typed into. `null` is neither. Editor only.
  ///
  /// [DiffineSide.before] is the common one: the version that was saved on the
  /// left, the one being written on the right.
  final DiffineSide? readOnly;

  /// How the two documents are compared.
  ///
  /// In [DiffineMode.editor] the comparison is run again on every keystroke,
  /// and what bounds it is [DiffOptions.maxCost].
  final DiffOptions diff;

  /// One document either side, or one column with both. Viewer only.
  final DiffineView view;

  /// Whether each line carries its number.
  final bool lineNumbers;

  /// Whether a changed line carries a `+`, `−` or `~` beside it.
  ///
  /// The colours say the same thing, and this is what says it to a reader who
  /// cannot tell those two colours apart. It is not what a screen reader hears
  /// — that is written into the line itself and does not turn off.
  final bool markers;

  /// Whether a line too long for the pane wraps or runs off the side.
  final bool wrap;

  /// Whether a line is held level with its counterpart. Viewer only.
  ///
  /// On, which is the usual thing to want, a line with nothing opposite it gets
  /// a blank opposite it, so the two documents stay in step all the way down.
  /// Off, each side is only its own lines, and the connectors between the panes
  /// are what says which part of one answers which part of the other.
  final bool alignLines;

  /// Whether runs of unchanged lines far from any change are folded away.
  /// Viewer only.
  ///
  /// A comparison of two versions of a file is mostly the part nobody edited,
  /// and a reader who opened it to see what changed scrolls past all of it. On,
  /// each run of unchanged lines is drawn as a band saying how many lines it
  /// stands for, with [context] of them kept either side of every change so
  /// that each one still sits in the file rather than on its own. Pressing a
  /// band puts the lines it holds back, and they stay back until the comparison
  /// changes.
  ///
  /// It is off by default, because a viewer handed two documents is a viewer
  /// asked to show two documents. Turning it on is what makes a long file read
  /// the way a patch does.
  ///
  /// A search reaches the whole document rather than the part of it that is
  /// drawn, so opening one puts the folded runs back for as long as the bar is
  /// open. A run that is missing altogether — the lines between one hunk of a
  /// patch and the next — is drawn as a band whatever this says, because there
  /// is nothing else honest to draw there.
  final bool collapse;

  /// How many unchanged lines are kept either side of a change. Viewer only.
  final int context;

  /// Whether the column between the panes draws each change as a band from
  /// where it left to where it arrived. Split view only.
  final bool connectors;

  /// Whether each change carries a button for writing it into the other
  /// document. Editor only.
  ///
  /// A comparison of a saved version and a draft is usually read with one
  /// question in mind: keep this, or put the other one back. On, every change
  /// grows a pair of arrows in the column between the panes — the one pointing
  /// left writes the right-hand version over the left, and the one pointing
  /// right does the opposite. A side that is [readOnly] is not written into, so
  /// the usual arrangement of a saved version on the left and a draft on the
  /// right leaves one arrow rather than two.
  ///
  /// The buttons sit in the column between the panes, so `connectors: false`
  /// takes them away with the column they are in.
  final bool applyChanges;

  /// Whether scrolling one pane scrolls the other. Split view only.
  final bool syncScroll;

  /// Whether each side is named above it.
  final bool header;

  /// Whether the buttons for moving between changes are drawn.
  final bool navigation;

  /// Whether a reader can search the documents from inside the widget.
  ///
  /// A pane at a time, which is what a comparison wants: a name being chased
  /// through the version on the left is not a name being chased through the
  /// version on the right, so each side has a button in the bar above it and a
  /// bar of its own underneath. Ctrl+F, or Cmd+F, opens the one for the pane
  /// the keyboard is in; in [DiffineMode.editor] Ctrl+H opens it with the row
  /// for replacing already drawn, which a side that cannot be typed into does
  /// not get.
  final bool search;

  /// Whether the bar under the view is drawn: what each document weighs, and
  /// how many changes there are between them.
  final bool summary;

  /// Whether the spaces and tabs inside a line are drawn.
  ///
  /// A line ending in three spaces and a line ending in none are the same line
  /// to look at, and the comparison marks the difference between them in a run
  /// of text nobody can see. On, a space is a dot in the middle of its own
  /// column and a run of tabs carries a rule under it, so what changed is
  /// visible rather than merely marked.
  ///
  /// The characters themselves are untouched — the marks are drawn behind the
  /// text — so what a reader copies out is the line as it was written.
  final bool showInvisibles;

  /// Which change a reader has moved to, as an index into
  /// [DiffResult.changes], or -1.
  ///
  /// Passing it makes it the application's: it will not change on its own, and
  /// the buttons report through [onSelectedChanged] instead.
  final int? selected;

  /// Which change to start on, when the widget is to keep it.
  final int defaultSelected;

  /// A change was moved to, by the buttons or by the application.
  final void Function(int selected, DiffChange? change)? onSelectedChanged;

  /// Whether Tab types a tab instead of moving to the next control. Editor
  /// only.
  ///
  /// Off, because a control a keyboard cannot leave is a screen a keyboard
  /// cannot leave. On, there are two ways out and both are the ones somebody
  /// would try: Shift+Tab always moves back a control, and Escape hands the
  /// next Tab to the framework.
  final bool indentWithTab;

  /// Which palette to draw in. [DiffineColorScheme.system] follows the screen
  /// around it.
  final DiffineColorScheme colorScheme;

  /// The typeface the two documents are drawn in.
  ///
  /// Anything left out keeps the theme's own value, so
  /// `DiffineFont(size: 15)` is a whole answer.
  final DiffineFont? font;

  /// The whole palette, for an application that wants its own.
  ///
  /// Start from [DiffineTheme.light] or [DiffineTheme.dark] and replace what
  /// you mean to change. Passing it settles [colorScheme] as well: a theme is a
  /// decision about which palette this is.
  final DiffineTheme? theme;

  /// How tall the whole comparison is. The theme's own height where nothing is
  /// given, and `double.infinity` to fill whatever holds it.
  final double? height;

  /// The language of the widget's own words — not of the documents.
  final DiffineLocale locale;

  /// Words to use instead of the locale's.
  ///
  /// Start from `baseStringsFor(locale)` and use
  /// [DiffineStrings.copyWith] to change the few that matter.
  final DiffineStrings? strings;

  /// What the two documents are written in, so that they are coloured as it.
  ///
  /// A grammar identifier — `typescript`, `python`, `xml` — or `plain` for a
  /// document that is not code. [kDiffineLanguages] is the whole list, with the
  /// name to write beside each one.
  ///
  /// In [DiffineMode.editor], passing it makes it the application's: the menu
  /// reports through [onLanguageChanged] and does not change on its own. Leave
  /// it out and pass [defaultLanguage] to let the widget keep it, which is what
  /// a screen where somebody pastes a document nobody knew about wants.
  final String? language;

  /// Which language to start on, when the widget is to keep it.
  final String defaultLanguage;

  /// A language was chosen, from the menu or by the application. Editor only.
  final ValueChanged<String>? onLanguageChanged;

  /// Whether what the documents are being coloured as is drawn at the right end
  /// of the bar above them.
  ///
  /// The name in [DiffineMode.viewer], where the application decided it; the
  /// menu it was chosen from in [DiffineMode.editor], where a document somebody
  /// pasted is a document nobody knew the language of.
  final bool languageLabel;

  /// How a line is coloured beyond what the comparison says about it, which is
  /// where a syntax highlighter of the application's own goes.
  ///
  /// This replaces [language] rather than adding to it, and it leaves the menu
  /// showing a language nothing is being coloured as — so a screen that passes
  /// it usually turns [languageLabel] off as well.
  final DiffineHighlight? highlight;

  /// Something of the application's own, drawn in the gutter beside each line.
  /// Viewer only.
  ///
  /// It sits after the number and the marker. Keep it the same width on every
  /// line: a column that is wider on the lines that have something in it is a
  /// gutter whose text does not line up.
  final DiffineRender? renderGutter;

  /// Something of the application's own, drawn under each line. Viewer only.
  ///
  /// This is where a review comment, a thread, or a form for adding one goes.
  /// It is as tall as it is, and the line opposite is given the same height so
  /// that the two sides stay level.
  final DiffineRender? renderWidget;

  @override
  State<TextDiff> createState() => _TextDiffState();
}

class _TextDiffState extends State<TextDiff> {
  final TextEditingController _beforeField = TextEditingController();
  final TextEditingController _afterField = TextEditingController();
  final FocusNode _beforeFocus = FocusNode(debugLabel: 'diffine before');
  final FocusNode _afterFocus = FocusNode(debugLabel: 'diffine after');
  // A pane a reader can select out of, and the one thing that needs its own
  // focus to do it. `SelectionArea` would be the obvious way and is Material's;
  // this is the same widget one layer down.
  final List<FocusNode> _selecting = <FocusNode>[
    FocusNode(debugLabel: 'diffine selection 0'),
    FocusNode(debugLabel: 'diffine selection 1'),
  ];

  final ScrollController _firstVertical = ScrollController();
  final ScrollController _secondVertical = ScrollController();
  final ScrollController _firstHorizontal = ScrollController();
  final ScrollController _secondHorizontal = ScrollController();

  late final PaneSearch _firstSearch;
  late final PaneSearch _secondSearch;

  /// Whether each document is the application's or this widget's, decided on
  /// the first build and not afterwards. A prop that arrives later would
  /// otherwise take a value away from the widget mid-flight.
  late final bool _beforeControlled = widget.before != null;
  late final bool _afterControlled = widget.after != null;
  late final bool _languageControlled = widget.language != null;
  late final bool _selectionControlled = widget.selected != null;

  late String _language = widget.language ?? widget.defaultLanguage;
  int _selected = -1;

  /// Which folded runs a reader has opened, and which comparison they were
  /// opened against.
  DiffResult? _openedOf;
  Set<int> _opened = <int>{};

  DiffResult? _comparison;
  String _lastBefore = '';
  String _lastAfter = '';
  DiffOptions? _lastOptions;
  DiffResult? _lastGiven;

  RowHeights? _heights;
  RowHeights? _secondHeights;
  Object? _heightsKey;

  bool _syncing = false;

  @override
  void initState() {
    super.initState();
    _selected = widget.defaultSelected;
    _beforeField.text = widget.before ?? widget.defaultBefore ?? '';
    _afterField.text = widget.after ?? widget.defaultAfter ?? '';
    _firstSearch = PaneSearch(
      onChanged: _rebuild,
      onReveal: (SearchMatch match) => _revealMatch(DiffineSide.before, match),
    );
    _secondSearch = PaneSearch(
      onChanged: _rebuild,
      onReveal: (SearchMatch match) => _revealMatch(DiffineSide.after, match),
    );
    _firstVertical.addListener(_onFirstScroll);
    _secondVertical.addListener(_onSecondScroll);
    _beforeField.addListener(_onBeforeTyped);
    _afterField.addListener(_onAfterTyped);
  }

  @override
  void didUpdateWidget(TextDiff old) {
    super.didUpdateWidget(old);

    final String? before = widget.before;
    final String? after = widget.after;

    if (_beforeControlled && before != null && before != _beforeField.text) {
      _beforeField.value = TextEditingValue(
        text: before,
        selection: _clampSelection(_beforeField.selection, before.length),
      );
    }

    if (_afterControlled && after != null && after != _afterField.text) {
      _afterField.value = TextEditingValue(
        text: after,
        selection: _clampSelection(_afterField.selection, after.length),
      );
    }

    if (_languageControlled && widget.language != null) {
      _language = widget.language!;
    }
  }

  @override
  void dispose() {
    _firstVertical
      ..removeListener(_onFirstScroll)
      ..dispose();
    _secondVertical
      ..removeListener(_onSecondScroll)
      ..dispose();
    _firstHorizontal.dispose();
    _secondHorizontal.dispose();
    _beforeField
      ..removeListener(_onBeforeTyped)
      ..dispose();
    _afterField
      ..removeListener(_onAfterTyped)
      ..dispose();
    _beforeFocus.dispose();
    _afterFocus.dispose();

    for (final FocusNode node in _selecting) {
      node.dispose();
    }

    _firstSearch.dispose();
    _secondSearch.dispose();
    _heights?.dispose();
    _secondHeights?.dispose();
    super.dispose();
  }

  TextSelection _clampSelection(TextSelection selection, int length) {
    if (!selection.isValid) {
      return TextSelection.collapsed(offset: length);
    }

    return TextSelection(
      baseOffset: math.min(selection.baseOffset, length),
      extentOffset: math.min(selection.extentOffset, length),
    );
  }

  void _rebuild() {
    if (mounted) {
      setState(() {});
    }
  }

  void _onBeforeTyped() {
    if (widget.mode != DiffineMode.editor) {
      return;
    }

    widget.onBeforeChanged?.call(_beforeField.text);
    _rebuild();
  }

  void _onAfterTyped() {
    if (widget.mode != DiffineMode.editor) {
      return;
    }

    widget.onAfterChanged?.call(_afterField.text);
    _rebuild();
  }

  /// Scrolling one pane scrolls the other, without the two chasing each other.
  void _onFirstScroll() {
    _mirror(_firstVertical, _secondVertical);
  }

  void _onSecondScroll() {
    _mirror(_secondVertical, _firstVertical);
  }

  void _mirror(ScrollController from, ScrollController to) {
    final ScrollPosition? mine = scrollPositionOf(from);
    final ScrollPosition? theirs = scrollPositionOf(to);

    if (_syncing || !widget.syncScroll || mine == null || theirs == null) {
      return;
    }

    _syncing = true;

    // As far as the other pane can go, which is not always as far as this one:
    // the editor holds two documents of their own lengths rather than level
    // with each other.
    final double wanted = math.min(mine.pixels, theirs.maxScrollExtent);

    if ((theirs.pixels - wanted).abs() > 0.5) {
      to.jumpTo(math.max(0, wanted));
    }

    _syncing = false;
  }

  String get _beforeText => _beforeControlled ? (widget.before ?? '') : _beforeField.text;

  String get _afterText => _afterControlled ? (widget.after ?? '') : _afterField.text;

  bool get _editing => widget.mode == DiffineMode.editor;

  bool get _beforeReadOnly => widget.readOnly == DiffineSide.before;

  bool get _afterReadOnly => widget.readOnly == DiffineSide.after;

  DiffResult _compare(String before, String after) {
    final DiffResult? given = _editing ? null : widget.result;

    if (_comparison != null &&
        identical(_lastGiven, given) &&
        _lastBefore == before &&
        _lastAfter == after &&
        identical(_lastOptions, widget.diff)) {
      return _comparison!;
    }

    final DiffResult worked = given ?? diffText(before, after, widget.diff);

    _comparison = worked;
    _lastBefore = before;
    _lastAfter = after;
    _lastOptions = widget.diff;
    _lastGiven = given;

    WidgetsBinding.instance.addPostFrameCallback((Duration _) {
      if (mounted) {
        widget.onDiff?.call(worked);
      }
    });

    return worked;
  }

  void _step(int direction, List<DiffChange> changes) {
    if (changes.isEmpty) {
      return;
    }

    final int from = _current(changes);
    final int index = from < 0
        ? (direction > 0 ? 0 : changes.length - 1)
        : (from + direction + changes.length) % changes.length;

    if (!_selectionControlled) {
      setState(() => _selected = index);
    }

    widget.onSelectedChanged?.call(index, changes[index]);
    _revealChange(index, changes);
  }

  int _current(List<DiffChange> changes) {
    final int held = _selectionControlled ? (widget.selected ?? -1) : _selected;

    return held >= 0 && held < changes.length ? held : -1;
  }

  void _revealChange(int index, List<DiffChange> changes) {
    final DiffChange change = changes[index];

    WidgetsBinding.instance.addPostFrameCallback((Duration _) {
      final RowHeights? heights = _heights;
      final PaneLayout? layout = _lastLayouts.isEmpty ? null : _lastLayouts.first;
      final ScrollPosition? position = scrollPositionOf(_firstVertical);

      if (heights == null || layout == null || position == null) {
        return;
      }

      for (int row = change.rowStart; row < change.rowEnd; row += 1) {
        if (row >= layout.positions.length) {
          break;
        }

        final int drawn = layout.positions[row];

        if (drawn < 0) {
          continue;
        }

        // A third of the way down rather than hard against the top: a change
        // reads better with the lines that led up to it still on the screen.
        final double top = heights.top(drawn);

        _firstVertical.jumpTo(
          math.max(0, math.min(top - position.viewportDimension / 3, position.maxScrollExtent)),
        );

        return;
      }
    });
  }

  void _revealMatch(DiffineSide side, SearchMatch match) {
    final ScrollController scroller = side == DiffineSide.before ? _firstVertical : _secondVertical;
    final RowHeights? heights = side == DiffineSide.before
        ? _heights
        : (_secondHeights ?? _heights);

    WidgetsBinding.instance.addPostFrameCallback((Duration _) {
      final ScrollPosition? position = scrollPositionOf(scroller);

      if (heights == null || position == null) {
        return;
      }

      final double top = heights.top(match.row);
      final double height = heights.height(match.row);
      final double viewport = position.viewportDimension;

      // Only when it is not already there. A reader typing into the box is
      // narrowing a search rather than travelling through a document, and a
      // pane that jumped on every keystroke would be one they could not read.
      if (top < position.pixels || top + height > position.pixels + viewport) {
        scroller.jumpTo(math.max(0, math.min(top - viewport / 3, position.maxScrollExtent)));
      }

      _moveCaret(side, match);
    });
  }

  /// Puts the caret on what the search moved to, for a pane that has one.
  void _moveCaret(DiffineSide side, SearchMatch match) {
    if (!_editing) {
      return;
    }

    final TextEditingController field = side == DiffineSide.before ? _beforeField : _afterField;
    final PaneLayout? layout = side == DiffineSide.before
        ? (_lastLayouts.isEmpty ? null : _lastLayouts.first)
        : (_lastLayouts.length > 1 ? _lastLayouts[1] : null);

    if (layout == null) {
      return;
    }

    final DocumentRange? range = rangeOf(layout, lineStarts(field.text), match);

    if (range != null) {
      field.selection = TextSelection(baseOffset: range.start, extentOffset: range.end);
    }
  }

  List<PaneLayout> _lastLayouts = <PaneLayout>[];

  /// Writes `text` over one range of a document.
  void _write(DiffineSide side, String whole, int start, int end, String text) {
    final TextEditingController field = side == DiffineSide.before ? _beforeField : _afterField;

    field.value = TextEditingValue(
      text: whole,
      selection: TextSelection.collapsed(offset: start + text.length),
    );
  }

  void _apply(DiffChange change, DiffineSide into, DiffResult comparison) {
    final String text = into == DiffineSide.before ? _beforeText : _afterText;
    final LineEdit edit = applyChange(comparison, change, into, text);

    _write(into, edit.whole, edit.start, edit.end, edit.text);
  }

  void _replaceOne(DiffineSide side, PaneSearch search, PaneLayout layout) {
    final String text = side == DiffineSide.before ? _beforeText : _afterText;
    final SearchMatch? on = search.match;
    final DocumentRange? range = on == null ? null : rangeOf(layout, lineStarts(text), on);

    if (range == null) {
      return;
    }

    final String replacement = search.replacement.text;

    _write(
      side,
      text.substring(0, range.start) + replacement + text.substring(range.end),
      range.start,
      range.end,
      replacement,
    );
    // The document is about to be compared again and searched again, and the
    // match a reader was on has just stopped being one. Asking for the one that
    // takes its place is what makes Replace pressed twice move down the file.
    search.reveal();
  }

  void _replaceEvery(DiffineSide side, PaneSearch search, PaneLayout layout) {
    final String text = side == DiffineSide.before ? _beforeText : _afterText;
    final List<int> starts = lineStarts(text);
    // Every match rather than the ones that were counted: the count stops at a
    // limit, and a button called Replace all that left some behind would be a
    // lie about what it did.
    final List<DocumentRange> ranges = <DocumentRange>[
      for (final SearchMatch each in search.all(layout))
        if (rangeOf(layout, starts, each) case final DocumentRange range) range,
    ];

    if (ranges.isEmpty) {
      return;
    }

    final String whole = replacedText(text, ranges, search.replacement.text);

    _write(side, whole, 0, text.length, whole);
    search.reveal();
  }

  @override
  Widget build(BuildContext context) {
    final DiffineStrings strings = stringsFor(widget.locale, widget.strings);
    final DiffineTheme theme = (widget.theme ?? DiffineTheme.resolve(context, widget.colorScheme))
        .withFont(widget.font);
    final String beforeLabel = widget.beforeLabel ?? strings.before;
    final String afterLabel = widget.afterLabel ?? strings.after;

    final String beforeText = _beforeText;
    final String afterText = _afterText;
    final DiffResult comparison = _compare(beforeText, afterText);

    final bool split = _editing || widget.view == DiffineView.split;
    final bool aligned = !_editing && widget.alignLines;
    final bool empty = !_editing && comparison.rows.isEmpty;
    final bool searchable = widget.search && !empty;
    final bool searchOpen = searchable && (_firstSearch.open || (split && _secondSearch.open));

    final Int32List owner = changeOfRow(comparison.rows.length, comparison.changes);
    final FoldPlan? plan = _editing || empty
        ? null
        : foldPlan(
            comparison.rows,
            FoldOptions(
              collapse: widget.collapse && !searchOpen,
              context: widget.context,
              opened: identical(_openedOf, comparison) ? _opened : const <int>{},
            ),
          );

    final PaneLayout beforeLayout = _editing
        ? fieldLayout(comparison.rows, owner, DiffineSide.before, beforeText)
        : splitLayout(comparison.rows, owner, DiffineSide.before, aligned, plan);
    final PaneLayout afterLayout = _editing
        ? fieldLayout(comparison.rows, owner, DiffineSide.after, afterText)
        : splitLayout(comparison.rows, owner, DiffineSide.after, aligned, plan);
    final PaneLayout oneColumn = split
        ? PaneLayout.none
        : unifiedLayout(comparison.rows, comparison.changes, owner, plan);

    final List<PaneLayout> layouts = split
        ? <PaneLayout>[beforeLayout, afterLayout]
        : <PaneLayout>[oneColumn];

    _lastLayouts = layouts;

    final DiffineHighlight? colour =
        widget.highlight ??
        diffineHighlighterFor(
          _editing ? _language : (widget.language ?? widget.defaultLanguage),
          comparison.before,
          comparison.after,
        );

    final int digits = _digitsOf(comparison, beforeLayout, afterLayout);
    final int current = _current(comparison.changes);

    _prepareHeights(theme, layouts, aligned && split);

    _firstSearch.scan(layouts.first, enabled: searchable);
    _secondSearch.scan(
      layouts.length > 1 ? layouts[1] : PaneLayout.none,
      enabled: searchable && split,
    );

    final Widget body = empty
        ? Center(
            child: Text(strings.empty, style: TextStyle(color: theme.muted, fontSize: 13)),
          )
        : _body(
            theme: theme,
            strings: strings,
            comparison: comparison,
            layouts: layouts,
            split: split,
            aligned: aligned,
            digits: digits,
            current: current,
            colour: colour,
            beforeLabel: beforeLabel,
            afterLabel: afterLabel,
          );

    final bool tools = (widget.navigation && !empty) || widget.languageLabel || searchable;

    final Widget frame = DecoratedBox(
      decoration: BoxDecoration(
        color: theme.surface,
        border: Border.all(color: theme.border),
        borderRadius: BorderRadius.circular(theme.radius),
      ),
      child: DiffineSurface(
        child: ClipRRect(
          borderRadius: BorderRadius.circular(theme.radius),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              if (widget.header || tools)
                _header(
                  theme: theme,
                  strings: strings,
                  comparison: comparison,
                  split: split,
                  empty: empty,
                  searchable: searchable,
                  tools: tools,
                  current: current,
                  beforeLabel: beforeLabel,
                  afterLabel: afterLabel,
                ),
              Expanded(child: body),
              if (_firstSearch.open || _secondSearch.open)
                _findBar(
                  theme: theme,
                  strings: strings,
                  layouts: layouts,
                  split: split,
                  beforeLabel: beforeLabel,
                  afterLabel: afterLabel,
                ),
              if (widget.summary && !empty)
                DiffineSummary(
                  theme: theme,
                  before: beforeText.isEmpty && widget.result != null
                      ? comparison.before.join('\n')
                      : beforeText,
                  after: afterText.isEmpty && widget.result != null
                      ? comparison.after.join('\n')
                      : afterText,
                  beforeLabel: beforeLabel,
                  afterLabel: afterLabel,
                  changes: comparison.changes.length,
                  inserted: comparison.stats.inserted + comparison.stats.changed,
                  deleted: comparison.stats.deleted + comparison.stats.changed,
                  linked: split && widget.connectors,
                  format: comparison.format,
                  locale: widget.locale,
                  strings: strings,
                ),
            ],
          ),
        ),
      ),
    );

    final Widget sized = widget.height == double.infinity
        ? frame
        : SizedBox(height: widget.height ?? theme.height, child: frame);

    if (!searchable) {
      return sized;
    }

    return Shortcuts(
      shortcuts: <ShortcutActivator, Intent>{
        const SingleActivator(LogicalKeyboardKey.keyF, control: true): const _FindIntent(),
        const SingleActivator(LogicalKeyboardKey.keyF, meta: true): const _FindIntent(),
        if (_editing) ...<ShortcutActivator, Intent>{
          const SingleActivator(LogicalKeyboardKey.keyH, control: true): const _FindIntent(
            replacing: true,
          ),
          const SingleActivator(LogicalKeyboardKey.keyH, meta: true): const _FindIntent(
            replacing: true,
          ),
        },
      },
      child: Actions(
        actions: <Type, Action<Intent>>{
          _FindIntent: CallbackAction<_FindIntent>(
            onInvoke: (_FindIntent intent) {
              _openSearch(intent.replacing, split);

              return null;
            },
          ),
        },
        child: sized,
      ),
    );
  }

  void _openSearch(bool replacing, bool split) {
    final bool second = split && _afterFocus.hasFocus;
    final PaneSearch search = second ? _secondSearch : _firstSearch;
    final bool editable = _editing && !(second ? _afterReadOnly : _beforeReadOnly);

    search.show(replacing: replacing && editable);
  }

  int _digitsOf(DiffResult comparison, PaneLayout before, PaneLayout after) {
    if (_editing) {
      return '${math.max(math.max(before.lines.length, after.lines.length), 1)}'.length;
    }

    final DiffRow? last = comparison.rows.isEmpty ? null : comparison.rows.last;
    final int most = <int>[
      comparison.before.length,
      comparison.after.length,
      (last?.before?.index ?? 0) + 1,
      (last?.after?.index ?? 0) + 1,
      1,
    ].reduce(math.max);

    return '$most'.length;
  }

  void _prepareHeights(DiffineTheme theme, List<PaneLayout> layouts, bool shared) {
    final Object key = Object.hash(
      layouts.first.lines.length,
      layouts.length > 1 ? layouts[1].lines.length : 0,
      widget.wrap,
      theme.lineHeight,
      theme.fontSize,
      theme.fontFamily,
      shared,
      identical(_lastGiven, widget.result),
      _comparison.hashCode,
    );

    if (identical(_heightsKey, key) && _heights != null) {
      return;
    }

    _heightsKey = key;
    _heights?.dispose();
    _secondHeights?.dispose();

    final TextDirection direction = context.mounted
        ? Directionality.of(context)
        : TextDirection.ltr;

    _heights = RowHeights(
      count: layouts.first.lines.length,
      lineHeight: theme.lineHeight,
      wrap: widget.wrap,
      style: theme.lineStyle,
      direction: direction,
    );

    if (shared) {
      _secondHeights = null;
    } else if (layouts.length > 1) {
      _secondHeights = RowHeights(
        count: layouts[1].lines.length,
        lineHeight: theme.lineHeight,
        wrap: widget.wrap,
        style: theme.lineStyle,
        direction: direction,
      );
    } else {
      _secondHeights = null;
    }
  }

  Widget _header({
    required DiffineTheme theme,
    required DiffineStrings strings,
    required DiffResult comparison,
    required bool split,
    required bool empty,
    required bool searchable,
    required bool tools,
    required int current,
    required String beforeLabel,
    required String afterLabel,
  }) {
    final String bothLabel = '$beforeLabel → $afterLabel';

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
                        split ? beforeLabel : bothLabel,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: theme.text,
                        ),
                      ),
                    ),
                  const Spacer(),
                  if (searchable && split)
                    DiffineFindToggle(
                      theme: theme,
                      search: _firstSearch,
                      label: beforeLabel,
                      strings: strings,
                    ),
                ],
              ),
            ),
          ),
          if (split && widget.connectors) SizedBox(width: theme.linksWidth),
          if (split)
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
                    ..._tools(
                      theme: theme,
                      strings: strings,
                      comparison: comparison,
                      empty: empty,
                      searchable: searchable,
                      current: current,
                      label: afterLabel,
                      split: split,
                      bothLabel: bothLabel,
                    ),
                  ],
                ),
              ),
            )
          else
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Row(
                children: _tools(
                  theme: theme,
                  strings: strings,
                  comparison: comparison,
                  empty: empty,
                  searchable: searchable,
                  current: current,
                  label: bothLabel,
                  split: split,
                  bothLabel: bothLabel,
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
    required DiffResult comparison,
    required bool empty,
    required bool searchable,
    required int current,
    required String label,
    required bool split,
    required String bothLabel,
  }) {
    return <Widget>[
      if (widget.navigation && !empty)
        DiffineNav(
          theme: theme,
          total: comparison.changes.length,
          current: current,
          onStep: (int direction) => _step(direction, comparison.changes),
          strings: strings,
        ),
      if (searchable)
        DiffineFindToggle(
          theme: theme,
          search: split ? _secondSearch : _firstSearch,
          label: split ? label : bothLabel,
          strings: strings,
        ),
      if (widget.languageLabel)
        _editing
            ? DiffineLanguagePicker(
                theme: theme,
                language: _language,
                strings: strings,
                onLanguageChange: (String chosen) {
                  if (!_languageControlled) {
                    setState(() => _language = chosen);
                  }

                  widget.onLanguageChanged?.call(chosen);
                },
              )
            : DiffineLanguageName(
                theme: theme,
                language: widget.language ?? widget.defaultLanguage,
                strings: strings,
              ),
    ];
  }

  Widget _findBar({
    required DiffineTheme theme,
    required DiffineStrings strings,
    required List<PaneLayout> layouts,
    required bool split,
    required String beforeLabel,
    required String afterLabel,
  }) {
    final String firstLabel = split ? beforeLabel : '$beforeLabel → $afterLabel';

    return DecoratedBox(
      decoration: BoxDecoration(
        color: theme.gutter,
        border: Border(top: BorderSide(color: theme.border)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Expanded(
            child: _firstSearch.open
                ? DiffineFind(
                    theme: theme,
                    search: _firstSearch,
                    label: firstLabel,
                    replaceable: _editing && !_beforeReadOnly,
                    strings: strings,
                    onReplace: () => _replaceOne(DiffineSide.before, _firstSearch, layouts.first),
                    onReplaceAll: () =>
                        _replaceEvery(DiffineSide.before, _firstSearch, layouts.first),
                    onClose: () =>
                        (_editing ? _beforeFocus : _firstSearch.queryFocus).requestFocus(),
                  )
                : const SizedBox.shrink(),
          ),
          if (split && widget.connectors) SizedBox(width: theme.linksWidth),
          if (split)
            Expanded(
              child: _secondSearch.open
                  ? DiffineFind(
                      theme: theme,
                      search: _secondSearch,
                      label: afterLabel,
                      replaceable: _editing && !_afterReadOnly,
                      strings: strings,
                      onReplace: () => _replaceOne(
                        DiffineSide.after,
                        _secondSearch,
                        layouts.length > 1 ? layouts[1] : PaneLayout.none,
                      ),
                      onReplaceAll: () => _replaceEvery(
                        DiffineSide.after,
                        _secondSearch,
                        layouts.length > 1 ? layouts[1] : PaneLayout.none,
                      ),
                      onClose: () =>
                          (_editing ? _afterFocus : _secondSearch.queryFocus).requestFocus(),
                    )
                  : const SizedBox.shrink(),
            ),
        ],
      ),
    );
  }

  Widget _body({
    required DiffineTheme theme,
    required DiffineStrings strings,
    required DiffResult comparison,
    required List<PaneLayout> layouts,
    required bool split,
    required bool aligned,
    required int digits,
    required int current,
    required DiffineHighlight? colour,
    required String beforeLabel,
    required String afterLabel,
  }) {
    return LayoutBuilder(
      builder: (BuildContext context, BoxConstraints constraints) {
        final TextDirection direction = Directionality.of(context);
        final double characterWidth = characterWidthOf(theme.lineStyle, direction);
        final double links = split && widget.connectors ? theme.linksWidth : 0;
        final double paneWidth = split
            ? math.max(0, (constraints.maxWidth - links) / 2)
            : constraints.maxWidth;
        final int columns = split ? 1 : 2;
        final double gutter = gutterWidthOf(
          characterWidth: characterWidth,
          digits: digits,
          columns: columns,
          lineNumbers: widget.lineNumbers,
          markers: widget.markers,
        );

        final RowHeights first = _heights!;
        final RowHeights second = _secondHeights ?? _heights!;

        final double firstContent = contentWidthOf(
          paneWidth: paneWidth,
          gutter: gutter,
          characterWidth: characterWidth,
          longest: layouts.first.widest?.line?.text.length ?? 0,
          wrap: widget.wrap,
        );
        final double secondContent = layouts.length > 1
            ? contentWidthOf(
                paneWidth: paneWidth,
                gutter: gutter,
                characterWidth: characterWidth,
                longest: layouts[1].widest?.line?.text.length ?? 0,
                wrap: widget.wrap,
              )
            : firstContent;

        // Both panes are described before either is laid out, so the table they
        // share has heard from both by the time the first row asks how tall it
        // is.
        first.describe(0, layouts.first, math.max(0, firstContent - gutter - kTextGap * 2));

        if (identical(first, second)) {
          if (layouts.length > 1) {
            first.describe(1, layouts[1], math.max(0, secondContent - gutter - kTextGap * 2));
          }
        } else {
          second.describe(0, layouts[1], math.max(0, secondContent - gutter - kTextGap * 2));
        }

        final Widget firstPane = _pane(
          theme: theme,
          strings: strings,
          layout: layouts.first,
          heights: first,
          pane: 0,
          side: DiffineSide.before,
          name: split ? beforeLabel : '$beforeLabel → $afterLabel',
          vertical: _firstVertical,
          horizontal: _firstHorizontal,
          digits: digits,
          current: current,
          colour: colour,
          search: _firstSearch,
          contentWidth: firstContent,
          gutterWidth: gutter,
          readOnly: _beforeReadOnly,
          controller: _beforeField,
          focus: _beforeFocus,
        );

        if (!split) {
          return firstPane;
        }

        return Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Expanded(child: firstPane),
            if (widget.connectors)
              SizedBox(
                width: theme.linksWidth,
                child: ListenableBuilder(
                  listenable: Listenable.merge(<Listenable>[
                    _firstVertical,
                    _secondVertical,
                    first,
                    second,
                  ]),
                  builder: (BuildContext context, Widget? child) => DiffineLinks(
                    theme: theme,
                    changes: comparison.changes,
                    beforeLayout: layouts.first,
                    afterLayout: layouts.length > 1 ? layouts[1] : PaneLayout.none,
                    beforeHeights: first,
                    afterHeights: identical(first, second) ? first : second,
                    beforeOffset: scrollOffsetOf(_firstVertical),
                    afterOffset: scrollOffsetOf(_secondVertical),
                    current: current,
                    strings: strings,
                    beforeLabel: beforeLabel,
                    afterLabel: afterLabel,
                    writableBefore: _editing && widget.applyChanges && !_beforeReadOnly,
                    writableAfter: _editing && widget.applyChanges && !_afterReadOnly,
                    onApply: _editing && widget.applyChanges
                        ? (DiffChange change, DiffineSide into) => _apply(change, into, comparison)
                        : null,
                  ),
                ),
              ),
            Expanded(
              child: _pane(
                theme: theme,
                strings: strings,
                layout: layouts.length > 1 ? layouts[1] : PaneLayout.none,
                heights: second,
                pane: identical(first, second) ? 1 : 0,
                side: DiffineSide.after,
                name: afterLabel,
                vertical: _secondVertical,
                horizontal: _secondHorizontal,
                digits: digits,
                current: current,
                colour: colour,
                search: _secondSearch,
                contentWidth: secondContent,
                gutterWidth: gutter,
                readOnly: _afterReadOnly,
                controller: _afterField,
                focus: _afterFocus,
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _pane({
    required DiffineTheme theme,
    required DiffineStrings strings,
    required PaneLayout layout,
    required RowHeights heights,
    required int pane,
    required DiffineSide side,
    required String name,
    required ScrollController vertical,
    required ScrollController horizontal,
    required int digits,
    required int current,
    required DiffineHighlight? colour,
    required PaneSearch search,
    required double contentWidth,
    required double gutterWidth,
    required bool readOnly,
    required TextEditingController controller,
    required FocusNode focus,
  }) {
    if (_editing) {
      return TextDiffField(
        theme: theme,
        side: side,
        name: name,
        controller: controller,
        focusNode: focus,
        layout: layout,
        heights: heights,
        pane: pane,
        vertical: vertical,
        horizontal: horizontal,
        strings: strings,
        digits: digits,
        lineNumbers: widget.lineNumbers,
        markers: widget.markers,
        wrap: widget.wrap,
        current: current,
        contentWidth: contentWidth,
        gutterWidth: gutterWidth,
        readOnly: readOnly,
        highlight: colour,
        matches: search.rows,
        match: search.match,
        invisibles: widget.showInvisibles,
        indentWithTab: widget.indentWithTab,
      );
    }

    return SelectableRegion(
      focusNode: _selecting[pane.clamp(0, _selecting.length - 1)],
      selectionControls: emptyTextSelectionControls,
      child: TextDiffPane(
        theme: theme,
        name: name,
        layout: layout,
        heights: heights,
        pane: pane,
        controller: vertical,
        horizontal: horizontal,
        strings: strings,
        digits: digits,
        lineNumbers: widget.lineNumbers,
        markers: widget.markers,
        wrap: widget.wrap,
        current: current,
        contentWidth: contentWidth,
        highlight: colour,
        matches: search.rows,
        match: search.match,
        invisibles: widget.showInvisibles,
        renderGutter: widget.renderGutter,
        renderWidget: widget.renderWidget,
        onExpand: (FoldRun fold) {
          setState(() {
            final DiffResult? comparison = _comparison;

            _opened = <int>{if (identical(_openedOf, comparison)) ..._opened, fold.start};
            _openedOf = comparison;
          });
        },
      ),
    );
  }
}

/// Ctrl+F, and Ctrl+H where there is something to write into.
class _FindIntent extends Intent {
  const _FindIntent({this.replacing = false});

  final bool replacing;
}
