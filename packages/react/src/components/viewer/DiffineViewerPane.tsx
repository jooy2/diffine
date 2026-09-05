'use client';

import * as React from 'react';
import type { DiffRow, DiffineSide, DiffineStrings } from '../../types.js';
import { DiffineViewerLine } from './DiffineViewerLine.js';

export interface DiffineViewerPaneProps {
  side: DiffineSide;
  rows: readonly DiffRow[];
  /**
   * Whether a row with no line on this side is still drawn, as a blank.
   *
   * This is what holds the two documents level with each other. Without it each
   * side is its own list of lines, ending where that document ends, and the
   * connectors between the panes are the only thing saying which part of one
   * answers which part of the other.
   */
  blanks: boolean;
  lineNumbers: boolean;
  markers: boolean;
  label: string;
  strings: DiffineStrings;
  paneRef: React.RefObject<HTMLDivElement | null>;
}

/** One side of a split view: its own lines, and its own scrolling. */
export function DiffineViewerPane({
  side,
  rows,
  blanks,
  lineNumbers,
  markers,
  label,
  strings,
  paneRef
}: DiffineViewerPaneProps): React.JSX.Element {
  return (
    <div
      className="diffine-pane"
      data-side={side}
      role="region"
      aria-label={label}
      tabIndex={0}
      ref={paneRef}
    >
      <div className="diffine-lines">
        {rows.map((row, index) => {
          const line = row[side];

          if (!line && !blanks) {
            return null;
          }

          return (
            <DiffineViewerLine
              key={index}
              row={index}
              kind={row.kind}
              side={side}
              line={line}
              numbers={[line ? line.index + 1 : null]}
              lineNumbers={lineNumbers}
              markers={markers}
              strings={strings}
            />
          );
        })}
      </div>
    </div>
  );
}
