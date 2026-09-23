import type * as React from 'react';

/**
 * A `scale` prop, as a number that is safe to multiply by.
 *
 * Anything that is not a positive, finite number is read as 1. A component
 * drawn at nought, or at a negative size, is not a smaller component but a
 * missing one, and a `NaN` written into the stylesheet would throw away every
 * length that is worked out from it.
 */
export function scaleOf(scale: number | undefined): number {
  return typeof scale === 'number' && Number.isFinite(scale) && scale > 0 ? scale : 1;
}

/**
 * A scale, as the custom property the stylesheet multiplies its lengths by.
 *
 * Nothing at all for 1, rather than a 1 written on the element. The property is
 * inherited, so an application can also set it on an element around the
 * component in its own CSS — and a value written here would win over that one
 * for a component that was never asked to be any size.
 */
export function scaleVariables(scale: number): React.CSSProperties {
  if (scale === 1) {
    return {};
  }

  return { '--diffine-scale': String(scale) } as React.CSSProperties;
}
