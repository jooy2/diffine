/// What a reader gets when they copy out of a pane.
///
/// A pane is not the document it is showing. It has numbers down the side, a
/// mark for what happened to each line, bands standing in for the lines that
/// are folded away, in a view holding two documents level a blank opposite
/// every line the other side does not have, and in a merged view the words
/// that went out of a line, drawn next to the ones that came in. None of that
/// is in the file.
///
/// The columns are already left out of a selection, because they are drawn
/// inside a container that takes no part in one, and the blanks and the bands
/// have no text to select. What is left is the framework's own habit: it hands
/// a selection over as the text of every piece it covers run together, so
/// three lines copied out of a pane arrive as one with no break in it.
///
/// So each line hands over its own part with the breaks that follow it, up to
/// the next line the selection reaches — counting the empty lines between, which
/// have no text to select either and are still lines of the document. That is
/// done where the framework asks each line for its text rather than where a
/// copy is made, because there is more than one way to make one: a key on the
/// desktop, and on the web the browser's own menu, which reads the selection
/// without a key being pressed.
library;

import 'dart:math' as math;

import 'package:diffine/src/internal/rows.dart';
import 'package:flutter/rendering.dart';

/// Which lines of one pane are built, and so which a selection can reach.
///
/// With the rows virtualised that is what is on the screen and a little either
/// side, and whatever a selection is holding on to, which the list keeps built
/// for as long as it does.
class PaneSelection {
  final Map<int, LineSelection> _lines = <int, LineSelection>{};

  /// The lines the pane is drawing, which the breaks between two selected
  /// lines are counted in.
  PaneLayout layout = PaneLayout.none;

  /// A line has been built at [row].
  void attach(int row, LineSelection line) {
    _lines[row] = line;
  }

  /// The line at [row] has gone, unless another has taken its place since.
  void detach(int row, LineSelection line) {
    if (identical(_lines[row], line)) {
      _lines.remove(row);
    }
  }

  /// How many line breaks follow the selected part of the line at [row]: one
  /// for every line of the document up to the next line the selection reaches,
  /// and none where it reaches no line after this one.
  int breaksAfter(int row) {
    int? next;

    for (final MapEntry<int, LineSelection> entry in _lines.entries) {
      if (entry.key > row && (next == null || entry.key < next) && entry.value.selected) {
        next = entry.key;
      }
    }

    if (next == null) {
      return 0;
    }

    int breaks = 0;

    for (int between = row + 1; between <= next && between < layout.lines.length; between += 1) {
      if (layout.lines[between].line != null) {
        breaks += 1;
      }
    }

    return breaks;
  }
}

/// One line's text, as a selection sees it.
///
/// A registrar the text registers through on its way to whatever it would have
/// registered with anyway. What reaches that registrar is the text's own
/// selectable with one thing changed, the text it hands over, so the line sits
/// exactly as deep in the selection as it did. A container in the same place
/// would be a level more, and the framework does not carry a selection that far
/// down when the line is all a pane holds.
class LineSelection implements SelectionRegistrar {
  /// The selection of one drawn line.
  LineSelection({required this.drawn, required this.row, required this.pane});

  /// The line it belongs to.
  PaneLine drawn;

  /// Where the line sits in its pane's own list.
  int row;

  /// The pane's record of its built lines.
  PaneSelection pane;

  SelectionRegistrar? _parent;
  final Map<Selectable, _LineSelectable> _selectables = <Selectable, _LineSelectable>{};

  /// What the text would have registered with, had this not been in the way.
  set parent(SelectionRegistrar? value) {
    if (identical(value, _parent)) {
      return;
    }

    for (final _LineSelectable selectable in _selectables.values) {
      _parent?.remove(selectable);
    }

    _parent = value;

    for (final _LineSelectable selectable in _selectables.values) {
      _parent?.add(selectable);
    }
  }

  @override
  void add(Selectable selectable) {
    final _LineSelectable wrapped = _selectables.putIfAbsent(
      selectable,
      () => _LineSelectable(selectable, this),
    );

    _parent?.add(wrapped);
  }

  @override
  void remove(Selectable selectable) {
    final _LineSelectable? wrapped = _selectables.remove(selectable);

    if (wrapped != null) {
      _parent?.remove(wrapped);
    }
  }

  /// Whether the selection reaches this line at all.
  bool get selected {
    return _selectables.keys.any((Selectable selectable) => selectable.getSelection() != null);
  }

  /// The part of the line [inner] has selected, as the document has it, and
  /// the breaks that follow it.
  ///
  /// A line drawn from two is drawn with what went out still in it, and what a
  /// reader copies is the line of `after` it stands for. A point inside a run
  /// that went out is where the run was, which is where the text after it
  /// starts.
  SelectedContent? _contentOf(Selectable inner) {
    final SelectedContent? content = inner.getSelectedContent();

    if (content == null) {
      return null;
    }

    final SelectedContentRange? range = inner.getSelection();
    final MergedLine? merged = drawn.merged;
    String text = content.plainText;

    if (merged != null && range != null) {
      final int start = merged.afterOffset(math.min(range.startOffset, range.endOffset));
      final int end = merged.afterOffset(math.max(range.startOffset, range.endOffset));

      text = merged.after.text.substring(start, end);
    }

    return SelectedContent(plainText: text + '\n' * pane.breaksAfter(row));
  }
}

/// A line's selectable, as its registrar hands it on: the same in everything
/// but the text it hands over.
class _LineSelectable with Selectable {
  _LineSelectable(this._inner, this._line);

  final Selectable _inner;
  final LineSelection _line;

  @override
  SelectedContent? getSelectedContent() => _line._contentOf(_inner);

  @override
  SelectionGeometry get value => _inner.value;

  @override
  void addListener(VoidCallback listener) => _inner.addListener(listener);

  @override
  void removeListener(VoidCallback listener) => _inner.removeListener(listener);

  @override
  void pushHandleLayers(LayerLink? startHandle, LayerLink? endHandle) {
    _inner.pushHandleLayers(startHandle, endHandle);
  }

  @override
  SelectedContentRange? getSelection() => _inner.getSelection();

  @override
  SelectionResult dispatchSelectionEvent(SelectionEvent event) {
    return _inner.dispatchSelectionEvent(event);
  }

  @override
  int get contentLength => _inner.contentLength;

  @override
  Matrix4 getTransformTo(RenderObject? ancestor) => _inner.getTransformTo(ancestor);

  @override
  Size get size => _inner.size;

  @override
  List<Rect> get boundingBoxes => _inner.boundingBoxes;

  /// Nothing to let go of. The selectable underneath belongs to the text, which
  /// disposes of it itself.
  @override
  void dispose() {}
}
