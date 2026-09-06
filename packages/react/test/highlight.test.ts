import { describe, expect, it } from 'vitest';
import { DIFFINE_LANGUAGES } from 'diffine-react';
import { isLoaded, loadLanguage, tokenizeLines } from '../src/internal/highlight/engine.js';

/**
 * The colouring, from the grammar being fetched to the runs coming back.
 *
 * Reaching into `src/internal` rather than going through the components,
 * because what is worth checking here is not a component: it is a list of
 * thirty-four module paths that nothing type-checks, and a reader that takes a
 * string of HTML apart. TypeScript accepts `import('highlight.js/lib/languages/bashh')`
 * without a word — the contextual type swallows it — so a mistyped entry in the
 * catalogue is a language that quietly refuses to colour anything, and only a
 * test that actually fetches all of them says so.
 *
 * The runs are the other half. They come back as lengths rather than as text,
 * so nothing about them is obvious by reading: a miscounted escape or a
 * mishandled newline is a line coloured half a word out of step, everywhere,
 * for ever.
 */

/** The runs of one line, back as the text they cover. */
function textOf(line: string, runs: readonly { length: number; className?: string }[]): string[] {
  const pieces: string[] = [];
  let cursor = 0;

  for (const run of runs) {
    pieces.push(line.slice(cursor, cursor + run.length));
    cursor += run.length;
  }

  return pieces;
}

describe('the language catalogue', () => {
  it('has a grammar for every language it offers', async () => {
    const offered = DIFFINE_LANGUAGES.filter((option) => option.id !== 'plain');

    expect(offered.length).toBeGreaterThan(0);

    const loaded = await Promise.all(offered.map((option) => loadLanguage(option.id)));
    const missing = offered.filter((option, index) => !loaded[index]).map((option) => option.id);

    expect(missing).toEqual([]);
    expect(offered.every((option) => isLoaded(option.id))).toBe(true);
  });

  it('says no to a language it does not have, rather than throwing', async () => {
    expect(await loadLanguage('esperanto')).toBe(false);
    expect(isLoaded('esperanto')).toBe(false);
  });

  it('names every language once, with `plain` in front', () => {
    const ids = DIFFINE_LANGUAGES.map((option) => option.id);

    expect(ids[0]).toBe('plain');
    expect(new Set(ids).size).toBe(ids.length);
    expect(DIFFINE_LANGUAGES.every((option) => option.name.length > 0)).toBe(true);
  });
});

describe('tokenizeLines', () => {
  it('hands back one list of runs per line, covering the whole line', async () => {
    await loadLanguage('javascript');

    const lines = ['const greeting = "hi";', '', 'export default greeting;'];
    const tokens = tokenizeLines(lines, 'javascript');

    expect(tokens).not.toBeNull();
    expect(tokens).toHaveLength(lines.length);

    for (const [index, line] of lines.entries()) {
      const runs = tokens![index];

      expect(runs.reduce((total, run) => total + run.length, 0)).toBe(line.length);
      expect(textOf(line, runs).join('')).toBe(line);
    }
  });

  it('counts an escaped character as the one character it was', async () => {
    await loadLanguage('javascript');

    // Every character highlight.js escapes, inside a string so that the run
    // covering them is one the grammar actually marks.
    const line = 'const mixed = "a & b < c > d \' e \\" f";';
    const runs = tokenizeLines([line], 'javascript')![0];

    expect(runs.reduce((total, run) => total + run.length, 0)).toBe(line.length);
    expect(textOf(line, runs).join('')).toBe(line);
  });

  it('carries a construct that spans lines across all of them', async () => {
    await loadLanguage('javascript');

    const lines = ['/* one', '   two', '   three */', 'const after = 1;'];
    const tokens = tokenizeLines(lines, 'javascript')!;
    const commentOn = (row: number) =>
      tokens[row].some((run) => run.className?.includes('hljs-comment'));

    // The three lines of the comment are a comment, which is the whole reason
    // the document is highlighted at once rather than a line at a time.
    expect([commentOn(0), commentOn(1), commentOn(2), commentOn(3)]).toEqual([
      true,
      true,
      true,
      false
    ]);
  });

  it('keeps the classes of a run inside a run', async () => {
    await loadLanguage('javascript');

    const line = 'const said = `hello ${name} there`;';
    const runs = tokenizeLines([line], 'javascript')![0];
    const nested = runs.find((run) => (run.className?.split(' ').length ?? 0) > 1);

    expect(nested?.className).toContain('hljs-string');
    expect(runs.reduce((total, run) => total + run.length, 0)).toBe(line.length);
  });

  it('has nothing to say about an empty document or a language it has not got', () => {
    expect(tokenizeLines([], 'javascript')).toBeNull();
    expect(tokenizeLines(['const x = 1;'], 'esperanto')).toBeNull();
  });
});
