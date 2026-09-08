'use client';

import * as React from 'react';
import type { DiffChange, DiffChangeKind, DiffineSide, DiffineStrings } from '../../types.js';
import { fill } from '../../internal/i18n.js';
import { readRows, useMeasure, type RowBox } from '../../internal/layout.js';
import type { RowMetrics } from '../../internal/metrics.js';
import type { PaneLayout } from '../../internal/rows.js';
import { useScrollWatch } from '../../internal/scroll.js';
import { Arrow } from './DiffineIcons.js';

/**
 * One change, drawn as the shape between where it left and where it arrived.
 *
 * Three paths rather than one. A single closed path stroked all the way round
 * puts half of that stroke outside the column on the left-hand and right-hand
 * edges, where it is clipped — so the two curves that carry the meaning come
 * out thinner than the two edges that carry none. Drawn apart, the fill is a
 * fill and the curves are the only thing with a line on them.
 */
interface Link {
  /** Which change this is, as an index into `changes`. */
  index: number;
  kind: DiffChangeKind;
  current: boolean;
  /** Where the middle of the band is, for the buttons that take it across. */
  middle: number;
  /** The whole band, closed and filled. */
  area: string;
  /** Its top curve, from where the run left to where it arrived. */
  top: string;
  /** Its bottom curve. */
  bottom: string;
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
  metrics: RowMetrics,
  rowStart: number,
  rowEnd: number
): Band {
  const boxAt = (row: number): RowBox | undefined => {
    const position = layout.positions[row];

    if (position < 0) {
      return undefined;
    }

    const top = metrics.top(position);

    return top >= 0 ? { top, height: metrics.height(position) } : boxes.get(position);
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
  /** Where the rows of each pane are. */
  beforeMetrics: RowMetrics;
  afterMetrics: RowMetrics;
  /** Which change a reader has moved to, or -1. */
  current: number;
  /** What has to change before the geometry is worth reading again. */
  deps: React.DependencyList;
  /**
   * Writes one change into one of the two documents.
   *
   * Left out where nothing can be written, which is every viewer and an editor
   * that was not asked for the buttons.
   */
  onApply?: (change: DiffChange, into: DiffineSide) => void;
  /** Which of the two documents can be written into at all. */
  writable?: { before: boolean; after: boolean };
  /** What each side is called, for the name of the button that writes into it. */
  labels?: { before: string; after: string };
  strings?: DiffineStrings;
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
  beforeMetrics,
  afterMetrics,
  current,
  deps,
  onApply,
  writable,
  labels,
  strings
}: DiffineLinksProps): React.JSX.Element {
  const column = React.useRef<HTMLDivElement>(null);
  /*
   * What this component's own gradients are called.
   *
   * A page can hold more than one viewer, and two `<defs>` naming the same
   * gradient is one gradient — whichever came second, drawn in whichever
   * palette its component happened to have. `useId` is unique per instance and
   * the same on the server as in the browser; the characters React puts round
   * it are not legal in a URL fragment, so they come off.
   */
  const gradient = React.useId().replace(/[^\w-]/g, '');
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
      const left = bandFor(
        beforeLayout,
        beforeBoxes,
        beforeMetrics,
        change.rowStart,
        change.rowEnd
      );
      const right = bandFor(afterLayout, afterBoxes, afterMetrics, change.rowStart, change.rowEnd);
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

      const top = `M0 ${leftTop}C${bend} ${leftTop} ${bend} ${rightTop} ${width} ${rightTop}`;
      const bottom = `M0 ${leftBottom}C${bend} ${leftBottom} ${bend} ${rightBottom} ${width} ${rightBottom}`;

      next.push({
        index,
        kind: change.kind,
        current: index === current,
        middle: (Math.min(leftTop, rightTop) + Math.max(leftBottom, rightBottom)) / 2,
        area:
          `${top}L${width} ${rightBottom}` +
          `C${bend} ${rightBottom} ${bend} ${leftBottom} 0 ${leftBottom}` +
          'Z',
        top,
        bottom
      });
    }

    setLinks((held) =>
      held.length === next.length &&
      held.every(
        (link, index) =>
          link.area === next[index].area &&
          link.current === next[index].current &&
          link.index === next[index].index
      )
        ? held
        : next
    );
  };

  const measure = () => {
    // Only worth doing when the answer is not arithmetic. With every line the
    // same height there is nothing a measurement would add, and most of the
    // lines are not on the page to be measured anyway.
    // Only worth reading the page where the arithmetic cannot answer, which is
    // a pane drawing every row it has.
    geometry.current = [
      beforeMetrics.total > 0 ? new Map() : readRows(before.current),
      afterMetrics.total > 0 ? new Map() : readRows(after.current)
    ];
    paint();
  };

  const watched = [column, before, after];

  useMeasure(watched, measure, [...deps, beforeMetrics, afterMetrics, current]);
  useScrollWatch(watched, paint, true, deps);

  /*
   * The buttons that take a change across, and the whole of what decides
   * whether there are any: something to write with, a side that can be written
   * into, and the words to name the button with.
   */
  const applying = onApply && writable && labels && strings && (writable.before || writable.after);

  return (
    <div className="diffine-links" ref={column} aria-hidden={applying ? undefined : true}>
      <svg className="diffine-links-canvas" focusable="false" aria-hidden="true">
        <defs>
          {/*
            An edit went out on one side and came in on the other, so its band
            is not one colour. It is the colour it left as on the left-hand edge
            and the colour it arrived as on the right, and the two run into each
            other across the column — which says in one shape what a red band
            with a green outline said in two contradictory ones.

            The stops are custom properties, so this is themed with everything
            else. The `fill` and `stroke` are written on the elements rather
            than in the stylesheet because a rule there cannot name an
            identifier this component made up; nothing in the stylesheet claims
            either for a `replace`, so the attributes stand.
          */}
          <linearGradient id={`${gradient}-area`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="var(--diffine-delete-line)" />
            <stop offset="1" stopColor="var(--diffine-insert-line)" />
          </linearGradient>
          <linearGradient id={`${gradient}-edge`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="var(--diffine-delete-text)" />
            <stop offset="1" stopColor="var(--diffine-insert-text)" />
          </linearGradient>
        </defs>
        {links.map((link, index) => (
          <g
            key={index}
            className="diffine-link"
            data-kind={link.kind}
            data-current={link.current ? 'true' : undefined}
          >
            <path
              className="diffine-link-area"
              d={link.area}
              fill={link.kind === 'replace' ? `url(#${gradient}-area)` : undefined}
            />
            <path
              className="diffine-link-edge"
              d={link.top}
              stroke={link.kind === 'replace' ? `url(#${gradient}-edge)` : undefined}
            />
            <path
              className="diffine-link-edge"
              d={link.bottom}
              stroke={link.kind === 'replace' ? `url(#${gradient}-edge)` : undefined}
            />
          </g>
        ))}
      </svg>
      {applying
        ? links.map((link) => (
            <div key={link.index} className="diffine-apply" style={{ top: link.middle }}>
              {writable.before ? (
                <button
                  type="button"
                  className="diffine-apply-button"
                  aria-label={fill(strings.applyChange, { label: labels.before })}
                  onClick={() => onApply(changes[link.index], 'before')}
                >
                  <Arrow left />
                </button>
              ) : null}
              {writable.after ? (
                <button
                  type="button"
                  className="diffine-apply-button"
                  aria-label={fill(strings.applyChange, { label: labels.after })}
                  onClick={() => onApply(changes[link.index], 'after')}
                >
                  <Arrow />
                </button>
              ) : null}
            </div>
          ))
        : null}
    </div>
  );
}
