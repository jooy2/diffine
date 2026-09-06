'use client';

import * as React from 'react';
import type { DiffChange } from '../types.js';
import { useControlled } from './controlled.js';
import { useIsomorphicLayoutEffect } from './layout.js';
import type { PaneLayout } from './rows.js';

/** Where in a pane a change begins, or -1 for a pane that has no part of it. */
function startOf(layout: PaneLayout, change: DiffChange): number {
  for (let row = change.rowStart; row < change.rowEnd; row += 1) {
    if (layout.positions[row] >= 0) {
      return layout.positions[row];
    }
  }

  // A change this side has no lines for. The nearest line above it is where a
  // reader would look for the hole.
  for (let row = change.rowStart - 1; row >= 0; row -= 1) {
    if (layout.positions[row] >= 0) {
      return layout.positions[row];
    }
  }

  return -1;
}

export interface ChangeNavigationOptions {
  changes: readonly DiffChange[];
  /** The scrolling columns, in the order their layouts are given. */
  panes: readonly React.RefObject<HTMLElement | null>[];
  layouts: readonly PaneLayout[];
  /** The height of one line, or `0` when a row's position has to be measured. */
  rowHeight: number;
  /** Works the drawn window out again, for a pane that has just been jumped. */
  remeasure: () => void;
  /** Which change the application is holding, or `undefined` to hold it here. */
  selected?: number;
  defaultSelected: number;
  onSelectedChange?: (selected: number, change: DiffChange | null) => void;
}

/** Which change a reader is on, and the one move they can make from there. */
export interface ChangeNavigation {
  /** The change being looked at, or -1 before a reader has moved to one. */
  current: number;
  /** Moves on a change, or back one, wrapping at either end. */
  step: (direction: 1 | -1) => void;
}

/**
 * Reading a comparison one change at a time.
 *
 * Both components do this and both do it the same way, which is the whole
 * reason it is here: the buttons say which direction, this works out where that
 * lands, and the panes are scrolled so that the change is on the screen with
 * the lines that led up to it still above it.
 *
 * Scrolling follows the selection rather than the button, so an application
 * that sets `selected` itself moves the view exactly the way a reader does.
 */
export function useChangeNavigation({
  changes,
  panes,
  layouts,
  rowHeight,
  remeasure,
  selected,
  defaultSelected,
  onSelectedChange
}: ChangeNavigationOptions): ChangeNavigation {
  const [held, setHeld] = useControlled(selected, defaultSelected);
  // A comparison with fewer changes than the last one leaves the old number
  // pointing at nothing, and a number pointing at nothing is no selection.
  const current = held >= 0 && held < changes.length ? held : -1;

  /**
   * Where the last button press landed, tracked as it happens.
   *
   * Two presses inside one task both see the state the render before them had,
   * so both would work out the same next change and the second would do
   * nothing. This is written the moment a press is handled, so the second press
   * steps on from where the first one went.
   */
  const pending = React.useRef(current);

  useIsomorphicLayoutEffect(() => {
    pending.current = current;
  });

  function step(direction: 1 | -1): void {
    const total = changes.length;

    if (total === 0) {
      return;
    }

    const from = pending.current;
    const index = from < 0 ? (direction > 0 ? 0 : total - 1) : (from + direction + total) % total;

    pending.current = index;
    setHeld(index);
    onSelectedChange?.(index, changes[index]);
  }

  /** Puts a change on the screen. `false` when there was nothing to point at. */
  function reveal(index: number): boolean {
    const change = changes[index];
    let moved = false;

    if (!change) {
      return false;
    }

    for (const [side, pane] of panes.entries()) {
      const element = pane.current;
      const position = startOf(layouts[side], change);

      if (!element || position < 0) {
        continue;
      }

      const top =
        rowHeight > 0
          ? position * rowHeight
          : (element.querySelector<HTMLElement>(`[data-row="${position}"]`)?.offsetTop ?? -1);

      if (top >= 0) {
        // A third of the way down rather than hard against the top: a change
        // reads better with the lines that led up to it still on the screen.
        element.scrollTop = Math.max(0, top - element.clientHeight / 3);
        moved = true;
      }
    }

    if (moved) {
      // The pane has jumped somewhere the drawn lines do not cover, and waiting
      // for the scroll it just raised would leave a reader looking at nothing
      // for a frame.
      remeasure();
    }

    return moved;
  }

  /*
   * The number is only remembered once the scrolling worked. On the first pass
   * the lines a virtualised pane needs have not been drawn and there is no
   * height to place them by; the pass after the measurement has both.
   */
  const revealed = React.useRef(current);

  useIsomorphicLayoutEffect(() => {
    if (revealed.current === current) {
      return;
    }

    if (current < 0 || reveal(current)) {
      revealed.current = current;
    }
  });

  return { current, step };
}
