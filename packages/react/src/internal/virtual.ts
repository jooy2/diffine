'use client';

import * as React from 'react';
import { useMeasure } from './layout.js';
import { DRAWN_ROWS, evenRows, unevenRows, type RowMetrics } from './metrics.js';
import { useScrollWatch } from './scroll.js';

/** Which slice of a pane's lines is on the page, as a half-open interval. */
export interface VirtualWindow {
  start: number;
  end: number;
}

/** What the panes are drawing, and where the rows of each of them are. */
export interface VirtualRows {
  windows: readonly VirtualWindow[];
  /**
   * Works the windows out again, now, from where the panes are.
   *
   * For anything that moves a pane itself rather than waiting for a reader to.
   * Scrolling raises an event and the windows follow it a frame later, which is
   * soon enough for a reader dragging a scrollbar and one frame too late for a
   * jump — the pane would be at a part of the document that has not been drawn,
   * and a reader would see it empty before it filled. Called from an effect,
   * this lands before the browser has painted either.
   */
  remeasure: () => void;
  /** Where the rows of each pane are. See `metrics.ts`. */
  metrics: readonly RowMetrics[];
}

/** How many lines above and below the pane are drawn anyway. */
const OVERSCAN = 8;

/** What is drawn before anything has been measured, and the least worth cutting. */
const THRESHOLD = 120;

/** Every line of every pane, which is what a document short enough gets. */
function whole(counts: readonly number[]): VirtualWindow[] {
  return counts.map((count) => ({ start: 0, end: count }));
}

function same(a: readonly VirtualWindow[], b: readonly VirtualWindow[]): boolean {
  return (
    a.length === b.length &&
    a.every((window, index) => window.start === b[index].start && window.end === b[index].end)
  );
}

/** Where each row of one pane starts, from the heights of the ones measured so far. */
function tableOf(heights: Float64Array, count: number): Float64Array {
  let measured = 0;
  let sum = 0;

  for (let row = 0; row < count; row += 1) {
    if (heights[row] > 0) {
      measured += 1;
      sum += heights[row];
    }
  }

  // The rows nobody has drawn stand at the average of the ones somebody has.
  // Every row that is measured makes this a better guess and never a worse one,
  // and a row keeps its own height once it has one.
  const guess = measured > 0 ? sum / measured : 0;
  const tops = new Float64Array(count + 1);

  for (let row = 0; row < count; row += 1) {
    tops[row + 1] = tops[row] + (heights[row] > 0 ? heights[row] : guess);
  }

  return tops;
}

/**
 * Draws the lines a reader can see and leaves the rest as empty space.
 *
 * A comparison of twenty thousand lines is twenty thousand rows in the page,
 * and a browser asked to lay that out is a browser that stops answering for a
 * second. What a reader can see is forty of them. So the pane keeps its full
 * height — a spacer above the drawn lines and another below — and only the
 * lines inside the window are elements.
 *
 * With every line the same height, where the rows are is arithmetic. With
 * wrapping on it is not: a line that wraps three times is three lines tall and
 * its height cannot be known without drawing it. So the heights of the rows
 * that have been drawn are kept, the rest stand at the average of those, and
 * the pane is scrolled by however much the row under its top edge moved when a
 * measurement replaced a guess — which is what keeps the words a reader is
 * looking at where they were looking at them.
 */
export function useVirtualRows(
  panes: readonly React.RefObject<HTMLElement | null>[],
  counts: readonly number[],
  enabled: boolean,
  /** Whether every row is the same height, which is a pane that is not wrapping. */
  even: boolean,
  /**
   * Whether the panes are held level with each other, and so are one column of
   * rows drawn twice rather than two columns of their own.
   *
   * It decides whether they share a table of heights. Two tables would drift:
   * the rows nobody has drawn stand at the average of the ones somebody has,
   * the two sides average to different numbers, and two columns of different
   * heights are two scrollbars that cannot both be right.
   */
  shared: boolean,
  deps: React.DependencyList
): VirtualRows {
  const wanted = enabled && counts.some((count) => count > THRESHOLD);
  const [state, setState] = React.useState<Omit<VirtualRows, 'remeasure'>>(() => ({
    windows: whole(counts),
    metrics: counts.map(() => DRAWN_ROWS)
  }));
  /** What each row of each pane measured, kept between passes and never guessed over. */
  const heights = React.useRef<Float64Array[]>([]);
  /** How wide the panes were when those heights were measured. */
  const widths = React.useRef('');

  // A plain function rather than a memoised one: the hooks below keep it in a
  // ref and never compare it, and memoising a function that reads a ref means
  // reading that ref during a render.
  const measure = () => {
    if (!wanted) {
      setState((current) =>
        current.metrics.every((metrics) => metrics === DRAWN_ROWS) &&
        same(current.windows, whole(counts))
          ? current
          : { windows: whole(counts), metrics: counts.map(() => DRAWN_ROWS) }
      );

      return;
    }

    if (even) {
      measureEven();

      return;
    }

    measureUneven();
  };

  /** One height for every row, read off whichever row happens to be drawn. */
  function measureEven(): void {
    // Read again on every pass rather than remembering it. A line's height
    // follows the font, and the font follows a custom property the application
    // is free to change at any moment.
    let rowHeight = 0;

    for (const pane of panes) {
      const drawn = pane.current?.querySelector<HTMLElement>('[data-row]');

      if (drawn?.offsetHeight) {
        rowHeight = drawn.offsetHeight;
        break;
      }
    }

    // Nothing is on the page yet, so there is nothing to measure and nothing
    // to cut. The next pass, after the first lines are drawn, has both.
    if (rowHeight === 0) {
      return;
    }

    const metrics = counts.map((count) => evenRows(count, rowHeight));
    const windows = panes.map((pane, index) =>
      windowIn(pane.current, metrics[index], counts[index])
    );

    setState((current) =>
      same(current.windows, windows) && sameHeights(current.metrics, metrics)
        ? current
        : { windows, metrics }
    );
  }

  /** A height for each row that has been drawn, and the average for the rest. */
  function measureUneven(): void {
    // A row's height follows the width it is wrapped in, so nothing measured at
    // one width says anything about another. The whole table goes rather than
    // being corrected: the rows in front of the reader are measured again on
    // this pass, and the rest were a guess either way.
    const now = panes.map((pane) => pane.current?.clientWidth ?? 0).join();

    if (now !== widths.current) {
      widths.current = now;
      heights.current = [];
    }

    /** The table one pane writes into, which is both panes' where they are level. */
    function tableFor(index: number): Float64Array {
      const slot = shared ? 0 : index;
      let held = heights.current[slot];

      if (!held || held.length !== counts[index]) {
        held = new Float64Array(counts[index]);
        heights.current[slot] = held;
      }

      return held;
    }

    let ready = false;

    // Every height first, and the tables read only once both panes have written
    // to them. Held level, a pair is one row drawn twice, and building one
    // side's answer before the other has been read is building it from half a
    // column.
    for (const [index, pane] of panes.entries()) {
      const held = tableFor(index);

      for (const row of pane.current?.querySelectorAll<HTMLElement>('[data-row]') ?? []) {
        const at = Number(row.dataset.row);

        if (at >= 0 && at < held.length) {
          // The taller of the two, which is the height the pair is held at.
          // Reading it here rather than waiting for the levelling to write it
          // is what keeps the first pass from recording two different columns.
          held[at] = Math.max(held[at], row.offsetHeight);
          ready = true;
        }
      }
    }

    // Nothing is on the page yet, so there is nothing to measure and nothing to
    // cut. The next pass, after the first lines are drawn, has both.
    if (!ready) {
      return;
    }

    const metrics: RowMetrics[] = [];
    const windows: VirtualWindow[] = [];
    let level: RowMetrics | null = null;

    for (const [index, pane] of panes.entries()) {
      const count = counts[index];
      const element = pane.current;
      const before = state.metrics[index] ?? DRAWN_ROWS;
      const anchor = element ? before.at(element.scrollTop) : -1;
      const drift = anchor >= 0 && element ? element.scrollTop - before.top(anchor) : 0;
      const next: RowMetrics =
        shared && level ? level : unevenRows(tableOf(tableFor(index), count), count);

      level = next;

      // The rows above the one a reader is looking at have just changed height,
      // and everything below them has moved by however much. Following that
      // with the scroll is what keeps the words in front of them still.
      if (element && anchor >= 0) {
        const moved = next.top(anchor) + drift;

        if (Math.abs(moved - element.scrollTop) > 0.5) {
          element.scrollTop = moved;
        }
      }

      metrics.push(next);
      windows.push(windowIn(element, next, count));
    }

    setState((current) =>
      same(current.windows, windows) && sameHeights(current.metrics, metrics)
        ? current
        : { windows, metrics }
    );
  }

  /*
   * How long the documents are, as one value rather than as one each.
   *
   * A dependency list has to be the same length on every render, and the number
   * of panes is not: a split view has two and a unified view has one. Spread,
   * the counts made both lists below grow and shrink as a reader switched
   * between the two views — which React refuses to compare, and says so.
   * Joined, it is one entry that changes exactly when a count does, and when a
   * pane arrives or leaves.
   */
  const sizes = counts.join();

  useMeasure(panes, measure, [...deps, wanted, even, sizes]);
  useScrollWatch(panes, measure, wanted, [...deps, even, sizes]);

  // Answered from the props rather than from the state, so that turning this
  // off draws the whole document on the same render rather than on the one
  // after the effect has caught up with it.
  if (!wanted) {
    return { windows: whole(counts), metrics: counts.map(() => DRAWN_ROWS), remeasure: measure };
  }

  // Until the first measurement there is nothing to place a spacer with, so the
  // first slice is a guess: enough lines to fill any pane and to be measured,
  // and few enough that a long document is never drawn whole.
  return state.metrics[0] === DRAWN_ROWS
    ? {
        windows: counts.map((count) => ({ start: 0, end: Math.min(count, THRESHOLD) })),
        metrics: counts.map(() => DRAWN_ROWS),
        remeasure: measure
      }
    : { ...state, remeasure: measure };
}

/** Which rows of one pane are worth drawing, from where it has been scrolled to. */
function windowIn(pane: HTMLElement | null, metrics: RowMetrics, count: number): VirtualWindow {
  if (!pane) {
    return { start: 0, end: Math.min(count, THRESHOLD) };
  }

  const first = metrics.at(pane.scrollTop);
  const last = metrics.at(pane.scrollTop + pane.clientHeight);

  return {
    start: Math.max(0, first - OVERSCAN),
    end: Math.min(count, last + 1 + OVERSCAN)
  };
}

/** Whether two sets of metrics put every row in the same place. */
function sameHeights(a: readonly RowMetrics[], b: readonly RowMetrics[]): boolean {
  return a.length === b.length && a.every((metrics, index) => metrics.total === b[index].total);
}
