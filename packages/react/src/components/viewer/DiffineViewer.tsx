'use client';

import * as React from 'react';
import type {
  DiffInlineMode,
  DiffOptions,
  DiffResult,
  DiffWhitespace,
  DiffineColorScheme,
  DiffineInput,
  DiffineLocale,
  DiffineSource,
  DiffineStrings,
  DiffineView
} from '../../types.js';
import { diffText } from '../../diff.js';
import { fill, stringsFor } from '../../internal/i18n.js';
import { useRowAlignment } from '../../internal/layout.js';
import { splitLayout, unifiedLayout } from '../../internal/rows.js';
import { useSyncedScroll } from '../../internal/scroll.js';
import { useVirtualRows } from '../../internal/virtual.js';
import { DiffineViewerLinks } from './DiffineViewerLinks.js';
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
}

/** A bare string is the document; the object form names it as well. */
function sourceOf(input: DiffineInput | undefined, label: string): Required<DiffineSource> {
  if (typeof input === 'string') {
    return { content: input, label };
  }

  return { content: input?.content ?? '', label: input?.label ?? label };
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
  summary = true,
  virtualize = true,
  tabSize = 4,
  colorScheme = 'system',
  locale = 'en',
  strings: overrides,
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

  const beforeLayout = React.useMemo(
    () => splitLayout(comparison.rows, 'before', alignLines),
    [comparison, alignLines]
  );
  const afterLayout = React.useMemo(
    () => splitLayout(comparison.rows, 'after', alignLines),
    [comparison, alignLines]
  );
  const oneColumn = React.useMemo(
    () => unifiedLayout(comparison.rows, comparison.changes),
    [comparison]
  );

  const layouts = split ? [beforeLayout, afterLayout] : [oneColumn];
  const panes = React.useMemo(() => (split ? [firstPane, secondPane] : [firstPane]), [split]);

  // Everything that moves a line. What is worked out from the drawn document —
  // the height of a wrapped row, the band between two panes, which lines are
  // worth drawing at all — is worked out again when one of these has changed
  // and left alone the rest of the time.
  const layoutDeps = [comparison, view, wrap, alignLines, lineNumbers, markers];

  const { windows, rowHeight } = useVirtualRows(
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

  const digits = String(Math.max(comparison.before.length, comparison.after.length, 1)).length;

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
      {header ? (
        <div className="diffine-header">
          <div className="diffine-title" data-side="before">
            <span className="diffine-label">{beforeSource.label}</span>
          </div>
          {split ? <div className="diffine-title-gap" aria-hidden="true" /> : null}
          <div className="diffine-title" data-side="after">
            <span className="diffine-label">{afterSource.label}</span>
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
            lineNumbers={lineNumbers}
            markers={markers}
            strings={strings}
            paneRef={firstPane}
          />
          {split && connectors ? (
            <DiffineViewerLinks
              changes={comparison.changes}
              beforeLayout={beforeLayout}
              afterLayout={afterLayout}
              before={firstPane}
              after={secondPane}
              rowHeight={rowHeight}
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
              lineNumbers={lineNumbers}
              markers={markers}
              strings={strings}
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
