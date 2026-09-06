'use client';

import * as React from 'react';
import type { DiffineHighlight, DiffineStrings } from '../../types.js';
import type { PaneLayout } from '../../internal/rows.js';
import type { SearchMatch } from '../../internal/search.js';
import type { VirtualWindow } from '../../internal/virtual.js';
import { DiffineRows } from '../shared/DiffineRows.js';

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
  /** What a search found, keyed by the line it found it in. */
  matches?: ReadonlyMap<number, readonly SearchMatch[]>;
  /** The match a reader is on, which is the one drawn differently from the rest. */
  match?: SearchMatch | null;
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
  matches,
  match,
  paneRef,
  side
}: DiffineViewerPaneProps): React.JSX.Element {
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
        <DiffineRows
          layout={layout}
          window={shown}
          rowHeight={rowHeight}
          current={current}
          lineNumbers={lineNumbers}
          markers={markers}
          strings={strings}
          highlight={highlight}
          matches={matches}
          match={match}
        />
      </div>
    </div>
  );
}
