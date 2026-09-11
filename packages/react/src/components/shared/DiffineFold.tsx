'use client';

import * as React from 'react';
import type { DiffineSide, DiffineTextStrings } from '../../types.js';
import type { FoldRun } from '../../internal/fold.js';
import { fill } from '../../internal/strings/common.js';

export interface DiffineFoldProps {
  /** Where this band sits in its pane's own list, which is what the rows are measured by. */
  row: number;
  /** Which pane it is in, so that it is picked out the way every other line is. */
  side: DiffineSide;
  fold: FoldRun;
  strings: DiffineTextStrings;
  /** Opens the run. Left out for a run whose lines nobody has. */
  onExpand?: (fold: FoldRun) => void;
}

/**
 * One row's worth of band, standing in for the lines a pane is not drawing.
 *
 * It takes a line's place and a line's height, which is what lets everything
 * around it carry on unchanged: the rows are still all the same height, so they
 * are still virtualised, and a band is still one entry in the list a search and
 * the navigation count through.
 *
 * A run that was folded away is a button, because the lines are in hand and a
 * reader can ask for them. A run that is missing — the lines between one hunk
 * of a patch and the next — is not, because there is nothing to open. Both say
 * how many lines they stand for, which is the part a reader needs either way.
 */
export function DiffineFold({
  row,
  side,
  fold,
  strings,
  onExpand
}: DiffineFoldProps): React.JSX.Element {
  const text = fill(strings.folded, { lines: fold.lines });

  return (
    <div className="diffine-line" data-kind="fold" data-side={side} data-row={row}>
      {fold.expandable && onExpand ? (
        <button
          type="button"
          className="diffine-fold"
          aria-label={fill(strings.expand, { lines: fold.lines })}
          onClick={() => onExpand(fold)}
        >
          <span className="diffine-fold-text">{text}</span>
        </button>
      ) : (
        <span className="diffine-fold">
          <span className="diffine-fold-text">{text}</span>
        </span>
      )}
    </div>
  );
}
