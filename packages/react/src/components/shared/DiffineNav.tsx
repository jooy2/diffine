'use client';

import * as React from 'react';
import type { DiffineStrings } from '../../types.js';
import { fill } from '../../internal/i18n.js';
import { Chevron } from './DiffineIcons.js';

export interface DiffineNavProps {
  total: number;
  /** Which change a reader has moved to, or -1 before they have moved to any. */
  current: number;
  /** Which way to move. Where that lands is the component's to work out. */
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
export function DiffineNav({
  total,
  current,
  onStep,
  strings
}: DiffineNavProps): React.JSX.Element {
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
