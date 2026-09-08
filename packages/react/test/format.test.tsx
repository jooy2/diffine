import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { TextDiff, diffText, parsePatch } from 'diffine-react';
import type { TextDiffProps } from 'diffine-react';

const render = (props: TextDiffProps) => renderToStaticMarkup(<TextDiff {...props} />);

/** What the bar under the panes says about how the two are written, if anything. */
function writtenIn(markup: string): string | null {
  const found = /<span class="diffine-format"[^>]*>(.*?)<\/span>/u.exec(markup);

  return found ? found[1] : null;
}

describe('how a document is written', () => {
  it('reads the line ending each document uses', () => {
    expect(diffText('a\nb\n', 'a\r\nb\r\n').format).toEqual({
      before: { ending: 'lf', finalNewline: true, byteOrderMark: false },
      after: { ending: 'crlf', finalNewline: true, byteOrderMark: false }
    });
  });

  it('calls a document with more than one kind of ending mixed', () => {
    expect(diffText('a\nb\r\nc', '').format?.before.ending).toBe('mixed');
  });

  it('reads a lone carriage return as an ending of its own', () => {
    expect(diffText('a\rb', '').format?.before.ending).toBe('cr');
  });

  it('has nothing to say about a document with one line in it', () => {
    expect(diffText('a', '').format?.before.ending).toBe('none');
  });

  it('says whether the last line carries an ending', () => {
    expect(diffText('a\nb\n', 'a\nb').format).toMatchObject({
      before: { finalNewline: true },
      after: { finalNewline: false }
    });
  });

  it('finds a byte order mark at the front of a document', () => {
    expect(diffText('\ufeffa\n', 'a\n').format).toMatchObject({
      before: { byteOrderMark: true },
      after: { byteOrderMark: false }
    });
  });

  it('leaves it out of a comparison read back from a patch', () => {
    const patch = ['--- a', '+++ b', '@@ -1 +1 @@', '-a', '+b', ''].join('\n');

    expect(parsePatch(patch)[0].result.format).toBeUndefined();
  });

  it('is not part of the comparison itself', () => {
    expect(diffText('a\nb\n', 'a\r\nb').changes).toEqual([]);
  });
});

describe('TextDiff, saying how the two are written', () => {
  it('says nothing when the two are written the same way', () => {
    expect(writtenIn(render({ before: 'a\nb\n', after: 'a\nc\n' }))).toBeNull();
  });

  it('names both endings when they differ', () => {
    expect(writtenIn(render({ before: 'a\nb\n', after: 'a\r\nb\r\n' }))).toBe('LF → CRLF');
  });

  it('says which of the two has no ending on its last line', () => {
    expect(writtenIn(render({ before: 'a\nb\n', after: 'a\nb' }))).toBe(
      'LF → LF, no final newline'
    );
  });

  it('says which of the two carries a byte order mark', () => {
    expect(writtenIn(render({ before: '\ufeffa\nb\n', after: 'a\nb\n' }))).toBe('LF, BOM → LF');
  });

  it('says nothing about a document that has no line ending to disagree about', () => {
    expect(writtenIn(render({ before: 'a', after: 'a\nb\n' }))).toBeNull();
  });
});

describe('TextDiff, drawing the whitespace', () => {
  it('leaves the spaces alone until it is asked', () => {
    expect(render({ before: 'a  b', after: 'a b' })).not.toContain('diffine-invisible');
  });

  it('picks out a run of spaces and a run of tabs apart from each other', () => {
    const markup = render({ before: 'a\t\tb  c', after: 'x', showInvisibles: true });

    expect(markup).toContain('<span class="diffine-invisible" data-kind="tab">\t\t</span>');
    expect(markup).toContain('<span class="diffine-invisible" data-kind="space">  </span>');
  });

  it('keeps the line itself exactly as it was written', () => {
    const markup = render({ before: 'a  b', after: 'a b', showInvisibles: true });

    expect(markup.replace(/<[^>]*>/gu, '')).toContain('a  b');
  });

  it('draws them inside a run the comparison marked as well', () => {
    const markup = render({ before: 'keep  one', after: 'keep  two', showInvisibles: true });

    expect(markup).toContain('diffine-invisible');
    expect(markup).toContain('diffine-piece');
  });
});
