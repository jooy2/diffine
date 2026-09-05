/**
 * A small syntax highlighter, for the demos that show what `highlight` is for.
 *
 * Deliberately not a real one. What a page here has to show is the shape of the
 * hook — a whole line in, runs of it out, cut against the comparison by the
 * viewer — and a grammar written properly would bury that under itself. An
 * application would hand these runs straight out of whichever highlighter it
 * already has.
 */

import type { DiffLine, DiffineToken } from 'diffine-react';

const KEYWORDS =
  /\b(const|let|var|function|return|export|import|from|if|else|for|of|in|new|class|await|async)\b/g;

interface Run {
  start: number;
  end: number;
  className: string;
}

export function highlight(line: DiffLine): DiffineToken[] | null {
  const runs: Run[] = [];

  for (const found of line.text.matchAll(/'[^']*'|`[^`]*`|"[^"]*"/g)) {
    runs.push({ start: found.index, end: found.index + found[0].length, className: 'dx-string' });
  }

  for (const found of line.text.matchAll(/\/\/.*$/g)) {
    runs.push({ start: found.index, end: line.text.length, className: 'dx-comment' });
  }

  for (const found of line.text.matchAll(KEYWORDS)) {
    runs.push({ start: found.index, end: found.index + found[0].length, className: 'dx-keyword' });
  }

  if (runs.length === 0) {
    return null;
  }

  runs.sort((a, b) => a.start - b.start);

  const tokens: DiffineToken[] = [];
  let cursor = 0;

  for (const run of runs) {
    // A keyword inside a string is the string's, and the string came first.
    if (run.start < cursor) {
      continue;
    }

    if (run.start > cursor) {
      tokens.push({ length: run.start - cursor });
    }

    tokens.push({ length: run.end - run.start, className: run.className });
    cursor = run.end;
  }

  if (cursor < line.text.length) {
    tokens.push({ length: line.text.length - cursor });
  }

  return tokens;
}
