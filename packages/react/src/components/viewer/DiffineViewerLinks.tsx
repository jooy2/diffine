'use client';

import * as React from 'react';
import type { DiffChange, DiffChangeKind } from '../../types.js';
import { readRows, useMeasure, type RowBox } from '../../internal/layout.js';
import { useScrollWatch } from '../../internal/scroll.js';

/** One change, drawn as the shape between where it left and where it arrived. */
interface Link {
  kind: DiffChangeKind;
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
 * A change that took lines out of one document put none into that side of the
 * view, so there is nothing to measure — and the honest answer for it is not
 * "nowhere" but "here, between these two lines". The band collapses to the
 * bottom edge of the last line before the change, which is exactly where a
 * reader would point.
 */
function bandFor(boxes: Map<number, RowBox>, rowStart: number, rowEnd: number): Band {
  let top = Number.POSITIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;

  for (let row = rowStart; row < rowEnd; row += 1) {
    const box = boxes.get(row);

    if (box) {
      top = Math.min(top, box.top);
      bottom = Math.max(bottom, box.top + box.height);
    }
  }

  if (top !== Number.POSITIVE_INFINITY) {
    return { top, bottom };
  }

  for (let row = rowStart - 1; row >= 0; row -= 1) {
    const box = boxes.get(row);

    if (box) {
      return { top: box.top + box.height, bottom: box.top + box.height };
    }
  }

  return { top: 0, bottom: 0 };
}

export interface DiffineViewerLinksProps {
  changes: readonly DiffChange[];
  before: React.RefObject<HTMLDivElement | null>;
  after: React.RefObject<HTMLDivElement | null>;
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
export function DiffineViewerLinks({
  changes,
  before,
  after,
  deps
}: DiffineViewerLinksProps): React.JSX.Element {
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

    for (const change of changes) {
      const left = bandFor(beforeBoxes, change.rowStart, change.rowEnd);
      const right = bandFor(afterBoxes, change.rowStart, change.rowEnd);
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
        d:
          `M0 ${leftTop}` +
          `C${bend} ${leftTop} ${bend} ${rightTop} ${width} ${rightTop}` +
          `L${width} ${rightBottom}` +
          `C${bend} ${rightBottom} ${bend} ${leftBottom} 0 ${leftBottom}` +
          'Z'
      });
    }

    setLinks((current) =>
      current.length === next.length && current.every((link, index) => link.d === next[index].d)
        ? current
        : next
    );
  };

  const measure = () => {
    geometry.current = [readRows(before.current), readRows(after.current)];
    paint();
  };

  const watched = [column, before, after];

  useMeasure(watched, measure, deps);
  useScrollWatch(watched, paint, true);

  return (
    <div className="diffine-links" ref={column} aria-hidden="true">
      <svg className="diffine-links-canvas" focusable="false">
        {links.map((link, index) => (
          <path key={index} className="diffine-link" data-kind={link.kind} d={link.d} />
        ))}
      </svg>
    </div>
  );
}
