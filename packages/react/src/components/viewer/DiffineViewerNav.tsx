'use client';

import * as React from 'react';
import type { DiffineStrings } from '../../types.js';
import { fill } from '../../internal/i18n.js';

export interface DiffineViewerNavProps {
  total: number;
  /** Which change a reader has moved to, or -1 before they have moved to any. */
  current: number;
  /** Which way to move. Where that lands is the viewer's to work out. */
  onStep: (direction: 1 | -1) => void;
  strings: DiffineStrings;
}

/**
 * Two buttons and a count, for reading a long comparison one change at a time.
 *
 * They wrap. A reader working down a file wants the next change rather than a
 * button that stops working at the bottom, and the count beside them is what
 * makes that unambiguous — going from `4 / 4` to `1 / 4` says what happened.
 *
 * The count is drawn for the eye and hidden from a screen reader, which is told
 * the same thing in a sentence when it changes. A fraction read out as "one
 * slash four" is not what anybody meant by it.
 */
export function DiffineViewerNav({
  total,
  current,
  onStep,
  strings
}: DiffineViewerNavProps): React.JSX.Element {
  const none = total === 0;

  return (
    <div className="diffine-nav">
      <button
        type="button"
        className="diffine-nav-button"
        disabled={none}
        title={strings.previousChange}
        aria-label={strings.previousChange}
        onClick={() => onStep(-1)}
      >
        <Chevron up />
      </button>
      <span className="diffine-nav-position" aria-hidden="true">
        {`${current < 0 ? '–' : current + 1} / ${total}`}
      </span>
      <button
        type="button"
        className="diffine-nav-button"
        disabled={none}
        title={strings.nextChange}
        aria-label={strings.nextChange}
        onClick={() => onStep(1)}
      >
        <Chevron />
      </button>
      <span className="diffine-said" role="status">
        {current < 0 ? '' : fill(strings.changePosition, { position: current + 1, total })}
      </span>
    </div>
  );
}

/** Drawn rather than imported: two lines are not worth a dependency. */
function Chevron({ up = false }: { up?: boolean }): React.JSX.Element {
  return (
    <svg
      className="diffine-chevron"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={up ? 'M3.5 10 8 5.5 12.5 10' : 'M3.5 6 8 10.5 12.5 6'} />
    </svg>
  );
}
