import { describe, expect, it } from 'vitest';
import { diffText } from 'diffine-react';
import { splitLine } from '../src/internal/pieces.js';
import { fieldLayout, changeOfRow, type PaneLine } from '../src/internal/rows.js';
import {
  findMatches,
  lineStarts,
  matchRows,
  patternFor,
  rangeOf,
  replacedText,
  type SearchOptions
} from '../src/internal/search.js';

/**
 * The search, from the query to the range that gets written over.
 *
 * Reaching into `src/internal` rather than going through the components,
 * because none of this is a component: it is a query read four ways, a scan
 * that has to come back in the order a reader will walk through it, and an
 * offset that has to survive being turned from a line and a column into a
 * position in a document and back. A browser is where the bar is checked; this
 * is where the arithmetic under it is.
 */

/** A pane's worth of lines, out of a document nothing was compared to. */
function linesOf(text: string): PaneLine[] {
  return text.split('\n').map((line, index) => ({
    kind: 'equal' as const,
    side: 'before' as const,
    line: { index, text: line, segments: [] },
    numbers: [index + 1],
    change: -1
  }));
}

const PLAIN: SearchOptions = { matchCase: false, wholeWord: false, regex: false };

/** Every match, as the text it covers and the line it was found on. */
function foundIn(text: string, query: string, options: Partial<SearchOptions> = {}): string[] {
  const settings = { ...PLAIN, ...options };
  const lines = linesOf(text);

  return findMatches(lines, patternFor(query, settings), settings.wholeWord).matches.map(
    (match) => `${match.row}:${lines[match.row].line?.text.slice(match.start, match.end)}`
  );
}

describe('patternFor', () => {
  it('looks for the query as the text it is, punctuation included', () => {
    expect(foundIn('a.b\naxb', 'a.b')).toEqual(['0:a.b']);
  });

  it('reads the query as an expression when it is asked to', () => {
    expect(foundIn('a.b\naxb', 'a.b', { regex: true })).toEqual(['0:a.b', '1:axb']);
  });

  it('tells the cases apart only when it is asked to', () => {
    expect(foundIn('Title\ntitle', 'title')).toEqual(['0:Title', '1:title']);
    expect(foundIn('Title\ntitle', 'title', { matchCase: true })).toEqual(['1:title']);
  });

  it('has nothing to look for in an empty box, and nothing in a half-written one', () => {
    expect(patternFor('', PLAIN)).toBeNull();
    expect(patternFor('(a', { ...PLAIN, regex: true })).toBeNull();
    // The same query, looked for as text rather than as an expression.
    expect(patternFor('(a', PLAIN)).not.toBeNull();
  });

  it('keeps an expression an older engine allows rather than refusing it', () => {
    // `\d{` is a syntax error with the flag that matches whole characters and
    // an ordinary pattern without it. A reader who wrote it means the second.
    expect(patternFor('\\d{', { ...PLAIN, regex: true })).not.toBeNull();
  });
});

describe('findMatches', () => {
  it('comes back in the order the pane draws them', () => {
    expect(foundIn('one two\nthree\ntwo', 'two')).toEqual(['0:two', '2:two']);
  });

  it('leaves a word inside a longer one alone when whole words are asked for', () => {
    expect(foundIn('cat concat\ncat.', 'cat')).toEqual(['0:cat', '0:cat', '1:cat']);
    expect(foundIn('cat concat\ncat.', 'cat', { wholeWord: true })).toEqual(['0:cat', '1:cat']);
  });

  it('counts a Korean word as a word', () => {
    expect(foundIn('찾기 다시찾기', '찾기', { wholeWord: true })).toEqual(['0:찾기']);
  });

  it('collects nothing for a pattern that matches nothing at all', () => {
    // `a*` matches the empty string between every pair of characters, and a
    // count of those is not an answer to anything.
    expect(foundIn('bbb', 'a*', { regex: true })).toEqual([]);
  });

  it('stops at the limit, and says that it did', () => {
    const lines = linesOf('aaaa\naaaa\naaaa');
    const found = findMatches(lines, patternFor('a', PLAIN), false, 5);

    expect(found.matches).toHaveLength(5);
    expect(found.capped).toBe(true);

    const all = findMatches(lines, patternFor('a', PLAIN), false, Number.POSITIVE_INFINITY);

    expect(all.matches).toHaveLength(12);
    expect(all.capped).toBe(false);
  });

  it('has nothing to say about a line that is not there', () => {
    const blank: PaneLine[] = [
      { kind: 'insert', side: 'before', line: null, numbers: [null], change: 0 }
    ];

    expect(findMatches(blank, patternFor('a', PLAIN), false).matches).toEqual([]);
  });
});

describe('matchRows', () => {
  it('hands each line the matches that are in it', () => {
    const rows = matchRows(
      findMatches(linesOf('two two\nthree'), patternFor('t', PLAIN), false).matches
    );

    expect(rows.get(0)).toHaveLength(2);
    expect(rows.get(1)).toHaveLength(1);
    expect(rows.get(2)).toBeUndefined();
  });
});

describe('lineStarts and rangeOf', () => {
  it('counts every line ending as the one character or two that it is', () => {
    expect(lineStarts('one\ntwo\r\nthree\rfour')).toEqual([0, 4, 9, 15]);
  });

  it('gives a document that ends in a newline the empty line a caret can sit on', () => {
    expect(lineStarts('one\ntwo\n')).toEqual([0, 4, 8]);
  });

  it('turns a match into a range in the document it came from', () => {
    const text = 'one\r\ntwo three\r\n';
    const comparison = diffText(text, text);
    const owner = changeOfRow(comparison.rows.length, comparison.changes);
    const layout = fieldLayout(comparison.rows, owner, 'before', text);
    const found = findMatches(layout.lines, patternFor('three', PLAIN), false).matches;

    expect(found).toHaveLength(1);

    const range = rangeOf(layout, lineStarts(text), found[0]);

    expect(range).toEqual({ start: 9, end: 14 });
    expect(text.slice(range!.start, range!.end)).toBe('three');
  });
});

describe('replacedText', () => {
  it('writes over every range and leaves everything between them', () => {
    const text = 'one two one';
    const lines = linesOf(text);
    const found = findMatches(lines, patternFor('one', PLAIN), false).matches;
    const ranges = found.map((match) => ({ start: match.start, end: match.end }));

    expect(replacedText(text, ranges, '1')).toBe('1 two 1');
  });

  it('has nothing to do when there was nothing to write over', () => {
    expect(replacedText('one', [], '1')).toBe('one');
  });
});

describe('splitLine with matches', () => {
  it('cuts the line at what was found as well as at what changed', () => {
    const comparison = diffText('one two', 'one three');
    const line = comparison.rows[0].after!;
    const pieces = splitLine(line, null, [{ start: 4, end: 6, current: true }]);

    expect(pieces?.map((piece) => `${piece.kind}/${piece.match ?? '-'} ${piece.text}`)).toEqual([
      'equal/- one ',
      'insert/current th',
      'insert/- ree'
    ]);
  });

  it('marks what was found in a line the comparison had nothing to say about', () => {
    const line = { index: 0, text: 'one two one', segments: [] };
    const pieces = splitLine(line, null, [
      { start: 0, end: 3 },
      { start: 8, end: 11, current: true }
    ]);

    expect(pieces?.map((piece) => `${piece.match ?? '-'} ${piece.text}`)).toEqual([
      'found one',
      '-  two ',
      'current one'
    ]);
  });

  it('has nothing to say about a line with no comparison, no colour and no match', () => {
    expect(splitLine({ index: 0, text: 'one', segments: [] }, null, [])).toBeNull();
  });
});
