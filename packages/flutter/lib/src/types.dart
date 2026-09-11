/// The vocabulary every part of Diffine is written in.
///
/// These are the types that more than one library needs, which is why they sit
/// here rather than beside whichever library introduced them — and why they are
/// all exported from `package:diffine/diffine.dart`, so an application can name
/// one in its own state without importing the engine or the widget to get at
/// it.
///
/// The first half is the comparison and the second is the view of it. Only the
/// props of a widget live anywhere else, beside the widget that takes them.
library;

import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/widgets.dart';

/// What happened to one piece of a comparison.
enum DiffEditKind {
  /// The piece is in both documents.
  equal,

  /// The piece is only in `after`.
  insert,

  /// The piece is only in `before`.
  delete,
}

/// What happened to a run of lines.
///
/// [DiffChangeKind.replace] is the one worth a word: it is a run where lines
/// went away *and* lines arrived, which is what a person means by "this was
/// edited". Keeping it apart from a bare insert next to a bare delete is what
/// lets the two sides be laid out level with each other, and what lets the
/// words inside the pair be compared rather than the whole line being called
/// new.
enum DiffChangeKind {
  /// Lines arrived and none went away.
  insert,

  /// Lines went away and none arrived.
  delete,

  /// Lines went away and lines arrived over the same run.
  replace,
}

/// What one row of the comparison is.
enum DiffRowKind {
  /// The same line on both sides.
  equal,

  /// A line only `after` has.
  insert,

  /// A line only `before` has.
  delete,

  /// A pair of lines that sit opposite each other and differ.
  replace,
}

/// What is compared inside a pair of lines that were edited rather than
/// replaced outright.
enum DiffInlineMode {
  /// Nothing. A changed line is changed, and that is all the row says.
  none,

  /// Runs of letters and digits, runs of whitespace, and every other character
  /// on its own. This is what a reader usually wants: it marks the word that
  /// moved rather than the three letters it has in common with the word that
  /// was there before.
  word,

  /// One grapheme at a time, so a changed digit in the middle of a number is a
  /// changed digit rather than a changed number.
  character,
}

/// How much of the whitespace counts when two lines are compared.
///
/// Whatever is ignored is still drawn. This changes which lines are called
/// equal, never what the viewer shows.
enum DiffWhitespace {
  /// All of it.
  exact,

  /// Whitespace at the end of a line is ignored.
  trailing,

  /// Whitespace at either end is ignored, so a line that was only indented
  /// further is unchanged.
  surrounding,

  /// As [surrounding], and a run of whitespace inside the line counts as one
  /// space however long it is.
  amount,

  /// Whitespace is dropped before the comparison.
  all,
}

/// How two documents are compared.
@immutable
class DiffOptions {
  /// Every option, with the defaults behind whatever is left out.
  const DiffOptions({
    this.inline = DiffInlineMode.word,
    this.whitespace = DiffWhitespace.exact,
    this.ignoreCase = false,
    this.inlineThreshold = 0.3,
    this.ignore = const <RegExp>[],
    this.maxCost = 5000,
  });

  /// What is compared inside a pair of lines that were edited.
  final DiffInlineMode inline;

  /// How much of the whitespace counts.
  final DiffWhitespace whitespace;

  /// Whether `Title` and `title` are the same line.
  final bool ignoreCase;

  /// How alike a pair of lines has to be, from 0 to 1, before the words inside
  /// them are worth marking.
  ///
  /// Two lines that were edited share most of their words; two lines that
  /// merely landed opposite each other share a comma and a couple of vowels,
  /// and marking those is worse than marking nothing — the row ends up striped
  /// with scraps that mean nothing to a reader. Below this, the pair is drawn
  /// as one changed line on each side.
  ///
  /// At `0` every pair is marked, and at `1` only an identical pair is.
  final double inlineThreshold;

  /// Patterns whose matches do not count when two lines are compared.
  ///
  /// A snapshot with a timestamp in it, a log with a request id, a build with a
  /// hash in its filename: one line that is different every time, and a
  /// comparison that says the whole file changed. Each pattern is looked for in
  /// both lines and what it finds is set aside, so two lines that differ only
  /// inside a match are the same line.
  ///
  /// ```dart
  /// diffText(saved, rendered, const DiffOptions(ignore: <RegExp>[_stamp]));
  /// ```
  ///
  /// What is set aside is still drawn, exactly as with [whitespace]: this
  /// decides which lines are called equal and never what the viewer shows. It
  /// decides that at the level of a line — inside a pair that was edited, the
  /// words are compared as they were written, because a pattern written for a
  /// line is not a pattern about one word of it.
  ///
  /// A match is set aside rather than removed, so a line with a timestamp in it
  /// and a line with the timestamp missing are still two different lines.
  final List<RegExp> ignore;

  /// The largest difference the engine will work through before it gives up.
  ///
  /// Finding the smallest set of edits costs roughly the size of the two
  /// documents multiplied by the number of edits between them, so two large
  /// documents with nothing in common are the expensive case — and the answer
  /// for that case is "all of it changed", which is not worth waiting for. Past
  /// this, the range being compared comes back as one wholesale replacement and
  /// [DiffResult.complete] is `false`.
  final int maxCost;

  /// A copy with whichever options are given replaced.
  DiffOptions copyWith({
    DiffInlineMode? inline,
    DiffWhitespace? whitespace,
    bool? ignoreCase,
    double? inlineThreshold,
    List<RegExp>? ignore,
    int? maxCost,
  }) {
    return DiffOptions(
      inline: inline ?? this.inline,
      whitespace: whitespace ?? this.whitespace,
      ignoreCase: ignoreCase ?? this.ignoreCase,
      inlineThreshold: inlineThreshold ?? this.inlineThreshold,
      ignore: ignore ?? this.ignore,
      maxCost: maxCost ?? this.maxCost,
    );
  }
}

/// What a document ends its lines with.
enum DiffLineEnding {
  /// `\n`.
  lf,

  /// `\r\n`.
  crlf,

  /// A lone `\r`.
  cr,

  /// More than one of the above, in one document.
  mixed,

  /// No line ending at all — a single line, or nothing.
  none,
}

/// How a document is written, apart from the lines it holds.
///
/// None of this changes the comparison: every line ending ends a line, so a
/// file written on one platform and edited on another is not a file where every
/// line changed. What it does is let a view say what the comparison cannot —
/// that two documents with the same lines in them are not the same file.
@immutable
class DiffFormat {
  /// How one document is written.
  const DiffFormat({required this.ending, required this.finalNewline, required this.byteOrderMark});

  /// What its lines end with.
  final DiffLineEnding ending;

  /// Whether the last line carries an ending of its own.
  final bool finalNewline;

  /// Whether it begins with a byte order mark.
  final bool byteOrderMark;
}

/// A run of text, and what happened to it.
@immutable
class DiffSegment {
  /// One run of one side of a line.
  const DiffSegment(this.kind, this.text);

  /// What happened to it.
  final DiffEditKind kind;

  /// The run itself, as it was written.
  final String text;
}

/// What a pair of lines has in common, from each side, and how much of it.
///
/// A side each rather than one list between them, because with
/// [DiffOptions.ignoreCase] on, or whitespace being ignored, a run the engine
/// calls equal is two different strings — `Title` on one side and `title` on
/// the other. Joining a side back together gives the text that was passed in
/// for it.
@immutable
class DiffInlineResult {
  /// What one pair of lines has in common.
  const DiffInlineResult({required this.before, required this.after, required this.similarity});

  /// `before`, broken into equal and delete pieces.
  final List<DiffSegment> before;

  /// `after`, broken into equal and insert pieces.
  final List<DiffSegment> after;

  /// How alike the two are, from 0 for nothing in common to 1 for the same
  /// text.
  ///
  /// This is the share of the two lines the comparison could pair up, counted
  /// in characters, and it is what [DiffOptions.inlineThreshold] is measured
  /// against.
  final double similarity;
}

/// A run of tokens, and what happened to it.
@immutable
class DiffEdit {
  /// One run of the comparison of two sequences.
  const DiffEdit({
    required this.kind,
    required this.beforeStart,
    required this.beforeEnd,
    required this.afterStart,
    required this.afterEnd,
  });

  /// What happened to it.
  final DiffEditKind kind;

  /// Where the run starts in `before`. Empty for an insert.
  final int beforeStart;

  /// Where it ends in `before`, exclusive.
  final int beforeEnd;

  /// Where the run starts in `after`. Empty for a delete.
  final int afterStart;

  /// Where it ends in `after`, exclusive.
  final int afterEnd;
}

/// One line of one side of the comparison.
@immutable
class DiffLine {
  /// One line, and whatever was worked out about its inside.
  const DiffLine({required this.index, required this.text, this.segments = const <DiffSegment>[]});

  /// Which line of that side this is, counted from zero.
  final int index;

  /// The line as it was written, whitespace and case included.
  final String text;

  /// The line broken into the pieces that changed and the pieces that did not.
  ///
  /// Empty when there was nothing to compare it against, when
  /// [DiffOptions.inline] is [DiffInlineMode.none], or when the pair was too
  /// far apart to be worth marking — see [DiffOptions.inlineThreshold]. An
  /// empty list means the line is whatever its row says it is, all the way
  /// across.
  ///
  /// Only this side's own pieces are here: a line from `before` carries equal
  /// and delete and a line from `after` carries equal and insert, so joining
  /// the text back together gives [text].
  final List<DiffSegment> segments;
}

/// One row of the comparison, holding whichever side has a line on it.
///
/// A row with a line on one side only is a line that has no counterpart. The
/// viewer draws a blank opposite it, which is what keeps the two sides level;
/// anything else reading these rows can ignore the `null` instead.
@immutable
class DiffRow {
  /// One row of the comparison.
  const DiffRow({required this.kind, this.before, this.after});

  /// What happened over this row.
  final DiffRowKind kind;

  /// The line from `before`, or `null` for a blank.
  final DiffLine? before;

  /// The line from `after`, or `null` for a blank.
  final DiffLine? after;

  /// Whichever of the two sides this row asks for.
  DiffLine? side(DiffineSide which) {
    return which == DiffineSide.before ? before : after;
  }
}

/// A run of lines that changed together — one entry per change, which is what a
/// reader is counting when they ask how many changes there are.
///
/// Runs of unchanged lines are not on the list. They are the gaps between
/// these.
@immutable
class DiffChange {
  /// One change of the comparison.
  const DiffChange({
    required this.kind,
    required this.beforeStart,
    required this.beforeEnd,
    required this.afterStart,
    required this.afterEnd,
    required this.rowStart,
    required this.rowEnd,
  });

  /// What happened over it.
  final DiffChangeKind kind;

  /// The first `before` line it covers.
  final int beforeStart;

  /// One past the last `before` line it covers.
  final int beforeEnd;

  /// The first `after` line it covers.
  final int afterStart;

  /// One past the last `after` line it covers.
  final int afterEnd;

  /// Where it starts in [DiffResult.rows].
  final int rowStart;

  /// One past where it ends there.
  final int rowEnd;
}

/// How much of the two documents ended up where.
@immutable
class DiffStats {
  /// The four counts.
  const DiffStats({this.unchanged = 0, this.changed = 0, this.inserted = 0, this.deleted = 0});

  /// Lines that are the same on both sides.
  final int unchanged;

  /// Pairs of lines that sit opposite each other and differ.
  final int changed;

  /// Lines that are only in `after`.
  final int inserted;

  /// Lines that are only in `before`.
  final int deleted;

  /// The same counts with whichever of them is given added on.
  DiffStats plus({int unchanged = 0, int changed = 0, int inserted = 0, int deleted = 0}) {
    return DiffStats(
      unchanged: this.unchanged + unchanged,
      changed: this.changed + changed,
      inserted: this.inserted + inserted,
      deleted: this.deleted + deleted,
    );
  }
}

/// Everything the engine worked out about two documents.
@immutable
class DiffResult {
  /// One comparison.
  const DiffResult({
    required this.before,
    required this.after,
    required this.rows,
    required this.changes,
    required this.stats,
    required this.complete,
    this.format,
  });

  /// `before`, split into lines. Line endings are not part of these.
  final List<String> before;

  /// `after`, split into lines.
  final List<String> after;

  /// The comparison, one row at a time, from the top of both documents.
  final List<DiffRow> rows;

  /// The changes, in the order they appear.
  final List<DiffChange> changes;

  /// How much of the two documents ended up where.
  final DiffStats stats;

  /// Whether the engine found the smallest set of edits, or gave up somewhere
  /// and called a range replaced outright. See [DiffOptions.maxCost].
  final bool complete;

  /// How each document is written, which is what the rows cannot say.
  ///
  /// Two files with the same lines in them and different line endings compare
  /// as the same document, and they are not the same file. This is where that
  /// difference is, and the viewer writes it under the panes when the two
  /// disagree.
  ///
  /// Left out where nobody could know it: a comparison read back out of a patch
  /// never saw either file, and one an application built by hand is whatever it
  /// says it is.
  final DiffDocumentFormat? format;
}

/// How each of the two documents is written.
@immutable
class DiffDocumentFormat {
  /// The pair.
  const DiffDocumentFormat({required this.before, required this.after});

  /// The left document's own way of being written.
  final DiffFormat before;

  /// The right document's.
  final DiffFormat after;
}

/// How a comparison is written out as a patch.
@immutable
class DiffPatchOptions {
  /// Every option, with the defaults behind whatever is left out.
  const DiffPatchOptions({this.context = 3, this.before = 'before', this.after = 'after'});

  /// How many unchanged lines are kept either side of a change.
  ///
  /// This is what makes a patch smaller than the two documents it came from:
  /// the lines nobody touched are left out except for the few that say where
  /// each change sits. Three is what `diff` and `git` write, and what anything
  /// reading a patch expects to find.
  final int context;

  /// The name written on the `---` line.
  ///
  /// A patch that is going to be applied by `git apply` or `patch` needs the
  /// path of the file on both lines, which is why this is a name and not a
  /// label: it is read by a program before it is read by a person.
  final String before;

  /// The name written on the `+++` line.
  final String after;
}

/// One file of a patch, and the comparison its hunks describe.
///
/// A patch is not the two documents. It is the changed lines and a few either
/// side of each of them, so the comparison that comes back is the same shape as
/// one worked out from two documents and covers less: [DiffLine.index] is still
/// the line's own number in the file it came from, and [DiffResult.before]
/// holds only the lines the patch carried rather than the whole document. Where
/// one hunk ends and the next begins, the line numbers jump — which is what a
/// viewer draws as a gap.
@immutable
class DiffPatchFile {
  /// One file's worth of a patch.
  const DiffPatchFile({required this.before, required this.after, required this.result});

  /// The name on the `---` line, or `''` where the patch carried no header.
  final String before;

  /// The name on the `+++` line.
  final String after;

  /// What the hunks of this file say changed.
  final DiffResult result;
}

/* ---------------------------------------------------------------------------
 * The comparison, in two dimensions
 *
 * A picture has no lines in it, so none of the vocabulary above answers
 * anything about one. What follows is the same two halves written again for
 * pixels: what the engine found, and — further down, beside the rest of the
 * view — how it is drawn.
 * ------------------------------------------------------------------------- */

/// A picture as the engine reads it: four bytes a pixel, row by row from the
/// top-left corner.
///
/// The same shape `ui.Image.toByteData` hands back for
/// [ui.ImageByteFormat.rawRgba], on purpose. What a decode produces can be
/// passed straight in, and so can a buffer that never went near one. It is also
/// the whole of what [DiffImageOptions] is given alongside: turning a file into
/// pixels is decoding, and where that happens — an isolate, a build, a server —
/// is not the engine's business.
@immutable
class DiffPixels {
  /// One buffer of pixels.
  const DiffPixels({required this.data, required this.width, required this.height});

  /// Red, green, blue and alpha, a byte each, `width * height * 4` long.
  final Uint8List data;

  /// How many pixels across it is.
  final int width;

  /// How many down.
  final int height;
}

/// What happened to one pixel.
///
/// [added] and [removed] are the pixels only one of the two pictures covers,
/// which is what a difference in size, or a shift, leaves behind. Everything
/// inside both is [equal] or [changed].
enum DiffPixelKind {
  /// Both pictures cover it and agree.
  equal,

  /// Both cover it and disagree.
  changed,

  /// Only the second picture covers it.
  added,

  /// Only the first one covers it.
  removed,
}

/// Whether the two pictures are lined up before they are compared.
///
/// The offset that was used is on the result either way, and how far the search
/// goes is [DiffImageOptions.alignRadius].
enum DiffImageAlign {
  /// They are not. Both start at the top-left corner, and a picture moved a
  /// pixel to the right is a picture where every edge changed.
  none,

  /// A whole-pixel offset is looked for first, and the comparison is run with
  /// the two held that far apart. This is what makes a screenshot taken again,
  /// a scan fed in crooked, or a canvas cropped by a row of pixels comparable
  /// at all.
  shift,
}

/// How two pictures are compared.
@immutable
class DiffImageOptions {
  /// Every option, with the defaults behind whatever is left out.
  const DiffImageOptions({
    this.tolerance = 0.05,
    this.ignoreAntialiasing = true,
    this.align = DiffImageAlign.none,
    this.alignRadius = 16,
    this.blockSize = 16,
    this.maxRegions = 200,
  });

  /// How different two pixels have to be, from 0 to 1, before the difference
  /// counts.
  ///
  /// Zero is exact: a photograph saved twice by the same encoder will light up
  /// across most of its area, because it is not the same file twice. What is
  /// being allowed for here is that kind of noise, and the number is a distance
  /// between two colours where 1 is black against white.
  final double tolerance;

  /// Whether a pixel that only differs because an edge was drawn smooth is left
  /// out.
  ///
  /// Text and diagonals are drawn by putting part of a colour into the pixels
  /// either side of where the line really falls, and the part each one gets is
  /// decided by the renderer — so the same screen drawn on two devices differs
  /// along every letter and every curve while showing the same thing. On, a
  /// differing pixel is dropped when the *same edge* runs through it in both
  /// pictures and the change is no larger than the weaker of the two steps: an
  /// edge is a step with something level within a pixel of it, and the pixel
  /// has to be a blend of what surrounds it rather than a colour of its own in
  /// at least one of the two.
  ///
  /// Both pictures, and the weaker step, because that is what tells an edge
  /// drawn twice from an edge that arrived. A patch pasted over a flat part of
  /// a photograph brings an edge with it that the other picture has nothing to
  /// answer with, and the level test keeps a texture — where nearly every pixel
  /// lies between its neighbours and the range is most of the scale — from
  /// counting as an edge at all.
  ///
  /// It is not free: the pixels that differ are each read again with the pixels
  /// around them. It costs nothing on two pictures that are alike and a good
  /// deal on two that are not.
  final bool ignoreAntialiasing;

  /// Whether an offset between the two pictures is looked for first.
  final DiffImageAlign align;

  /// How far the search for that offset goes, in pixels of the larger picture.
  ///
  /// It is a radius, so `16` covers everything from sixteen pixels left to
  /// sixteen right and the same up and down. Widening it costs time and, past a
  /// point, honesty: a search wide enough to slide one picture across another
  /// will eventually find a corner that matches by accident.
  final int alignRadius;

  /// How coarse the grid is that changed pixels are grouped on, in pixels.
  ///
  /// The mask says which pixels changed and [DiffImageResult.regions] says
  /// where the changes are, and this is the difference between the two: pixels
  /// are counted into squares this big, and the squares that touch each other
  /// become one region. Small squares split one change into several, large ones
  /// gather changes that have nothing to do with each other.
  final int blockSize;

  /// The most regions the engine will return.
  ///
  /// Two photographs of the same scene differ nearly everywhere, and a list of
  /// forty thousand rectangles is not a list anybody steps through. Past this,
  /// the largest are kept, the rest are left on the mask where they still show,
  /// and [DiffImageResult.complete] is `false`.
  final int maxRegions;
}

/// A rectangle, in the frame's own pixels.
@immutable
class DiffImageArea {
  /// One rectangle.
  const DiffImageArea({
    required this.x,
    required this.y,
    required this.width,
    required this.height,
  });

  /// Its left edge.
  final int x;

  /// Its top edge.
  final int y;

  /// How wide it is.
  final int width;

  /// How tall it is.
  final int height;
}

/// A part of the frame where something changed, as the smallest rectangle that
/// holds it.
///
/// These are what a reader steps through, which is why they are rectangles
/// rather than the outline of what actually changed: a box can be scrolled to,
/// drawn around and counted, and the mask underneath is still there for
/// anything that wants the exact shape.
@immutable
class DiffImageRegion extends DiffImageArea {
  /// One change of a picture comparison.
  const DiffImageRegion({
    required super.x,
    required super.y,
    required super.width,
    required super.height,
    required this.pixels,
  });

  /// How many pixels inside it are not equal.
  final int pixels;
}

/// How much of the frame ended up where.
@immutable
class DiffImageStats {
  /// The counts, the share they come to, and how far apart the pixels are.
  const DiffImageStats({
    required this.pixels,
    required this.covered,
    required this.unchanged,
    required this.changed,
    required this.added,
    required this.removed,
    required this.ratio,
    required this.distance,
  });

  /// How many pixels the frame holds.
  final int pixels;

  /// How many of those at least one of the two pictures reaches, which is what
  /// the rest are counted out of.
  ///
  /// The same as [pixels] for two pictures laid corner to corner with nothing
  /// between them. Two pictures one of which is wider and the other taller, or
  /// two held apart by an offset, leave a corner of the frame neither of them
  /// covers, and those pixels are nothing at all rather than pixels that agree.
  final int covered;

  /// Pixels both pictures cover and agree about.
  final int unchanged;

  /// Pixels both pictures cover and disagree about.
  final int changed;

  /// Pixels only the second picture covers.
  final int added;

  /// Pixels only the first one covers.
  final int removed;

  /// Everything that is not unchanged, as a share of [covered], from 0 to 1.
  ///
  /// The four counts add up to [covered], so `1 - ratio` is how much of the two
  /// pictures came out the same. [DiffImageSimilarity] is that number with the
  /// rest of what goes with it.
  final double ratio;

  /// How far apart two pixels are on average, over the pixels both pictures
  /// cover, from 0 to 1.
  ///
  /// The other half of the answer [ratio] gives. A picture saved again by a
  /// worse encoder and a picture with half of it painted over can differ in the
  /// same number of pixels, and they do not differ by the same amount — this is
  /// the amount, on the same scale the tolerance is measured on. Everything is
  /// in it, including the pixels the tolerance and the smoothing test let
  /// through.
  final double distance;
}

/// How alike two pictures are, as one number and the counts behind it.
///
/// What [DiffImageResult] answers is "where did these two differ", and a build
/// that keeps a threshold, a report that ranks a hundred screenshots and a
/// badge on a screen are all asking the shorter question instead. This is the
/// shorter question: see `imageSimilarity`.
@immutable
class DiffImageSimilarity {
  /// The share and the counts behind it.
  const DiffImageSimilarity({
    required this.similarity,
    required this.identical,
    required this.pixels,
    required this.matched,
    required this.changed,
    required this.added,
    required this.removed,
    required this.distance,
    required this.before,
    required this.after,
  });

  /// How alike the two are, from 0 for nothing in common to 1 for the same
  /// picture, as a share of the pixels at least one of them covers.
  ///
  /// Times a hundred is the percentage. A pixel only one picture covers counts
  /// against it, so two pictures of different sizes cannot reach 1.
  final double similarity;

  /// Whether not one pixel of either came out different.
  final bool identical;

  /// How many pixels at least one of the two covers.
  final int pixels;

  /// How many of those came out the same.
  final int matched;

  /// How many both cover and disagree about.
  final int changed;

  /// How many only the second covers.
  final int added;

  /// How many only the first covers.
  final int removed;

  /// How far apart two pixels are on average, over the pixels both cover, from
  /// 0 to 1.
  ///
  /// [similarity] counts pixels and this measures them, which are two different
  /// questions about the same pair. A photograph saved again is unalike in most
  /// of its pixels and barely apart in any of them.
  final double distance;

  /// How large the first picture was, because a share means less when the two
  /// differ.
  final DiffImageSize before;

  /// How large the second one was.
  final DiffImageSize after;
}

/// How large a picture is, in pixels.
@immutable
class DiffImageSize {
  /// One size.
  const DiffImageSize({required this.width, required this.height});

  /// How many pixels across.
  final int width;

  /// How many down.
  final int height;

  @override
  bool operator ==(Object other) =>
      other is DiffImageSize && other.width == width && other.height == height;

  @override
  int get hashCode => Object.hash(width, height);

  @override
  String toString() => '$width × $height';
}

/// What each kind of pixel is painted in, when the mask is turned into a
/// picture of its own.
///
/// Anything left out keeps its default.
@immutable
class DiffImagePaint {
  /// Whichever of the four colours are being replaced.
  const DiffImagePaint({this.changed, this.added, this.removed, this.unchanged});

  /// A pixel both pictures cover and disagree about.
  final ui.Color? changed;

  /// A pixel only the second picture covers.
  final ui.Color? added;

  /// A pixel only the first one covers.
  final ui.Color? removed;

  /// Everything else, which is see-through unless it is asked to be something.
  final ui.Color? unchanged;
}

/// How far the second picture sits from the first, in pixels.
@immutable
class DiffImageOffset {
  /// One offset.
  const DiffImageOffset(this.x, this.y);

  /// Nothing moved.
  static const DiffImageOffset zero = DiffImageOffset(0, 0);

  /// How far across.
  final int x;

  /// How far down.
  final int y;
}

/// Everything the engine worked out about two pictures.
@immutable
class DiffImageResult {
  /// One picture comparison.
  const DiffImageResult({
    required this.width,
    required this.height,
    required this.before,
    required this.after,
    required this.offset,
    required this.mask,
    required this.regions,
    required this.stats,
    required this.complete,
  });

  /// How wide the frame both pictures were compared in is.
  ///
  /// As large as it has to be to hold both of them once the offset is applied,
  /// so two pictures of the same size compared without one give a frame of
  /// exactly that size, and everything else gives a frame with a margin where
  /// only one of the two reaches.
  final int width;

  /// How tall that frame is.
  final int height;

  /// Where the first picture sits in it.
  final DiffImageArea before;

  /// Where the second one sits.
  final DiffImageArea after;

  /// How far the second picture was moved to line the two up, in pixels —
  /// [DiffImageOffset.zero] unless [DiffImageOptions.align] asked for a search.
  ///
  /// It is where the move went rather than where the contents were: a picture
  /// drawn a pixel further to the right than the first is moved a pixel to the
  /// left, and `x` is `-1`.
  final DiffImageOffset offset;

  /// What happened to each pixel of the frame, one byte each, row by row.
  ///
  /// The byte is the index of a [DiffPixelKind], so `0` is a pixel that did not
  /// change and anything else is a pixel that did. A byte a pixel rather than a
  /// picture, because what it is drawn in — a colour, a stipple, an outline,
  /// nothing at all — is the view's decision and not this one's.
  final Uint8List mask;

  /// Where the changes are, in reading order.
  final List<DiffImageRegion> regions;

  /// How much of the frame ended up where.
  final DiffImageStats stats;

  /// Whether the list of regions holds all of them. See
  /// [DiffImageOptions.maxRegions].
  final bool complete;
}

/* ---------------------------------------------------------------------------
 * The view
 *
 * Everything above is the comparison. What follows is how it is shown, and it
 * is here rather than beside the widget for the same reason: an application
 * that keeps the view's settings in its own state has to be able to name their
 * types without importing a widget to reach them.
 * ------------------------------------------------------------------------- */

/// Which of the two documents a line belongs to.
enum DiffineSide {
  /// The left document.
  before,

  /// The right one.
  after,
}

/// Whether the two documents are read or written.
///
/// One widget draws both, because they were never two things: the same
/// comparison, the same rows, the same colours, the same way through the
/// changes. An editor is that with a field over each pane, so the comparison is
/// worked out again as somebody types into it.
enum DiffineMode {
  /// Read.
  viewer,

  /// Read and written.
  editor,
}

/// How the two documents are laid out.
///
/// A unified column is not a thing to type into, so an editor is always split.
enum DiffineView {
  /// One document either side, held level with each other.
  split,

  /// One column, with what went out above what came in.
  unified,
}

/// The typeface the two documents are drawn in.
///
/// Anything left out keeps the theme's own value, so
/// `DiffineFont(size: 15)` is a whole answer.
///
/// [lineHeight] is a length in logical pixels rather than a bare multiplier. A
/// row is that tall whether or not it has a line in it, the editor's field is
/// laid over rows that are, and the rows a long comparison does not draw are
/// stood in for by exactly that much height — none of which a number with no
/// unit can answer.
@immutable
class DiffineFont {
  /// Whichever of the four values are being replaced.
  const DiffineFont({
    this.family,
    this.familyFallback,
    this.size,
    this.lineHeight,
    this.letterSpacing,
  });

  /// The family. Monospace, or the columns will not line up.
  final String? family;

  /// What to fall back to where the family has no glyph.
  final List<String>? familyFallback;

  /// How big it is, in logical pixels.
  final double? size;

  /// How tall one unwrapped line is, in logical pixels. A length, not a
  /// multiplier.
  final double? lineHeight;

  /// How far apart the letters are.
  final double? letterSpacing;
}

/// Which palette the viewer draws in.
enum DiffineColorScheme {
  /// Follows the surrounding [MediaQuery], which is what a widget dropped into
  /// somebody else's screen should do unless that screen says otherwise.
  system,

  /// The light palette, whatever the screen around it is in.
  light,

  /// The dark one.
  dark,
}

/// The languages the viewer's own words are written in.
enum DiffineLocale {
  /// English.
  en,

  /// Korean.
  ko,
}

/// A language the documents themselves can be coloured as, and what to call it.
///
/// The whole list is [kDiffineLanguages], which is what the editor's menu is
/// built from and what an application building a menu of its own should build
/// from. The names are English: `TypeScript` is `TypeScript` in every locale.
@immutable
class DiffineLanguageOption {
  /// One entry of the menu.
  const DiffineLanguageOption(this.id, this.name);

  /// What to pass as `language` — a Diffine grammar identifier, or `plain`.
  final String id;

  /// Its full name, as the bar above the panes writes it.
  final String name;
}

/// What kind of thing one run of a line is, for a highlighter that wants the
/// theme's colours rather than its own.
///
/// Eight rather than one per keyword a grammar knows, because eight is what an
/// application overriding the palette has to think about. A run that carries a
/// [DiffineToken.style] of its own ignores these entirely.
enum DiffineTokenKind {
  /// A keyword, a literal, an operator that is a word.
  keyword,

  /// A string, a character, a regular expression.
  string,

  /// A comment of any shape.
  comment,

  /// A number.
  number,

  /// The name of something being declared, and a tag's name.
  title,

  /// A type, a built-in, a class.
  type,

  /// A variable, an attribute, a property.
  variable,

  /// Everything that is about the file rather than in it: a directive, a
  /// preprocessor line, punctuation.
  meta,
}

/// A run of one line, as the application wants it coloured.
///
/// This is how a syntax highlighter reaches the viewer. The application is
/// given the whole line and hands back the runs it wants drawn differently,
/// which is the only order that works: a grammar cannot be applied to a
/// fragment of a line and come out right, and the fragments are what the
/// comparison produces. The viewer cuts the line at the boundaries of both and
/// draws each piece with whatever the two say about it.
///
/// [length] counts UTF-16 code units, which is what `String.substring` counts,
/// so the runs a tokeniser already returns can be used as they are.
@immutable
class DiffineToken {
  /// One run of a line.
  const DiffineToken({required this.length, this.kind, this.style});

  /// How many characters of the line this run covers.
  final int length;

  /// What kind of thing it is, which the theme turns into a colour.
  final DiffineTokenKind? kind;

  /// What to draw it in instead, for a highlighter with its own palette.
  final TextStyle? style;
}

/// How a line is coloured beyond what the comparison says about it.
///
/// Called for each line the viewer draws, so with the rows virtualised it is
/// called for what is on the screen rather than for the whole document. Return
/// `null` to leave a line as it is.
///
/// Passing this replaces whatever `language` was doing rather than adding to
/// it. A line has one set of runs, and two highlighters cutting it at once is
/// not a thing that has an answer.
typedef DiffineHighlight = List<DiffineToken>? Function(DiffLine line, DiffineSide side);

/// Something of the application's own, drawn beside or under one line.
///
/// This is where everything a comparison does not know about goes: a review
/// comment, a coverage bar, a blame, a lint warning, a button for adding any of
/// them. The line is handed over whole, along with the side it is on, and what
/// comes back is drawn as it is — return `null` for a line that gets nothing,
/// which is most of them.
///
/// It is called for each line a pane draws, so with the rows virtualised it is
/// called for what is on the screen. A line with nothing opposite it — the
/// blank that holds the two sides level — is not a line, and nothing is asked
/// about it.
typedef DiffineRender = Widget? Function(DiffLine line, DiffineSide side);

/// How the two pictures are laid out.
///
/// The first is what a reader compares two pictures with. The other three are
/// what they reach for once they have found the part that differs, and the
/// reason all four are here rather than one is that no single one of them
/// answers "did this move, or did it change colour" — a wipe does, an overlay
/// does not, and the mask says where to point them.
enum DiffineImageView {
  /// One either side, both moving together under one zoom.
  split,

  /// One on top of the other, with a slider that fades between them.
  overlay,

  /// One on top of the other, with a handle that draws the line where the first
  /// stops and the second starts.
  wipe,

  /// Neither of them: what changed, on its own, over a flat ground.
  mask,
}

/// What is done with the parts of a picture nothing happened to.
///
/// It is not [DiffineImageView], because it is a different question and holds
/// across all four of those: a wipe of two pictures whose unchanged half is
/// dimmed is a sensible thing to ask for.
enum DiffineImageUnchanged {
  /// Nothing. Both pictures are drawn as they are, with the changed pixels
  /// tinted over them.
  keep,

  /// They are drawn faint and what changed is drawn as it is, so the change is
  /// what the eye lands on and the rest of the picture is still there to say
  /// where in it the change was.
  dim,

  /// They are not drawn at all. What changed is drawn on a plain ground, which
  /// is the view for reading a change as a picture rather than as a mark on
  /// one.
  hide,
}

/// What the wheel does over a picture comparison.
///
/// Both are the right answer to different screens. A comparison that is the
/// screen wants the first; one sitting in the middle of an article wants the
/// second.
enum DiffineImageWheel {
  /// It zooms about the pointer, a notch at a time, which is what a picture
  /// viewer does. Shift with it moves the picture instead, and the screen a
  /// comparison is on does not scroll while the pointer is over it.
  zoom,

  /// It moves a picture larger than its pane and lets the screen scroll when
  /// the whole frame is already in view, so a reader scrolling past a
  /// comparison scrolls past it. The modifier zooms.
  pan,
}

/// A picture, as an application hands one over.
///
/// There is no URL among the three, and that is deliberate rather than missing.
/// A picture fetched by the widget would be a picture the application never saw
/// — read from wherever the string pointed, decoded from bytes nobody checked.
/// Fetching it is the application's to do, and what arrives here is what it
/// already holds.
@immutable
sealed class DiffineImageContent {
  /// The base of the three shapes a picture arrives in.
  const DiffineImageContent();
}

/// A picture as the bytes of a file — what a file picker, an asset or a
/// response hands back.
@immutable
final class DiffineEncodedImage extends DiffineImageContent {
  /// One encoded picture.
  const DiffineEncodedImage(this.bytes);

  /// The file, as it was read.
  final Uint8List bytes;

  @override
  bool operator ==(Object other) {
    return other is DiffineEncodedImage && identical(other.bytes, bytes);
  }

  @override
  int get hashCode => identityHashCode(bytes);
}

/// A picture that has already been decoded.
@immutable
final class DiffineDecodedImage extends DiffineImageContent {
  /// One decoded picture.
  const DiffineDecodedImage(this.image);

  /// The picture itself. It stays the application's to dispose of.
  final ui.Image image;

  @override
  bool operator ==(Object other) {
    return other is DiffineDecodedImage && identical(other.image, image);
  }

  @override
  int get hashCode => identityHashCode(image);
}

/// A buffer of pixels from anywhere at all.
@immutable
final class DiffinePixelImage extends DiffineImageContent {
  /// One buffer of pixels.
  const DiffinePixelImage(this.pixels);

  /// Four bytes a pixel, row by row.
  final DiffPixels pixels;

  @override
  bool operator ==(Object other) {
    return other is DiffinePixelImage && identical(other.pixels, pixels);
  }

  @override
  int get hashCode => identityHashCode(pixels);
}

/// How far into a picture a reader is, and where.
///
/// [scale] is what a pixel of the frame is drawn as: `1` is the picture at its
/// own size, `4` is four screen pixels a pixel, and below `1` the frame has
/// been shrunk to fit. [x] and [y] are the point of the frame the middle of the
/// pane is looking at, in the frame's own pixels — a centre rather than a
/// corner, because that is what stays still when a reader zooms.
@immutable
class DiffineImageViewport {
  /// One view of a picture.
  const DiffineImageViewport({required this.scale, required this.x, required this.y});

  /// How far in the view is.
  final double scale;

  /// What the middle of the pane is looking at, across.
  final double x;

  /// And down.
  final double y;

  @override
  bool operator ==(Object other) {
    return other is DiffineImageViewport && other.scale == scale && other.x == x && other.y == y;
  }

  @override
  int get hashCode => Object.hash(scale, x, y);
}

/// Every word the viewer puts on the screen.
///
/// Some of these are read by a screen reader rather than shown, which is why
/// they are sentences rather than labels.
@immutable
class DiffineStrings {
  /// Every word, each of which has to be given.
  const DiffineStrings({
    required this.before,
    required this.after,
    required this.empty,
    required this.placeholder,
    required this.identical,
    required this.added,
    required this.removed,
    required this.changed,
    required this.folded,
    required this.expand,
    required this.applyChange,
    required this.format,
    required this.mixedEndings,
    required this.noFinalNewline,
    required this.language,
    required this.summary,
    required this.documentSize,
    required this.previousChange,
    required this.nextChange,
    required this.changePosition,
    required this.search,
    required this.searchIn,
    required this.searchPrevious,
    required this.searchNext,
    required this.searchClose,
    required this.searchPosition,
    required this.searchEmpty,
    required this.matchCase,
    required this.wholeWord,
    required this.regex,
    required this.replace,
    required this.replaceWith,
    required this.replaceAll,
    required this.imageSize,
    required this.imageSummary,
    required this.choose,
    required this.chooseIn,
    required this.unsupported,
    required this.loading,
    required this.zoomOut,
    required this.zoomIn,
    required this.zoomFit,
    required this.zoomLevel,
    required this.fade,
    required this.wipe,
    required this.at,
    required this.loupeMove,
    required this.loupeSize,
  });

  /// The header over the left side, and its region's name.
  final String before;

  /// The header over the right side.
  final String after;

  /// What is said when there is nothing on either side yet.
  final String empty;

  /// What an empty field says before anybody has typed into it.
  final String placeholder;

  /// What is said when the two documents turned out to be the same.
  final String identical;

  /// What a screen reader hears in front of a line that is only in `after`.
  final String added;

  /// What it hears in front of a line that is only in `before`.
  final String removed;

  /// What it hears in front of a line that has a different counterpart.
  final String changed;

  /// What a band standing in for lines nobody is reading says: `{lines}`.
  final String folded;

  /// The name of the button that opens one of those bands: `{lines}`.
  final String expand;

  /// The name of the button that writes one change into the other side:
  /// `{label}`.
  final String applyChange;

  /// How the two documents are written, where that differs: `{before}` and
  /// `{after}`.
  final String format;

  /// What a document with more than one kind of line ending in it is called.
  final String mixedEndings;

  /// What is said of a document whose last line carries no ending of its own.
  final String noFinalNewline;

  /// What the editor's menu of languages is called to a screen reader.
  final String language;

  /// How the counts are read out: `{changes}`, `{inserted}` and `{deleted}`.
  final String summary;

  /// How one side's size is read out, under the pane it belongs to: `{label}`
  /// is what that side is called, `{characters}` and `{size}` are already
  /// written in the reader's own language.
  final String documentSize;

  /// The name of the button that moves back a change.
  final String previousChange;

  /// The name of the button that moves on a change.
  final String nextChange;

  /// Which change is being looked at: `{position}` of `{total}`.
  final String changePosition;

  /// The name of the button that opens the search bar, and of its field.
  final String search;

  /// Which side is being searched, for the button above each pane: `{label}`.
  final String searchIn;

  /// The name of the button that moves back a match.
  final String searchPrevious;

  /// The name of the button that moves on a match.
  final String searchNext;

  /// The name of the button that closes the search bar.
  final String searchClose;

  /// Which match is being looked at: `{position}` of `{total}`.
  final String searchPosition;

  /// What is said when the query found nothing.
  final String searchEmpty;

  /// The name of the switch for telling `Title` from `title`.
  final String matchCase;

  /// The name of the switch for matching whole words only.
  final String wholeWord;

  /// The name of the switch for reading the query as a regular expression.
  final String regex;

  /// The name of the button that writes over the match being looked at.
  final String replace;

  /// What the field holding the text to write instead is called.
  final String replaceWith;

  /// The name of the button that writes over every match.
  final String replaceAll;

  /// How one picture is written under the pane it belongs to: `{label}`,
  /// `{width}`, `{height}` and `{size}`.
  final String imageSize;

  /// How the counts are read out: `{regions}` areas over `{percent}` of the
  /// frame.
  final String imageSummary;

  /// What an empty pane invites, and what its button is called.
  final String choose;

  /// What the button in the bar above one pane is called: `{label}`.
  final String chooseIn;

  /// What is said when a file that is not a picture is chosen for a pane.
  final String unsupported;

  /// What is said while a picture is being decoded.
  final String loading;

  /// The name of the button that draws the picture smaller.
  final String zoomOut;

  /// The name of the button that draws it larger.
  final String zoomIn;

  /// The name of the button that fits the whole frame in the pane.
  final String zoomFit;

  /// How far in the view is, as a percentage: `{percent}`.
  final String zoomLevel;

  /// The name of the slider that fades the second picture over the first.
  final String fade;

  /// The name of the handle that wipes one picture across the other.
  final String wipe;

  /// What goes before the coordinates under the magnified pixels.
  final String at;

  /// The name of the handle that moves the magnified pixels somewhere else.
  final String loupeMove;

  /// The name of the corner that shows more of them at once.
  final String loupeSize;

  /// The same words with whichever of them are given replaced.
  DiffineStrings copyWith({
    String? before,
    String? after,
    String? empty,
    String? placeholder,
    String? identical,
    String? added,
    String? removed,
    String? changed,
    String? folded,
    String? expand,
    String? applyChange,
    String? format,
    String? mixedEndings,
    String? noFinalNewline,
    String? language,
    String? summary,
    String? documentSize,
    String? previousChange,
    String? nextChange,
    String? changePosition,
    String? search,
    String? searchIn,
    String? searchPrevious,
    String? searchNext,
    String? searchClose,
    String? searchPosition,
    String? searchEmpty,
    String? matchCase,
    String? wholeWord,
    String? regex,
    String? replace,
    String? replaceWith,
    String? replaceAll,
    String? imageSize,
    String? imageSummary,
    String? choose,
    String? chooseIn,
    String? unsupported,
    String? loading,
    String? zoomOut,
    String? zoomIn,
    String? zoomFit,
    String? zoomLevel,
    String? fade,
    String? wipe,
    String? at,
    String? loupeMove,
    String? loupeSize,
  }) {
    return DiffineStrings(
      before: before ?? this.before,
      after: after ?? this.after,
      empty: empty ?? this.empty,
      placeholder: placeholder ?? this.placeholder,
      identical: identical ?? this.identical,
      added: added ?? this.added,
      removed: removed ?? this.removed,
      changed: changed ?? this.changed,
      folded: folded ?? this.folded,
      expand: expand ?? this.expand,
      applyChange: applyChange ?? this.applyChange,
      format: format ?? this.format,
      mixedEndings: mixedEndings ?? this.mixedEndings,
      noFinalNewline: noFinalNewline ?? this.noFinalNewline,
      language: language ?? this.language,
      summary: summary ?? this.summary,
      documentSize: documentSize ?? this.documentSize,
      previousChange: previousChange ?? this.previousChange,
      nextChange: nextChange ?? this.nextChange,
      changePosition: changePosition ?? this.changePosition,
      search: search ?? this.search,
      searchIn: searchIn ?? this.searchIn,
      searchPrevious: searchPrevious ?? this.searchPrevious,
      searchNext: searchNext ?? this.searchNext,
      searchClose: searchClose ?? this.searchClose,
      searchPosition: searchPosition ?? this.searchPosition,
      searchEmpty: searchEmpty ?? this.searchEmpty,
      matchCase: matchCase ?? this.matchCase,
      wholeWord: wholeWord ?? this.wholeWord,
      regex: regex ?? this.regex,
      replace: replace ?? this.replace,
      replaceWith: replaceWith ?? this.replaceWith,
      replaceAll: replaceAll ?? this.replaceAll,
      imageSize: imageSize ?? this.imageSize,
      imageSummary: imageSummary ?? this.imageSummary,
      choose: choose ?? this.choose,
      chooseIn: chooseIn ?? this.chooseIn,
      unsupported: unsupported ?? this.unsupported,
      loading: loading ?? this.loading,
      zoomOut: zoomOut ?? this.zoomOut,
      zoomIn: zoomIn ?? this.zoomIn,
      zoomFit: zoomFit ?? this.zoomFit,
      zoomLevel: zoomLevel ?? this.zoomLevel,
      fade: fade ?? this.fade,
      wipe: wipe ?? this.wipe,
      at: at ?? this.at,
      loupeMove: loupeMove ?? this.loupeMove,
      loupeSize: loupeSize ?? this.loupeSize,
    );
  }
}
