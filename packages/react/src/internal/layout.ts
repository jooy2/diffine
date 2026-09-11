'use client';

import * as React from 'react';

/**
 * `useLayoutEffect`, and `useEffect` where there is no layout to run before.
 *
 * Everything below measures elements and writes the measurements back, which
 * has to happen before the browser paints or the reader sees the unmeasured
 * frame first. On a server there is nothing to measure and React says so out
 * loud, so the same hook becomes the one that never runs there.
 */
export const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

/** The elements a measurement watches, given as refs so the effect reads them itself. */
export type MeasuredRefs = readonly React.RefObject<HTMLElement | null>[];

/**
 * Runs `measure` after every paint that could have changed what it would find.
 *
 * The refs are read inside the effect rather than during the render that set
 * this up. On the first render they are still `null`, and an observer built
 * from what a render could see would be an observer watching nothing at all.
 *
 * `measure` is kept in a ref and never in a dependency list, so the caller
 * hands over a plain function rather than a memoised one — putting it in the
 * list would tear the observer down and build it again on every render, and
 * memoising it would mean reading a ref during a render to do so.
 */
export function useMeasure(
  refs: MeasuredRefs,
  measure: () => void,
  deps: React.DependencyList
): void {
  const latest = React.useRef(measure);

  useIsomorphicLayoutEffect(() => {
    latest.current = measure;
  });

  useIsomorphicLayoutEffect(() => {
    const run = () => latest.current();

    run();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    // Width is what changes a wrapped row's height, and a container can be
    // resized without this component rendering at all — a window drag, a
    // sidebar opening, a font finishing loading.
    const observer = new ResizeObserver(run);

    for (const ref of refs) {
      if (ref.current) {
        observer.observe(ref.current);
      }
    }

    return () => observer.disconnect();
    // The list is the caller's, because what a measurement depends on is the
    // caller's — and `refs` is left out of it on purpose, since a new array of
    // the same refs a render is every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Where a row sits inside its pane, and how tall it is. */
export interface RowBox {
  top: number;
  height: number;
}

/** Every row of a pane, read in one pass and keyed by the row it belongs to. */
export function readRows(pane: HTMLElement | null): Map<number, RowBox> {
  const boxes = new Map<number, RowBox>();

  if (!pane) {
    return boxes;
  }

  for (const element of pane.querySelectorAll<HTMLElement>('[data-row]')) {
    boxes.set(Number(element.dataset.row), {
      top: element.offsetTop,
      height: element.offsetHeight
    });
  }

  return boxes;
}

/**
 * Holds the two sides level when a wrapped line has made one of them taller.
 *
 * With wrapping off, every row is one line tall and the two sides are level
 * because there is nothing that could make them otherwise. With it on, a line
 * that wraps three times is three lines tall while its counterpart is one, and
 * from there down the two documents are out of step — which is the one thing a
 * side-by-side view cannot be.
 *
 * So each pair is measured and the shorter one is given the height of the
 * taller. The clearing pass first is not optional: a minimum height left over
 * from the last measurement is part of what the next one would measure, and
 * heights that only ever grow never come back down when the pane is widened.
 */
export function useRowAlignment(
  before: React.RefObject<HTMLElement | null>,
  after: React.RefObject<HTMLElement | null>,
  enabled: boolean,
  deps: React.DependencyList
): void {
  const measure = () => {
    const sides = [before.current, after.current].map((pane) =>
      pane ? [...pane.querySelectorAll<HTMLElement>('[data-row]')] : []
    );

    for (const side of sides) {
      for (const element of side) {
        element.style.minHeight = '';
      }
    }

    if (!enabled || sides[0].length === 0 || sides[1].length === 0) {
      return;
    }

    // Read every height before writing any of them. Interleaving the two makes
    // the browser lay the document out again between each pair, which is the
    // difference between one reflow and one per row.
    const heights = sides.map(
      (side) => new Map(side.map((element) => [element.dataset.row, element.offsetHeight]))
    );

    for (const [index, side] of sides.entries()) {
      const opposite = heights[index === 0 ? 1 : 0];

      for (const element of side) {
        const theirs = opposite.get(element.dataset.row);

        if (theirs !== undefined) {
          element.style.minHeight = `${Math.max(heights[index].get(element.dataset.row) ?? 0, theirs)}px`;
        }
      }
    }
  };

  useMeasure([before, after], measure, deps);
}
