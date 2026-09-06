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
   * showing the same thing. On, a differing pixel is dropped when it is a blend
   * of what surrounds it rather than a colour of its own, and the change is no
   * larger than the step in brightness it is sitting on.
   *
   * It is not free: the pixels that differ are each read again with their eight
   * neighbours. It costs nothing on two pictures that are alike and a good deal
   * on two that are not.
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
  /** How many pixels the frame holds, which is what the rest are counted out of. */
  pixels: number;
  /**
   * Pixels that came out the same — and, where an offset has left a corner of
   * the frame that neither picture reaches, the pixels that are nothing at all.
   */
  unchanged: number;
  changed: number;
  /** Pixels only the second picture covers. */
  added: number;
  /** Pixels only the first one covers. */
  removed: number;
  /** Everything that is not `unchanged`, as a share of the frame, from 0 to 1. */
  ratio: number;
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
 * Every word the viewer puts on the screen.
 *
 * Some of these are read by a screen reader rather than shown, which is why
 * they are sentences rather than labels.
 */
export interface DiffineStrings {
  /** The header over the left side, and its region's name. */
  before: string;
  /** The header over the right side. */
  after: string;
  /** What is said when there is nothing on either side yet. */
  empty: string;
  /** What an empty field says before anybody has typed into it. */
  placeholder: string;
  /** What is said when the two documents turned out to be the same. */
  identical: string;
  /** What a screen reader hears in front of a line that is only in `after`. */
  added: string;
  /** What it hears in front of a line that is only in `before`. */
  removed: string;
  /** What it hears in front of a line that has a different counterpart. */
  changed: string;
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
  /** The name of the button that moves back a change. */
  previousChange: string;
  /** The name of the button that moves on a change. */
  nextChange: string;
  /** Which change is being looked at: `{position}` of `{total}`. */
  changePosition: string;
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

  /* The words the picture comparison adds. Everything above it uses as well. */

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
}

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
