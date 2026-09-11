'use client';

import * as React from 'react';

/**
 * A part of the view fetched the first time something asks to draw it.
 *
 * Some of what a viewer can draw is not on the screen when it opens and is
 * never on the screen at all for most readers: a search bar nobody opened, a
 * menu of languages a page that colours nothing has no use for. Statically
 * imported, those are kilobytes every reader downloads to look at two
 * documents. Behind an `import()`, they are a file the one reader who asks for
 * them fetches, and the rest of the page has already drawn by then.
 *
 * What it costs is a render: the first pass after a reader asks has nothing to
 * draw, and the module arrives in the second. So this is for what a reader
 * reaches for rather than what they land on — a bar that opens on a keystroke,
 * not a bar that is there when the page is.
 *
 * The loader has to be a constant of its module rather than something written
 * out at the call site, because it is the key everything here is kept under.
 * Written inline it would be a different key on every render, which is a fetch
 * that never finishes arriving.
 */
interface Held {
  part: unknown;
  fetching: Promise<unknown> | null;
}

/**
 * What the page has asked for, so that the second viewer on it finds a module
 * the first one fetched rather than waiting for a round trip of its own.
 */
const HELD = new Map<() => Promise<unknown>, Held>();

export function useLazyPart<T>(load: () => Promise<T>, wanted: boolean): T | null {
  /*
   * Whether the module has arrived is a fact about the page rather than state,
   * and a render is allowed to read it. What this holds is only the reason to
   * render again: a module that arrived after the last render did.
   */
  const [, arrived] = React.useReducer((count: number) => count + 1, 0);

  React.useEffect(() => {
    if (!wanted || HELD.get(load)?.part) {
      return;
    }

    let live = true;
    const held = HELD.get(load) ?? { part: null, fetching: null };

    HELD.set(load, held);
    // A module that could not be fetched is left as nothing rather than tried
    // again. The effect does not run a second time for the same loader, so a
    // network that dropped is a part of the view that stays away — which is
    // what every caller here already draws when it is not there yet.
    held.fetching ??= load()
      .then((part) => (held.part = part))
      .catch(() => null);

    void held.fetching.then(() => {
      if (live) {
        arrived();
      }
    });

    return () => {
      live = false;
    };
  }, [load, wanted]);

  return wanted ? ((HELD.get(load)?.part as T | undefined) ?? null) : null;
}
