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
