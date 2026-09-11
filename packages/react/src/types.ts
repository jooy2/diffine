import type * as React from 'react';

/**
 * The vocabulary every part of Diffine is written in.
 *
 * These are the types that more than one module needs, which is why they sit
 * here rather than beside whichever module introduced them — and why they are
 * also exported from `diffine-react/types`, so an application can name one in
 * its own props without importing the engine or the component to get at it.
 *
 * The first half is the comparison and the second is the view of it. Only the
 * props of a component live anywhere else, beside the component that takes
 * them.
 */

/** What happened to one piece of a comparison. */
export type DiffEditKind = 'equal' | 'insert' | 'delete';

/**
 * What happened to a run of lines.
 *
 * `replace` is the one worth a word: it is a run where lines went away *and*
 * lines arrived, which is what a person means by "this was edited". Keeping it
 * apart from a bare `insert` next to a bare `delete` is what lets the two sides
 * be laid out level with each other, and what lets the words inside the pair be
 * compared rather than the whole line being called new.
 */
export type DiffChangeKind = 'insert' | 'delete' | 'replace';

/** What one row of the comparison is. */
export type DiffRowKind = 'equal' | DiffChangeKind;

/**
 * What is compared inside a pair of lines that were edited rather than
 * replaced outright.
 *
 * - `none` — nothing. A changed line is changed, and that is all the row says.
 * - `word` — runs of letters and digits, runs of whitespace, and every other
 *   character on its own. This is what a reader usually wants: it marks the
 *   word that moved rather than the three letters it has in common with the
 *   word that was there before.
 * - `character` — one grapheme at a time, so a changed digit in the middle of a
 *   number is a changed digit rather than a changed number.
 */
export type DiffInlineMode = 'none' | 'word' | 'character';

/**
 * How much of the whitespace counts when two lines are compared.
 *
 * - `exact` — all of it.
 * - `trailing` — whitespace at the end of a line is ignored.
 * - `surrounding` — whitespace at either end is ignored, so a line that was
 *   only indented further is unchanged.
 * - `amount` — as `surrounding`, and a run of whitespace inside the line counts
 *   as one space however long it is.
 * - `all` — whitespace is dropped before the comparison.
 *
 * Whatever is ignored is still drawn. This changes which lines are called equal,
 * never what the viewer shows.
 */
export type DiffWhitespace = 'exact' | 'trailing' | 'surrounding' | 'amount' | 'all';

/** How two documents are compared. */
export interface DiffOptions {
  /**
   * What is compared inside a pair of lines that were edited.
   * @default 'word'
   */
  inline?: DiffInlineMode;

  /**
   * How much of the whitespace counts.
   * @default 'exact'
   */
  whitespace?: DiffWhitespace;

  /**
   * Whether `Title` and `title` are the same line.
   * @default false
   */
  ignoreCase?: boolean;

  /**
   * How alike a pair of lines has to be, from 0 to 1, before the words inside
   * them are worth marking.
   *
   * Two lines that were edited share most of their words; two lines that merely
   * landed opposite each other share a comma and a couple of vowels, and marking
   * those is worse than marking nothing — the row ends up striped with scraps
   * that mean nothing to a reader. Below this, the pair is drawn as one changed
   * line on each side.
   *
   * At `0` every pair is marked, and at `1` only an identical pair is.
   *
   * @default 0.3
   */
  inlineThreshold?: number;

  /**
   * Patterns whose matches do not count when two lines are compared.
   *
   * A snapshot with a timestamp in it, a log with a request id, a build with a
   * hash in its filename: one line that is different every time, and a
   * comparison that says the whole file changed. Each pattern is looked for in
   * both lines and what it finds is set aside, so two lines that differ only
   * inside a match are the same line.
   *
   * ```ts
   * diffText(saved, rendered, { ignore: [/\d{4}-\d{2}-\d{2}T[\d:.]+Z/] });
   * ```
   *
   * What is set aside is still drawn, exactly as with
   * {@link DiffOptions.whitespace}: this decides which lines are called equal
   * and never what the viewer shows. It decides that at the level of a line —
   * inside a pair that was edited, the words are compared as they were written,
   * because a pattern written for a line is not a pattern about one word of it.
   *
   * A match is set aside rather than removed, so a line with a timestamp in it
   * and a line with the timestamp missing are still two different lines.
   *
   * @default []
   */
  ignore?: readonly RegExp[];

  /**
   * The largest difference the engine will work through before it gives up.
   *
   * Finding the smallest set of edits costs roughly the size of the two
   * documents multiplied by the number of edits between them, so two large
   * documents with nothing in common are the expensive case — and the answer
   * for that case is "all of it changed", which is not worth waiting for. Past
   * this, the range being compared comes back as one wholesale replacement and
   * {@link DiffResult.complete} is `false`.
   *
   * @default 5000
   */
  maxCost?: number;
}

/**
 * What a document ends its lines with.
 *
 * `mixed` is a document with more than one of them in it, and `none` is one
 * with no line ending at all — a single line, or nothing.
 */
export type DiffLineEnding = 'lf' | 'crlf' | 'cr' | 'mixed' | 'none';

/**
 * How a document is written, apart from the lines it holds.
 *
 * None of this changes the comparison: every line ending ends a line, so a file
 * written on one platform and edited on another is not a file where every line
 * changed. What it does is let a view say what the comparison cannot — that two
 * documents with the same lines in them are not the same file.
 */
export interface DiffFormat {
  /** What its lines end with. */
  ending: DiffLineEnding;
  /** Whether the last line carries an ending of its own. */
  finalNewline: boolean;
  /** Whether it begins with a byte order mark. */
  byteOrderMark: boolean;
}

/** A run of text, and what happened to it. */
export interface DiffSegment {
  kind: DiffEditKind;
  text: string;
}

/**
 * What a pair of lines has in common, from each side, and how much of it.
 *
 * A side each rather than one list between them, because with `ignoreCase` on,
 * or whitespace being ignored, a run the engine calls equal is two different
 * strings — `Title` on one side and `title` on the other. Joining a side back
 * together gives the text that was passed in for it.
 */
export interface DiffInlineResult {
  /** `before`, broken into `equal` and `delete` pieces. */
  before: readonly DiffSegment[];
  /** `after`, broken into `equal` and `insert` pieces. */
  after: readonly DiffSegment[];
  /**
   * How alike the two are, from 0 for nothing in common to 1 for the same text.
   *
   * This is the share of the two lines the comparison could pair up, counted in
   * characters, and it is what {@link DiffOptions.inlineThreshold} is measured
   * against.
   */
  similarity: number;
}

/** A run of tokens, and what happened to it. */
export interface DiffEdit {
  kind: DiffEditKind;
  /** Where the run sits in `before`, as a half-open interval. Empty for an insert. */
  beforeStart: number;
  beforeEnd: number;
  /** Where the run sits in `after`, as a half-open interval. Empty for a delete. */
  afterStart: number;
  afterEnd: number;
}

/** One line of one side of the comparison. */
export interface DiffLine {
  /** Which line of that side this is, counted from zero. */
  index: number;
  /** The line as it was written, whitespace and case included. */
  text: string;
  /**
   * The line broken into the pieces that changed and the pieces that did not.
   *
   * Empty when there was nothing to compare it against, when `inline` is
   * `none`, or when the pair was too far apart to be worth marking — see
   * {@link DiffOptions.inlineThreshold}. An empty list means the line is
   * whatever its row says it is, all the way across.
   *
   * Only this side's own pieces are here: a line from `before` carries `equal`
   * and `delete` and a line from `after` carries `equal` and `insert`, so
   * joining the text back together gives {@link DiffLine.text}.
   */
  segments: readonly DiffSegment[];
}

/**
 * One row of the comparison, holding whichever side has a line on it.
 *
 * A row with a line on one side only is a line that has no counterpart. The
 * viewer draws a blank opposite it, which is what keeps the two sides level;
 * anything else reading these rows can ignore the `null` instead.
 */
export interface DiffRow {
  kind: DiffRowKind;
  before: DiffLine | null;
  after: DiffLine | null;
}

/**
 * A run of lines that changed together — one entry per change, which is what a
 * reader is counting when they ask how many changes there are.
 *
 * Runs of unchanged lines are not on the list. They are the gaps between these.
 */
export interface DiffChange {
  kind: DiffChangeKind;
  /** The `before` lines this change covers, as a half-open interval. */
  beforeStart: number;
  beforeEnd: number;
  /** The `after` lines this change covers, as a half-open interval. */
  afterStart: number;
  afterEnd: number;
  /** The rows this change occupies in {@link DiffResult.rows}, as a half-open interval. */
  rowStart: number;
  rowEnd: number;
}

/** How much of the two documents ended up where. */
export interface DiffStats {
  /** Lines that are the same on both sides. */
  unchanged: number;
  /** Pairs of lines that sit opposite each other and differ. */
  changed: number;
  /** Lines that are only in `after`. */
  inserted: number;
  /** Lines that are only in `before`. */
  deleted: number;
}

/** Everything the engine worked out about two documents. */
export interface DiffResult {
  /** `before`, split into lines. Line endings are not part of these. */
  before: readonly string[];
  /** `after`, split into lines. */
  after: readonly string[];
  /** The comparison, one row at a time, from the top of both documents. */
  rows: readonly DiffRow[];
  /** The changes, in the order they appear. */
  changes: readonly DiffChange[];
  stats: DiffStats;
  /**
   * Whether the engine found the smallest set of edits, or gave up somewhere
   * and called a range replaced outright. See {@link DiffOptions.maxCost}.
   */
  complete: boolean;
  /**
   * How each document is written, which is what the rows cannot say.
   *
   * Two files with the same lines in them and different line endings compare as
   * the same document, and they are not the same file. This is where that
   * difference is, and the viewer writes it under the panes when the two
   * disagree.
   *
   * Left out where nobody could know it: a comparison read back out of a patch
   * never saw either file, and one an application built by hand is whatever it
   * says it is.
   */
  format?: { before: DiffFormat; after: DiffFormat };
}

/** How a comparison is written out as a patch. */
export interface DiffPatchOptions {
  /**
   * How many unchanged lines are kept either side of a change.
   *
   * This is what makes a patch smaller than the two documents it came from: the
   * lines nobody touched are left out except for the few that say where each
   * change sits. Three is what `diff` and `git` write, and what anything
   * reading a patch expects to find.
   *
   * @default 3
   */
  context?: number;

  /**
   * The name written on the `---` line.
   *
   * A patch that is going to be applied by `git apply` or `patch` needs the
   * path of the file on both lines, which is why this is a name and not a
   * label: it is read by a program before it is read by a person.
   *
   * @default 'before'
   */
  before?: string;

  /**
   * The name written on the `+++` line.
   * @default 'after'
   */
  after?: string;
}

/**
 * One file of a patch, and the comparison its hunks describe.
 *
 * A patch is not the two documents. It is the changed lines and a few either
 * side of each of them, so the comparison that comes back is the same shape as
 * one worked out from two documents and covers less: {@link DiffLine.index} is
 * still the line's own number in the file it came from, and
 * {@link DiffResult.before} holds only the lines the patch carried rather than
 * the whole document. Where one hunk ends and the next begins, the line numbers
 * jump — which is what a viewer draws as a gap.
 */
export interface DiffPatchFile {
  /** The name on the `---` line, or `''` where the patch carried no header. */
  before: string;
  /** The name on the `+++` line. */
  after: string;
  /** What the hunks of this file say changed. */
  result: DiffResult;
}

/* ---------------------------------------------------------------------------
 * The comparison, in two dimensions
 *
 * A picture has no lines in it, so none of the vocabulary above answers
 * anything about one. What follows is the same two halves written again for
 * pixels: what the engine found, and — further down, beside the rest of the
 * view — how it is drawn.
 * ------------------------------------------------------------------------- */

/**
 * A picture as the engine reads it: four bytes a pixel, row by row from the
 * top-left corner.
 *
 * The same shape as `ImageData`, on purpose. What a canvas hands back can be
 * passed straight in, and so can a buffer that never went near one. It is also
 * the whole of what {@link DiffImageOptions} is given alongside: turning a file
 * into pixels is decoding, and where that happens — a page, a worker, a server
 * — is not the engine's business.
 */
export interface DiffPixels {
  /** Red, green, blue and alpha, a byte each, `width * height * 4` long. */
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/**
 * What happened to one pixel.
 *
 * `added` and `removed` are the pixels only one of the two pictures covers,
 * which is what a difference in size, or a shift, leaves behind. Everything
 * inside both is `equal` or `changed`.
 */
export type DiffPixelKind = 'equal' | 'changed' | 'added' | 'removed';

/**
 * Whether the two pictures are lined up before they are compared.
 *
 * - `none` — they are not. Both start at the top-left corner, and a picture
 *   moved a pixel to the right is a picture where every edge changed.
 * - `shift` — a whole-pixel offset is looked for first, and the comparison is
 *   run with the two held that far apart. This is what makes a screenshot taken
 *   again, a scan fed in crooked, or a canvas cropped by a row of pixels
 *   comparable at all.
 *
 * The offset that was used is on the result either way, and how far the search
 * goes is {@link DiffImageOptions.alignRadius}.
 */
export type DiffImageAlign = 'none' | 'shift';

/** How two pictures are compared. */
export interface DiffImageOptions {
  /**
   * How different two pixels have to be, from 0 to 1, before the difference
   * counts.
   *
   * Zero is exact: a photograph saved twice by the same encoder will light up
   * across most of its area, because it is not the same file twice. What is
   * being allowed for here is that kind of noise, and the number is a distance
   * between two colours where 1 is black against white.
   *
   * @default 0.05
   */
  tolerance?: number;

  /**
   * Whether a pixel that only differs because an edge was drawn smooth is left
   * out.
   *
   * Text and diagonals are drawn by putting part of a colour into the pixels
   * either side of where the line really falls, and the part each one gets is
   * decided by the renderer — so the same page drawn by two browsers, or by one
   * browser on two machines, differs along every letter and every curve while
   * showing the same thing. On, a differing pixel is dropped when the *same
   * edge* runs through it in both pictures and the change is no larger than the
   * weaker of the two steps: an edge is a step with something level within a
   * pixel of it, and the pixel has to be a blend of what surrounds it rather
   * than a colour of its own in at least one of the two.
   *
   * Both pictures, and the weaker step, because that is what tells an edge
   * drawn twice from an edge that arrived. A patch pasted over a flat part of a
   * photograph brings an edge with it that the other picture has nothing to
   * answer with, and the level test keeps a texture — where nearly every pixel
   * lies between its neighbours and the range is most of the scale — from
   * counting as an edge at all.
   *
   * It is not free: the pixels that differ are each read again with the pixels
   * around them. It costs nothing on two pictures that are alike and a good
   * deal on two that are not.
   *
   * @default true
   */
  ignoreAntialiasing?: boolean;

  /**
   * Whether an offset between the two pictures is looked for first.
   * @default 'none'
   */
  align?: DiffImageAlign;

  /**
   * How far the search for that offset goes, in pixels of the larger picture.
   *
   * It is a radius, so `16` covers everything from sixteen pixels left to
   * sixteen right and the same up and down. Widening it costs time and, past a
   * point, honesty: a search wide enough to slide one picture across another
   * will eventually find a corner that matches by accident.
   *
   * @default 16
   */
  alignRadius?: number;

  /**
   * How coarse the grid is that changed pixels are grouped on, in pixels.
   *
   * The mask says which pixels changed and {@link DiffImageResult.regions} says
   * where the changes are, and this is the difference between the two: pixels
   * are counted into squares this big, and the squares that touch each other
   * become one region. Small squares split one change into several, large ones
   * gather changes that have nothing to do with each other.
   *
   * @default 16
   */
  blockSize?: number;

  /**
   * The most regions the engine will return.
   *
   * Two photographs of the same scene differ nearly everywhere, and a list of
   * forty thousand rectangles is not a list anybody steps through. Past this,
   * the largest are kept, the rest are left on the mask where they still show,
   * and {@link DiffImageResult.complete} is `false`.
   *
   * @default 200
   */
  maxRegions?: number;
}

/** A rectangle, in the frame's own pixels. */
export interface DiffImageArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * A part of the frame where something changed, as the smallest rectangle that
 * holds it.
 *
 * These are what a reader steps through, which is why they are rectangles
 * rather than the outline of what actually changed: a box can be scrolled to,
 * drawn around and counted, and the mask underneath is still there for anything
 * that wants the exact shape.
 */
export interface DiffImageRegion extends DiffImageArea {
  /** How many pixels inside it are not `equal`. */
  pixels: number;
}

/** How much of the frame ended up where. */
export interface DiffImageStats {
  /** How many pixels the frame holds. */
  pixels: number;
  /**
   * How many of those at least one of the two pictures reaches, which is what
   * the rest are counted out of.
   *
   * The same as `pixels` for two pictures laid corner to corner with nothing
   * between them. Two pictures one of which is wider and the other taller, or
   * two held apart by an offset, leave a corner of the frame neither of them
   * covers, and those pixels are nothing at all rather than pixels that agree.
   */
  covered: number;
  /** Pixels both pictures cover and agree about. */
  unchanged: number;
  /** Pixels both cover and disagree about. */
  changed: number;
  /** Pixels only the second picture covers. */
  added: number;
  /** Pixels only the first one covers. */
  removed: number;
  /**
   * Everything that is not `unchanged`, as a share of `covered`, from 0 to 1.
   *
   * The four counts add up to `covered`, so `1 - ratio` is how much of the two
   * pictures came out the same. {@link DiffImageSimilarity} is that number with
   * the rest of what goes with it.
   */
  ratio: number;
  /**
   * How far apart two pixels are on average, over the pixels both pictures
   * cover, from 0 to 1.
   *
   * The other half of the answer `ratio` gives. A picture saved again by a
   * worse encoder and a picture with half of it painted over can differ in the
   * same number of pixels, and they do not differ by the same amount — this is
   * the amount, on the same scale `tolerance` is measured on. Everything is in
   * it, including the pixels the tolerance and the smoothing test let through.
   */
  distance: number;
}

/**
 * How alike two pictures are, as one number and the counts behind it.
 *
 * What {@link DiffImageResult} answers is "where did these two differ", and a
 * build that keeps a threshold, a report that ranks a hundred screenshots and a
 * badge on a page are all asking the shorter question instead. This is the
 * shorter question: see `imageSimilarity`.
 */
export interface DiffImageSimilarity {
  /**
   * How alike the two are, from 0 for nothing in common to 1 for the same
   * picture, as a share of the pixels at least one of them covers.
   *
   * Times a hundred is the percentage. A pixel only one picture covers counts
   * against it, so two pictures of different sizes cannot reach 1.
   */
  similarity: number;
  /** Whether not one pixel of either came out different. */
  identical: boolean;
  /** How many pixels at least one of the two covers. */
  pixels: number;
  /** How many of those came out the same. */
  matched: number;
  /** How many both cover and disagree about. */
  changed: number;
  /** How many only the second covers. */
  added: number;
  /** How many only the first covers. */
  removed: number;
  /**
   * How far apart two pixels are on average, over the pixels both cover, from 0
   * to 1.
   *
   * `similarity` counts pixels and this measures them, which are two different
   * questions about the same pair. A photograph saved again is unalike in most
   * of its pixels and barely apart in any of them.
   */
  distance: number;
  /** How large each picture was, because a share means less when the two differ. */
  before: { width: number; height: number };
  after: { width: number; height: number };
}

/** One colour as four bytes: red, green, blue and alpha, each from 0 to 255. */
export type DiffPixelColour = readonly [number, number, number, number];

/**
 * What each kind of pixel is painted in, when the mask is turned into a
 * picture of its own.
 *
 * Bytes rather than CSS colours, because reading `rgb(232 62 140 / 55%)` means
 * asking a browser what it means, and nothing else about the comparison needs
 * one. Anything left out keeps its default.
 */
export interface DiffImagePaint {
  /** A pixel both pictures cover and disagree about. @default [232, 62, 140, 255] */
  changed?: DiffPixelColour;
  /** A pixel only the second picture covers. @default [26, 127, 75, 255] */
  added?: DiffPixelColour;
  /** A pixel only the first one covers. @default [194, 51, 63, 255] */
  removed?: DiffPixelColour;
  /** Everything else, which is see-through unless it is asked to be something. @default [0, 0, 0, 0] */
  unchanged?: DiffPixelColour;
}

/** Everything the engine worked out about two pictures. */
export interface DiffImageResult {
  /**
   * The frame both pictures were compared in.
   *
   * As large as it has to be to hold both of them once the offset is applied,
   * so two pictures of the same size compared without one give a frame of
   * exactly that size, and everything else gives a frame with a margin where
   * only one of the two reaches.
   */
  width: number;
  height: number;
  /** Where each picture sits in that frame. */
  before: DiffImageArea;
  after: DiffImageArea;
  /**
   * How far the second picture was moved to line the two up, in pixels — `{ x:
   * 0, y: 0 }` unless {@link DiffImageOptions.align} asked for a search.
   *
   * It is where the move went rather than where the contents were: a picture
   * drawn a pixel further to the right than the first is moved a pixel to the
   * left, and `x` is `-1`.
   */
  offset: { x: number; y: number };
  /**
   * What happened to each pixel of the frame, one byte each, row by row.
   *
   * The byte is an index into {@link DIFF_PIXEL_KINDS}, so `0` is a pixel that
   * did not change and anything else is a pixel that did. A byte a pixel rather
   * than a picture, because what it is drawn in — a colour, a stipple, an
   * outline, nothing at all — is the view's decision and not this one's.
   */
  mask: Uint8Array;
  /** Where the changes are, in reading order. */
  regions: readonly DiffImageRegion[];
  stats: DiffImageStats;
  /**
   * Whether the list of regions holds all of them. See
   * {@link DiffImageOptions.maxRegions}.
   */
  complete: boolean;
}

/**
 * How many pictures one comparison of several can hold.
 *
 * The mask is a byte a pixel and each picture is a bit of it, so eight is what
 * a byte holds. A comparison of more than eight is a comparison nobody reads as
 * one picture anyway — and the pair each of them makes with the baseline is
 * still `diffImage`, which has no limit.
 */
export const MOST_PICTURES = 8;

/** How several pictures are compared. */
export interface DiffImagesOptions extends DiffImageOptions {
  /**
   * Which picture the rest are counted against, as an index into the list.
   *
   * A comparison of several asks one of two questions, and this decides which.
   * With a baseline it is "how does each of these differ from that one", which
   * is what a saved version against four runs is. Without one it is "where do
   * these disagree at all", and the answer to that is the same whichever of
   * them the counting starts from: a pixel they all agree about has no bit set
   * whoever is the baseline.
   *
   * @default 0
   */
  baseline?: number;
}

/** How much of the frame several pictures ended up agreeing about. */
export interface DiffImagesStats {
  /** How many pixels the frame holds. */
  pixels: number;
  /** How many of those at least one of the pictures reaches. */
  covered: number;
  /** How many of those every picture that reaches them agrees about. */
  unchanged: number;
  /** The rest: pixels at least one of them disagrees about. */
  changed: number;
  /** `changed` as a share of `covered`, from 0 to 1. */
  ratio: number;
  /**
   * How many pixels each picture disagrees with the baseline about, in the
   * order the pictures were given. The baseline's own is 0.
   */
  apart: readonly number[];
}

/** Everything the engine worked out about several pictures. */
export interface DiffImagesResult {
  /**
   * The frame all of them were compared in.
   *
   * As large as it has to be to hold every one of them once its offset is
   * applied, which for pictures of one size laid corner to corner is that size.
   */
  width: number;
  height: number;
  /** Where each picture sits in that frame, in the order they were given. */
  areas: readonly DiffImageArea[];
  /**
   * How far each one was moved to line it up with the baseline, in pixels.
   *
   * `{ x: 0, y: 0 }` for the baseline, and for every other picture unless
   * {@link DiffImageOptions.align} asked for a search.
   */
  offsets: readonly { x: number; y: number }[];
  /** Which picture the rest were counted against. */
  baseline: number;
  /**
   * Which pictures disagree at each pixel, a bit each, row by row.
   *
   * Bit `i` is set when the picture at `i` in the list differs from the
   * baseline there — because the two pixels are far enough apart, or because
   * one of them covers the pixel and the other does not. `0` is a pixel every
   * picture agrees about, and the baseline's own bit is never set.
   *
   * A bit rather than a count, because it answers both questions: `mask[pixel]
   * !== 0` is "does anything disagree here", and `mask[pixel] & (1 << i)` is
   * "does this one", which is what lets a view tint each picture with what is
   * wrong with that picture.
   */
  mask: Uint8Array;
  /** Where the changes are, in reading order. */
  regions: readonly DiffImageRegion[];
  stats: DiffImagesStats;
  /**
   * Whether the list of regions holds all of them. See
   * {@link DiffImageOptions.maxRegions}.
   */
  complete: boolean;
}

/**
 * How alike several pictures are, as one number and the counts behind it.
 *
 * The same shorter question {@link DiffImageSimilarity} answers for a pair. A
 * build comparing one screen drawn on four machines wants one number and a
 * list saying which of the four is the odd one out, and this is both.
 */
export interface DiffImagesSimilarity {
  /**
   * How alike they all are, from 0 to 1: the share of the pixels at least one
   * of them covers that every one of them agrees about.
   *
   * Times a hundred is the percentage. One picture disagreeing in a corner
   * costs the whole set exactly as much as all of them disagreeing there,
   * because the question is whether they agree.
   */
  similarity: number;
  /** Whether not one pixel of any of them came out different. */
  identical: boolean;
  /** How many pixels at least one of them covers. */
  pixels: number;
  /** How many of those every one of them agrees about. */
  matched: number;
  /** The rest. */
  changed: number;
  /** Which picture the rest were counted against. */
  baseline: number;
  /**
   * How alike each picture is to the baseline, from 0 to 1, in the order they
   * were given. The baseline's own is 1.
   *
   * This is what says which of them is the odd one out, where `similarity`
   * only says that one of them is.
   */
  each: readonly number[];
  /** How large each picture was, in order. */
  sizes: readonly { width: number; height: number }[];
}

/* ---------------------------------------------------------------------------
 * The view
 *
 * Everything above is the comparison. What follows is how it is shown, and it
 * is here rather than beside the component for the same reason: an application
 * that keeps the view's settings in its own state has to be able to name their
 * types without importing a component to reach them.
 * ------------------------------------------------------------------------- */

/** Which of the two documents a line belongs to. */
export type DiffineSide = 'before' | 'after';

/**
 * Whether the two documents are read or written.
 *
 * One component draws both, because they were never two things: the same
 * comparison, the same rows, the same colours, the same way through the
 * changes. An editor is that with a field over each pane, so the comparison is
 * worked out again as somebody types into it.
 */
export type DiffineMode = 'viewer' | 'editor';

/**
 * How the two documents are laid out.
 *
 * - `split` — one document either side, held level with each other.
 * - `unified` — one column, with what went out above what came in.
 *
 * A unified column is not a thing to type into, so an editor is always split.
 */
export type DiffineView = 'split' | 'unified';

/**
 * The typeface the two documents are drawn in.
 *
 * Anything left out keeps the stylesheet's own value, so `{ size: 15 }` is a
 * whole answer. A number is pixels and a string is whatever CSS makes of it,
 * which is how `1rem`, `0.05em` and a `clamp()` get in.
 *
 * `lineHeight` has to be a length rather than a bare multiplier. A row is that
 * tall whether or not it has a line in it, the editor's field is laid over rows
 * that are, and the rows a long comparison does not draw are stood in for by
 * exactly that much height — none of which a number with no unit can answer.
 */
export interface DiffineFont {
  /** The family, as a CSS font stack. Monospace, or the columns will not line up. */
  family?: string;
  /** How big it is. */
  size?: string | number;
  /** How tall one unwrapped line is. A length, not a multiplier. */
  lineHeight?: string | number;
  /** How far apart the letters are. */
  letterSpacing?: string | number;
}

/**
 * Which palette the viewer draws in.
 *
 * `system` follows the reader's own setting, which is what a component dropped
 * into somebody else's page should do unless that page says otherwise.
 */
export type DiffineColorScheme = 'system' | 'light' | 'dark';

/** The languages the viewer's own words are written in. */
export type DiffineLocale = 'en' | 'ko';

/**
 * A language the documents themselves can be coloured as, and what to call it.
 *
 * The whole list is `DIFFINE_LANGUAGES`, which is what the editor's menu is
 * built from and what an application building a menu of its own should build
 * from. The names are English: `TypeScript` is `TypeScript` in every locale.
 */
export interface DiffineLanguageOption {
  /** What to pass as `language` — a highlight.js identifier, or `plain`. */
  id: string;
  /** Its full name, as the bar above the panes writes it. */
  name: string;
}

/**
 * A document to compare, and what to call it.
 *
 * A bare string is the document, which is all most applications need. The
 * object form is for a viewer with a header on it, where each side is named —
 * a file path, a version, a date.
 */
export type DiffineInput = string | DiffineSource;

/** A document with a name on it. */
export interface DiffineSource {
  content: string;
  /** What the header calls this side. Its default is the word for it. */
  label?: string;
}

/**
 * The words both viewers put on the screen.
 *
 * Some of these are read by a screen reader rather than shown, which is why
 * they are sentences rather than labels.
 *
 * They are split three ways because the words are shipped the way they are
 * used: a page with a document comparison on it has no reason to carry the
 * word for a zoom control, and a page with a picture comparison has no reason
 * to carry the word for a regular expression.
 */
export interface DiffineCommonStrings {
  /** The header over the left side, and its region's name. */
  before: string;
  /** The header over the right side. */
  after: string;
  /** What is said when there is nothing on either side yet. */
  empty: string;
  /** What is said when the two turned out to be the same. */
  identical: string;
  /** The name of the button that moves back a change. */
  previousChange: string;
  /** The name of the button that moves on a change. */
  nextChange: string;
  /** Which change is being looked at: `{position}` of `{total}`. */
  changePosition: string;
}

/** The words the document comparison adds. */
export interface DiffineTextStrings extends DiffineCommonStrings {
  /** What an empty field says before anybody has typed into it. */
  placeholder: string;
  /** What a screen reader hears in front of a line that is only in `after`. */
  added: string;
  /** What it hears in front of a line that is only in `before`. */
  removed: string;
  /** What it hears in front of a line that has a different counterpart. */
  changed: string;
  /** What a band standing in for lines nobody is reading says: `{lines}`. */
  folded: string;
  /** The name of the button that opens one of those bands: `{lines}`. */
  expand: string;
  /** The name of the button that writes one change into the other side: `{label}`. */
  applyChange: string;
  /** How the two documents are written, where that differs: `{before}` and `{after}`. */
  format: string;
  /** What a document with more than one kind of line ending in it is called. */
  mixedEndings: string;
  /** What is said of a document whose last line carries no ending of its own. */
  noFinalNewline: string;
  /** What the editor's menu of languages is called to a screen reader. */
  language: string;
  /** How the counts are read out: `{changes}`, `{inserted}` and `{deleted}`. */
  summary: string;
  /**
   * How one side's size is read out, under the pane it belongs to:
   * `{label}` is what that side is called, `{characters}` and `{size}` are
   * already written in the reader's own language.
   */
  documentSize: string;
  /** The name of the button that opens the search bar, and of its field. */
  search: string;
  /** Which side is being searched, for the button above each pane: `{label}`. */
  searchIn: string;
  /** The name of the button that moves back a match. */
  searchPrevious: string;
  /** The name of the button that moves on a match. */
  searchNext: string;
  /** The name of the button that closes the search bar. */
  searchClose: string;
  /** Which match is being looked at: `{position}` of `{total}`. */
  searchPosition: string;
  /** What is said when the query found nothing. */
  searchEmpty: string;
  /** The name of the switch for telling `Title` from `title`. */
  matchCase: string;
  /** The name of the switch for matching whole words only. */
  wholeWord: string;
  /** The name of the switch for reading the query as a regular expression. */
  regex: string;
  /** The name of the button that writes over the match being looked at. */
  replace: string;
  /** What the field holding the text to write instead is called. */
  replaceWith: string;
  /** The name of the button that writes over every match. */
  replaceAll: string;
}

/** The words the picture comparison adds. */
export interface DiffineImageStrings extends DiffineCommonStrings {
  /** How one picture is written under the pane it belongs to: `{label}`, `{width}`, `{height}` and `{size}`. */
  imageSize: string;
  /** How the counts are read out: `{regions}` areas over `{percent}` of the frame. */
  imageSummary: string;
  /** What an empty pane invites, and what its button is called. */
  choose: string;
  /** What the button in the bar above one pane is called: `{label}`. */
  chooseIn: string;
  /** What is said when a file that is not a picture is dropped on a pane. */
  unsupported: string;
  /** What is said while a picture is being decoded. */
  loading: string;
  /** The name of the button that draws the picture smaller. */
  zoomOut: string;
  /** The name of the button that draws it larger. */
  zoomIn: string;
  /** The name of the button that fits the whole frame in the pane. */
  zoomFit: string;
  /** How far in the view is, as a percentage: `{percent}`. */
  zoomLevel: string;
  /** The name of the slider that fades the second picture over the first. */
  fade: string;
  /** The name of the handle that wipes one picture across the other. */
  wipe: string;
  /** What goes before the coordinates under the magnified pixels. */
  at: string;
  /** The name of the handle that moves the magnified pixels somewhere else. */
  loupeMove: string;
  /** The name of the corner that shows more of them at once. */
  loupeSize: string;
}

/**
 * Every word either viewer puts on the screen.
 *
 * The two halves together, for an application that keeps one table of words for
 * both — a translation file, a theme, a set of overrides passed to whichever
 * viewer a page happens to be drawing.
 */
export interface DiffineStrings extends DiffineTextStrings, DiffineImageStrings {}

/**
 * A run of one line, as the application wants it coloured.
 *
 * This is how a syntax highlighter reaches the viewer. The application is given
 * the whole line and hands back the runs it wants drawn differently, which is
 * the only order that works: a grammar cannot be applied to a fragment of a
 * line and come out right, and the fragments are what the comparison produces.
 * The viewer cuts the line at the boundaries of both and draws each piece with
 * whatever the two say about it.
 *
 * `length` counts the same units `String.prototype.slice` does, so the runs a
 * tokeniser already returns can be used as they are.
 */
export interface DiffineToken {
  /** How many characters of the line this run covers. */
  length: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * How a line is coloured beyond what the comparison says about it.
 *
 * Called for each line the viewer draws, so with the rows virtualised it is
 * called for what is on the screen rather than for the whole document. Return
 * `null` to leave a line as it is.
 *
 * Passing this replaces whatever `language` was doing rather than adding to it.
 * A line has one set of runs, and two highlighters cutting it at once is not a
 * thing that has an answer.
 *
 * ```tsx
 * <DiffineViewer
 *   before={saved}
 *   after={draft}
 *   highlight={(line) => tokenize(line.text).map((token) => ({
 *     length: token.content.length,
 *     className: `token ${token.type}`
 *   }))}
 * />
 * ```
 */
export type DiffineHighlight = (
  line: DiffLine,
  side: DiffineSide
) => readonly DiffineToken[] | null | undefined;

/**
 * Something of the application's own, drawn beside or under one line.
 *
 * This is where everything a comparison does not know about goes: a review
 * comment, a coverage bar, a blame, a lint warning, a button for adding any of
 * them. The line is handed over whole, along with the side it is on, and what
 * comes back is drawn as it is — return `null` for a line that gets nothing,
 * which is most of them.
 *
 * ```tsx
 * <TextDiff
 *   before={saved}
 *   after={draft}
 *   renderWidget={(line, side) =>
 *     side === 'after' && comments[line.index] ? (
 *       <Comment thread={comments[line.index]} />
 *     ) : null
 *   }
 * />
 * ```
 *
 * It is called for each line a pane draws, so with the rows virtualised it is
 * called for what is on the screen. A line with nothing opposite it — the blank
 * that holds the two sides level — is not a line, and nothing is asked about
 * it.
 */
export type DiffineRender = (line: DiffLine, side: DiffineSide) => React.ReactNode;

/**
 * How the two pictures are laid out.
 *
 * - `split` — one either side, both moving together under one zoom.
 * - `overlay` — one on top of the other, with a slider that fades between them.
 * - `wipe` — one on top of the other, with a handle that draws the line where
 *   the first stops and the second starts.
 * - `mask` — neither of them: what changed, on its own, over a flat ground.
 *
 * The first is what a reader compares two pictures with. The other three are
 * what they reach for once they have found the part that differs, and the
 * reason all four are here rather than one is that no single one of them
 * answers "did this move, or did it change colour" — a wipe does, an overlay
 * does not, and the mask says where to point them.
 */
export type DiffineImageView = 'split' | 'overlay' | 'wipe' | 'mask';

/**
 * What is done with the parts of a picture nothing happened to.
 *
 * - `keep` — nothing. Both pictures are drawn as they are, with the changed
 *   pixels tinted over them.
 * - `dim` — they are drawn faint and what changed is drawn as it is, so the
 *   change is what the eye lands on and the rest of the picture is still there
 *   to say where in it the change was.
 * - `hide` — they are not drawn at all. What changed is drawn on a plain
 *   ground, which is the view for reading a change as a picture rather than as
 *   a mark on one.
 *
 * It is not `view`, because it is a different question and holds across all
 * four of those: a wipe of two pictures whose unchanged half is dimmed is a
 * sensible thing to ask for.
 */
export type DiffineImageUnchanged = 'keep' | 'dim' | 'hide';

/**
 * What the wheel does over a picture comparison.
 *
 * - `zoom` — it zooms about the pointer, a notch at a time, which is what a
 *   picture viewer does. Shift with it moves the picture instead. The page a
 *   comparison is on does not scroll while the pointer is over it.
 * - `pan` — it moves a picture larger than its pane and lets the page scroll
 *   when the whole frame is already in view, so a reader scrolling past a
 *   comparison scrolls past it. The modifier zooms.
 *
 * Both are the right answer to different pages. A comparison that is the page
 * wants the first; one sitting in the middle of an article wants the second.
 */
export type DiffineImageWheel = 'zoom' | 'pan';

/**
 * A picture, as an application hands one over.
 *
 * A `Blob` is the usual answer, which is what a `<input type="file">` gives and
 * what a `fetch` can be asked for. `ImageBitmap` is what a page that has
 * already decoded one holds, and {@link DiffPixels} is a buffer of pixels from
 * anywhere at all.
 *
 * There is no URL on the list, and that is deliberate rather than missing. A
 * picture fetched by the component would be a picture the application never saw
 * — read from wherever the string pointed, sent through a canvas that a
 * cross-origin response quietly poisons, and decoded from bytes nobody checked.
 * Fetching it is the application's to do, and what arrives here is what it
 * already holds.
 */
export type DiffineImageContent = Blob | ImageBitmap | DiffPixels;

/** A picture, or a picture with a name on it. */
export type DiffineImageInput = DiffineImageContent | DiffineImageSource;

/** A picture with a name on it. */
export interface DiffineImageSource {
  content: DiffineImageContent;
  /** What the header calls this side. Its default is the word for it. */
  label?: string;
}

/**
 * How far into a picture a reader is, and where.
 *
 * `scale` is what a pixel of the frame is drawn as: `1` is the picture at its
 * own size, `4` is four screen pixels a pixel, and below `1` the frame has been
 * shrunk to fit. `x` and `y` are the point of the frame the middle of the pane
 * is looking at, in the frame's own pixels — a centre rather than a corner,
 * because that is what stays still when a reader zooms.
 */
export interface DiffineImageViewport {
  scale: number;
  x: number;
  y: number;
}
