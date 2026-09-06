'use client';

import * as React from 'react';
import type {
  DiffChange,
  DiffInlineMode,
  DiffOptions,
  DiffResult,
  DiffWhitespace,
  DiffineColorScheme,
  DiffineFont,
  DiffineHighlight,
  DiffineInput,
  DiffineLocale,
  DiffineMode,
  DiffineSide,
  DiffineStrings,
  DiffineView
} from '../../types.js';
import { diffText } from '../../diff.js';
import { useControlled } from '../../internal/controlled.js';
import { typeOver } from '../../internal/field.js';
import { fontVariables } from '../../internal/font.js';
import { useSyntaxHighlight } from '../../internal/highlight/useSyntax.js';
import { stringsFor } from '../../internal/i18n.js';
import { useIsomorphicLayoutEffect, useRowAlignment } from '../../internal/layout.js';
import { useChangeNavigation } from '../../internal/navigate.js';
import type { PaneLayout } from '../../internal/rows.js';
import { changeOfRow, fieldLayout, splitLayout, unifiedLayout } from '../../internal/rows.js';
import { useSyncedScroll } from '../../internal/scroll.js';
import {
  lineStarts,
  rangeOf,
  replacedText,
  useDocumentSearch,
  type DocumentSearch,
  type SearchMatch
} from '../../internal/search.js';
import { contentOf, sourceOf } from '../../internal/source.js';
import { useVirtualRows } from '../../internal/virtual.js';
import { DiffineFind, DiffineFindToggle } from '../shared/DiffineFind.js';
import { DiffineLanguageName, DiffineLanguagePicker } from '../shared/DiffineLanguage.js';
import { DiffineLinks } from '../shared/DiffineLinks.js';
import { DiffineNav } from '../shared/DiffineNav.js';
import { DiffineSummary } from '../shared/DiffineSummary.js';
import { TextDiffField } from './TextDiffField.js';
import { TextDiffPane } from './TextDiffPane.js';

export interface TextDiffProps extends Omit<
  React.ComponentPropsWithoutRef<'div'>,
  'children' | 'title' | 'onChange' | 'defaultValue'
> {
  /**
   * Whether the two documents are read or written.
   *
   * `viewer` draws them. `editor` draws them with a field over each side, so
   * the comparison is worked out again as somebody types into it — and that is
   * the whole of the difference. The lines, the tints, the marked words, the
   * bands between the panes, the buttons above them and the search under them
   * are one component's, and the mode decides which of its parts are on the
   * screen.
   *
   * Three props belong to one mode and are ignored in the other, because there
   * is no honest answer for them: `view` and `alignLines` in the editor, where
   * a blank line put in to hold the two sides level would be a line somebody
   * could put the caret in and a unified column is not a thing to type into;
   * and `result` in the editor, where a comparison worked out elsewhere is a
   * comparison of documents nobody has typed into yet.
   *
   * @default 'viewer'
   */
  mode?: DiffineMode;

  /**
   * The document on the left, as a string or as a string with a name on it.
   *
   * ```tsx
   * <TextDiff before="one\ntwo" after={{ content: 'one\n2', label: 'v2' }} />
   * ```
   *
   * In `editor` mode, passing it makes the field a controlled one in the usual
   * React sense: it shows what it is given and reports what a reader typed
   * through `onBeforeChange`, and it is the application's job to hand the new
   * text back. Leave it out and pass `defaultBefore` instead to let the
   * component keep the document itself.
   */
  before?: DiffineInput;
  /** The document on the right. */
  after?: DiffineInput;

  /** What the left field starts with, when the component is to keep it. Editor only. */
  defaultBefore?: DiffineInput;
  /** What the right field starts with. Editor only. */
  defaultAfter?: DiffineInput;

  /** The left document was typed into. */
  onBeforeChange?: (value: string) => void;
  /** The right document was typed into. */
  onAfterChange?: (value: string) => void;

  /**
   * The comparison, every time it is worked out again.
   *
   * For everything an application wants to say about the two documents outside
   * the box they are in — a count in a heading, a button that is only worth
   * pressing while the two differ.
   */
  onDiff?: (result: DiffResult) => void;

  /**
   * A comparison that has already been worked out, drawn as it is. Viewer only.
   *
   * `before` and `after` are ignored when this is passed, which is what makes
   * it useful: the comparison of two large documents can be done in a worker,
   * on a server, or once for a list of views, and handed here as a value.
   */
  result?: DiffResult;

  /**
   * Which side cannot be typed into. `true` is both of them. Editor only.
   *
   * `'before'` is the common one: the version that was saved on the left, the
   * one being written on the right.
   *
   * @default false
   */
  readOnly?: boolean | DiffineSide;

  /**
   * How the two documents are compared. Anything left out keeps its default, so
   * `{ whitespace: 'trailing' }` is a whole answer.
   *
   * In `editor` mode the comparison is run again on every keystroke, and what
   * bounds it is `maxCost` — see {@link DiffOptions.maxCost}.
   */
  diff?: DiffOptions;

  /**
   * One document either side, or one column with both. Viewer only.
   * @default 'split'
   */
  view?: DiffineView;

  /**
   * Whether each line carries its number.
   * @default true
   */
  lineNumbers?: boolean;

  /**
   * Whether a changed line carries a `+`, `−` or `~` beside it.
   *
   * The colours say the same thing, and this is what says it to a reader who
   * cannot tell those two colours apart. It is not what a screen reader hears —
   * that is written into the line itself and does not turn off.
   *
   * @default true
   */
  markers?: boolean;

  /**
   * Whether a line too long for the pane wraps or runs off the side.
   * @default false
   */
  wrap?: boolean;

  /**
   * Whether a line is held level with its counterpart. Viewer only.
   *
   * On, which is the usual thing to want, a line with nothing opposite it gets
   * a blank opposite it, so the two documents stay in step all the way down.
   * Off, each side is only its own lines, and the connectors between the panes
   * are what says which part of one answers which part of the other.
   *
   * @default true
   */
  alignLines?: boolean;

  /**
   * Whether the column between the panes draws each change as a band from
   * where it left to where it arrived. Split view only.
   * @default true
   */
  connectors?: boolean;

  /**
   * Whether scrolling one pane scrolls the other. Split view only.
   *
   * In `editor` mode the two documents are not held level — a field cannot be
   * padded out with blank lines somebody would be able to type into — so this
   * follows the fraction of the way down rather than the line number.
   *
   * @default true
   */
  syncScroll?: boolean;

  /**
   * Whether each side is named above it.
   * @default true
   */
  header?: boolean;

  /**
   * Whether the buttons for moving between changes are drawn.
   *
   * They sit in the bar above the panes, and that bar is drawn for them even
   * when `header` is off.
   *
   * @default true
   */
  navigation?: boolean;

  /**
   * Whether a reader can search the documents from inside the component.
   *
   * A pane at a time, which is what a comparison wants: a name being chased
   * through the version on the left is not a name being chased through the
   * version on the right, so each side has a button in the bar above it and a
   * bar of its own underneath. Ctrl+F, or Cmd+F, opens the one for the pane the
   * keyboard is in; in `editor` mode Ctrl+H opens it with the row for replacing
   * already drawn, which a side that cannot be typed into does not get.
   *
   * It is also what reaches text `virtualize` has left undrawn, which the
   * browser's own find cannot.
   *
   * @default true
   */
  search?: boolean;

  /**
   * Whether the bar under the view is drawn: what each document weighs, and how
   * many changes there are between them.
   * @default true
   */
  summary?: boolean;

  /**
   * Whether only the lines a reader can see are drawn.
   *
   * A comparison of twenty thousand lines is twenty thousand rows in the page,
   * and forty of them are on the screen. With this on the rest are height and
   * nothing else: the scrollbar is still the length of the document, and what
   * is drawn is what is in front of the reader. In `editor` mode the field
   * holds the whole document either way — that part is the browser's — and this
   * is about the lines behind it, which are elements.
   *
   * It needs every line to be the same height, which is true of a pane that is
   * not wrapping and of nothing else — so `wrap` turns it off. It also does
   * nothing to a short document, where the machinery would cost more than the
   * rows it saved.
   *
   * @default true
   */
  virtualize?: boolean;

  /**
   * Which change a reader has moved to, as an index into `changes`, or -1.
   *
   * Passing it makes it the application's: it will not change on its own, and
   * the buttons report through `onSelectedChange` instead. Leaving it out makes
   * it the component's, and the reporting still happens.
   */
  selected?: number;
  /** Which change to start on, when the component is to keep it. @default -1 */
  defaultSelected?: number;
  /** A change was moved to, by the buttons or by the application. */
  onSelectedChange?: (selected: number, change: DiffChange | null) => void;

  /**
   * How wide a tab is drawn, in characters.
   * @default 4
   */
  tabSize?: number;

  /**
   * Whether Tab types a tab instead of moving to the next control. Editor only.
   *
   * Off, because a control a keyboard cannot leave is a page a keyboard cannot
   * leave, and an editor is rarely the only thing on a page. On, there are two
   * ways out and both are the ones somebody would try: Shift+Tab always moves
   * back a control, and Escape hands the next Tab to the browser.
   *
   * @default false
   */
  indentWithTab?: boolean;

  /**
   * Whether the browser marks its own spelling mistakes in the fields.
   * Editor only.
   * @default false
   */
  spellCheck?: boolean;

  /**
   * Which palette to draw in. `system` follows the reader's own setting.
   * @default 'system'
   */
  colorScheme?: DiffineColorScheme;

  /**
   * The typeface the two documents are drawn in.
   *
   * Anything left out keeps the stylesheet's own value, so `{ size: 15 }` is a
   * whole answer. The same four values can be set as custom properties on the
   * element instead; this is the way in for an application that holds them in
   * its own state rather than in its own CSS.
   */
  font?: DiffineFont;

  /**
   * The language of the component's own words — not of the documents.
   * @default 'en'
   */
  locale?: DiffineLocale;

  /** Words to use instead of the locale's, for any of them. */
  strings?: Partial<DiffineStrings>;

  /**
   * What the two documents are written in, so that they are coloured as it.
   *
   * A highlight.js identifier — `typescript`, `python`, `xml` — or `plain` for
   * a document that is not code. `DIFFINE_LANGUAGES` is the whole list, with
   * the name to write beside each one.
   *
   * In `editor` mode, passing it makes it the application's in the usual React
   * pair: the menu reports through `onLanguageChange` and does not change on
   * its own. Leave it out and pass `defaultLanguage` to let the component keep
   * it, which is what a page where somebody pastes a document nobody knew about
   * wants.
   *
   * The grammar is fetched when it is asked for and not before, so a component
   * left on `plain` downloads none of highlight.js. The first paint after one
   * arrives is the document coloured; the one before it is the document.
   *
   * @default 'plain'
   */
  language?: string;
  /** Which language to start on, when the component is to keep it. @default 'plain' */
  defaultLanguage?: string;
  /** A language was chosen, from the menu or by the application. Editor only. */
  onLanguageChange?: (language: string) => void;

  /**
   * Whether what the documents are being coloured as is drawn at the right end
   * of the bar above them.
   *
   * The name in `viewer` mode, where the application decided it; the menu it
   * was chosen from in `editor` mode, where a document somebody pasted is a
   * document nobody knew the language of.
   *
   * @default true
   */
  languageLabel?: boolean;

  /**
   * How a line is coloured beyond what the comparison says about it, which is
   * where a syntax highlighter of the application's own goes. See
   * {@link DiffineHighlight}.
   *
   * This replaces `language` rather than adding to it, and it leaves the menu
   * showing a language nothing is being coloured as — so a component that
   * passes it usually turns `languageLabel` off as well.
   */
  highlight?: DiffineHighlight;
}

/** No lines at all, for a layout the drawn view has no use for. */
const NO_LINES: PaneLayout = { lines: [], positions: new Int32Array(0), widest: null };

/**
 * Two documents, what happened between them, and — where it is asked for — a
 * way to type into either of them.
 *
 * ```tsx
 * import { TextDiff } from 'diffine-react';
 * import 'diffine-react/styles.css';
 *
 * <TextDiff before={saved} after={draft} />;
 * <TextDiff mode="editor" defaultBefore={saved} defaultAfter={draft} />;
 * ```
 *
 * One component rather than two, because reading a comparison and writing one
 * were never two things. Both draw the same rows out of the same engine, hold
 * them level or not, colour them with the same highlighter, step through the
 * changes with the same buttons and search them with the same bar. What the
 * editor adds is a `<textarea>` laid over each pane's lines, so that what a
 * reader sees is the comparison and what they type into is a plain field —
 * with the browser's undo, its input method and its selection left alone.
 *
 * Which parts are drawn is entirely a matter of the props above: every one of
 * them is a boolean with a default, so the same component covers a full
 * side-by-side with connectors and a bare column of lines in a panel too narrow
 * for anything else, without a stylesheet being touched.
 */
export function TextDiff({
  mode = 'viewer',
  before,
  after,
  defaultBefore,
  defaultAfter,
  onBeforeChange,
  onAfterChange,
  onDiff,
  result,
  readOnly = false,
  diff,
  view = 'split',
  lineNumbers = true,
  markers = true,
  wrap = false,
  alignLines = true,
  connectors = true,
  syncScroll = true,
  header = true,
  navigation = true,
  search = true,
  summary = true,
  virtualize = true,
  selected: selectedProp,
  defaultSelected = -1,
  onSelectedChange,
  tabSize = 4,
  indentWithTab = false,
  spellCheck = false,
  colorScheme = 'system',
  font,
  locale = 'en',
  strings: overrides,
  language: languageProp,
  defaultLanguage = 'plain',
  onLanguageChange,
  languageLabel = true,
  highlight,
  className,
  style,
  onKeyDown: onKeyDownProp,
  ...rest
}: TextDiffProps): React.JSX.Element {
  const editing = mode === 'editor';
  const strings = React.useMemo(() => stringsFor(locale, overrides), [locale, overrides]);
  const beforeSource = sourceOf(before ?? defaultBefore, strings.before);
  const afterSource = sourceOf(after ?? defaultAfter, strings.after);

  /*
   * Who holds the two documents, and the one place the two modes disagree
   * about it.
   *
   * An editable document is a value in the usual React pair: given `before` it
   * is the application's and reported through `onBeforeChange`, given
   * `defaultBefore` it is the component's — and which of the two it is, is
   * settled on the first render and does not change afterwards.
   *
   * A document nobody can type into has no such question to settle, so it is
   * read from the props on every render instead. Deciding once would freeze a
   * viewer that was handed `before={data?.text}` on the render before the data
   * arrived, which is most of the viewers there are.
   */
  const [beforeHeld, setBeforeHeld] = useControlled(
    contentOf(before),
    contentOf(defaultBefore) ?? ''
  );
  const [afterHeld, setAfterHeld] = useControlled(contentOf(after), contentOf(defaultAfter) ?? '');
  const [languageHeld, setLanguage] = useControlled(languageProp, defaultLanguage);

  const beforeText = editing ? beforeHeld : beforeSource.content;
  const afterText = editing ? afterHeld : afterSource.content;
  const language = editing ? languageHeld : (languageProp ?? defaultLanguage);

  // The second pane in a split view; the only one in a unified view. Naming it
  // for the side it usually holds is a small lie that keeps the refs from being
  // three things where two will do.
  const firstPane = React.useRef<HTMLDivElement>(null);
  const secondPane = React.useRef<HTMLDivElement>(null);
  // The fields, held here rather than inside the panes: a search moves the
  // caret to what it found, and a replace writes through the browser's own
  // editing command, and both of those are the field's business. Both are null
  // in a mode that draws no fields.
  const beforeField = React.useRef<HTMLTextAreaElement>(null);
  const afterField = React.useRef<HTMLTextAreaElement>(null);

  const beforeReadOnly = readOnly === true || readOnly === 'before';
  const afterReadOnly = readOnly === true || readOnly === 'after';

  // Every option of its own rather than the object holding them. An application
  // that writes `diff={{ whitespace: 'trailing' }}` inline hands over a new
  // object on every render, and depending on the object would compare the two
  // documents again each time for an answer that had not changed.
  const inline: DiffInlineMode | undefined = diff?.inline;
  const whitespace: DiffWhitespace | undefined = diff?.whitespace;
  const ignoreCase = diff?.ignoreCase;
  const inlineThreshold = diff?.inlineThreshold;
  const maxCost = diff?.maxCost;
  const given = editing ? undefined : result;

  const comparison = React.useMemo(
    () =>
      given ??
      diffText(beforeText, afterText, {
        inline,
        whitespace,
        ignoreCase,
        inlineThreshold,
        maxCost
      }),
    [given, beforeText, afterText, inline, whitespace, ignoreCase, inlineThreshold, maxCost]
  );

  /*
   * The comparison, handed on once per comparison.
   *
   * The callback is kept in a ref rather than depended on, so an application
   * that writes the handler inline — which is most of them — is told when the
   * two documents changed rather than on every render of its own.
   */
  const latest = React.useRef(onDiff);

  useIsomorphicLayoutEffect(() => {
    latest.current = onDiff;
  });

  React.useEffect(() => {
    latest.current?.(comparison);
  }, [comparison]);

  // A field cannot be a unified column and cannot be padded out with blanks, so
  // the editor is a split view with the two documents at their own lengths.
  const split = editing || view === 'split';
  const aligned = !editing && alignLines;
  /*
   * Nothing to draw, which is a comparison with no rows in it rather than two
   * empty props: a viewer handed a `result` on its own has both of those props
   * empty and a document to draw. An editor is never this — an empty document
   * is one empty line with a caret in it.
   */
  const empty = !editing && comparison.rows.length === 0;

  /*
   * The two documents as text, for the sizes written under the panes.
   *
   * Normally that is what was passed in. An application that worked the
   * comparison out elsewhere and handed over `result` alone has no `before` to
   * pass, so the lines it holds are joined back into one — which is the only
   * place in the component that copies a whole document, and it happens once
   * per comparison rather than once per render.
   */
  const beforeMeasured = React.useMemo(
    () => (beforeText === '' && given ? given.before.join('\n') : beforeText),
    [beforeText, given]
  );
  const afterMeasured = React.useMemo(
    () => (afterText === '' && given ? given.after.join('\n') : afterText),
    [afterText, given]
  );

  const owner = React.useMemo(
    () => changeOfRow(comparison.rows.length, comparison.changes),
    [comparison]
  );
  const beforeLayout = React.useMemo(
    () =>
      editing
        ? fieldLayout(comparison.rows, owner, 'before', beforeText)
        : splitLayout(comparison.rows, owner, 'before', aligned),
    [comparison, owner, editing, beforeText, aligned]
  );
  const afterLayout = React.useMemo(
    () =>
      editing
        ? fieldLayout(comparison.rows, owner, 'after', afterText)
        : splitLayout(comparison.rows, owner, 'after', aligned),
    [comparison, owner, editing, afterText, aligned]
  );
  const oneColumn = React.useMemo(
    () => (split ? NO_LINES : unifiedLayout(comparison.rows, comparison.changes, owner)),
    [split, comparison, owner]
  );

  const layouts = split ? [beforeLayout, afterLayout] : [oneColumn];
  const panes = React.useMemo(() => (split ? [firstPane, secondPane] : [firstPane]), [split]);

  // Everything that moves a line. What is worked out from the drawn document —
  // the height of a wrapped row, the band between two panes, which lines are
  // worth drawing at all — is worked out again when one of these has changed
  // and left alone the rest of the time.
  const layoutDeps = [
    comparison,
    editing,
    view,
    wrap,
    aligned,
    lineNumbers,
    markers,
    // A row's height and a character's width both follow the typeface, and
    // everything measured from either is worked out again when it changes.
    font?.family,
    font?.size,
    font?.lineHeight,
    font?.letterSpacing
  ];

  const { windows, rowHeight, remeasure } = useVirtualRows(
    panes,
    layouts.map((layout) => layout.lines.length),
    virtualize && !wrap && !empty,
    layoutDeps
  );

  useRowAlignment(firstPane, secondPane, split && wrap && aligned, layoutDeps);
  // `empty` is on the list because it decides whether the panes are on the page
  // at all: without it, a view that started with nothing and was then given two
  // documents would have listeners on the elements it no longer has.
  useSyncedScroll(firstPane, secondPane, split && syncScroll && !empty, aligned);

  const { current, step } = useChangeNavigation({
    changes: comparison.changes,
    panes,
    layouts,
    rowHeight,
    remeasure,
    selected: selectedProp,
    defaultSelected,
    onSelectedChange
  });

  /**
   * Where a match sits in the document rather than in the line that holds it.
   *
   * Everything a search works with is a range inside a drawn line, which is
   * what the highlighting needs and what a `<textarea>` cannot be told anything
   * about. A field counts one document from the beginning, so the line has to
   * be turned back into the characters in front of it.
   */
  function offsetOf(side: DiffineSide, match: SearchMatch): { start: number; end: number } | null {
    const text = side === 'before' ? beforeText : afterText;

    return rangeOf(side === 'before' ? beforeLayout : afterLayout, lineStarts(text), match);
  }

  /** Puts the caret on what the search moved to, for a pane that has one. */
  function moveCaret(side: DiffineSide, match: SearchMatch): void {
    const field = side === 'before' ? beforeField.current : afterField.current;
    const range = field && offsetOf(side, match);

    if (field && range) {
      field.setSelectionRange(range.start, range.end);
    }
  }

  /*
   * One search per pane, opened and closed on its own.
   *
   * Both are held whichever view is drawn, because a hook cannot be called
   * behind a condition: a unified view has one pane, and the second search runs
   * over no lines until a split view puts a document back under it.
   */
  const searchable = search && !empty;
  const firstSearch = useDocumentSearch({
    enabled: searchable,
    layout: layouts[0],
    pane: firstPane,
    rowHeight,
    remeasure,
    onReveal: (match) => moveCaret('before', match)
  });
  const secondSearch = useDocumentSearch({
    enabled: searchable && split,
    layout: layouts[1] ?? NO_LINES,
    pane: secondPane,
    rowHeight,
    remeasure,
    onReveal: (match) => moveCaret('after', match)
  });

  /**
   * Writes `text` over one range of a document.
   *
   * Through the field where there is one, so that the browser's undo stack has
   * the edit on it and a reader can take it back with Ctrl+Z the way they would
   * take back anything else they typed. Where that command has gone, the value
   * is set instead and the undo stack goes with it — which is worse, and is
   * still better than a Replace button that does nothing.
   */
  function write(side: DiffineSide, whole: string, start: number, end: number, text: string): void {
    const field = side === 'before' ? beforeField.current : afterField.current;

    if (field && typeOver(field, start, end, text)) {
      return;
    }

    if (side === 'before') {
      setBeforeHeld(whole);
      onBeforeChange?.(whole);
    } else {
      setAfterHeld(whole);
      onAfterChange?.(whole);
    }
  }

  function replaceOne(side: DiffineSide): void {
    const pane = side === 'before' ? firstSearch : secondSearch;
    const text = side === 'before' ? beforeText : afterText;
    const range = pane.match && offsetOf(side, pane.match);

    if (!range) {
      return;
    }

    write(
      side,
      `${text.slice(0, range.start)}${pane.replacement}${text.slice(range.end)}`,
      range.start,
      range.end,
      pane.replacement
    );
    // The document is about to be compared again and searched again, and the
    // match a reader was on has just stopped being one. Asking for the one that
    // takes its place is what makes Replace pressed twice move down the file.
    pane.reveal();
  }

  function replaceEvery(side: DiffineSide): void {
    const pane = side === 'before' ? firstSearch : secondSearch;
    const text = side === 'before' ? beforeText : afterText;
    const layout = side === 'before' ? beforeLayout : afterLayout;
    const starts = lineStarts(text);
    // Every match rather than the ones that were counted: the count stops at a
    // limit, and a button called Replace All that left some behind would be a
    // lie about what it did.
    const ranges = pane
      .all()
      .map((match) => rangeOf(layout, starts, match))
      .filter((range) => range !== null);

    if (ranges.length === 0) {
      return;
    }

    const whole = replacedText(text, ranges, pane.replacement);

    write(side, whole, 0, text.length, whole);
    pane.reveal();
  }

  /** Which pane a key was pressed in, which is the one the shortcut opens. */
  function searchOf(target: EventTarget | null): DocumentSearch {
    const element = target instanceof Element ? target.closest('[data-side]') : null;

    return split && element?.getAttribute('data-side') === 'after' ? secondSearch : firstSearch;
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
    onKeyDownProp?.(event);

    if (!searchable || event.defaultPrevented) {
      return;
    }

    // Ctrl+F and Ctrl+H, or Cmd+F and Cmd+H where that is the modifier. Every
    // other combination with those letters in it belongs to the browser.
    if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) {
      return;
    }

    const key = event.key.toLowerCase();

    if (key !== 'f' && (key !== 'h' || !editing)) {
      return;
    }

    const found = searchOf(event.target);
    const editable = editing && !(found === firstSearch ? beforeReadOnly : afterReadOnly);

    event.preventDefault();
    found.show(key === 'h' && editable);
  }

  const syntax = useSyntaxHighlight(language, comparison.before, comparison.after);
  // The application's own highlighter replaces the language rather than joining
  // it. A line has one set of runs, and two of them cutting it at once is not a
  // question with an answer.
  const colour = highlight ?? syntax;

  const digits = String(
    editing
      ? Math.max(beforeLayout.lines.length, afterLayout.lines.length, 1)
      : Math.max(comparison.before.length, comparison.after.length, 1)
  ).length;
  const tools = (navigation && !empty) || languageLabel || searchable;
  const bar = header || tools;
  const bothLabel = `${beforeSource.label} → ${afterSource.label}`;
  const firstLabel = split ? beforeSource.label : bothLabel;

  return (
    <div
      className={[editing ? 'diffine diffine-editor' : 'diffine', className]
        .filter(Boolean)
        .join(' ')}
      data-view={split ? 'split' : 'unified'}
      data-linked={split && connectors}
      data-scheme={colorScheme}
      data-wrap={wrap}
      data-align={aligned}
      // Which columns the gutter has, so the stylesheet can work out how wide
      // it is — for the stripe that carries it past the last line of a document
      // shorter than the pane it is in, and for the padding that starts a field
      // where the lines behind it start.
      data-numbers={lineNumbers}
      data-markers={markers}
      style={
        {
          '--diffine-digits': digits,
          '--diffine-tab-size': tabSize,
          ...fontVariables(font),
          ...style
        } as React.CSSProperties
      }
      onKeyDown={onKeyDown}
      {...rest}
    >
      {bar ? (
        <div className="diffine-header">
          <div className="diffine-title" data-side="before">
            {header ? <span className="diffine-label">{beforeSource.label}</span> : null}
            {searchable && split ? (
              <div className="diffine-tools">
                <DiffineFindToggle
                  search={firstSearch}
                  label={beforeSource.label}
                  strings={strings}
                />
              </div>
            ) : null}
          </div>
          {split && connectors ? <div className="diffine-title-gap" aria-hidden="true" /> : null}
          <div className="diffine-title" data-side="after">
            {header ? <span className="diffine-label">{afterSource.label}</span> : null}
            {tools ? (
              <div className="diffine-tools">
                {navigation && !empty ? (
                  <DiffineNav
                    total={comparison.changes.length}
                    current={current}
                    onStep={step}
                    strings={strings}
                  />
                ) : null}
                {searchable ? (
                  <DiffineFindToggle
                    search={split ? secondSearch : firstSearch}
                    label={split ? afterSource.label : bothLabel}
                    strings={strings}
                  />
                ) : null}
                {languageLabel ? (
                  editing ? (
                    <DiffineLanguagePicker
                      language={language}
                      onLanguageChange={(chosen) => {
                        setLanguage(chosen);
                        onLanguageChange?.(chosen);
                      }}
                      strings={strings}
                    />
                  ) : (
                    <DiffineLanguageName language={language} strings={strings} />
                  )
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {empty ? (
        <div className="diffine-empty">{strings.empty}</div>
      ) : (
        <div className="diffine-body">
          {editing ? (
            <TextDiffField
              side="before"
              name={beforeSource.label}
              value={beforeText}
              onValueChange={(value) => {
                setBeforeHeld(value);
                onBeforeChange?.(value);
              }}
              readOnly={beforeReadOnly}
              spellCheck={spellCheck}
              indentWithTab={indentWithTab}
              wrap={wrap}
              layout={beforeLayout}
              window={windows[0]}
              rowHeight={rowHeight}
              current={current}
              lineNumbers={lineNumbers}
              markers={markers}
              strings={strings}
              highlight={colour}
              matches={firstSearch.rows}
              match={firstSearch.match}
              paneRef={firstPane}
              fieldRef={beforeField}
            />
          ) : (
            <TextDiffPane
              side={split ? 'before' : 'unified'}
              name={firstLabel}
              layout={layouts[0]}
              window={windows[0]}
              rowHeight={rowHeight}
              current={current}
              lineNumbers={lineNumbers}
              markers={markers}
              strings={strings}
              highlight={colour}
              matches={firstSearch.rows}
              match={firstSearch.match}
              paneRef={firstPane}
            />
          )}
          {split && connectors ? (
            <DiffineLinks
              changes={comparison.changes}
              beforeLayout={beforeLayout}
              afterLayout={afterLayout}
              before={firstPane}
              after={secondPane}
              rowHeight={rowHeight}
              current={current}
              deps={layoutDeps}
            />
          ) : null}
          {split ? (
            editing ? (
              <TextDiffField
                side="after"
                name={afterSource.label}
                value={afterText}
                onValueChange={(value) => {
                  setAfterHeld(value);
                  onAfterChange?.(value);
                }}
                readOnly={afterReadOnly}
                spellCheck={spellCheck}
                indentWithTab={indentWithTab}
                wrap={wrap}
                layout={afterLayout}
                window={windows[1]}
                rowHeight={rowHeight}
                current={current}
                lineNumbers={lineNumbers}
                markers={markers}
                strings={strings}
                highlight={colour}
                matches={secondSearch.rows}
                match={secondSearch.match}
                paneRef={secondPane}
                fieldRef={afterField}
              />
            ) : (
              <TextDiffPane
                side="after"
                name={afterSource.label}
                layout={afterLayout}
                window={windows[1]}
                rowHeight={rowHeight}
                current={current}
                lineNumbers={lineNumbers}
                markers={markers}
                strings={strings}
                highlight={colour}
                matches={secondSearch.rows}
                match={secondSearch.match}
                paneRef={secondPane}
              />
            )
          ) : null}
        </div>
      )}

      {firstSearch.open || secondSearch.open ? (
        <div className="diffine-find-bar">
          <div className="diffine-find-cell" data-side="before">
            {firstSearch.open ? (
              <DiffineFind
                search={firstSearch}
                label={firstLabel}
                replaceable={editing && !beforeReadOnly}
                onReplace={() => replaceOne('before')}
                onReplaceAll={() => replaceEvery('before')}
                onClose={() => (beforeField.current ?? firstPane.current)?.focus()}
                strings={strings}
              />
            ) : null}
          </div>
          {split && connectors ? <div className="diffine-find-gap" aria-hidden="true" /> : null}
          {split ? (
            <div className="diffine-find-cell" data-side="after">
              {secondSearch.open ? (
                <DiffineFind
                  search={secondSearch}
                  label={afterSource.label}
                  replaceable={editing && !afterReadOnly}
                  onReplace={() => replaceOne('after')}
                  onReplaceAll={() => replaceEvery('after')}
                  onClose={() => (afterField.current ?? secondPane.current)?.focus()}
                  strings={strings}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {summary && !empty ? (
        <DiffineSummary
          before={beforeMeasured}
          after={afterMeasured}
          beforeLabel={beforeSource.label}
          afterLabel={afterSource.label}
          changes={comparison.changes.length}
          inserted={comparison.stats.inserted + comparison.stats.changed}
          deleted={comparison.stats.deleted + comparison.stats.changed}
          linked={split && connectors}
          locale={locale}
          strings={strings}
        />
      ) : null}
    </div>
  );
}
