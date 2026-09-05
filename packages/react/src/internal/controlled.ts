'use client';

import * as React from 'react';

/**
 * A value the application either holds or leaves to the component.
 *
 * Passing it makes it the application's: it will not change on its own, and the
 * component reports what a reader did instead of acting on it. Leaving it out
 * makes it the component's, and the same reporting still happens — which is
 * what lets an application watch a value it is not managing.
 *
 * Which of the two it is, is decided on the first render and does not change
 * afterwards. A prop that arrives later would otherwise take a value away from
 * the component mid-flight, and there is no honest answer for what should
 * happen to what the reader had already done.
 */
export function useControlled<T>(controlled: T | undefined, initial: T): [T, (value: T) => void] {
  // State rather than a ref, because a ref is not a thing to read while
  // rendering and this is read on every render. Its initial value is worked out
  // once and there is no setter, which is the whole of what is wanted from it.
  const [isControlled] = React.useState(controlled !== undefined);
  const [held, setHeld] = React.useState(controlled ?? initial);

  return [
    isControlled ? (controlled as T) : held,
    (value: T) => {
      if (!isControlled) {
        setHeld(value);
      }
    }
  ];
}
