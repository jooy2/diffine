/// Every switch on the playground page, as one value.
///
/// The playground is the one screen here whose controls are not its own: the
/// documentation site draws them in HTML above the frame, because they belong
/// to the page rather than to the widget and because the reader on React sees
/// exactly the same row. So the switches arrive as a message and land here,
/// and [Playground] is a widget that draws whatever this last said.
///
/// Everything is read defensively. What comes in was written by a page, and a
/// page that has been edited since this was built should leave the gallery
/// showing something rather than throwing on a field that moved.
library;

import 'package:diffine/diffine.dart';
import 'package:flutter/foundation.dart';

/// What the playground is showing.
enum PlaygroundMode {
  /// Two documents, with a field over each of them.
  editor,

  /// The same two documents, read.
  viewer,

  /// Two pictures.
  pictures,
}

/// The page's switches, as they last stood.
@immutable
class PlaygroundSettings {
  /// Every switch, each with the default the page starts on.
  const PlaygroundSettings({
    this.mode = PlaygroundMode.editor,
    this.generation = 0,
    this.before = '',
    this.after = '',
    this.beforeLabel,
    this.afterLabel,
    this.language = 'plain',
    this.detail = DiffInlineMode.word,
    this.unified = false,
    this.wrap = false,
    this.numbers = true,
    this.align = true,
    this.connectors = true,
    this.tab = false,
    this.view = DiffineImageView.split,
    this.tolerance = 0.05,
    this.alignPictures = false,
    this.smoothing = true,
    this.marks = true,
    this.outlines = true,
    this.shot = '',
    this.pictureBefore,
    this.pictureAfter,
    this.pictureBeforeLabel,
    this.pictureAfterLabel,
  });

  /// Before the page has said anything.
  ///
  /// The generation is one no message can carry, so the first that arrives is
  /// always a new pair of documents. Nought would not do: it is where the page
  /// itself starts, and a widget built before the first message would then read
  /// its own empty defaults as the documents and keep them.
  static const PlaygroundSettings waiting = PlaygroundSettings(generation: -1);

  /// What the page last posted, or the defaults where a field is missing.
  factory PlaygroundSettings.of(
    Map<Object?, Object?> value, {
    Uint8List? pictureBefore,
    Uint8List? pictureAfter,
  }) {
    const PlaygroundSettings fallback = PlaygroundSettings();

    bool flag(String name, {required bool or}) => switch (value[name]) {
      final bool given => given,
      _ => or,
    };

    String text(String name, {required String or}) => switch (value[name]) {
      final String given => given,
      _ => or,
    };

    String? label(String name) => switch (value[name]) {
      final String given when given.isNotEmpty => given,
      _ => null,
    };

    return PlaygroundSettings(
      mode: PlaygroundMode.values.asNameMap()[value['mode']] ?? fallback.mode,
      generation: switch (value['generation']) {
        final num given => given.toInt(),
        _ => fallback.generation,
      },
      before: text('before', or: fallback.before),
      after: text('after', or: fallback.after),
      beforeLabel: label('beforeLabel'),
      afterLabel: label('afterLabel'),
      language: text('language', or: fallback.language),
      detail: DiffInlineMode.values.asNameMap()[value['detail']] ?? fallback.detail,
      unified: flag('unified', or: fallback.unified),
      wrap: flag('wrap', or: fallback.wrap),
      numbers: flag('numbers', or: fallback.numbers),
      align: flag('align', or: fallback.align),
      connectors: flag('connectors', or: fallback.connectors),
      tab: flag('tab', or: fallback.tab),
      view: DiffineImageView.values.asNameMap()[value['view']] ?? fallback.view,
      tolerance: switch (value['tolerance']) {
        final num given => given.toDouble().clamp(0, 1),
        _ => fallback.tolerance,
      },
      alignPictures: flag('alignPictures', or: fallback.alignPictures),
      smoothing: flag('smoothing', or: fallback.smoothing),
      marks: flag('marks', or: fallback.marks),
      outlines: flag('outlines', or: fallback.outlines),
      shot: text('shot', or: fallback.shot),
      pictureBefore: pictureBefore,
      pictureAfter: pictureAfter,
      pictureBeforeLabel: label('pictureBeforeLabel'),
      pictureAfterLabel: label('pictureAfterLabel'),
    );
  }

  /// Which of the three the page is on.
  final PlaygroundMode mode;

  /// How many times the documents have been put back.
  ///
  /// The two text modes share what a reader typed, so the widget keeps the
  /// documents rather than reading them again on every message. This is what
  /// says the page means new ones: a different sample, or the reset button.
  final int generation;

  /// The left document, as the page last handed it over.
  final String before;

  /// The right one.
  final String after;

  /// What to call the left one, or null for the locale's own word.
  final String? beforeLabel;

  /// What to call the right one.
  final String? afterLabel;

  /// What the two are being coloured as.
  final String language;

  /// What is compared inside a pair of lines that were edited.
  final DiffInlineMode detail;

  /// One column rather than two. Viewer only.
  final bool unified;

  /// Whether a long line wraps.
  final bool wrap;

  /// Whether each line carries its number.
  final bool numbers;

  /// Whether a line is held level with its counterpart. Viewer only.
  final bool align;

  /// Whether the column between the panes is drawn.
  final bool connectors;

  /// Whether Tab types a tab. Editor only.
  final bool tab;

  /// How the two pictures are laid out.
  final DiffineImageView view;

  /// How different two pixels have to be before it counts.
  final double tolerance;

  /// Whether an offset between the two pictures is looked for.
  final bool alignPictures;

  /// Whether a pixel that only differs because an edge was drawn smooth counts.
  final bool smoothing;

  /// Whether the pixels that changed are tinted.
  final bool marks;

  /// Whether a box is drawn round each change.
  final bool outlines;

  /// Which pair of pictures the page sent, so a new one is a new comparison.
  ///
  /// The name rather than the bytes: two `Uint8List`s are not worth comparing
  /// on every message, and the page has a name for each pair anyway.
  final String shot;

  /// The left picture, as the bytes of a file.
  final Uint8List? pictureBefore;

  /// The right one.
  final Uint8List? pictureAfter;

  /// What to call the left picture.
  final String? pictureBeforeLabel;

  /// What to call the right one.
  final String? pictureAfterLabel;
}
