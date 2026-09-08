import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { TextDiff } from 'diffine-react';
import type { DiffLine, DiffineSide, TextDiffProps } from 'diffine-react';

const render = (props: TextDiffProps) => renderToStaticMarkup(<TextDiff {...props} />);

const BEFORE = 'one\ntwo\nthree';
const AFTER = 'one\ntwo changed\nthree\nfour';

describe('TextDiff, with something of the application drawn on it', () => {
  it('puts what `renderGutter` returns in the gutter, after the number', () => {
    const markup = render({
      before: BEFORE,
      after: AFTER,
      renderGutter: (line) => <b>{line.index}</b>
    });

    expect(markup).toContain('<span class="diffine-slot"><b>0</b></span>');
    expect(markup.match(/class="diffine-slot"/gu)).toHaveLength(7);
  });

  it('asks about a line rather than about the blank opposite one', () => {
    const asked: string[] = [];

    render({
      before: BEFORE,
      after: AFTER,
      renderGutter: (line: DiffLine, side: DiffineSide) => {
        asked.push(`${side} ${line.index}`);

        return null;
      }
    });

    // Three lines on the left and four on the right. The blank the fourth line
    // is drawn opposite is not a line and is not asked about.
    expect(asked).toEqual([
      'before 0',
      'before 1',
      'before 2',
      'after 0',
      'after 1',
      'after 2',
      'after 3'
    ]);
  });

  it('draws what `renderWidget` returns under the line it belongs to', () => {
    const markup = render({
      before: BEFORE,
      after: AFTER,
      renderWidget: (line, side) => (side === 'after' && line.index === 1 ? <p>a comment</p> : null)
    });

    expect(markup).toContain('<div class="diffine-widget"><p>a comment</p></div>');
    expect(markup.match(/data-widget="true"/gu)).toHaveLength(1);
  });

  it('keeps a line and its columns in a row of their own under a widget', () => {
    const markup = render({
      before: 'one',
      after: 'two',
      renderWidget: () => <p>here</p>
    });

    expect(markup).toContain('<div class="diffine-row"><span class="diffine-gutter">');
  });

  it('leaves a line that gets nothing exactly as it was', () => {
    const plain = render({ before: BEFORE, after: AFTER });
    const asked = render({ before: BEFORE, after: AFTER, renderWidget: () => null });

    expect(asked).toBe(plain);
  });

  it('draws neither in a document somebody can type into', () => {
    const markup = render({
      mode: 'editor',
      defaultBefore: BEFORE,
      defaultAfter: AFTER,
      renderGutter: () => <b>x</b>,
      renderWidget: () => <p>y</p>
    });

    expect(markup).not.toContain('diffine-slot');
    expect(markup).not.toContain('diffine-widget');
  });
});
