/**
 * The vocabulary every part of Diffine is written in.
 *
 * These are the types that more than one module needs, which is why they sit
 * here rather than beside whichever module introduced them — and why they are
 * also exported from `diffine-react/types`, so an application can name one in
 * its own props without importing the engine to get at it.
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
