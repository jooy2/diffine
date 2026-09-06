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

  const beforeTokens = React.useMemo(
    () => (ready ? tokenizeLines(before, ready) : null),
    [ready, before]
  );
  const afterTokens = React.useMemo(
    () => (ready ? tokenizeLines(after, ready) : null),
    [ready, after]
  );

  return React.useMemo(() => {
    if (!beforeTokens && !afterTokens) {
      return undefined;
    }

    return (line, side) => (side === 'before' ? beforeTokens : afterTokens)?.[line.index] ?? null;
  }, [beforeTokens, afterTokens]);
}
