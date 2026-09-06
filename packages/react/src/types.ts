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
 * How the two documents are laid out.
 *
 * - `split` — one document either side, held level with each other.
 * - `unified` — one column, with what went out above what came in.
 */
export type DiffineView = 'split' | 'unified';

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
 * Two of these are read by a screen reader rather than shown, which is why they
 * are sentences rather than labels.
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
