'use client';

import * as React from 'react';
import type { DiffineHighlight, DiffineStrings } from '../../types.js';
import type { PaneLayout } from '../../internal/rows.js';
import type { VirtualWindow } from '../../internal/virtual.js';
import { DiffineViewerLine } from './DiffineViewerLine.js';

export interface DiffineViewerPaneProps {
  /** Which document this pane draws, for the region's name and the styling. */
  name: string;
  layout: PaneLayout;
  /** The slice of `layout.lines` that is drawn. */
  window: VirtualWindow;
  /** The height of one line, or `0` when every line is being drawn. */
  rowHeight: number;
  /** Which change a reader has moved to, or -1. */
  current: number;
  lineNumbers: boolean;
  markers: boolean;
  strings: DiffineStrings;
  highlight?: DiffineHighlight;
  paneRef: React.RefObject<HTMLDivElement | null>;
  side: string;
}

/** One scrolling column of lines — a side of a split view, or a unified one. */
export function DiffineViewerPane({
  name,
  layout,
  window: shown,
  rowHeight,
  current,
  lineNumbers,
  markers,
  strings,
  highlight,
  paneRef,
  side
}: DiffineViewerPaneProps): React.JSX.Element {
  const above = shown.start * rowHeight;
  const below = (layout.lines.length - shown.end) * rowHeight;

  return (
    <div
      className="diffine-pane"
      data-side={side}
      role="region"
      aria-label={name}
      tabIndex={0}
      ref={paneRef}
    >
      <div className="diffine-lines">
        {/*
          The lines that are not drawn, as height and nothing else. The pane
          keeps the size it would have had, so the scrollbar is the length of
          the document rather than the length of what happens to be on the page.
        */}
        {above > 0 ? <div className="diffine-spacer" style={{ height: above }} /> : null}

        {layout.lines.slice(shown.start, shown.end).map((drawn, offset) => {
          const row = shown.start + offset;

          return (
            <DiffineViewerLine
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
            />
          );
        })}

        {below > 0 ? <div className="diffine-spacer" style={{ height: below }} /> : null}

        {/*
          The longest line of the whole document, drawn where nobody can see it.
          With the rest of the lines undrawn, the width of this pane's content
          would otherwise be the width of whatever is on the screen — so it
          would grow and shrink as a reader scrolled down, and a reader who had
          scrolled sideways would be dragged back.
        */}
        {rowHeight > 0 && layout.widest ? (
          <div className="diffine-measure" aria-hidden="true">
            <DiffineViewerLine
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
      </div>
    </div>
  );
}
