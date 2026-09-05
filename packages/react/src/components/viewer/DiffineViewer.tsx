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
import { useSyncedScroll } from '../../internal/scroll.js';
import { DiffineViewerLinks } from './DiffineViewerLinks.js';
import { DiffineViewerPane } from './DiffineViewerPane.js';
import { DiffineViewerUnified } from './DiffineViewerUnified.js';

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
function sourceOf(input: DiffineInput | undefined, label: string): DiffineSource {
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
 * it draws is entirely a matter of the props above: every part of the view is
 * a boolean with a default, so it goes from a full side-by-side with
 * connectors down to a bare column of lines without a stylesheet being touched.
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

  const beforePane = React.useRef<HTMLDivElement>(null);
  const afterPane = React.useRef<HTMLDivElement>(null);
  const unifiedPane = React.useRef<HTMLDivElement>(null);

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
  const blanks = alignLines;
  const empty = beforeText === '' && afterText === '';
  // Everything that moves a row. What is measured off the drawn document — the
  // height of a wrapped row, the band between two panes — is read again when
  // any of these has changed and left alone the rest of the time.
  const layout = [comparison, view, wrap, alignLines, lineNumbers, markers];

  useRowAlignment(beforePane, afterPane, split && wrap && alignLines, layout);
  // `empty` is on the list because it decides whether the panes are on the page
  // at all: without it, a viewer that started with nothing and was then given
  // two documents would have listeners on the elements it no longer has.
  useSyncedScroll(beforePane, afterPane, split && syncScroll && !empty, alignLines);

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
            {beforeSource.label}
          </div>
          {split ? <div className="diffine-title-gap" aria-hidden="true" /> : null}
          <div className="diffine-title" data-side="after">
            {afterSource.label}
          </div>
        </div>
      ) : null}

      {empty ? (
        <p className="diffine-empty">{strings.empty}</p>
      ) : (
        <div className="diffine-body">
          {split ? (
            <>
              <DiffineViewerPane
                side="before"
                rows={comparison.rows}
                blanks={blanks}
                lineNumbers={lineNumbers}
                markers={markers}
                label={beforeSource.label ?? strings.before}
                strings={strings}
                paneRef={beforePane}
              />
              {connectors ? (
                <DiffineViewerLinks
                  changes={comparison.changes}
                  before={beforePane}
                  after={afterPane}
                  deps={layout}
                />
              ) : null}
              <DiffineViewerPane
                side="after"
                rows={comparison.rows}
                blanks={blanks}
                lineNumbers={lineNumbers}
                markers={markers}
                label={afterSource.label ?? strings.after}
                strings={strings}
                paneRef={afterPane}
              />
            </>
          ) : (
            <DiffineViewerUnified
              result={comparison}
              lineNumbers={lineNumbers}
              markers={markers}
              label={`${beforeSource.label} → ${afterSource.label}`}
              strings={strings}
              paneRef={unifiedPane}
            />
          )}
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
