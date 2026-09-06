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
  DiffineSide,
  DiffineStrings
} from '../../types.js';
import { diffText } from '../../diff.js';
import { useControlled } from '../../internal/controlled.js';
import { typeOver } from '../../internal/field.js';
import { fontVariables } from '../../internal/font.js';
import { stringsFor } from '../../internal/i18n.js';
import { useIsomorphicLayoutEffect } from '../../internal/layout.js';
import { useChangeNavigation } from '../../internal/navigate.js';
import { changeOfRow, fieldLayout } from '../../internal/rows.js';
import { useSyntaxHighlight } from '../../internal/highlight/useSyntax.js';
import { useSyncedScroll } from '../../internal/scroll.js';
import {
  lineStarts,
  rangeOf,
  replacedText,
  useDocumentSearch,
  type SearchMatch
} from '../../internal/search.js';
import { contentOf, sourceOf } from '../../internal/source.js';
import { useVirtualRows } from '../../internal/virtual.js';
import { DiffineFind, DiffineFindToggle } from '../shared/DiffineFind.js';
import { DiffineLanguagePicker } from '../shared/DiffineLanguage.js';
import { DiffineLinks } from '../shared/DiffineLinks.js';
import { DiffineNav } from '../shared/DiffineNav.js';
import { DiffineSummary } from '../shared/DiffineSummary.js';
import { DiffineEditorPane } from './DiffineEditorPane.js';

export interface DiffineEditorProps extends Omit<
  React.ComponentPropsWithoutRef<'div'>,
  'children' | 'title' | 'onChange' | 'defaultValue'
> {
  /**
   * The document on the left, held by the application.
   *
   * Passing it makes the field a controlled one in the usual React sense: it
   * shows what it is given and reports what a reader typed through
   * `onBeforeChange`, and it is the application's job to hand the new text
   * back. Leave it out and pass `defaultBefore` instead to let the editor keep
   * the document itself.
   */
  before?: DiffineInput;
  /** The document on the right. */
  after?: DiffineInput;

  /** What the left field starts with, when the editor is to keep the document. */
  defaultBefore?: DiffineInput;
  /** What the right field starts with. */
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
   * Which side cannot be typed into. `true` is both of them.
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
   * The comparison is run again on every keystroke, and what bounds it is
   * `maxCost` — see {@link DiffOptions.maxCost} for what happens past it.
   */
  diff?: DiffOptions;

  /**
   * Whether each line carries its number.
   * @default true
   */
  lineNumbers?: boolean;

  /**
   * Whether a changed line carries a `+`, `−` or `~` beside it.
   * @default true
   */
  markers?: boolean;

  /**
   * Whether a line too long for the pane wraps or runs off the side.
   * @default false
   */
  wrap?: boolean;

  /**
   * Whether the column between the panes draws each change as a band from where
   * it left to where it arrived.
   * @default true
   */
  connectors?: boolean;

  /**
   * Whether scrolling one pane scrolls the other.
   *
   * The two documents are not held level — a field cannot be padded out with
   * blank lines somebody would be able to type into — so this follows the
   * fraction of the way down rather than the line number.
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
   * @default true
   */
  navigation?: boolean;

  /**
   * Whether the bar under the fields is drawn: what each document weighs, and
   * how many changes there are between them.
   * @default true
   */
  summary?: boolean;

  /**
   * Whether a reader can search the documents from inside the editor.
   *
   * A pane at a time, with a button in the bar above each side and a bar of its
   * own underneath it. Ctrl+F, or Cmd+F, opens the one for the field the caret
   * is in; Ctrl+R opens it with the row for replacing already drawn, which a
   * side that cannot be typed into does not get.
   *
   * @default true
   */
  search?: boolean;

  /**
   * Whether only the lines a reader can see are drawn behind the fields.
   *
   * The field itself holds the whole document either way — that part is the
   * browser's — and this is about the lines under it, which are elements. It
   * needs every line to be the same height, so `wrap` turns it off.
   *
   * @default true
   */
  virtualize?: boolean;

  /**
   * Which change a reader has moved to, as an index into `changes`, or -1.
   *
   * Passing it makes it the application's, exactly as in the viewer.
   */
  selected?: number;
  /** Which change to start on, when the editor is to keep it itself. @default -1 */
  defaultSelected?: number;
  /** A change was moved to, by the buttons or by the application. */
  onSelectedChange?: (selected: number, change: DiffChange | null) => void;

  /**
   * How wide a tab is drawn, in characters.
   * @default 4
   */
  tabSize?: number;

  /**
   * Whether Tab types a tab instead of moving to the next control.
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
   * The language of the editor's own words — not of the documents.
   * @default 'en'
   */
  locale?: DiffineLocale;

  /** Words to use instead of the locale's, for any of them. */
  strings?: Partial<DiffineStrings>;

  /**
   * What the two documents are written in, so that they are coloured as it.
   *
   * A highlight.js identifier — `typescript`, `python`, `xml` — or `plain` for
   * a document that is not code. `DIFFINE_LANGUAGES` is the whole list, and it
   * is the list the menu above the panes is built from.
   *
   * Passing it makes it the application's, in the usual React pair: the menu
   * reports through `onLanguageChange` and does not change on its own. Leave it
   * out and pass `defaultLanguage` to let the editor keep it, which is what a
   * page where somebody pastes a document nobody knew about wants.
   *
   * The grammar is fetched when it is asked for and not before, so an editor
   * left on `plain` downloads none of highlight.js.
   */
  language?: string;
  /** Which language to start on, when the editor is to keep it. @default 'plain' */
  defaultLanguage?: string;
  /** A language was chosen, from the menu or by the application. */
  onLanguageChange?: (language: string) => void;

  /**
   * Whether the menu of languages is drawn at the right end of the bar above
   * the fields.
   * @default true
   */
  languagePicker?: boolean;

  /**
   * How a line is coloured beyond what the comparison says about it, which is
   * where a syntax highlighter of the application's own goes. See
   * {@link DiffineHighlight}.
   *
   * This replaces `language` rather than adding to it, and it leaves the menu
   * showing a language nothing is being coloured as — so an editor that passes
   * it usually turns `languagePicker` off as well.
   */
  highlight?: DiffineHighlight;
}

/**
 * Two documents somebody can type into, and the comparison between them,
 * redrawn as they type.
 *
 * ```tsx
 * import { DiffineEditor } from 'diffine-react';
 * import 'diffine-react/styles.css';
 *
 * <DiffineEditor defaultBefore={saved} defaultAfter={draft} />;
 * ```
 *
 * It is the viewer with the two panes made editable, and it means that
 * literally: the same comparison, the same lines, the same bands across the
 * column between them, the same buttons for stepping through the changes. What
 * is different is that each pane carries a field over its lines, so what a
 * reader sees is the comparison and what they type into is a plain
 * `<textarea>` — with the browser's undo, its input method and its selection
 * left alone.
 *
 * One thing the viewer does is not possible here. A viewer holds the two sides
 * level by putting a blank opposite a line that has no counterpart, and a blank
 * in a field is a line somebody can put the caret in. So the two documents run
 * at their own lengths, and the column between the panes is what says which
 * part of one answers which part of the other.
 *
 * The comparison is worked out again on every keystroke rather than after a
 * pause. An edit to a document that has already been compared is a small edit,
 * and a small edit is the cheap case for the engine; `diff.maxCost` is what
 * bounds the other one.
 */
export function DiffineEditor({
  before,
  after,
  defaultBefore,
  defaultAfter,
  onBeforeChange,
  onAfterChange,
  onDiff,
  readOnly = false,
  diff,
  lineNumbers = true,
  markers = true,
  wrap = false,
  connectors = true,
  syncScroll = true,
  header = true,
  navigation = true,
  summary = true,
  search = true,
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
  languagePicker = true,
  highlight,
  className,
  style,
  onKeyDown: onKeyDownProp,
  ...rest
}: DiffineEditorProps): React.JSX.Element {
  const strings = React.useMemo(() => stringsFor(locale, overrides), [locale, overrides]);
  const beforeLabel = sourceOf(before ?? defaultBefore, strings.before).label;
  const afterLabel = sourceOf(after ?? defaultAfter, strings.after).label;

  // Which of the two holds each document is settled on the first render and
  // does not change afterwards — see `useControlled`. The reporting happens
  // either way, so an application can watch a document it is not managing.
  const [beforeText, setBeforeText] = useControlled(
    contentOf(before),
    contentOf(defaultBefore) ?? ''
  );
  const [afterText, setAfterText] = useControlled(contentOf(after), contentOf(defaultAfter) ?? '');
  const [language, setLanguage] = useControlled(languageProp, defaultLanguage);

  const beforePane = React.useRef<HTMLDivElement>(null);
  const afterPane = React.useRef<HTMLDivElement>(null);
  // The fields themselves, held here rather than inside the panes: a search
  // moves the caret to what it found, and a replace writes through the
  // browser's own editing command, and both of those are the field's business.
  const beforeField = React.useRef<HTMLTextAreaElement>(null);
  const afterField = React.useRef<HTMLTextAreaElement>(null);

  const beforeReadOnly = readOnly === true || readOnly === 'before';
  const afterReadOnly = readOnly === true || readOnly === 'after';

  // Every option of its own rather than the object holding them. An application
  // that writes `diff={{ whitespace: 'trailing' }}` inline hands over a new
  // object on every render, and depending on the object would compare the two
  // documents again on every keystroke for a reason that was not the keystroke.
  const inline: DiffInlineMode | undefined = diff?.inline;
  const whitespace: DiffWhitespace | undefined = diff?.whitespace;
  const ignoreCase = diff?.ignoreCase;
  const inlineThreshold = diff?.inlineThreshold;
  const maxCost = diff?.maxCost;

  const comparison = React.useMemo(
    () =>
      diffText(beforeText, afterText, {
        inline,
        whitespace,
        ignoreCase,
        inlineThreshold,
        maxCost
      }),
    [beforeText, afterText, inline, whitespace, ignoreCase, inlineThreshold, maxCost]
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

  const owner = React.useMemo(
    () => changeOfRow(comparison.rows.length, comparison.changes),
    [comparison]
  );
  const beforeLayout = React.useMemo(
    () => fieldLayout(comparison.rows, owner, 'before', beforeText),
    [comparison, owner, beforeText]
  );
  const afterLayout = React.useMemo(
    () => fieldLayout(comparison.rows, owner, 'after', afterText),
    [comparison, owner, afterText]
  );

  const layouts = [beforeLayout, afterLayout];
  const panes = [beforePane, afterPane];

  // Everything that moves a line. What is worked out from the drawn document —
  // the band between two panes, which lines are worth drawing at all — is
  // worked out again when one of these has changed and left alone otherwise.
  const layoutDeps = [
    comparison,
    wrap,
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
    virtualize && !wrap,
    layoutDeps
  );

  // Never aligned: the two documents are their own lengths, because a blank
  // line put in to hold them level would be a line somebody could type into.
  useSyncedScroll(beforePane, afterPane, syncScroll, false);

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
   * what the highlighting needs and what a `<textarea>` cannot be told
   * anything about. A field counts one document from the beginning, so the
   * line has to be turned back into the characters in front of it.
   */
  function offsetOf(side: DiffineSide, match: SearchMatch): { start: number; end: number } | null {
    const text = side === 'before' ? beforeText : afterText;

    return rangeOf(side === 'before' ? beforeLayout : afterLayout, lineStarts(text), match);
  }

  /** Puts the caret on what the search moved to, so that closing it lands there. */
  function moveCaret(side: DiffineSide, match: SearchMatch): void {
    const field = side === 'before' ? beforeField.current : afterField.current;
    const range = offsetOf(side, match);

    if (field && range) {
      field.setSelectionRange(range.start, range.end);
    }
  }

  const beforeSearch = useDocumentSearch({
    enabled: search,
    layout: beforeLayout,
    pane: beforePane,
    rowHeight,
    remeasure,
    onReveal: (match) => moveCaret('before', match)
  });
  const afterSearch = useDocumentSearch({
    enabled: search,
    layout: afterLayout,
    pane: afterPane,
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
      setBeforeText(whole);
      onBeforeChange?.(whole);
    } else {
      setAfterText(whole);
      onAfterChange?.(whole);
    }
  }

  function replaceOne(side: DiffineSide): void {
    const pane = side === 'before' ? beforeSearch : afterSearch;
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
    const pane = side === 'before' ? beforeSearch : afterSearch;
    const text = side === 'before' ? beforeText : afterText;
    const starts = lineStarts(text);
    const layout = side === 'before' ? beforeLayout : afterLayout;
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

  /** Which field a key was pressed in, which is the pane the shortcut opens. */
  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
    onKeyDownProp?.(event);

    if (!search || event.defaultPrevented) {
      return;
    }

    // Ctrl+F and Ctrl+R, or Cmd+F and Cmd+R where that is the modifier. Every
    // other combination with those letters in it belongs to the browser.
    if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) {
      return;
    }

    const key = event.key.toLowerCase();

    if (key !== 'f' && key !== 'r') {
      return;
    }

    const element = event.target instanceof Element ? event.target.closest('[data-side]') : null;
    const side: DiffineSide = element?.getAttribute('data-side') === 'after' ? 'after' : 'before';
    const editable = side === 'before' ? !beforeReadOnly : !afterReadOnly;

    event.preventDefault();
    (side === 'before' ? beforeSearch : afterSearch).show(key === 'r' && editable);
  }

  const syntax = useSyntaxHighlight(language, comparison.before, comparison.after);
  // The application's own highlighter replaces the language rather than joining
  // it. A line has one set of runs, and two of them cutting it at once is not a
  // question with an answer.
  const colour = highlight ?? syntax;

  const digits = String(Math.max(beforeLayout.lines.length, afterLayout.lines.length, 1)).length;
  const tools = navigation || languagePicker || search;

  return (
    <div
      className={className ? `diffine diffine-editor ${className}` : 'diffine diffine-editor'}
      data-view="split"
      data-linked={connectors}
      data-scheme={colorScheme}
      data-wrap={wrap}
      data-align={false}
      // Which columns the gutter has. The stylesheet works its width out from
      // these two, and both the padding that starts the field where the lines
      // behind it start and the stripe that carries the gutter past the last
      // line are measured from that one number.
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
      {header || tools ? (
        <div className="diffine-header">
          <div className="diffine-title" data-side="before">
            {header ? <span className="diffine-label">{beforeLabel}</span> : null}
            {search ? (
              <div className="diffine-tools">
                <DiffineFindToggle search={beforeSearch} label={beforeLabel} strings={strings} />
              </div>
            ) : null}
          </div>
          {connectors ? <div className="diffine-title-gap" aria-hidden="true" /> : null}
          <div className="diffine-title" data-side="after">
            {header ? <span className="diffine-label">{afterLabel}</span> : null}
            {tools ? (
              <div className="diffine-tools">
                {navigation ? (
                  <DiffineNav
                    total={comparison.changes.length}
                    current={current}
                    onStep={step}
                    strings={strings}
                  />
                ) : null}
                {search ? (
                  <DiffineFindToggle search={afterSearch} label={afterLabel} strings={strings} />
                ) : null}
                {languagePicker ? (
                  <DiffineLanguagePicker
                    language={language}
                    onLanguageChange={(chosen) => {
                      setLanguage(chosen);
                      onLanguageChange?.(chosen);
                    }}
                    strings={strings}
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="diffine-body">
        <DiffineEditorPane
          side="before"
          name={beforeLabel}
          value={beforeText}
          onValueChange={(value) => {
            setBeforeText(value);
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
          matches={beforeSearch.rows}
          match={beforeSearch.match}
          paneRef={beforePane}
          fieldRef={beforeField}
        />
        {connectors ? (
          <DiffineLinks
            changes={comparison.changes}
            beforeLayout={beforeLayout}
            afterLayout={afterLayout}
            before={beforePane}
            after={afterPane}
            rowHeight={rowHeight}
            current={current}
            deps={layoutDeps}
          />
        ) : null}
        <DiffineEditorPane
          side="after"
          name={afterLabel}
          value={afterText}
          onValueChange={(value) => {
            setAfterText(value);
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
          matches={afterSearch.rows}
          match={afterSearch.match}
          paneRef={afterPane}
          fieldRef={afterField}
        />
      </div>

      {beforeSearch.open || afterSearch.open ? (
        <div className="diffine-find-bar">
          <div className="diffine-find-cell" data-side="before">
            {beforeSearch.open ? (
              <DiffineFind
                search={beforeSearch}
                label={beforeLabel}
                replaceable={!beforeReadOnly}
                onReplace={() => replaceOne('before')}
                onReplaceAll={() => replaceEvery('before')}
                onClose={() => beforeField.current?.focus()}
                strings={strings}
              />
            ) : null}
          </div>
          {connectors ? <div className="diffine-find-gap" aria-hidden="true" /> : null}
          <div className="diffine-find-cell" data-side="after">
            {afterSearch.open ? (
              <DiffineFind
                search={afterSearch}
                label={afterLabel}
                replaceable={!afterReadOnly}
                onReplace={() => replaceOne('after')}
                onReplaceAll={() => replaceEvery('after')}
                onClose={() => afterField.current?.focus()}
                strings={strings}
              />
            ) : null}
          </div>
        </div>
      ) : null}

      {summary ? (
        <DiffineSummary
          before={beforeText}
          after={afterText}
          beforeLabel={beforeLabel}
          afterLabel={afterLabel}
          changes={comparison.changes.length}
          inserted={comparison.stats.inserted + comparison.stats.changed}
          deleted={comparison.stats.deleted + comparison.stats.changed}
          linked={connectors}
          locale={locale}
          strings={strings}
        />
      ) : null}
    </div>
  );
}
