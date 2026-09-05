'use client';

import * as React from 'react';
import { useMeasure } from './layout.js';
import { useScrollWatch } from './scroll.js';

/** Which slice of a pane's lines is on the page, as a half-open interval. */
export interface VirtualWindow {
  start: number;
  end: number;
}

/** What the panes are drawing, and how tall one line turned out to be. */
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
  /**
   * The height of one line, or `0` when every line is being drawn.
   *
   * Anything that needs to know where a line is without looking at it reads
   * this: a number above zero is a promise that line `n` starts at `n` times
   * it, and a zero is a document whose rows have to be measured one by one.
   */
  rowHeight: number;
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

/**
 * Draws the lines a reader can see and leaves the rest as empty space.
 *
 * A comparison of twenty thousand lines is twenty thousand rows in the page,
 * and a browser asked to lay that out is a browser that stops answering for a
 * second. What a reader can see is forty of them. So the pane keeps its full
 * height — a spacer above the drawn lines and another below — and only the
 * lines inside the window are elements.
 *
 * This works because every line is exactly as tall as every other, which is
 * true of a pane that is not wrapping and of nothing else. A line that wraps
 * three times is three lines tall, its height cannot be known without drawing
 * it, and a spacer standing in for a thousand undrawn lines of unknown height
 * would be a guess that moved under the reader as they scrolled. Wrapping turns
 * this off, and the whole document is drawn.
 */
export function useVirtualRows(
  panes: readonly React.RefObject<HTMLElement | null>[],
  counts: readonly number[],
  enabled: boolean,
  deps: React.DependencyList
): VirtualRows {
  const wanted = enabled && counts.some((count) => count > THRESHOLD);
  const [state, setState] = React.useState<Omit<VirtualRows, 'remeasure'>>({
    windows: whole(counts),
    rowHeight: 0
  });

  // A plain function rather than a memoised one: the hooks below keep it in a
  // ref and never compare it, and memoising a function that reads a ref means
  // reading that ref during a render.
  const measure = () => {
    if (!wanted) {
      setState((current) =>
        current.rowHeight === 0 && same(current.windows, whole(counts))
          ? current
          : { windows: whole(counts), rowHeight: 0 }
      );

      return;
    }

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

    const windows = panes.map((pane, index) => {
      const element = pane.current;

      if (!element) {
        return { start: 0, end: Math.min(counts[index], THRESHOLD) };
      }

      return {
        start: Math.max(0, Math.floor(element.scrollTop / rowHeight) - OVERSCAN),
        end: Math.min(
          counts[index],
          Math.ceil((element.scrollTop + element.clientHeight) / rowHeight) + OVERSCAN
        )
      };
    });

    setState((current) =>
      current.rowHeight === rowHeight && same(current.windows, windows)
        ? current
        : { windows, rowHeight }
    );
  };

  useMeasure(panes, measure, [...deps, wanted, ...counts]);
  useScrollWatch(panes, measure, wanted, [...deps, ...counts]);

  // Answered from the props rather than from the state, so that turning this
  // off draws the whole document on the same render rather than on the one
  // after the effect has caught up with it.
  if (!wanted) {
    return { windows: whole(counts), rowHeight: 0, remeasure: measure };
  }

  // Until the first measurement there is no height to place a spacer with, so
  // the first slice is a guess: enough lines to fill any pane and to be
  // measured, and few enough that a long document is never drawn whole.
  return state.rowHeight === 0
    ? {
        windows: counts.map((count) => ({ start: 0, end: Math.min(count, THRESHOLD) })),
        rowHeight: 0,
        remeasure: measure
      }
    : { ...state, remeasure: measure };
}
