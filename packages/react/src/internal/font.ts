import type * as React from 'react';
import type { DiffineFont } from '../types.js';

/**
 * A `font` prop, as the four custom properties the stylesheet reads.
 *
 * Written onto the element rather than applied as `font-family` and the rest,
 * because those four properties are not only what the text is drawn with. The
 * gutter is `--diffine-digits` characters wide, a row is one
 * `--diffine-line-height` tall, and the editor's field is laid over lines that
 * have to agree with it about all of that. One property each is what keeps the
 * whole component moving together.
 */
export function fontVariables(font: DiffineFont | undefined): React.CSSProperties {
  if (!font) {
    return {};
  }

  const variables: Record<string, string> = {};

  if (font.family) {
    variables['--diffine-font'] = font.family;
  }

  const size = lengthOf(font.size);
  const lineHeight = lengthOf(font.lineHeight);
  const letterSpacing = lengthOf(font.letterSpacing);

  if (size) {
    variables['--diffine-font-size'] = size;
  }

  if (lineHeight) {
    variables['--diffine-line-height'] = lineHeight;
  }

  if (letterSpacing) {
    variables['--diffine-letter-spacing'] = letterSpacing;
  }

  return variables as React.CSSProperties;
}

/** A number is pixels, and a string is whatever CSS makes of it. */
function lengthOf(value: string | number | undefined): string | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }

  return typeof value === 'number' ? `${value}px` : value;
}
