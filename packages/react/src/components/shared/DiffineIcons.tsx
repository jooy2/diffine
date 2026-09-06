'use client';

import * as React from 'react';

/**
 * The marks the components draw beside their own controls.
 *
 * Drawn rather than imported. Three paths are not worth a dependency, and an
 * icon font or an SVG sprite is a second thing an application would have to
 * install for a component that otherwise arrives as one import and one
 * stylesheet.
 *
 * They take their colour from the button they sit in and are hidden from a
 * screen reader, which is told what the button does by the button.
 */

/** The shared attributes, so that every mark is the same weight and size. */
const LINES = {
  viewBox: '0 0 16 16',
  width: 14,
  height: 14,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false
} as const;

/** Which way the next thing is, for the buttons that move between them. */
export function Chevron({ up = false }: { up?: boolean }): React.JSX.Element {
  return (
    <svg className="diffine-chevron" {...LINES}>
      <path d={up ? 'M3.5 10 8 5.5 12.5 10' : 'M3.5 6 8 10.5 12.5 6'} />
    </svg>
  );
}

/** Looking for something, which is what opens the search bar. */
export function Magnifier(): React.JSX.Element {
  return (
    <svg className="diffine-icon" {...LINES}>
      <circle cx="7" cy="7" r="4.25" />
      <path d="M10.25 10.25 13.5 13.5" />
    </svg>
  );
}

/** Done with it, which is what closes the search bar. */
export function Cross(): React.JSX.Element {
  return (
    <svg className="diffine-icon" {...LINES}>
      <path d="M4 4 12 12M12 4 4 12" />
    </svg>
  );
}

/** Smaller, larger, and the whole thing at once — the three zoom buttons. */
export function Minus(): React.JSX.Element {
  return (
    <svg className="diffine-icon" {...LINES}>
      <path d="M3.5 8h9" />
    </svg>
  );
}

export function Plus(): React.JSX.Element {
  return (
    <svg className="diffine-icon" {...LINES}>
      <path d="M8 3.5v9M3.5 8h9" />
    </svg>
  );
}

export function Frame(): React.JSX.Element {
  return (
    <svg className="diffine-icon" {...LINES}>
      <path d="M3 6V3h3M13 6V3h-3M3 10v3h3M13 10v3h-3" />
    </svg>
  );
}

/**
 * What each mark in the bar under the panes is, on a sixteen-unit square.
 *
 * Three of them are the `~`, `+` and `−` the gutter puts beside a line, drawn
 * again at the size of the bar. A reader who has learnt them once up there has
 * learnt them here, and a picture comparison borrows the same three for the
 * same three things.
 */
const TALLY: Record<string, string> = {
  document: 'M4.5 2.5h5l2.5 2.5v8.5h-7.5zM9.5 2.5V5h2.5',
  picture: 'M2.5 3.5h11v9h-11zM2.5 10l3-3 3 3M8 9.5l2-2 3.5 3.5',
  change: 'M2.5 9.5q2.75-4 5.5 0t5.5 0',
  insert: 'M8 3.5v9M3.5 8h9',
  delete: 'M3.5 8h9',
  region: 'M2.5 5.5v-3h3M13.5 5.5v-3h-3M2.5 10.5v3h3M13.5 10.5v3h-3',
  identical: 'M3.5 8.5 6.5 11.5 12.5 4.5'
};

/** Drawn rather than imported: seven paths are not worth a dependency. */
export function TallyIcon({ kind }: { kind: keyof typeof TALLY }): React.JSX.Element {
  return (
    <svg
      className="diffine-tally-icon"
      viewBox="0 0 16 16"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={TALLY[kind]} />
    </svg>
  );
}
