/// One pane's search: what was typed, what it found, and where the reader is in
/// what it found.
///
/// Both widgets hold one of these per pane, which is what makes the two sides
/// of a split view independent — two bars, two queries, two counts, opened and
/// closed on their own.
///
/// Which match is current is held in two parts, and the second one is what
/// keeps a search readable while it is being typed. An index alone would send a
/// reader who was on the fiftieth match back to the top of the document on
/// every keystroke, because the fiftieth match of `use` and the fiftieth match
/// of `user` have nothing to do with each other. So a step remembers the line
/// it landed on as well, and a query that has just changed takes the first
/// match at or after that line — the reader stays where they were reading, and
/// the highlighting narrows around them.
library;

import 'package:diffine/src/internal/rows.dart';
import 'package:diffine/src/internal/search.dart';
import 'package:flutter/widgets.dart';

/// Everything one pane's search bar shows, and everything it can do.
class PaneSearch {
  /// One pane's search, closed and empty.
  PaneSearch({required this.onChanged, required this.onReveal});

  /// Told whenever anything the bar draws has changed.
  final VoidCallback onChanged;

  /// Told where a reader moved to, so the pane can put it on the screen and a
  /// field can move its caret.
  final void Function(SearchMatch match) onReveal;

  /// What is being looked for.
  final TextEditingController query = TextEditingController();

  /// What is to be written over it.
  final TextEditingController replacement = TextEditingController();

  /// The box's own focus, so that opening the bar takes it.
  final FocusNode queryFocus = FocusNode(debugLabel: 'diffine find');

  /// The other box's.
  final FocusNode replacementFocus = FocusNode(debugLabel: 'diffine replace');

  /// Whether the bar is on the screen.
  bool open = false;

  /// Whether the row for replacing is on the screen with it.
  bool replacing = false;

  /// How the query is read.
  SearchOptions options = const SearchOptions();

  /// Which match a reader stepped to, or -1 for one that is worked out from
  /// [anchor].
  int held = -1;

  /// The line the reader was last taken to, which a new query starts from.
  int anchor = 0;

  /// What the last scan found, which the widget writes on every build.
  SearchResult found = SearchResult.none;

  /// Whether the query is a regular expression that cannot be read yet.
  bool invalid = false;

  /// The matches of each line that has any, keyed by its position in the pane.
  Map<int, List<SearchMatch>> rows = <int, List<SearchMatch>>{};

  /// Lets go of the controllers and the focus nodes.
  void dispose() {
    query.dispose();
    replacement.dispose();
    queryFocus.dispose();
    replacementFocus.dispose();
  }

  /// Which match a reader is on, as an index into [SearchResult.matches], or
  /// -1.
  int get current {
    final int total = found.matches.length;

    if (total == 0) {
      return -1;
    }

    if (held >= 0) {
      return held < total ? held : total - 1;
    }

    final int at = found.matches.indexWhere((SearchMatch match) => match.row >= anchor);

    return at < 0 ? 0 : at;
  }

  /// That match, which is the one drawn differently from the rest.
  SearchMatch? get match {
    final int at = current;

    return at < 0 ? null : found.matches[at];
  }

  /// Runs the query over a pane's lines. Called on every build, because in an
  /// editor every keystroke is a new comparison and a new set of lines.
  void scan(PaneLayout layout, {required bool enabled}) {
    final RegExp? pattern = enabled && open ? patternFor(query.text, options) : null;

    invalid = enabled && open && query.text.isNotEmpty && pattern == null;
    found = findMatches(layout.lines, pattern, options.wholeWord);
    rows = matchRows(found.matches);
  }

  /// Every match with no limit on the count, which is what Replace All works
  /// from.
  List<SearchMatch> all(PaneLayout layout) {
    final RegExp? pattern = patternFor(query.text, options);

    return findMatches(layout.lines, pattern, options.wholeWord, 1 << 30).matches;
  }

  /// Opens the bar, with the row for replacing if it is asked for.
  void show({bool replacing = false, int? from}) {
    anchor = match?.row ?? from ?? anchor;
    open = true;

    if (replacing) {
      this.replacing = true;
    }

    held = -1;
    queryFocus.requestFocus();
    query.selection = TextSelection(baseOffset: 0, extentOffset: query.text.length);
    onChanged();
  }

  /// Closes it.
  void hide() {
    open = false;
    onChanged();
  }

  /// Moves on a match, or back one, wrapping at either end.
  void step(int direction) {
    final int total = found.matches.length;

    if (total == 0) {
      return;
    }

    final int from = current;
    final int index = from < 0
        ? (direction > 0 ? 0 : total - 1)
        : (from + direction + total) % total;

    held = index;
    anchor = found.matches[index].row;
    onChanged();
    onReveal(found.matches[index]);
  }

  /// Puts the match a reader is on back on the screen, after the document
  /// moved.
  void reveal() {
    final SearchMatch? on = match;

    if (on != null) {
      onReveal(on);
    }
  }

  /// A new query. The reader stays where they were reading.
  void retype() {
    held = -1;
    onChanged();
  }

  /// One of the three switches was flipped.
  void setOptions(SearchOptions next) {
    options = next;
    held = -1;
    onChanged();
  }
}
