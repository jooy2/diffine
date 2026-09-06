/**
 * highlight.js, fetched when it is wanted, and read back as runs of a line.
 *
 * The library's answer is a string of HTML, and what the viewer needs is the
 * runs that markup describes: how many characters each one covers and what to
 * call it. So the markup is read back apart rather than put into the page —
 * which is the only way the colouring and the comparison can be drawn at once.
 * Neither of them knows about the other, their boundaries fall wherever they
 * fall, and `splitLine` cuts the line at the union of the two.
 *
 * The whole document is highlighted in one go and then split at its newlines,
 * never a line at a time. A grammar carries state across lines — a block
 * comment, a template string, a heredoc — and a line handed over on its own
 * would be coloured as though the document started there.
 *
 * Nothing here is loaded until a `language` is asked for. Both the library and
 * each grammar are behind an `import()`, so a page with a viewer that colours
 * nothing downloads none of it.
 */

import type { DiffineToken } from '../../types.js';
import { LANGUAGES } from './catalogue.js';

/** The lines of a document, each as the runs it is coloured in. */
export type LineTokens = readonly (readonly DiffineToken[])[];

/** The one copy of the library, once it has arrived. */
let engine: import('highlight.js').HLJSApi | null = null;
let fetching: Promise<import('highlight.js').HLJSApi | null> | null = null;

/** Every grammar that has been asked for, and whether it arrived. */
const grammars = new Map<string, Promise<boolean>>();

/** The ones that did, which is a question the render has to answer itself. */
const ready = new Set<string>();

/** Whether a language can be highlighted right now, without waiting for it. */
export function isLoaded(language: string): boolean {
  return ready.has(language);
}

function core(): Promise<import('highlight.js').HLJSApi | null> {
  if (engine) {
    return Promise.resolve(engine);
  }

  fetching ??= import('highlight.js/lib/core')
    .then((module) => {
      engine = module.default;

      return engine;
    })
    .catch(() => null);

  return fetching;
}

/**
 * Fetches a grammar and registers it, once per language for the whole page.
 *
 * `false` for a language that is not on the list and for one whose module could
 * not be fetched — a network that dropped, a bundler that split the chunk away.
 * A viewer that cannot colour its documents still draws them.
 */
export function loadLanguage(language: string): Promise<boolean> {
  const held = grammars.get(language);

  if (held) {
    return held;
  }

  const entry = LANGUAGES[language];

  if (!entry) {
    return Promise.resolve(false);
  }

  const arriving = (async () => {
    const [hljs, grammar] = await Promise.all([core(), entry.load().catch(() => null)]);

    if (!hljs || !grammar) {
      return false;
    }

    hljs.registerLanguage(language, grammar.default);
    ready.add(language);

    return true;
  })();

  grammars.set(language, arriving);

  return arriving;
}

/**
 * A document's lines, coloured, or `null` when there is nothing to colour with.
 *
 * The lines are joined back into the document they came from, which is what
 * gives a grammar the context it needs, and the answer is split at the newlines
 * again so that line `n` of the document is entry `n` here.
 */
export function tokenizeLines(lines: readonly string[], language: string): LineTokens | null {
  if (!engine || lines.length === 0) {
    return null;
  }

  try {
    return runsOf(engine.highlight(lines.join('\n'), { language, ignoreIllegals: true }).value);
  } catch {
    return null;
  }
}

/** The five characters highlight.js escapes, and nothing else. */
const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  '#x27': "'"
};

function unescape(text: string): string {
  return text.includes('&')
    ? text.replace(/&(amp|lt|gt|quot|#x27);/g, (whole, name: string) => ENTITIES[name] ?? whole)
    : text;
}

/**
 * highlight.js markup, read back as one list of runs per line.
 *
 * The output is a small, closed shape: opening `<span>`s that carry nothing but
 * a class, their closing tags, and text with five characters escaped. Which is
 * why this reads it with a regular expression rather than a parser — there is
 * no attribute to get wrong, no self-closing tag, and no element but `span`.
 *
 * A nested span keeps the classes around it as well as its own, the way it
 * would if it were still an element inside an element. The stylesheet decides
 * which of them wins, exactly as it would there.
 */
function runsOf(html: string): LineTokens {
  const markup = /<span class="([^"]*)">|<\/span>/g;
  const lines: DiffineToken[][] = [];
  const open: string[] = [];

  let current: DiffineToken[] = [];
  let className: string | undefined;
  let cursor = 0;

  function take(piece: string): void {
    if (piece === '') {
      return;
    }

    const parts = unescape(piece).split('\n');

    for (const [index, part] of parts.entries()) {
      if (index > 0) {
        lines.push(current);
        current = [];
      }

      if (part !== '') {
        current.push(
          className === undefined ? { length: part.length } : { length: part.length, className }
        );
      }
    }
  }

  for (let found = markup.exec(html); found !== null; found = markup.exec(html)) {
    take(html.slice(cursor, found.index));
    cursor = found.index + found[0].length;

    if (found[1] === undefined) {
      open.pop();
    } else {
      open.push(found[1]);
    }

    className = open.length === 0 ? undefined : open.join(' ');
  }

  take(html.slice(cursor));
  lines.push(current);

  return lines;
}
