import { describe, expect, it } from 'vitest';
import { diffText, formatPatch, parsePatch, type DiffResult, type DiffRow } from 'diffine-react';

/** A row written the way a reader would describe it, for readable assertions. */
function shape(row: DiffRow): string {
  const before = row.before ? `${row.before.index + 1}:${row.before.text}` : '·';
  const after = row.after ? `${row.after.index + 1}:${row.after.text}` : '·';

  return `${row.kind} ${before} | ${after}`;
}

const shapes = (result: DiffResult) => result.rows.map(shape);

/** A document of numbered lines, for a comparison with room between its changes. */
const numbered = (count: number, from = 1) =>
  Array.from({ length: count }, (_unused, index) => `line ${index + from}`).join('\n');

describe('formatPatch', () => {
  it('writes nothing at all for two documents that are the same', () => {
    expect(formatPatch(diffText('one\ntwo', 'one\ntwo'))).toBe('');
  });

  it('writes the headers, the hunk and the lines around it', () => {
    const patch = formatPatch(diffText('a\nb\nc', 'a\nB\nc'));

    expect(patch).toBe(
      ['--- before', '+++ after', '@@ -1,3 +1,3 @@', ' a', '-b', '+B', ' c', ''].join('\n')
    );
  });

  it('names each side where a name was given', () => {
    const patch = formatPatch(diffText('a', 'b'), {
      before: 'a/src/index.ts',
      after: 'b/src/index.ts'
    });

    expect(patch.split('\n').slice(0, 2)).toEqual(['--- a/src/index.ts', '+++ b/src/index.ts']);
  });

  it('leaves the count off a hunk that covers one line', () => {
    expect(formatPatch(diffText('a', 'b'), { context: 0 })).toContain('@@ -1 +1 @@');
  });

  it('writes the lines that come before an insertion as its position', () => {
    const patch = formatPatch(diffText('a\nb', 'a\nnew\nb'), { context: 0 });

    expect(patch).toContain('@@ -1,0 +2 @@');
  });

  it('keeps as many unchanged lines either side as `context` asks for', () => {
    const before = numbered(20);
    const after = before.replace('line 10', 'line ten');

    expect(formatPatch(diffText(before, after), { context: 1 })).toContain('@@ -9,3 +9,3 @@');
    expect(formatPatch(diffText(before, after), { context: 3 })).toContain('@@ -7,7 +7,7 @@');
  });

  it('writes two changes far apart as two hunks', () => {
    const before = numbered(40);
    const after = before.replace('line 5', 'line five').replace('line 30', 'line thirty');
    const patch = formatPatch(diffText(before, after));

    expect(patch.match(/^@@/gmu)).toHaveLength(2);
  });

  it('joins two changes whose context would touch into one hunk', () => {
    const before = numbered(20);
    const after = before.replace('line 8', 'line eight').replace('line 12', 'line twelve');
    const patch = formatPatch(diffText(before, after));

    expect(patch.match(/^@@/gmu)).toHaveLength(1);
  });

  it('writes everything that went out above everything that came in', () => {
    const patch = formatPatch(diffText('a\nb\nc', 'A\nB\nC'), { context: 0 });

    expect(patch.split('\n').slice(3, 9)).toEqual(['-a', '-b', '-c', '+A', '+B', '+C']);
  });
});

describe('parsePatch', () => {
  it('reads a file for each pair of header lines', () => {
    const patch = [
      'diff --git a/one.txt b/one.txt',
      'index 0000000..1111111 100644',
      '--- a/one.txt',
      '+++ b/one.txt',
      '@@ -1 +1 @@',
      '-a',
      '+b',
      'diff --git a/two.txt b/two.txt',
      '--- a/two.txt',
      '+++ b/two.txt',
      '@@ -1 +1 @@',
      '-c',
      '+d',
      ''
    ].join('\n');

    const files = parsePatch(patch);

    expect(files.map((file) => [file.before, file.after])).toEqual([
      ['a/one.txt', 'b/one.txt'],
      ['a/two.txt', 'b/two.txt']
    ]);
    expect(shapes(files[1].result)).toEqual(['replace 1:c | 1:d']);
  });

  it('numbers the lines from the hunk header rather than from the hunk', () => {
    const patch = ['--- a', '+++ b', '@@ -40,2 +50,2 @@', ' keep', '-old', '+new', ''].join('\n');

    expect(shapes(parsePatch(patch)[0].result)).toEqual([
      'equal 40:keep | 50:keep',
      'replace 41:old | 51:new'
    ]);
  });

  it('leaves a jump in the numbers where one hunk ends and the next begins', () => {
    const patch = [
      '--- a',
      '+++ b',
      '@@ -1 +1 @@',
      '-a',
      '+A',
      '@@ -40 +40 @@',
      '-b',
      '+B',
      ''
    ].join('\n');
    const { rows } = parsePatch(patch)[0].result;

    expect(rows[0].before?.index).toBe(0);
    expect(rows[1].before?.index).toBe(39);
  });

  it('marks the words inside a pair of changed lines, as the engine would', () => {
    const patch = ['--- a', '+++ b', '@@ -1 +1 @@', '-the quick fox', '+the slow fox', ''].join(
      '\n'
    );
    const [row] = parsePatch(patch)[0].result.rows;

    expect(row.before?.segments.map((piece) => piece.text)).toEqual(['the ', 'quick', ' fox']);
    expect(row.after?.segments.map((piece) => piece.kind)).toEqual(['equal', 'insert', 'equal']);
  });

  it('takes the options the engine takes', () => {
    const patch = ['--- a', '+++ b', '@@ -1 +1 @@', '-a b', '+a c', ''].join('\n');
    const [row] = parsePatch(patch, { inline: 'none' })[0].result.rows;

    expect(row.before?.segments).toEqual([]);
  });

  it('counts what the patch carried, and calls the result complete', () => {
    const patch = ['--- a', '+++ b', '@@ -1,3 +1,3 @@', ' keep', '-old', '+new', ' tail', ''].join(
      '\n'
    );
    const { stats, complete, before, after } = parsePatch(patch)[0].result;

    expect(stats).toEqual({ unchanged: 2, changed: 1, inserted: 0, deleted: 0 });
    expect(complete).toBe(true);
    expect(before).toEqual(['keep', 'old', 'tail']);
    expect(after).toEqual(['keep', 'new', 'tail']);
  });

  it('reads an empty line inside a hunk as an unchanged line', () => {
    const patch = ['--- a', '+++ b', '@@ -1,3 +1,3 @@', ' a', '', '-b', '+B', ''].join('\n');

    expect(shapes(parsePatch(patch)[0].result)).toEqual([
      'equal 1:a | 1:a',
      'equal 2: | 2:',
      'replace 3:b | 3:B'
    ]);
  });

  it('skips the marker for a file that does not end in a newline', () => {
    const patch = [
      '--- a',
      '+++ b',
      '@@ -1 +1 @@',
      '-a',
      '\\ No newline at end of file',
      '+b',
      '\\ No newline at end of file',
      ''
    ].join('\n');

    expect(shapes(parsePatch(patch)[0].result)).toEqual(['replace 1:a | 1:b']);
  });

  it('reads a patch that is nothing but hunks', () => {
    const files = parsePatch(['@@ -1 +1 @@', '-a', '+b', ''].join('\n'));

    expect(files).toHaveLength(1);
    expect(files[0].before).toBe('');
    expect(shapes(files[0].result)).toEqual(['replace 1:a | 1:b']);
  });

  it('finds nothing in text that is not a patch', () => {
    expect(parsePatch('just some prose\nover two lines')).toEqual([]);
  });

  it('reads a line that begins with three dashes as a line', () => {
    const patch = ['--- a', '+++ b', '@@ -1 +1 @@', '--- not a header', '+kept', ''].join('\n');

    expect(shapes(parsePatch(patch)[0].result)).toEqual(['replace 1:-- not a header | 1:kept']);
  });
});

describe('formatPatch and parsePatch together', () => {
  it('comes back to the same rows it started from', () => {
    const before = `${numbered(30)}\ntail`;
    const after = before.replace('line 4', 'line four').replace('line 25', '');
    const original = diffText(before, after);
    const patch = formatPatch(original);
    const [file] = parsePatch(patch);

    // Every changed row survives, and so does the context around it. What the
    // patch left out are unchanged rows the two documents agreed about.
    expect(shapes(file.result).filter((row) => !row.startsWith('equal'))).toEqual(
      shapes(original).filter((row) => !row.startsWith('equal'))
    );
    expect(file.result.changes).toHaveLength(original.changes.length);
  });

  it('writes the same patch again from what it read', () => {
    const before = numbered(30);
    const after = before.replace('line 4', 'line four').replace('line 25', 'line twenty-five');
    const patch = formatPatch(diffText(before, after));

    expect(formatPatch(parsePatch(patch)[0].result)).toBe(patch);
  });
});
