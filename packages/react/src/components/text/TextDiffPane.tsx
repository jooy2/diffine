'use client';

import * as React from 'react';
import type { DiffineHighlight, DiffineRender, DiffineStrings } from '../../types.js';
import { selectedText } from '../../internal/copy.js';
import type { FoldRun } from '../../internal/fold.js';
import type { PaneLayout } from '../../internal/rows.js';
import type { SearchMatch } from '../../internal/search.js';
import type { VirtualWindow } from '../../internal/virtual.js';
import { DiffineRows } from '../shared/DiffineRows.js';

export interface TextDiffPaneProps {
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
  /** Opens a folded run. */
  onExpand?: (fold: FoldRun) => void;
  /** Something of the application's own for the gutter of each line. */
  renderGutter?: DiffineRender;
  /** Something of the application's own for under each line. */
  renderWidget?: DiffineRender;
  /** Whether the spaces and tabs inside each line are drawn. */
  invisibles?: boolean;
}

/**
 * One scrolling column of lines that a reader reads — a side of a split view,
 * or the single column of a unified one.
 *
 * The pane is what the keyboard lands on, so it is a named region with a tab
 * stop of its own: a comparison is a document to read through, and a box a
 * keyboard cannot reach is a document a keyboard cannot read. Where the same
 * column can be typed into instead, `TextDiffField` draws it.
 */
export function TextDiffPane({
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
  side,
  onExpand,
  renderGutter,
  renderWidget,
  invisibles
}: TextDiffPaneProps): React.JSX.Element {
  /*
   * What a reader copies is the document, not the page it is drawn on. See
   * `copy.ts`: the blanks that hold the two sides level are real empty lines
   * here and are in neither file.
   */
  function onCopy(event: React.ClipboardEvent<HTMLDivElement>): void {
    const text = selectedText(event.currentTarget, layout);

    if (text !== null) {
      event.clipboardData.setData('text/plain', text);
      event.preventDefault();
    }
  }

  return (
    <div
      className="diffine-pane"
      data-side={side}
      role="region"
      aria-label={name}
      tabIndex={0}
      ref={paneRef}
      onCopy={onCopy}
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
          onExpand={onExpand}
          renderGutter={renderGutter}
          renderWidget={renderWidget}
          invisibles={invisibles}
        />
      </div>
    </div>
  );
}
