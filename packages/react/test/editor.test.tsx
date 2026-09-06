import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DiffineEditor } from 'diffine-react';
import type { DiffineEditorProps } from 'diffine-react';

/**
 * The editor as markup, with no layout under it.
 *
 * What this can check is everything the component decides: what each field
 * holds, what it is called, which lines are drawn behind it, and which of them
 * the comparison put a colour on. What it cannot check is the one thing the
 * component is really made of — a field laid over those lines so exactly that
 * the two cannot be told apart. That is geometry, it is answered by elements
 * that have a width and a height, and a renderer with no layout in it would
 * answer zero to every question about one. It belongs in a browser.
 */
const render = (props: DiffineEditorProps) => renderToStaticMarkup(<DiffineEditor {...props} />);

/** Every line of one side, in order, as `kind` and the words in it. */
function linesOf(markup: string, side: string): string[] {
  const END = '</span></div>';

  return markup
    .split('<div class="diffine-line"')
    .slice(1)
    .map((piece) => piece.slice(0, piece.indexOf(END) + END.length))
    .filter((piece) => piece.includes(`data-side="${side}"`))
    .map((piece) => {
      const kind = /data-kind="([^"]+)"/.exec(piece);
      const text = piece.slice(piece.indexOf('>') + 1).replace(/<[^>]*>/g, '');

      return `${kind?.[1] ?? '?'} ${text}`;
    });
}

/** What each `<textarea>` holds, in the order the two are drawn. */
function fieldsOf(markup: string): string[] {
  return [...markup.matchAll(/<textarea[^>]*>([\s\S]*?)<\/textarea>/g)].map((found) => found[1]);
}

const BEFORE = 'one\ntwo\nthree';
const AFTER = 'one\ntwo changed\nthree\nfour';

describe('DiffineEditor', () => {
  it('puts each document in a field of its own', () => {
    expect(fieldsOf(render({ defaultBefore: BEFORE, defaultAfter: AFTER }))).toEqual([
      BEFORE,
      AFTER
    ]);
  });

  it('takes the documents from the application when it is given them', () => {
    expect(fieldsOf(render({ before: BEFORE, after: AFTER }))).toEqual([BEFORE, AFTER]);
  });

  it('names each field for its side, and falls back to the word for it', () => {
    const markup = render({
      defaultBefore: { content: BEFORE, label: 'v1.2' },
      defaultAfter: AFTER
    });

    expect(markup).toContain('aria-label="v1.2"');
    expect(markup).toContain('aria-label="After"');
    expect(markup).toContain('>v1.2</span>');
  });

  it('draws the comparison behind the fields', () => {
    const markup = render({ defaultBefore: BEFORE, defaultAfter: AFTER });

    expect(linesOf(markup, 'before')).toEqual([
      'equal 1one',
      'replace 2~Changed: two',
      'equal 3three'
    ]);
    expect(linesOf(markup, 'after')).toEqual([
      'equal 1one',
      'replace 2~Changed: two changed',
      'equal 3three',
      'insert 4+Added: four'
    ]);
  });

  it('never holds the two sides level, because a blank is a line to type in', () => {
    const markup = render({ defaultBefore: BEFORE, defaultAfter: AFTER });

    expect(markup).not.toContain('data-kind="blank"');
  });

  it('hides the lines from a screen reader, which is already being read the field', () => {
    expect(render({ defaultBefore: BEFORE, defaultAfter: AFTER })).toContain(
      '<div class="diffine-editor-backdrop" aria-hidden="true">'
    );
  });

  it('draws the line after the last newline, which the comparison has no reason to', () => {
    // `a\nb\n` is two lines to compare and three to put a caret on.
    const ended = render({ defaultBefore: 'a\nb\n', defaultAfter: 'a\nb\n' });

    expect(linesOf(ended, 'before')).toEqual(['equal 1a', 'equal 2b', 'equal 3']);

    // And one without the newline is two of each.
    const bare = render({ defaultBefore: 'a\nb', defaultAfter: 'a\nb' });

    expect(linesOf(bare, 'before')).toEqual(['equal 1a', 'equal 2b']);
  });

  it('draws one line for an empty document, where the caret already is', () => {
    const markup = render({});

    expect(linesOf(markup, 'before')).toEqual(['equal 1']);
    expect(linesOf(markup, 'after')).toEqual(['equal 1']);
    expect(markup).toContain('The two are the same.');
  });

  it('invites a document into an empty field, and does not invite one it cannot take', () => {
    expect(render({})).toContain('placeholder="Type or paste a document here."');
    expect(render({ readOnly: true })).not.toContain('placeholder=');
  });

  it('turns off the side it was told to turn off', () => {
    // Case-insensitively, because HTML attribute names are and React has
    // written this one both ways across its versions.
    const readOnly = /readonly=""/gi;
    const left = render({ defaultBefore: BEFORE, defaultAfter: AFTER, readOnly: 'before' });
    const fields = left.split('<textarea');

    expect(fields[1]).toMatch(readOnly);
    expect(fields[2]).not.toMatch(readOnly);
    expect(left).toContain('data-side="before" data-readonly="true"');
    expect(left).not.toContain('data-side="after" data-readonly="true"');

    const both = render({ defaultBefore: BEFORE, defaultAfter: AFTER, readOnly: true });

    expect(both.match(readOnly)).toHaveLength(2);
  });

  it('leaves out the columns it was told to leave out', () => {
    const bare = render({
      defaultBefore: BEFORE,
      defaultAfter: AFTER,
      lineNumbers: false,
      markers: false,
      header: false,
      navigation: false,
      summary: false,
      search: false,
      languagePicker: false
    });

    expect(bare).not.toContain('diffine-number');
    expect(bare).not.toContain('diffine-marker');
    expect(bare).not.toContain('diffine-header');
    expect(bare).not.toContain('diffine-summary');
    expect(bare).toContain('diffine-line');
    expect(bare).toContain('data-numbers="false"');
    expect(bare).toContain('data-markers="false"');
  });

  it('splits the bar above the panes where the column between them is', () => {
    const linked = render({ defaultBefore: BEFORE, defaultAfter: AFTER });

    expect(linked).toContain('data-linked="true"');
    expect(linked).toContain('diffine-title-gap');

    const alone = render({ defaultBefore: BEFORE, defaultAfter: AFTER, connectors: false });

    expect(alone).toContain('data-linked="false"');
    expect(alone).not.toContain('diffine-title-gap');
  });

  it('counts what happened under the fields', () => {
    expect(render({ defaultBefore: BEFORE, defaultAfter: AFTER })).toContain(
      '2 changes, 2 lines added, 1 lines removed'
    );
  });

  it('names the language it was given, on a control that opens a menu', () => {
    const picker = render({
      defaultBefore: BEFORE,
      defaultAfter: AFTER,
      defaultLanguage: 'python'
    });

    expect(picker).toContain('role="combobox"');
    expect(picker).toContain('aria-expanded="false"');
    expect(picker).toContain('aria-label="Syntax highlighting"');
    expect(picker).toContain('>Python</span>');

    // The list is drawn when it is opened and not before, so there is nothing
    // of it in the markup a server sends.
    expect(picker).not.toContain('role="listbox"');
    expect(picker).not.toContain('role="option"');

    expect(render({ defaultBefore: BEFORE, defaultAfter: AFTER })).toContain('>Plain</span>');
    expect(
      render({ defaultBefore: BEFORE, defaultAfter: AFTER, languagePicker: false })
    ).not.toContain('diffine-syntax');
  });

  it('says the same things in the language it was asked for', () => {
    const markup = render({ locale: 'ko' });

    expect(markup).toContain('placeholder="여기에 문서를 입력하거나 붙여 넣으세요."');
    expect(markup).toContain('두 문서가 같습니다.');
  });

  it('compares the words inside a changed pair as closely as it was told to', () => {
    const words = render({ defaultBefore: 'total price', defaultAfter: 'total cost' });

    expect(words).toContain('<mark class="diffine-piece" data-kind="delete">price</mark>');

    const plain = render({
      defaultBefore: 'total price',
      defaultAfter: 'total cost',
      diff: { inline: 'none' }
    });

    expect(plain).not.toContain('diffine-piece');
  });

  it('does not wrap the fields unless the lines behind them wrap too', () => {
    const running = render({ defaultBefore: BEFORE, defaultAfter: AFTER });

    expect(running).toContain('data-wrap="false"');
    expect(running).toContain('wrap="off"');

    const wrapped = render({ defaultBefore: BEFORE, defaultAfter: AFTER, wrap: true });

    expect(wrapped).toContain('data-wrap="true"');
    expect(wrapped).toContain('wrap="soft"');
  });
});

describe('searching a field', () => {
  it('gives each field a button of its own, named for the side it opens', () => {
    const markup = render({
      defaultBefore: { content: BEFORE, label: 'saved' },
      defaultAfter: AFTER
    });

    expect(markup).toContain('aria-label="Find in saved"');
    expect(markup).toContain('aria-label="Find in After"');
  });

  it('draws no button when it is turned off', () => {
    const off = render({ defaultBefore: BEFORE, defaultAfter: AFTER, search: false });

    expect(off).not.toContain('Find in');
    expect(off).not.toContain('diffine-find-bar');
  });
});
