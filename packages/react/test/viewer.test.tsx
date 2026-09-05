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

/** Every line of one side, in order, with its kind. */
function linesOf(markup: string, side: string): string[] {
  return [
    ...markup.matchAll(
      /<div class="diffine-line" data-row="\d+" data-kind="([^"]+)" data-side="([^"]+)">([\s\S]*?)(?=<div class="diffine-line"|<\/div><\/div>)/g
    )
  ]
    .filter((match) => match[2] === side)
    .map((match) => `${match[1]} ${match[3].replace(/<[^>]*>/g, '')}`);
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
    expect(render({ before: BEFORE, after: AFTER })).toContain('>Before</div>');
    expect(render({ before: { content: BEFORE, label: 'v1.2' }, after: AFTER })).toContain(
      '>v1.2</div>'
    );
  });

  it('leaves out the columns it was told to leave out', () => {
    const bare = render({
      before: BEFORE,
      after: AFTER,
      lineNumbers: false,
      markers: false,
      header: false,
      summary: false
    });

    expect(bare).not.toContain('diffine-number');
    expect(bare).not.toContain('diffine-marker');
    expect(bare).not.toContain('diffine-header');
    expect(bare).not.toContain('diffine-summary');
    expect(bare).toContain('diffine-line');
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

    expect(markup).toContain('>이전</div>');
    expect(markup).toContain('변경 2건, 2줄 추가, 1줄 삭제');
  });

  it('takes a word of its own over the locale it was given', () => {
    const markup = render({ before: BEFORE, after: AFTER, strings: { before: 'Draft' } });

    expect(markup).toContain('>Draft</div>');
    expect(markup).toContain('>After</div>');
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
