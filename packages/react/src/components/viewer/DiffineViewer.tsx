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
  DiffineStrings,
  DiffineView
} from '../../types.js';
import { diffText } from '../../diff.js';
import { fontVariables } from '../../internal/font.js';
import { useSyntaxHighlight } from '../../internal/highlight/useSyntax.js';
import { stringsFor } from '../../internal/i18n.js';
import { useRowAlignment } from '../../internal/layout.js';
import { useChangeNavigation } from '../../internal/navigate.js';
import { changeOfRow, splitLayout, unifiedLayout } from '../../internal/rows.js';
import { useSyncedScroll } from '../../internal/scroll.js';
import { sourceOf } from '../../internal/source.js';
import { useVirtualRows } from '../../internal/virtual.js';
import { DiffineLanguageName } from '../shared/DiffineLanguage.js';
import { DiffineLinks } from '../shared/DiffineLinks.js';
import { DiffineNav } from '../shared/DiffineNav.js';
import { DiffineSummary } from '../shared/DiffineSummary.js';
import { DiffineViewerPane } from './DiffineViewerPane.js';

export interface DiffineViewerProps extends Omit<
  React.ComponentPropsWithoutRef<'div'>,
  'children' | 'title'
> {
  /**
   * The document on the left, as a string or as a string with a name on it.
   *
   * ```tsx
   * <DiffineViewer before="one\ntwo" after={{ content: 'one\n2', label: 'v2' }} />
   * ```
   */
  before?: DiffineInput;
  /** The document on the right. */
  after?: DiffineInput;

  /**
   * A comparison that has already been worked out, drawn as it is.
   *
   * `before` and `after` are ignored when this is passed, which is what makes
   * it useful: the comparison of two large documents can be done in a worker,
   * on a server, or once for a list of viewers, and handed here as a value.
   */
  result?: DiffResult;

  /**
   * How the two documents are compared. Anything left out keeps its default, so
   * `{ whitespace: 'trailing' }` is a whole answer.
   */
  diff?: DiffOptions;

  /**
   * One document either side, or one column with both.
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
   * Whether a line is held level with its counterpart.
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
   * is drawn is what is in front of the reader.
   *
   * It needs every line to be the same height, which is true of a pane that is
   * not wrapping and of nothing else — so `wrap` turns it off. It also does
   * nothing to a short document, where the machinery would cost more than the
   * rows it saved. Turn it off for a page where the browser's own find has to
   * reach text that is scrolled out of view.
   *
   * @default true
   */
  virtualize?: boolean;

  /**
   * Which change a reader has moved to, as an index into `changes`, or -1.
   *
   * Passing it makes it the application's: it will not change on its own, and
   * the buttons report through `onSelectedChange` instead. Leaving it out makes
   * it the viewer's, and the reporting still happens.
   */
  selected?: number;
  /** Which change to start on, when the viewer is to keep it itself. @default -1 */
  defaultSelected?: number;
  /** A change was moved to, by the buttons or by the application. */
  onSelectedChange?: (selected: number, change: DiffChange | null) => void;

  /**
   * How wide a tab is drawn, in characters.
   * @default 4
   */
  tabSize?: number;

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
   * The language of the viewer's own words — not of the documents.
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
   * The grammar is fetched when it is asked for and not before, so a viewer
   * left on `plain` downloads none of highlight.js. The first paint after one
   * arrives is the document coloured; the one before it is the document.
   *
   * @default 'plain'
   */
  language?: string;

  /**
   * Whether the language is named at the right end of the bar above the panes.
   * @default true
   */
  languageLabel?: boolean;

  /**
   * How a line is coloured beyond what the comparison says about it, which is
   * where a syntax highlighter of the application's own goes. See
   * {@link DiffineHighlight}.
   *
   * This replaces `language` rather than adding to it.
   */
  highlight?: DiffineHighlight;
}

/**
 * Two documents, and what happened between them.
 *
 * ```tsx
 * import { DiffineViewer } from 'diffine-react';
 * import 'diffine-react/styles.css';
 *
 * <DiffineViewer before={saved} after={draft} />;
 * ```
 *
 * The component works the comparison out itself unless it is handed one. What
 * it draws is entirely a matter of the props above: every part of the view is a
 * boolean with a default, so it goes from a full side-by-side with connectors
 * down to a bare column of lines without a stylesheet being touched.
 */
export function DiffineViewer({
  before,
  after,
  result,
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
  summary = true,
  virtualize = true,
  selected: selectedProp,
  defaultSelected = -1,
  onSelectedChange,
  tabSize = 4,
  colorScheme = 'system',
  font,
  locale = 'en',
  strings: overrides,
  language = 'plain',
  languageLabel = true,
  highlight,
  className,
  style,
  ...rest
}: DiffineViewerProps): React.JSX.Element {
  const strings = React.useMemo(() => stringsFor(locale, overrides), [locale, overrides]);
  const beforeSource = sourceOf(before, strings.before);
  const afterSource = sourceOf(after, strings.after);

  // The second pane in a split view; the only one in a unified view. Naming it
  // for the side it usually holds is a small lie that keeps the refs from being
  // three things where two will do.
  const firstPane = React.useRef<HTMLDivElement>(null);
  const secondPane = React.useRef<HTMLDivElement>(null);

  // Every option of its own rather than the object holding them. An application
  // that writes `diff={{ whitespace: 'trailing' }}` inline hands over a new
  // object on every render, and depending on the object would compare the two
  // documents again each time for an answer that had not changed.
  const inline: DiffInlineMode | undefined = diff?.inline;
  const whitespace: DiffWhitespace | undefined = diff?.whitespace;
  const ignoreCase = diff?.ignoreCase;
  const inlineThreshold = diff?.inlineThreshold;
  const maxCost = diff?.maxCost;
  const beforeText = beforeSource.content;
  const afterText = afterSource.content;

  const comparison = React.useMemo(
    () =>
      result ??
      diffText(beforeText, afterText, {
        inline,
        whitespace,
        ignoreCase,
        inlineThreshold,
        maxCost
      }),
    [result, beforeText, afterText, inline, whitespace, ignoreCase, inlineThreshold, maxCost]
  );

  const split = view === 'split';
  const empty = beforeText === '' && afterText === '';

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
    () => (beforeText === '' && result ? result.before.join('\n') : beforeText),
    [beforeText, result]
  );
  const afterMeasured = React.useMemo(
    () => (afterText === '' && result ? result.after.join('\n') : afterText),
    [afterText, result]
  );

  const owner = React.useMemo(
    () => changeOfRow(comparison.rows.length, comparison.changes),
    [comparison]
  );
  const beforeLayout = React.useMemo(
    () => splitLayout(comparison.rows, owner, 'before', alignLines),
    [comparison, owner, alignLines]
  );
  const afterLayout = React.useMemo(
    () => splitLayout(comparison.rows, owner, 'after', alignLines),
    [comparison, owner, alignLines]
  );
  const oneColumn = React.useMemo(
    () => unifiedLayout(comparison.rows, comparison.changes, owner),
    [comparison, owner]
  );

  const layouts = split ? [beforeLayout, afterLayout] : [oneColumn];
  const panes = React.useMemo(() => (split ? [firstPane, secondPane] : [firstPane]), [split]);

  // Everything that moves a line. What is worked out from the drawn document —
  // the height of a wrapped row, the band between two panes, which lines are
  // worth drawing at all — is worked out again when one of these has changed
  // and left alone the rest of the time.
  const layoutDeps = [
    comparison,
    view,
    wrap,
    alignLines,
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

  useRowAlignment(firstPane, secondPane, split && wrap && alignLines, layoutDeps);
  // `empty` is on the list because it decides whether the panes are on the page
  // at all: without it, a viewer that started with nothing and was then given
  // two documents would have listeners on the elements it no longer has.
  useSyncedScroll(firstPane, secondPane, split && syncScroll && !empty, alignLines);

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

  const syntax = useSyntaxHighlight(language, comparison.before, comparison.after);
  // The application's own highlighter replaces the language rather than joining
  // it. A line has one set of runs, and two of them cutting it at once is not a
  // question with an answer.
  const colour = highlight ?? syntax;

  const digits = String(Math.max(comparison.before.length, comparison.after.length, 1)).length;
  const tools = (navigation && !empty) || languageLabel;
  const bar = header || tools;

  return (
    <div
      className={className ? `diffine ${className}` : 'diffine'}
      data-view={view}
      data-linked={split && connectors}
      data-scheme={colorScheme}
      data-wrap={wrap}
      data-align={alignLines}
      // Which columns the gutter has, so the stylesheet can work out how wide
      // it is — for the stripe that carries it past the last line of a document
      // shorter than the pane it is in.
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
      {...rest}
    >
      {bar ? (
        <div className="diffine-header">
          <div className="diffine-title" data-side="before">
            {header ? <span className="diffine-label">{beforeSource.label}</span> : null}
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
                {languageLabel ? (
                  <DiffineLanguageName language={language} strings={strings} />
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
          <DiffineViewerPane
            side={split ? 'before' : 'unified'}
            name={split ? beforeSource.label : `${beforeSource.label} → ${afterSource.label}`}
            layout={layouts[0]}
            window={windows[0]}
            rowHeight={rowHeight}
            current={current}
            lineNumbers={lineNumbers}
            markers={markers}
            strings={strings}
            highlight={colour}
            paneRef={firstPane}
          />
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
            <DiffineViewerPane
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
              paneRef={secondPane}
            />
          ) : null}
        </div>
      )}

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
