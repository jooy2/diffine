'use client';

/**
 * Finding a run of text in a pane, and reading what turned up one match at a
 * time.
 *
 * A pane is searched rather than a document, and the difference matters in both
 * views the components draw: the two sides of a split view are two searches
 * that open, close and count on their own, and a unified view is one search
 * over a column that happens to hold lines from both documents. So everything
 * here is written against `PaneLayout` — the lines a pane actually draws — and
 * a match is a range inside one of them rather than an offset into a string.
 *
 * That is also what makes the highlighting free. The lines are already being
 * drawn a piece at a time, cut wherever the comparison or a syntax highlighter
 * had something to say; a match is a third thing with something to say about
 * the same line, and it is cut in at the same boundaries.
 *
 * Where the caret has to move as well — an editable pane — the range is turned
 * back into an offset into the document with {@link rangeOf}, which is the one
 * direction the translation runs in.
 */

import * as React from 'react';
import { useIsomorphicLayoutEffect } from './layout.js';
import type { PaneLayout, PaneLine } from './rows.js';

/** How a query is read. */
export interface SearchOptions {
  /** Whether `Title` and `title` are the same word. */
  matchCase: boolean;
  /** Whether a match has to have something other than a letter either side. */
  wholeWord: boolean;
  /** Whether the query is a regular expression rather than the text to find. */
  regex: boolean;
}

/** Where one match sits: which line of the pane, and the range inside it. */
export interface SearchMatch {
  /** Where the line sits in the pane's own list, which is what is scrolled to. */
  row: number;
  start: number;
  end: number;
}

/** Every match, and whether the scan reached the end of the document. */
export interface SearchResult {
  matches: SearchMatch[];
  /**
   * Whether the scan stopped at {@link MOST} rather than at the last line.
   *
   * A single letter typed into the box of a twenty-thousand-line document is a
   * match every few characters, and counting all of them is work nobody asked
   * for on the way to a query that has not been finished yet. The count says
   * `+` when this is set, and Replace All works from a scan with no limit on
   * it.
   */
  capped: boolean;
}

/** How many matches are worth collecting for a query somebody is still typing. */
const MOST = 20000;

/** What has to be escaped for a query to be looked for as the text it is. */
const ESCAPE = /[.*+?^${}()|[\]\\]/g;

/** What counts as being inside a word, for a search that wants whole ones. */
const WORD = /[\p{L}\p{N}_]/u;

/** No matches, as one array rather than a new empty one per render. */
const NONE: SearchResult = { matches: [], capped: false };

/**
 * The expression a query means, or `null` when it does not mean one yet.
 *
 * Which covers two cases the search bar draws differently: an empty box, where
 * there is nothing to look for, and an expression that cannot be read, where
 * there is something and it is not finished — `(` on the way to `(a|b)` is the
 * usual one, and it is not an error to put in front of somebody mid-word.
 *
 * The `u` flag is asked for and not insisted on. It is what makes a match land
 * on whole characters rather than on half of a surrogate pair, and it also
 * turns a handful of patterns that older expressions allow into syntax errors —
 * so a regular expression that a reader wrote and a browser understands is not
 * refused for the sake of a flag.
 */
export function patternFor(query: string, options: SearchOptions): RegExp | null {
  if (query === '') {
    return null;
  }

  const source = options.regex ? query : query.replace(ESCAPE, '\\$&');
  const flags = options.matchCase ? 'g' : 'gi';

  try {
    return new RegExp(source, `${flags}u`);
  } catch {
    try {
      return new RegExp(source, flags);
    } catch {
      return null;
    }
  }
}

/** Whether there is something other than a letter or a digit either side. */
function bounded(text: string, start: number, end: number): boolean {
  return !WORD.test(text[start - 1] ?? '') && !WORD.test(text[end] ?? '');
}

/**
 * Every match in a pane's lines, in the order the pane draws them.
 *
 * A match of no width is skipped rather than collected. `a*` matches the empty
 * string between every pair of characters, and a search bar that answers "four
 * hundred matches" to a pattern that found nothing is worse than one that
 * answers none.
 */
export function findMatches(
  lines: readonly PaneLine[],
  pattern: RegExp | null,
  wholeWord: boolean,
  limit = MOST
): SearchResult {
  if (!pattern) {
    return NONE;
  }

  const matches: SearchMatch[] = [];

  for (const [row, drawn] of lines.entries()) {
    const text = drawn.line?.text;

    if (!text) {
      continue;
    }

    pattern.lastIndex = 0;

    let found = pattern.exec(text);

    while (found) {
      const start = found.index;
      const end = start + found[0].length;

      if (end === start) {
        pattern.lastIndex = start + 1;
      } else {
        if (!wholeWord || bounded(text, start, end)) {
          matches.push({ row, start, end });

          if (matches.length >= limit) {
            return { matches, capped: true };
          }
        }

        pattern.lastIndex = end;
      }

      found = pattern.exec(text);
    }
  }

  return { matches, capped: false };
}

/** The matches of each line that has any, so a drawn line can ask for its own. */
export function matchRows(matches: readonly SearchMatch[]): Map<number, SearchMatch[]> {
  const rows = new Map<number, SearchMatch[]>();

  for (const match of matches) {
    const held = rows.get(match.row);

    if (held) {
      held.push(match);
    } else {
      rows.set(match.row, [match]);
    }
  }

  return rows;
}

/**
 * Where each line of a document starts, counted in characters.
 *
 * `\r\n`, `\n` and a lone `\r` all end a line, exactly as they do where the
 * document is split for the comparison — and the offsets have to be measured
 * against the same reading of it, or a replace in a document written on another
 * platform would cut a line ending in half.
 *
 * A document that ends in a newline gets one more entry than it has lines,
 * which is the empty line at the end that a field lets the caret sit on.
 */
export function lineStarts(text: string): number[] {
  const starts = [0];
  const breaks = /\r\n|\r|\n/g;
  let found = breaks.exec(text);

  while (found) {
    starts.push(found.index + found[0].length);
    found = breaks.exec(text);
  }

  return starts;
}

/** A range in the document rather than in a line, for a pane with a caret in it. */
export function rangeOf(
  layout: PaneLayout,
  starts: readonly number[],
  match: SearchMatch
): { start: number; end: number } | null {
  const line = layout.lines[match.row]?.line;
  const base = line ? starts[line.index] : undefined;

  return base === undefined ? null : { start: base + match.start, end: base + match.end };
}

/** A document with `text` written over every one of `ranges`, in order. */
export function replacedText(
  text: string,
  ranges: readonly { start: number; end: number }[],
  replacement: string
): string {
  const pieces: string[] = [];
  let cursor = 0;

  for (const range of ranges) {
    pieces.push(text.slice(cursor, range.start), replacement);
    cursor = range.end;
  }

  pieces.push(text.slice(cursor));

  return pieces.join('');
}

/** Everything one pane's search bar shows, and everything it can do. */
export interface DocumentSearch {
  /** Whether the bar is on the screen. */
  open: boolean;
  /** Whether the row for replacing is on the screen with it. */
  replacing: boolean;
  query: string;
  replacement: string;
  options: SearchOptions;
  matches: readonly SearchMatch[];
  /** The matches of each line that has any, keyed by its position in the pane. */
  rows: ReadonlyMap<number, readonly SearchMatch[]>;
  /** Which match a reader is on, as an index into `matches`, or -1. */
  current: number;
  /** That match, which is the one drawn differently from the rest. */
  match: SearchMatch | null;
  /** Whether the query is a regular expression that cannot be read yet. */
  invalid: boolean;
  /** Whether there are more matches than were collected. See {@link MOST}. */
  capped: boolean;
  /** Counts up every time the bar is asked for, so that it takes the focus. */
  wanted: number;
  /** Opens the bar, with the row for replacing if it is asked for. */
  show: (replacing?: boolean) => void;
  hide: () => void;
  /** Draws the row for replacing, or takes it away. */
  setReplacing: (replacing: boolean) => void;
  setQuery: (query: string) => void;
  setReplacement: (replacement: string) => void;
  setOptions: (patch: Partial<SearchOptions>) => void;
  /** Moves on a match, or back one, wrapping at either end. */
  step: (direction: 1 | -1) => void;
  /** Puts the match a reader is on back on the screen, after the document moved. */
  reveal: () => void;
  /** Every match with no limit on the count, which is what Replace All works from. */
  all: () => readonly SearchMatch[];
}

export interface DocumentSearchOptions {
  /** Whether this pane can be searched at all. */
  enabled: boolean;
  /**
   * Whether the bar is open, and how to open it.
   *
   * Held by the component rather than in here, because what the panes draw
   * depends on it: a folded run is a run the search cannot reach, so the folds
   * are suspended while a bar is open — and the layout this hook searches is
   * worked out before this hook runs.
   */
  open: boolean;
  setOpen: (open: boolean) => void;
  /** The lines the search runs over, which is one pane's worth of them. */
  layout: PaneLayout;
  pane: React.RefObject<HTMLElement | null>;
  /** The height of one line, or `0` when a row's position has to be measured. */
  rowHeight: number;
  /** Works the drawn window out again, for a pane that has just been jumped. */
  remeasure: () => void;
  /** Told where a reader moved to, for a pane that has a caret to move as well. */
  onReveal?: (match: SearchMatch) => void;
}

/** Puts a row on the screen, and leaves it where it is when it already is. */
function bring(pane: HTMLElement | null, row: number, rowHeight: number): boolean {
  if (!pane) {
    return false;
  }

  const drawn = rowHeight > 0 ? null : pane.querySelector<HTMLElement>(`[data-row="${row}"]`);
  const top = rowHeight > 0 ? row * rowHeight : (drawn?.offsetTop ?? -1);
  const height = rowHeight > 0 ? rowHeight : (drawn?.offsetHeight ?? 0);

  if (top < 0) {
    return false;
  }

  // Only when it is not already there. A reader typing into the box is
  // narrowing a search rather than travelling through a document, and a pane
  // that jumped on every keystroke would be one they could not read.
  if (top < pane.scrollTop || top + height > pane.scrollTop + pane.clientHeight) {
    pane.scrollTop = Math.max(0, top - pane.clientHeight / 3);
  }

  return true;
}

/**
 * One pane's search: what was typed, what it found, and where the reader is in
 * what it found.
 *
 * Both components hold one of these per pane, which is what makes the two sides
 * of a split view independent — two bars, two queries, two counts, opened and
 * closed on their own.
 *
 * Which match is current is held in two parts, and the second one is what keeps
 * a search readable while it is being typed. An index alone would send a reader
 * who was on the fiftieth match back to the top of the document on every
 * keystroke, because the fiftieth match of `use` and the fiftieth match of
 * `user` have nothing to do with each other. So a step remembers the line it
 * landed on as well, and a query that has just changed takes the first match at
 * or after that line — the reader stays where they were reading, and the
 * highlighting narrows around them.
 */
export function useDocumentSearch({
  enabled,
  open,
  setOpen,
  layout,
  pane,
  rowHeight,
  remeasure,
  onReveal
}: DocumentSearchOptions): DocumentSearch {
  const [replacing, setReplacing] = React.useState(false);
  const [query, setText] = React.useState('');
  const [replacement, setReplacement] = React.useState('');
  const [options, setAll] = React.useState<SearchOptions>({
    matchCase: false,
    wholeWord: false,
    regex: false
  });

  /** Which match a reader stepped to, or -1 for one that is worked out below. */
  const [held, setHeld] = React.useState(-1);
  /** The line the reader was last taken to, which a new query starts from. */
  const [anchor, setAnchor] = React.useState(0);
  /** Counts up whenever the current match has to be put back on the screen. */
  const [ticket, setTicket] = React.useState(0);
  const [wanted, setWanted] = React.useState(0);

  const showing = enabled && open;
  const pattern = React.useMemo(
    () => (showing ? patternFor(query, options) : null),
    [showing, query, options]
  );
  const found = React.useMemo(
    () => findMatches(layout.lines, pattern, options.wholeWord),
    [layout, pattern, options.wholeWord]
  );
  const rows = React.useMemo(() => matchRows(found.matches), [found]);

  const total = found.matches.length;
  const current =
    total === 0
      ? -1
      : held >= 0
        ? Math.min(held, total - 1)
        : Math.max(
            0,
            found.matches.findIndex((match) => match.row >= anchor)
          );
  const match = current < 0 ? null : found.matches[current];

  /*
   * Where the last press landed, tracked as it happens.
   *
   * Two presses inside one task both see the state the render before them had,
   * so both would work out the same next match and the second would do nothing.
   * This is written the moment a press is handled.
   */
  const pending = React.useRef(current);

  useIsomorphicLayoutEffect(() => {
    pending.current = current;
  });

  /** The line a new query starts looking from, which is where the reader is. */
  function anchorNow(): number {
    const element = pane.current;

    if (match) {
      return match.row;
    }

    return element && rowHeight > 0 ? Math.floor(element.scrollTop / rowHeight) : anchor;
  }

  function restart(): void {
    setHeld(-1);
    pending.current = -1;
    setTicket((count) => count + 1);
  }

  function show(withReplace = false): void {
    setAnchor(anchorNow());
    setOpen(true);
    setWanted((count) => count + 1);

    if (withReplace) {
      setReplacing(true);
    }

    restart();
  }

  function step(direction: 1 | -1): void {
    if (total === 0) {
      return;
    }

    const from = pending.current;
    const index = from < 0 ? (direction > 0 ? 0 : total - 1) : (from + direction + total) % total;

    pending.current = index;
    setHeld(index);
    setAnchor(found.matches[index].row);
    setTicket((count) => count + 1);
  }

  /*
   * Where the reveal has got to, so that it happens once per move rather than
   * once per render. The document changes under a search that is open — every
   * keystroke in an editor is a new comparison and a new set of matches — and
   * following that with the scroll, or with the caret, would drag a reader away
   * from what they were typing.
   */
  const done = React.useRef(ticket);

  useIsomorphicLayoutEffect(() => {
    if (done.current === ticket) {
      return;
    }

    if (!match) {
      done.current = ticket;

      return;
    }

    if (!bring(pane.current, match.row, rowHeight)) {
      // A virtualised pane has not drawn the line yet and there is no height to
      // place it by. The pass after the first measurement has both.
      return;
    }

    done.current = ticket;
    // The pane may have jumped somewhere the drawn lines do not cover, and
    // waiting for the scroll it just raised would leave a reader looking at
    // nothing for a frame.
    remeasure();
    onReveal?.(match);
  });

  return {
    open: showing,
    replacing: replacing && showing,
    query,
    replacement,
    options,
    matches: found.matches,
    rows,
    current,
    match,
    invalid: showing && query !== '' && pattern === null,
    capped: found.capped,
    wanted,
    show,
    hide: () => setOpen(false),
    setReplacing,
    setQuery: (text: string) => {
      setText(text);
      restart();
    },
    setReplacement,
    setOptions: (patch: Partial<SearchOptions>) => {
      setAll((current) => ({ ...current, ...patch }));
      restart();
    },
    step,
    reveal: () => setTicket((count) => count + 1),
    all: () =>
      findMatches(layout.lines, pattern, options.wholeWord, Number.POSITIVE_INFINITY).matches
  };
}
