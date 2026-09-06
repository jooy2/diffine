import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DiffineViewer, diffText } from 'diffine-react';
import type { DiffineViewerProps } from 'diffine-react';

/**
 * The viewer as markup, with no layout under it.
 *
 * What this can check is everything the component decides: which lines are on
 * which side, what each one is called, which columns are drawn. What it cannot
 * check is anything measured — holding two wrapped rows level, and the bands
 * between the panes, are read off elements that have a height, and a renderer
 * with no layout in it would answer zero to every question about one. Those
 * belong in a browser rather than in a convincing imitation of one.
 */
const render = (props: DiffineViewerProps) => renderToStaticMarkup(<DiffineViewer {...props} />);

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

const BEFORE = 'one\ntwo\nthree';
const AFTER = 'one\ntwo changed\nthree\nfour';

describe('DiffineViewer', () => {
  it('draws both documents side by side', () => {
    const markup = render({ before: BEFORE, after: AFTER });

    expect(linesOf(markup, 'before')).toEqual([
      'equal 1one',
      'replace 2~Changed: two',
      'equal 3three',
      'blank '
    ]);
    expect(linesOf(markup, 'after')).toEqual([
      'equal 1one',
      'replace 2~Changed: two changed',
      'equal 3three',
      'insert 4+Added: four'
    ]);
  });

  it('says what each side is called, and falls back to the word for it', () => {
    expect(render({ before: BEFORE, after: AFTER })).toContain('>Before</span>');
    expect(render({ before: { content: BEFORE, label: 'v1.2' }, after: AFTER })).toContain(
      '>v1.2</span>'
    );
  });

  it('leaves out the columns it was told to leave out', () => {
    const bare = render({
      before: BEFORE,
      after: AFTER,
      lineNumbers: false,
      markers: false,
      header: false,
      navigation: false,
      summary: false,
      languageLabel: false
    });

    expect(bare).not.toContain('diffine-number');
    expect(bare).not.toContain('diffine-marker');
    expect(bare).not.toContain('diffine-header');
    expect(bare).not.toContain('diffine-summary');
    expect(bare).toContain('diffine-line');
  });

  it('splits the bar above the panes where the column between them is', () => {
    const linked = render({ before: BEFORE, after: AFTER });

    expect(linked).toContain('data-linked="true"');
    expect(linked).toContain('diffine-title-gap');

    // No column between the panes, so no third column in the bar over them —
    // the two halves of the header would otherwise sit over the wrong panes.
    for (const props of [{ connectors: false }, { view: 'unified' as const }]) {
      const alone = render({ before: BEFORE, after: AFTER, ...props });

      expect(alone).toContain('data-linked="false"');
      expect(alone).not.toContain('diffine-title-gap');
    }
  });

  it('leaves out the blanks when the two sides are not held level', () => {
    const markup = render({ before: BEFORE, after: AFTER, alignLines: false });

    expect(markup).not.toContain('data-kind="blank"');
    expect(linesOf(markup, 'before')).toHaveLength(3);
    expect(linesOf(markup, 'after')).toHaveLength(4);
  });

  it('puts what went out above what came in, in a unified view', () => {
    const markup = render({ before: BEFORE, after: AFTER, view: 'unified' });

    expect(linesOf(markup, 'before')).toEqual([
      'equal 11one',
      'delete 2−Removed: two',
      'equal 33three'
    ]);
    expect(linesOf(markup, 'after')).toEqual([
      'insert 2+Added: two changed',
      'insert 4+Added: four'
    ]);
  });

  it('picks out the words that moved inside a line', () => {
    const markup = render({ before: 'the quick fox', after: 'the slow fox' });

    expect(markup).toContain('<mark class="diffine-piece" data-kind="delete">quick</mark>');
    expect(markup).toContain('<mark class="diffine-piece" data-kind="insert">slow</mark>');
  });

  it('says how much changed, and says so when nothing did', () => {
    expect(render({ before: BEFORE, after: AFTER })).toContain(
      '2 changes, 2 lines added, 1 lines removed'
    );
    expect(render({ before: BEFORE, after: BEFORE })).toContain('The two are the same.');
  });

  it('writes what each document weighs under the pane it belongs to', () => {
    // Seven characters and eleven bytes: an accented letter is two of them and
    // the emoji is four, while both are one character to a reader.
    const markup = render({ before: 'one', after: 'h\u00e9llo \ud83c\udf89' });

    expect(markup).toContain('Before: 3 characters, 3 B');
    expect(markup).toContain('After: 7 characters, 11 B');
    expect(markup).toContain('3 \u00b7 3 B');
    expect(markup).toContain('7 \u00b7 11 B');
  });

  it('writes a large document in the unit that leaves a number worth reading', () => {
    const markup = render({ before: 'a'.repeat(2048), after: 'a'.repeat(1536) });

    expect(markup).toContain('2,048 characters, 2 KB');
    expect(markup).toContain('1,536 characters, 1.5 KB');
  });

  it('draws the documents in the typeface it was given', () => {
    const markup = render({
      before: BEFORE,
      after: AFTER,
      font: { family: "'Iosevka', monospace", size: 15, lineHeight: '1.6rem', letterSpacing: 0.5 }
    });

    // A number is pixels and a string is left as it was written.
    expect(markup).toContain('--diffine-font:&#x27;Iosevka&#x27;, monospace');
    expect(markup).toContain('--diffine-font-size:15px');
    expect(markup).toContain('--diffine-line-height:1.6rem');
    expect(markup).toContain('--diffine-letter-spacing:0.5px');

    // What is left out keeps the stylesheet's own value rather than being
    // written as `undefined`.
    const partial = render({ before: BEFORE, after: AFTER, font: { size: 15 } });

    expect(partial).toContain('--diffine-font-size:15px');
    expect(partial).not.toContain('--diffine-line-height');
  });

  it('names what the documents are being coloured as, and calls nothing Plain', () => {
    expect(render({ before: BEFORE, after: AFTER })).toContain('>Plain</span>');
    expect(render({ before: BEFORE, after: AFTER, language: 'typescript' })).toContain(
      '>TypeScript</span>'
    );
    // An identifier nobody knows is written as it was given rather than dropped.
    expect(render({ before: BEFORE, after: AFTER, language: 'brainfuck' })).toContain(
      '>brainfuck</span>'
    );
    expect(render({ before: BEFORE, after: AFTER, languageLabel: false })).not.toContain(
      'diffine-language'
    );
  });

  it('says there is nothing to compare rather than drawing two empty panes', () => {
    const markup = render({});

    expect(markup).toContain('Nothing to compare yet.');
    expect(markup).not.toContain('diffine-pane');
  });

  it('takes a comparison that was already worked out', () => {
    const result = diffText('a', 'b', { inline: 'none' });
    const markup = render({ before: 'ignored', after: 'ignored too', result });

    expect(markup).toContain('data-kind="replace"');
    expect(markup).not.toContain('ignored');
  });

  it('speaks the language it was asked to', () => {
    const markup = render({ before: BEFORE, after: AFTER, locale: 'ko' });

    expect(markup).toContain('>이전</span>');
    expect(markup).toContain('변경 2건, 2줄 추가, 1줄 삭제');
  });

  it('takes a word of its own over the locale it was given', () => {
    const markup = render({ before: BEFORE, after: AFTER, strings: { before: 'Draft' } });

    expect(markup).toContain('>Draft</span>');
    expect(markup).toContain('>After</span>');
  });

  it('writes what the view is set to onto the element, for the stylesheet to read', () => {
    const markup = render({ before: BEFORE, after: AFTER, wrap: true, colorScheme: 'dark' });

    expect(markup).toContain('data-wrap="true"');
    expect(markup).toContain('data-scheme="dark"');
  });

  it('sizes the number gutter from the longest document', () => {
    const long = Array.from({ length: 120 }, (_, index) => `line ${index}`).join('\n');

    expect(render({ before: long, after: long })).toContain('--diffine-digits:3');
    expect(render({ before: 'a', after: 'b' })).toContain('--diffine-digits:1');
  });

  it('keeps the bar above the panes for the buttons when the names are off', () => {
    const markup = render({ before: BEFORE, after: AFTER, header: false });

    expect(markup).toContain('diffine-header');
    expect(markup).toContain('diffine-nav');
    expect(markup).not.toContain('diffine-label');
  });

  it('passes anything else it was given through to the element', () => {
    const markup = render({
      before: BEFORE,
      after: AFTER,
      id: 'review',
      className: 'mine',
      'aria-describedby': 'notes'
    } as DiffineViewerProps);

    expect(markup).toContain('class="diffine mine"');
    expect(markup).toContain('id="review"');
    expect(markup).toContain('aria-describedby="notes"');
  });
});

describe('moving between changes', () => {
  it('draws the buttons, and says how many changes there are to move through', () => {
    const markup = render({ before: BEFORE, after: AFTER });

    expect(markup).toContain('aria-label="Previous change"');
    expect(markup).toContain('aria-label="Next change"');
    expect(markup).toContain('– / 2');
  });

  it('leaves them out when it is told to', () => {
    expect(render({ before: BEFORE, after: AFTER, navigation: false })).not.toContain(
      'diffine-nav'
    );
  });

  it('says which change each line belongs to', () => {
    const markup = render({ before: BEFORE, after: AFTER });

    expect(markup).toContain('data-kind="replace" data-side="before" data-row="1" data-change="0"');
    expect(markup).toContain('data-kind="insert" data-side="after" data-row="3" data-change="1"');
    expect(markup).not.toContain('data-kind="equal" data-side="before" data-row="0" data-change');
  });

  it('marks the change the application says a reader is on', () => {
    const markup = render({ before: BEFORE, after: AFTER, selected: 1 });

    expect(markup).toContain('2 / 2');
    expect(markup).toContain('data-change="1" data-current="true"');
    expect(markup).not.toContain('data-change="0" data-current="true"');
  });

  it('marks nothing when the number points past the changes there are', () => {
    const markup = render({ before: BEFORE, after: AFTER, selected: 7 });

    expect(markup).not.toContain('data-current');
    expect(markup).toContain('– / 2');
  });

  it('has nothing to move through when the two documents are the same', () => {
    const markup = render({ before: BEFORE, after: BEFORE });

    expect(markup).toContain('– / 0');
    expect(markup).toContain('disabled=""');
  });
});

describe('drawing only what is in view', () => {
  const LONG = Array.from({ length: 400 }, (_, index) => `line ${index}`).join('\n');
  const EDITED = LONG.replace('line 200', 'line two hundred');

  it('draws a slice of a long document rather than all of it', () => {
    const drawn = render({ before: LONG, after: EDITED }).split('diffine-line"').length - 1;

    expect(drawn).toBeGreaterThan(0);
    expect(drawn).toBeLessThan(400);
  });

  it('draws every line when it is told not to cut', () => {
    const markup = render({ before: LONG, after: EDITED, virtualize: false });

    expect(linesOf(markup, 'before')).toHaveLength(400);
  });

  it('draws every line of a document short enough not to need cutting', () => {
    expect(linesOf(render({ before: BEFORE, after: AFTER }), 'before')).toHaveLength(4);
  });

  it('draws every line when the lines wrap, because their heights are not known', () => {
    const markup = render({ before: LONG, after: EDITED, wrap: true });

    expect(linesOf(markup, 'before')).toHaveLength(400);
  });
});

describe('colouring a line', () => {
  it('gives a run of the line the class the application asked for', () => {
    const markup = render({
      before: 'const total = 1;',
      after: 'const total = 2;',
      highlight: (line) => [{ length: 5, className: 'keyword' }, { length: line.text.length - 5 }]
    });

    expect(markup).toContain('<span class="keyword">const</span>');
  });

  it('cuts the line where the comparison and the colouring disagree', () => {
    const markup = render({
      before: 'aaabbb',
      after: 'aaaccc',
      diff: { inline: 'character', inlineThreshold: 0 },
      // One run across the whole line, which the changed half cuts in two.
      highlight: () => [{ length: 6, className: 'all' }]
    });

    expect(markup).toContain('<span class="all">aaa</span>');
    expect(markup).toContain('<mark class="diffine-piece all" data-kind="delete">bbb</mark>');
    expect(markup).toContain('<mark class="diffine-piece all" data-kind="insert">ccc</mark>');
  });

  it('leaves the line alone when the application has nothing to say about it', () => {
    const markup = render({ before: 'one', after: 'one', highlight: () => null });

    expect(markup).toContain('<span class="diffine-text">one</span>');
  });
});
