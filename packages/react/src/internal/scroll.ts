'use client';

import * as React from 'react';
import { useIsomorphicLayoutEffect } from './layout.js';

/** How far down a scrolling box is, as a fraction of how far it can go. */
function fractionOf(element: HTMLElement): number {
  const travel = element.scrollHeight - element.clientHeight;

  return travel <= 0 ? 0 : element.scrollTop / travel;
}

/**
 * Keeps the two panes looking at the same part of the two documents.
 *
 * Which is not the same as keeping the same number on both, and the difference
 * is `aligned`. With the rows held level, a line and its counterpart are at the
 * same height by construction, so the two panes share one scroll position. With
 * them not held level, the two documents are different lengths and the same
 * number would put a reader at the end of one and the middle of the other; the
 * position becomes a fraction of the way down instead.
 *
 * Sideways is always shared exactly. A reader who has scrolled right to read
 * the end of a long line wants the end of its counterpart, not the same
 * proportion of a shorter one.
 */
export function useSyncedScroll(
  before: React.RefObject<HTMLElement | null>,
  after: React.RefObject<HTMLElement | null>,
  enabled: boolean,
  aligned: boolean
): void {
  useIsomorphicLayoutEffect(() => {
    const panes = [before.current, after.current];

    if (!enabled || !panes[0] || !panes[1]) {
      return;
    }

    // Setting a scroll position raises a scroll event of its own, so the two
    // panes would answer each other for ever if either of them ever answered
    // one it had caused. Nothing here remembers which of the two that was:
    // moving a pane that is already where it should be is what would keep the
    // exchange going, and not doing it is what ends it — after one bounce, in
    // which neither pane has anything left to say.
    const NEAR_ENOUGH = 1;

    /*
     * How near is near enough, in the target's own pixels.
     *
     * A pixel, until the two documents are wildly different lengths. A fraction
     * of the way down a pane of eighty pixels of travel cannot say more than
     * one part in eighty, so the answer that comes back from a pane that short
     * is only ever that precise — and read against seventy thousand pixels of
     * travel on the other side, one pixel of rounding over there is nine
     * hundred over here. Insisting on a pixel then is insisting the long pane
     * move to a position the short one never meant, which is a jump of half a
     * screen every time anything scrolls the long one to a particular line.
     */
    const tolerance = (source: HTMLElement, target: HTMLElement) => {
      const travel = source.scrollHeight - source.clientHeight;

      return aligned || travel <= 0
        ? NEAR_ENOUGH
        : Math.max(NEAR_ENOUGH, (target.scrollHeight - target.clientHeight) / travel);
    };

    const follow = (source: HTMLElement, target: HTMLElement) => () => {
      const wanted = aligned
        ? source.scrollTop
        : fractionOf(source) * (target.scrollHeight - target.clientHeight);

      if (Math.abs(target.scrollTop - wanted) > tolerance(source, target)) {
        target.scrollTop = wanted;
      }

      if (Math.abs(target.scrollLeft - source.scrollLeft) > NEAR_ENOUGH) {
        target.scrollLeft = source.scrollLeft;
      }
    };

    const listeners = [
      { pane: panes[0], listener: follow(panes[0], panes[1]) },
      { pane: panes[1], listener: follow(panes[1], panes[0]) }
    ];

    for (const { pane, listener } of listeners) {
      pane.addEventListener('scroll', listener, { passive: true });
    }

    return () => {
      for (const { pane, listener } of listeners) {
        pane.removeEventListener('scroll', listener);
      }
    };
  }, [before, after, enabled, aligned]);
}

/**
 * Calls `onScroll` at most once a frame, for as long as either pane is moving.
 *
 * A frame is the right unit here rather than every event: a scroll fires far
 * faster than the screen is redrawn, and what this is for is redrawing.
 */
export function useScrollWatch(
  refs: readonly React.RefObject<HTMLElement | null>[],
  onScroll: () => void,
  enabled: boolean,
  deps: React.DependencyList = []
): void {
  const latest = React.useRef(onScroll);

  useIsomorphicLayoutEffect(() => {
    latest.current = onScroll;
  });

  useIsomorphicLayoutEffect(() => {
    if (!enabled) {
      return;
    }

    let queued = 0;

    const listener = () => {
      if (queued) {
        return;
      }

      queued = requestAnimationFrame(() => {
        queued = 0;
        latest.current();
      });
    };

    const panes = refs.map((ref) => ref.current).filter((pane) => pane !== null);

    for (const pane of panes) {
      pane.addEventListener('scroll', listener, { passive: true });
    }

    return () => {
      for (const pane of panes) {
        pane.removeEventListener('scroll', listener);
      }

      if (queued) {
        cancelAnimationFrame(queued);
      }
    };
    // The refs are read when the listeners go on, so anything that replaces the
    // elements they point at has to be on this list as well as `enabled`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);
}
