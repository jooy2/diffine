'use client';

import * as React from 'react';
import type { DiffineHighlight } from '../../types.js';
import { PLAIN } from './catalogue.js';
import { isLoaded, loadLanguage, tokenizeLines } from './engine.js';

/**
 * The `highlight` a `language` amounts to, or nothing while there is no grammar.
 *
 * The grammar arrives over the network, so the first paint of a viewer that was
 * given a language is the document uncoloured and the second is the document
 * coloured. That is the honest order: a component that waited for a grammar
 * before drawing anything would be a component that shows nothing while a
 * request is in flight, and what it is showing is a comparison rather than a
 * syntax tree.
 *
 * The two documents are tokenised once per comparison rather than once per
 * render, and the lines they are tokenised from are the comparison's own — so
 * entry `n` is line `n`, with no second opinion about where a line ends.
 *
 * That tokenising is the expensive part of an editor keystroke, and by a long
 * way: a grammar over five thousand lines costs tens of milliseconds where
 * comparing the same five thousand costs one. So it is deferred. The keystroke
 * renders against the colours the last one produced, the new ones arrive in a
 * pass React can interrupt, and a reader typing quickly is never waiting on a
 * grammar. What they see in between is the line they are typing coloured as it
 * was a keystroke ago — a run of the wrong length is cut to the line's own
 * length rather than spilling past it, so the worst of it is a word that is the
 * wrong colour for a frame.
 */
export function useSyntaxHighlight(
  language: string | undefined,
  before: readonly string[],
  after: readonly string[]
): DiffineHighlight | undefined {
  const wanted = language && language !== PLAIN ? language : null;

  /*
   * Whether the grammar has arrived is not state, it is a fact about the page,
   * and a render can read it. What this holds is only the reason to render
   * again: a grammar that arrived after the last one did.
   */
  const [, arrived] = React.useReducer((count: number) => count + 1, 0);
  const ready = wanted && isLoaded(wanted) ? wanted : null;

  React.useEffect(() => {
    if (!wanted || isLoaded(wanted)) {
      return;
    }

    let live = true;

    void loadLanguage(wanted).then((loaded) => {
      if (live && loaded) {
        arrived();
      }
    });

    return () => {
      live = false;
    };
  }, [wanted]);

  const settled = React.useDeferredValue(before);
  const settledAfter = React.useDeferredValue(after);

  const beforeTokens = React.useMemo(
    () => (ready ? tokenizeLines(settled, ready) : null),
    [ready, settled]
  );
  const afterTokens = React.useMemo(
    () => (ready ? tokenizeLines(settledAfter, ready) : null),
    [ready, settledAfter]
  );

  return React.useMemo(() => {
    if (!beforeTokens && !afterTokens) {
      return undefined;
    }

    return (line, side) => (side === 'before' ? beforeTokens : afterTokens)?.[line.index] ?? null;
  }, [beforeTokens, afterTokens]);
}
