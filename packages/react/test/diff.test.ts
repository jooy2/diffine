import { describe, expect, it } from 'vitest';
import {
  diffCharacters,
  diffSequence,
  diffText,
  diffWords,
  type DiffResult,
  type DiffRow
} from 'diffine-react';

/** A row written the way a reader would describe it, for readable assertions. */
function shape(row: DiffRow): string {
  const before = row.before ? row.before.text : '·';
  const after = row.after ? row.after.text : '·';

  return `${row.kind} ${before} | ${after}`;
}

const shapes = (result: DiffResult) => result.rows.map(shape);

describe('diffText', () => {
  it('reads an empty document as no lines rather than one empty line', () => {
    const result = diffText('', '');

    expect(result.before).toEqual([]);
    expect(result.after).toEqual([]);
    expect(result.rows).toEqual([]);
    expect(result.changes).toEqual([]);
  });

  it('takes the newline that ends a document as the end of its last line', () => {
    expect(diffText('a\n', '').before).toEqual(['a']);
    expect(diffText('a\nb', '').before).toEqual(['a', 'b']);
    expect(diffText('a\n\n', '').before).toEqual(['a', '']);
  });

  it('ends a line on any of the three line endings', () => {
    expect(diffText('a\r\nb\rc\nd', '').before).toEqual(['a', 'b', 'c', 'd']);
  });

  it('finds no changes between two copies of the same document', () => {
    const result = diffText('one\ntwo\nthree', 'one\ntwo\nthree');

    expect(result.changes).toEqual([]);
    expect(result.stats).toEqual({ unchanged: 3, changed: 0, inserted: 0, deleted: 0 });
    expect(result.rows.every((row) => row.kind === 'equal')).toBe(true);
  });

  it('puts an inserted line opposite a blank', () => {
    expect(shapes(diffText('a\nc', 'a\nb\nc'))).toEqual([
      'equal a | a',
      'insert · | b',
      'equal c | c'
    ]);
  });

  it('puts a deleted line opposite a blank', () => {
    expect(shapes(diffText('a\nb\nc', 'a\nc'))).toEqual([
      'equal a | a',
      'delete b | ·',
      'equal c | c'
    ]);
  });

  it('pairs the lines of a replaced run in the order they were written', () => {
    expect(shapes(diffText('a\nb\nc\nd', 'a\nB\nC\nd'))).toEqual([
      'equal a | a',
      'replace b | B',
      'replace c | C',
      'equal d | d'
    ]);
  });

  it('leaves the surplus of a longer side with nothing opposite it', () => {
    expect(shapes(diffText('a\nb\nc', 'A'))).toEqual([
      'replace a | A',
      'delete b | ·',
      'delete c | ·'
    ]);
  });

  it('pairs the line that was edited rather than the line that came first', () => {
    // A run that inserts a line *and* edits one. Taken straight down, every row
    // after the insertion pairs two lines that have nothing to do with each
    // other, and the words inside them get compared on that basis.
    const before = 'header\nconst total = price * quantity;\nfooter';
    const after = 'header\nconst tax = price * rate;\nconst total = price * quantity * 2;\nfooter';

    expect(shapes(diffText(before, after))).toEqual([
      'equal header | header',
      'insert · | const tax = price * rate;',
      'replace const total = price * quantity; | const total = price * quantity * 2;',
      'equal footer | footer'
    ]);
  });

  it('takes a run with nothing alike in it from the top', () => {
    expect(shapes(diffText('a\nb\nc', 'X'))).toEqual([
      'replace a | X',
      'delete b | ·',
      'delete c | ·'
    ]);
  });

  it('counts every line exactly once', () => {
    const result = diffText('a\nb\nc', 'a\nB\nc\nd');

    expect(result.stats).toEqual({ unchanged: 2, changed: 1, inserted: 1, deleted: 0 });
  });

  it('groups the rows of one edit into a single change', () => {
    const result = diffText('a\nb\nc\nd\ne', 'a\nX\nY\ne');

    expect(result.changes).toEqual([
      {
        kind: 'replace',
        beforeStart: 1,
        beforeEnd: 4,
        afterStart: 1,
        afterEnd: 3,
        rowStart: 1,
        rowEnd: 4
      }
    ]);
    expect(result.rows.slice(1, 4).map(shape)).toEqual([
      'replace b | X',
      'replace c | Y',
      'delete d | ·'
    ]);
  });

  it('reports every change in the order it appears', () => {
    const result = diffText('a\nb\nc\nd\ne', 'a\nc\nd\nE\nf');

    expect(result.changes.map((change) => change.kind)).toEqual(['delete', 'replace']);
    expect(result.changes[0]).toMatchObject({ beforeStart: 1, beforeEnd: 2 });
    expect(result.changes[1]).toMatchObject({ beforeStart: 4, beforeEnd: 5, afterEnd: 5 });
  });

  it('finds the smallest set of edits rather than the first one it meets', () => {
    // Two lines moved past each other. Anything that matched greedily from the
    // top would call all four lines changed.
    const result = diffText('a\nb\nc\nd', 'c\nd\na\nb');

    expect(result.stats.unchanged).toBe(2);
    expect(result.changes.length).toBe(2);
  });

  it('marks the words that moved inside a changed line', () => {
    const [row] = diffText('the quick brown fox', 'the slow brown fox').rows;

    expect(row.before?.segments).toEqual([
      { kind: 'equal', text: 'the ' },
      { kind: 'delete', text: 'quick' },
      { kind: 'equal', text: ' brown fox' }
    ]);
    expect(row.after?.segments).toEqual([
      { kind: 'equal', text: 'the ' },
      { kind: 'insert', text: 'slow' },
      { kind: 'equal', text: ' brown fox' }
    ]);
  });

  it('joins the pieces of a line back into the line', () => {
    const [row] = diffText('a shared middle here', 'a different middle there').rows;

    expect(row.before?.segments.map((piece) => piece.text).join('')).toBe(row.before?.text);
    expect(row.after?.segments.map((piece) => piece.text).join('')).toBe(row.after?.text);
  });

  it('marks nothing inside a pair that has too little in common', () => {
    const [row] = diffText('alpha beta gamma', 'nothing alike at all').rows;

    expect(row.kind).toBe('replace');
    expect(row.before?.segments).toEqual([]);
    expect(row.after?.segments).toEqual([]);
  });

  it('marks that pair anyway once the threshold is out of the way', () => {
    const [row] = diffText('alpha beta gamma', 'nothing alike at all', {
      inlineThreshold: 0
    }).rows;

    expect(row.before?.segments.length).toBeGreaterThan(0);
  });

  it('marks nothing inside a line when the inline comparison is off', () => {
    const [row] = diffText('the quick fox', 'the slow fox', { inline: 'none' }).rows;

    expect(row.kind).toBe('replace');
    expect(row.before?.segments).toEqual([]);
  });

  it('marks one grapheme at a time when asked to', () => {
    const [row] = diffText('version 1', 'version 2', { inline: 'character' }).rows;

    expect(row.after?.segments).toEqual([
      { kind: 'equal', text: 'version ' },
      { kind: 'insert', text: '2' }
    ]);
  });
});

describe('the whitespace and case options', () => {
  it('compares every space by default', () => {
    expect(diffText('a  b', 'a b').changes.length).toBe(1);
  });

  it('ignores whitespace at the end of a line', () => {
    expect(diffText('a b   ', 'a b', { whitespace: 'trailing' }).changes).toEqual([]);
    expect(diffText('   a b', 'a b', { whitespace: 'trailing' }).changes.length).toBe(1);
  });

  it('ignores whitespace at either end', () => {
    expect(diffText('   a b  ', 'a b', { whitespace: 'surrounding' }).changes).toEqual([]);
  });

  it('ignores how much whitespace is between two words', () => {
    expect(diffText('a      b', ' a b ', { whitespace: 'amount' }).changes).toEqual([]);
    expect(diffText('ab', 'a b', { whitespace: 'amount' }).changes.length).toBe(1);
  });

  it('ignores whitespace entirely', () => {
    expect(diffText('ab', ' a  b ', { whitespace: 'all' }).changes).toEqual([]);
  });

  it('draws the whitespace it was told to ignore', () => {
    const result = diffText('a b   ', 'a b', { whitespace: 'trailing' });

    expect(result.rows[0].before?.text).toBe('a b   ');
    expect(result.rows[0].after?.text).toBe('a b');
  });

  it('ignores case when asked to', () => {
    expect(diffText('Title', 'title', { ignoreCase: true }).changes).toEqual([]);
    expect(diffText('Title', 'title').changes.length).toBe(1);
  });
});

describe('the cost limit', () => {
  it('says the comparison finished when it did', () => {
    expect(diffText('a\nb\nc', 'a\nx\nc').complete).toBe(true);
  });

  it('gives up and calls the range replaced rather than working through it', () => {
    const before = Array.from({ length: 60 }, (_, index) => `before ${index}`).join('\n');
    const after = Array.from({ length: 60 }, (_, index) => `after ${index}`).join('\n');
    const result = diffText(before, after, { maxCost: 1 });

    expect(result.complete).toBe(false);
    expect(result.changes.length).toBe(1);
    expect(result.changes[0].kind).toBe('replace');
  });
});

describe('diffWords', () => {
  it('splits on words and keeps the whitespace between them', () => {
    const result = diffWords('one two three', 'one four three');

    expect(result.before).toEqual([
      { kind: 'equal', text: 'one ' },
      { kind: 'delete', text: 'two' },
      { kind: 'equal', text: ' three' }
    ]);
  });

  it('is 1 alike for two copies of the same text and 0 for nothing shared', () => {
    expect(diffWords('same', 'same').similarity).toBe(1);
    expect(diffWords('aaa', 'bbb').similarity).toBe(0);
  });

  it('holds each side of an equal run when the two are not the same string', () => {
    const result = diffWords('Title here', 'title there', { ignoreCase: true });

    expect(result.before.map((piece) => piece.text).join('')).toBe('Title here');
    expect(result.after.map((piece) => piece.text).join('')).toBe('title there');
  });
});

describe('diffCharacters', () => {
  it('keeps a grapheme whole rather than splitting it into its parts', () => {
    const result = diffCharacters('a👨‍👩‍👧b', 'a👨‍👩‍👧c');

    expect(result.before).toEqual([
      { kind: 'equal', text: 'a👨‍👩‍👧' },
      { kind: 'delete', text: 'b' }
    ]);
  });
});

describe('diffSequence', () => {
  it('returns the runs between two sequences of tokens', () => {
    expect(diffSequence(['a', 'b', 'c'], ['a', 'c'])).toEqual([
      { kind: 'equal', beforeStart: 0, beforeEnd: 1, afterStart: 0, afterEnd: 1 },
      { kind: 'delete', beforeStart: 1, beforeEnd: 2, afterStart: 1, afterEnd: 1 },
      { kind: 'equal', beforeStart: 2, beforeEnd: 3, afterStart: 1, afterEnd: 2 }
    ]);
  });

  it('reports one side as inserted when the other is empty', () => {
    expect(diffSequence([], ['a', 'b'])).toEqual([
      { kind: 'insert', beforeStart: 0, beforeEnd: 0, afterStart: 0, afterEnd: 2 }
    ]);
    expect(diffSequence(['a'], [])).toEqual([
      { kind: 'delete', beforeStart: 0, beforeEnd: 1, afterStart: 0, afterEnd: 0 }
    ]);
  });

  it('returns nothing at all for two empty sequences', () => {
    expect(diffSequence([], [])).toEqual([]);
  });

  it('covers both sequences exactly once, in order', () => {
    const before = 'the quick brown fox jumps'.split(' ');
    const after = 'the slow brown fox leaps over'.split(' ');
    const edits = diffSequence(before, after);

    let beforeCursor = 0;
    let afterCursor = 0;

    for (const edit of edits) {
      expect(edit.beforeStart).toBe(beforeCursor);
      expect(edit.afterStart).toBe(afterCursor);
      beforeCursor = edit.beforeEnd;
      afterCursor = edit.afterEnd;
    }

    expect(beforeCursor).toBe(before.length);
    expect(afterCursor).toBe(after.length);
  });
});

describe('diffText with patterns to ignore', () => {
  const STAMP = /\d{4}-\d{2}-\d{2}/u;

  it('calls two lines the same when they differ only inside a match', () => {
    const result = diffText('built 2026-01-01\nkeep', 'built 2026-09-08\nkeep', {
      ignore: [STAMP]
    });

    expect(result.changes).toEqual([]);
    expect(result.stats.unchanged).toBe(2);
  });

  it('leaves the lines exactly as they were written', () => {
    const result = diffText('built 2026-01-01', 'built 2026-09-08', { ignore: [STAMP] });

    expect(result.rows[0].before?.text).toBe('built 2026-01-01');
    expect(result.rows[0].after?.text).toBe('built 2026-09-08');
  });

  it('still finds what changed outside a match', () => {
    const result = diffText('built 2026-01-01 by ann', 'built 2026-09-08 by bob', {
      ignore: [STAMP]
    });

    expect(result.changes).toHaveLength(1);
  });

  it('sets a match aside rather than taking it out', () => {
    expect(diffText('a 2026-01-01 b', 'a  b', { ignore: [STAMP] }).changes).toHaveLength(1);
  });

  it('looks for a pattern everywhere in the line, not only once', () => {
    const result = diffText('2026-01-01 to 2026-01-02', '2020-05-05 to 2020-05-06', {
      ignore: [STAMP]
    });

    expect(result.changes).toEqual([]);
  });

  it('leaves a global pattern where it found it, so the next line starts over', () => {
    const result = diffText('id 1\nid 2\nid 3', 'id 9\nid 8\nid 7', { ignore: [/\d+/gu] });

    expect(result.changes).toEqual([]);
  });

  it('takes more than one pattern', () => {
    const result = diffText('2026-01-01 #4821 done', '2020-05-05 #17 done', {
      ignore: [STAMP, /#\d+/u]
    });

    expect(result.changes).toEqual([]);
  });

  it('compares the words inside a changed pair as they were written', () => {
    const [row] = diffText(
      'the report was written on 2026-01-01 by ann',
      'the report was written on 2020-05-05 by bob',
      { ignore: [STAMP] }
    ).rows;
    const gone = row.before?.segments
      .filter((piece) => piece.kind === 'delete')
      .map((piece) => piece.text)
      .join(' ');

    // The pair is a change, because the name differs. Inside it the date is
    // compared like anything else: a pattern written for a line says nothing
    // about one word of it.
    expect(gone).toContain('2026');
  });

  it('ignores nothing when it is not asked to', () => {
    expect(diffText('built 2026-01-01', 'built 2026-09-08').changes).toHaveLength(1);
  });
});
