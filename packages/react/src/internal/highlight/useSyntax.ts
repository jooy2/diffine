'use client';

import * as React from 'react';
import type { DiffineHighlight } from '../../types.js';
import { PLAIN } from './catalogue.js';

/** Everything the colouring needs, once the module holding it has arrived. */
type Engine = typeof import('./engine.js');

/**
 * The highlighter, which is itself fetched rather than imported.
 *
 * `engine.ts` reaches highlight.js and thirty-four grammars, and a bundler that
 * saw a plain import of it would write all of that into the build of every page
 * with a viewer on it — most of which colour nothing. Behind an `import()` the
 * cost belongs to the first viewer that is given a `language`, and a build that
 * never mentions one carries none of it.
 *
 * It is a module-level pair rather than state because it is a fact about the
 * page rather than about a component: the second viewer to ask finds the
 * library already here, and a render is allowed to read that.
 */
let engine: Engine | null = null;
let fetching: Promise<Engine | null> | null = null;

function highlighter(): Promise<Engine | null> {
  fetching ??= import('./engine.js').then((module) => (engine = module)).catch(() => null);

  return fetching;
}

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
 * The library itself arrives the same way and before any of it, so a viewer
 * given a language paints three times rather than twice: the document, then the
 * document with the grammar's colours, and nothing in between waits on either.
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
  const loaded = engine;
  const ready = wanted && loaded?.isLoaded(wanted) ? wanted : null;

  React.useEffect(() => {
    if (!wanted || engine?.isLoaded(wanted)) {
      return;
    }

    let live = true;

    void highlighter()
      .then((module) => module?.loadLanguage(wanted) ?? false)
      .then((coloured) => {
        if (live && coloured) {
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
    () => (ready ? (loaded?.tokenizeLines(settled, ready) ?? null) : null),
    [loaded, ready, settled]
  );
  const afterTokens = React.useMemo(
    () => (ready ? (loaded?.tokenizeLines(settledAfter, ready) ?? null) : null),
    [loaded, ready, settledAfter]
  );

  return React.useMemo(() => {
    if (!beforeTokens && !afterTokens) {
      return undefined;
    }

    return (line, side) => (side === 'before' ? beforeTokens : afterTokens)?.[line.index] ?? null;
  }, [beforeTokens, afterTokens]);
}
