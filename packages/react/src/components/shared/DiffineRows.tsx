'use client';

import * as React from 'react';
import type { DiffineHighlight, DiffineRender, DiffineStrings } from '../../types.js';
import type { FoldRun } from '../../internal/fold.js';
import type { RowMetrics } from '../../internal/metrics.js';
import type { PaneLayout } from '../../internal/rows.js';
import type { SearchMatch } from '../../internal/search.js';
import type { VirtualWindow } from '../../internal/virtual.js';
import { DiffineFold } from './DiffineFold.js';
import { DiffineLine } from './DiffineLine.js';

export interface DiffineRowsProps {
  layout: PaneLayout;
  /** The slice of `layout.lines` that is drawn. */
  window: VirtualWindow;
  /** Where the rows of this pane are. */
  metrics: RowMetrics;
  /** Which change a reader has moved to, or -1. */
  current: number;
  lineNumbers: boolean;
  markers: boolean;
  strings: DiffineStrings;
  highlight?: DiffineHighlight;
  /** What a search found, keyed by the line it found it in. */
  matches?: ReadonlyMap<number, readonly SearchMatch[]>;
  /** The match a reader is on, which is the one drawn differently from the rest. */
  match?: SearchMatch | null;
  /** Opens a folded run. Left out where the lines cannot be opened at all. */
  onExpand?: (fold: FoldRun) => void;
  /** Something of the application's own for the gutter of each line. */
  renderGutter?: DiffineRender;
  /** Something of the application's own for under each line. */
  renderWidget?: DiffineRender;
  /** Whether the spaces and tabs inside each line are drawn. */
  invisibles?: boolean;
}

/**
 * The lines of one column, the space where the undrawn ones would be, and the
 * hidden line that holds the column's width open.
 *
 * Both components that draw lines draw them this way, and neither of them wants
 * to own the arithmetic: the viewer wraps this in a scrolling region a reader
 * can tab into, and the editor puts it under a field and hides it from a screen
 * reader, which already hears the field.
 */
export function DiffineRows({
  layout,
  window: shown,
  metrics,
  current,
  lineNumbers,
  markers,
  strings,
  highlight,
  matches,
  match,
  onExpand,
  renderGutter,
  renderWidget,
  invisibles
}: DiffineRowsProps): React.JSX.Element {
  // Nothing to stand in for where every row is drawn, which is what a metrics
  // that answers -1 is saying.
  const above = Math.max(0, metrics.top(shown.start));
  const below = Math.max(0, metrics.total - Math.max(0, metrics.top(shown.end)));

  return (
    <>
      {/*
        The lines that are not drawn, as height and nothing else. The column
        keeps the size it would have had, so the scrollbar is the length of the
        document rather than the length of what happens to be on the page.
      */}
      {above > 0 ? <div className="diffine-spacer" style={{ height: above }} /> : null}

      {layout.lines.slice(shown.start, shown.end).map((drawn, offset) => {
        const row = shown.start + offset;

        if (drawn.fold) {
          return (
            <DiffineFold
              key={row}
              row={row}
              side={drawn.side}
              fold={drawn.fold}
              strings={strings}
              onExpand={onExpand}
            />
          );
        }

        return (
          <DiffineLine
            key={row}
            row={row}
            kind={drawn.kind}
            side={drawn.side}
            line={drawn.line}
            numbers={drawn.numbers}
            change={drawn.change}
            current={drawn.change >= 0 && drawn.change === current}
            lineNumbers={lineNumbers}
            markers={markers}
            strings={strings}
            highlight={highlight}
            matches={matches?.get(row)}
            match={match}
            renderGutter={renderGutter}
            renderWidget={renderWidget}
            invisibles={invisibles}
          />
        );
      })}

      {below > 0 ? <div className="diffine-spacer" style={{ height: below }} /> : null}

      {/*
        The longest line of the whole document, drawn where nobody can see it.
        With the rest of the lines undrawn, the width of this column's content
        would otherwise be the width of whatever is on the screen — so it would
        grow and shrink as a reader scrolled down, and a reader who had scrolled
        sideways would be dragged back.
      */}
      {metrics.total > 0 && layout.widest ? (
        <div className="diffine-measure" aria-hidden="true">
          <DiffineLine
            row={null}
            kind={layout.widest.kind}
            side={layout.widest.side}
            line={layout.widest.line}
            numbers={layout.widest.numbers}
            change={-1}
            current={false}
            lineNumbers={lineNumbers}
            markers={markers}
            strings={strings}
          />
        </div>
      ) : null}
    </>
  );
}
