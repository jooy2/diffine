'use client';

import * as React from 'react';
import type { DiffChange, DiffChangeKind } from '../../types.js';
import { readRows, useMeasure, type RowBox } from '../../internal/layout.js';
import type { PaneLayout } from '../../internal/rows.js';
import { useScrollWatch } from '../../internal/scroll.js';

/** One change, drawn as the shape between where it left and where it arrived. */
interface Link {
  kind: DiffChangeKind;
  current: boolean;
  d: string;
}

/** Where a change sits in one pane, in that pane's own coordinates. */
interface Band {
  top: number;
  bottom: number;
}

/** How far above and below the column a shape is still worth drawing. */
const MARGIN = 48;

/**
 * The rows of one change on one side, as a single band.
 *
 * Where a line is comes from one of two places. With every line the same height
 * it is arithmetic — line `n` starts at `n` times that height — which is the
 * only way to answer for a line that has not been drawn, and with the rows
 * virtualised most of them have not. Otherwise it is a measurement, because a
 * wrapped line's height is not knowable any other way.
 *
 * A change that took lines out of one document put none into that side of the
 * view, so there is nothing to point at — and the honest answer for it is not
 * "nowhere" but "here, between these two lines". The band collapses to the
 * bottom edge of the last line before the change, which is where a reader would
 * point.
 */
function bandFor(
  layout: PaneLayout,
  boxes: Map<number, RowBox>,
  rowHeight: number,
  rowStart: number,
  rowEnd: number
): Band {
  const boxAt = (row: number): RowBox | undefined => {
    const position = layout.positions[row];

    if (position < 0) {
      return undefined;
    }

    return rowHeight > 0 ? { top: position * rowHeight, height: rowHeight } : boxes.get(position);
  };

  let top = Number.POSITIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;

  for (let row = rowStart; row < rowEnd; row += 1) {
    const box = boxAt(row);

    if (box) {
      top = Math.min(top, box.top);
      bottom = Math.max(bottom, box.top + box.height);
    }
  }

  if (top !== Number.POSITIVE_INFINITY) {
    return { top, bottom };
  }

  for (let row = rowStart - 1; row >= 0; row -= 1) {
    const box = boxAt(row);

    if (box) {
      return { top: box.top + box.height, bottom: box.top + box.height };
    }
  }

  return { top: 0, bottom: 0 };
}

export interface DiffineLinksProps {
  changes: readonly DiffChange[];
  beforeLayout: PaneLayout;
  afterLayout: PaneLayout;
  before: React.RefObject<HTMLDivElement | null>;
  after: React.RefObject<HTMLDivElement | null>;
  /** The height of one line, or `0` when the rows have to be measured. */
  rowHeight: number;
  /** Which change a reader has moved to, or -1. */
  current: number;
  /** What has to change before the geometry is worth reading again. */
  deps: React.DependencyList;
}

/**
 * The column between the two panes, and the shape each change makes across it.
 *
 * This is the part of a side-by-side view that a list of rows cannot say. Two
 * documents that are not the same length do not line up, and a reader looking
 * at the left pane has no way of telling which part of the right one answers
 * it. A band drawn from where a run of lines was to where it ended up says
 * that, and says it in one glance.
 *
 * The geometry is read once per layout and kept; scrolling only moves what was
 * already measured. Reading every row's position again on each frame of a
 * scroll is the version of this that makes a long document unusable.
 */
export function DiffineLinks({
  changes,
  beforeLayout,
  afterLayout,
  before,
  after,
  rowHeight,
  current,
  deps
}: DiffineLinksProps): React.JSX.Element {
  const column = React.useRef<HTMLDivElement>(null);
  const geometry = React.useRef<[Map<number, RowBox>, Map<number, RowBox>]>([new Map(), new Map()]);
  const [links, setLinks] = React.useState<Link[]>([]);

  // Both of these are plain functions rather than memoised ones. Each is kept
  // in a ref by the hook that calls it, so neither is ever compared for
  // identity, and memoising a function that reads a ref means reading that ref
  // during a render.
  const paint = () => {
    const element = column.current;
    const panes = [before.current, after.current];

    if (!element || !panes[0] || !panes[1]) {
      return;
    }

    const width = element.clientWidth;
    const height = element.clientHeight;
    const [beforeBoxes, afterBoxes] = geometry.current;
    const bend = width / 2;
    const next: Link[] = [];

    for (const [index, change] of changes.entries()) {
      const left = bandFor(beforeLayout, beforeBoxes, rowHeight, change.rowStart, change.rowEnd);
      const right = bandFor(afterLayout, afterBoxes, rowHeight, change.rowStart, change.rowEnd);
      const leftTop = left.top - panes[0].scrollTop;
      const leftBottom = left.bottom - panes[0].scrollTop;
      const rightTop = right.top - panes[1].scrollTop;
      const rightBottom = right.bottom - panes[1].scrollTop;

      if (
        Math.max(leftBottom, rightBottom) < -MARGIN ||
        Math.min(leftTop, rightTop) > height + MARGIN
      ) {
        continue;
      }

      next.push({
        kind: change.kind,
        current: index === current,
        d:
          `M0 ${leftTop}` +
          `C${bend} ${leftTop} ${bend} ${rightTop} ${width} ${rightTop}` +
          `L${width} ${rightBottom}` +
          `C${bend} ${rightBottom} ${bend} ${leftBottom} 0 ${leftBottom}` +
          'Z'
      });
    }

    setLinks((held) =>
      held.length === next.length &&
      held.every((link, index) => link.d === next[index].d && link.current === next[index].current)
        ? held
        : next
    );
  };

  const measure = () => {
    // Only worth doing when the answer is not arithmetic. With every line the
    // same height there is nothing a measurement would add, and most of the
    // lines are not on the page to be measured anyway.
    geometry.current =
      rowHeight > 0 ? [new Map(), new Map()] : [readRows(before.current), readRows(after.current)];
    paint();
  };

  const watched = [column, before, after];

  useMeasure(watched, measure, [...deps, rowHeight, current]);
  useScrollWatch(watched, paint, true, deps);

  return (
    <div className="diffine-links" ref={column} aria-hidden="true">
      <svg className="diffine-links-canvas" focusable="false">
        {links.map((link, index) => (
          <path
            key={index}
            className="diffine-link"
            data-kind={link.kind}
            data-current={link.current ? 'true' : undefined}
            d={link.d}
          />
        ))}
      </svg>
    </div>
  );
}
