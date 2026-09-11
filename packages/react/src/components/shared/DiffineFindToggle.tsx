'use client';

import * as React from 'react';
import type { DiffineTextStrings } from '../../types.js';
import { fill } from '../../internal/strings/common.js';
import type { DocumentSearch } from '../../internal/search.js';
import { Magnifier } from './DiffineIcons.js';

/**
 * The button above a pane that opens its search.
 *
 * Apart from the bar it opens, because it is drawn when the component is and
 * the bar is drawn when a reader asks for it. `DiffineFind.tsx` is fetched on
 * that first ask, and a button that came with it would be a button that
 * appeared in the header a moment after the header did.
 */

export interface DiffineFindToggleProps {
  search: DocumentSearch;
  /** What the pane being searched is called, so two buttons are told apart. */
  label: string;
  strings: DiffineTextStrings;
}

/** The button in the bar above the panes that opens one pane's search. */
export function DiffineFindToggle({
  search,
  label,
  strings
}: DiffineFindToggleProps): React.JSX.Element {
  return (
    <button
      type="button"
      className="diffine-icon-button"
      aria-expanded={search.open}
      aria-label={fill(strings.searchIn, { label })}
      title={strings.search}
      onClick={() => (search.open ? search.hide() : search.show())}
    >
      <Magnifier />
    </button>
  );
}
