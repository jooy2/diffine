'use client';

import * as React from 'react';
import type {
  DiffChange,
  DiffInlineMode,
  DiffOptions,
  DiffResult,
  DiffWhitespace,
  DiffineColorScheme,
  DiffineHighlight,
  DiffineInput,
  DiffineLocale,
  DiffineStrings,
  DiffineView
} from '../../types.js';
import { diffText } from '../../diff.js';
import { fill, stringsFor } from '../../internal/i18n.js';
import { useRowAlignment } from '../../internal/layout.js';
import { useChangeNavigation } from '../../internal/navigate.js';
import { changeOfRow, splitLayout, unifiedLayout } from '../../internal/rows.js';
import { useSyncedScroll } from '../../internal/scroll.js';
import { sourceOf } from '../../internal/source.js';
import { useVirtualRows } from '../../internal/virtual.js';
import { DiffineLinks } from '../shared/DiffineLinks.js';
import { DiffineNav } from '../shared/DiffineNav.js';
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
   * Whether the counts are written under the view.
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
   * The language of the viewer's own words — not of the documents.
   * @default 'en'
   */
  locale?: DiffineLocale;

  /** Words to use instead of the locale's, for any of them. */
  strings?: Partial<DiffineStrings>;

  /**
   * How a line is coloured beyond what the comparison says about it, which is
   * where a syntax highlighter goes. See {@link DiffineHighlight}.
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
  locale = 'en',
  strings: overrides,
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
  const layoutDeps = [comparison, view, wrap, alignLines, lineNumbers, markers];

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

  const digits = String(Math.max(comparison.before.length, comparison.after.length, 1)).length;
  const bar = header || (navigation && !empty);

  return (
    <div
      className={className ? `diffine ${className}` : 'diffine'}
      data-view={view}
      data-scheme={colorScheme}
      data-wrap={wrap}
      data-align={alignLines}
      style={
        {
          '--diffine-digits': digits,
          '--diffine-tab-size': tabSize,
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
          {split ? <div className="diffine-title-gap" aria-hidden="true" /> : null}
          <div className="diffine-title" data-side="after">
            {header ? <span className="diffine-label">{afterSource.label}</span> : null}
            {navigation && !empty ? (
              <DiffineNav
                total={comparison.changes.length}
                current={current}
                onStep={step}
                strings={strings}
              />
            ) : null}
          </div>
        </div>
      ) : null}

      {empty ? (
        <p className="diffine-empty">{strings.empty}</p>
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
            highlight={highlight}
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
              highlight={highlight}
              paneRef={secondPane}
            />
          ) : null}
        </div>
      )}

      {summary && !empty ? (
        <p className="diffine-summary" role="status">
          {comparison.changes.length === 0
            ? strings.identical
            : fill(strings.summary, {
                changes: comparison.changes.length,
                inserted: comparison.stats.inserted + comparison.stats.changed,
                deleted: comparison.stats.deleted + comparison.stats.changed
              })}
        </p>
      ) : null}
    </div>
  );
}
