import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ImageDiff, diffImage, type DiffPixels, type ImageDiffProps } from 'diffine-react';

/**
 * The picture comparison as markup, with no canvas under it.
 *
 * Which is most of what there is to check here without a browser. Everything
 * inside a pane is painted rather than written — the pictures, the marks over
 * them, the boxes round the changes — and none of it exists in a renderer with
 * no canvas and no layout. What does exist is the frame: the bar above, the
 * numbers below, which panes were drawn and what they invite. The painting
 * itself is checked in a browser.
 *
 * It is also the test that the component survives a server at all. A component
 * whose whole middle is a canvas is one import away from calling `document`
 * during a render, and this is what says it does not.
 */
const render = (props: ImageDiffProps) => renderToStaticMarkup(<ImageDiff {...props} />);

const pixels = (width: number, height: number): DiffPixels => ({
  data: new Uint8ClampedArray(width * height * 4),
  width,
  height
});

describe('ImageDiff', () => {
  it('draws two panes with a name over each', () => {
    const markup = render({ before: pixels(4, 4), after: pixels(4, 4) });

    expect(markup.split('diffine-image-pane')).toHaveLength(3);
    expect(markup).toContain('data-side="before"');
    expect(markup).toContain('data-side="after"');
    expect(markup).toContain('>Before<');
    expect(markup).toContain('>After<');
  });

  it('draws one pane for a view that puts the two together', () => {
    const markup = render({ before: pixels(4, 4), after: pixels(4, 4), view: 'wipe' });

    expect(markup).toContain('data-side="both"');
    expect(markup.split('diffine-image-pane')).toHaveLength(2);
    expect(markup).toContain('Before → After');
  });

  it('says there is nothing to compare before a picture has arrived', () => {
    // Nothing is decoded on a server, so this is also what the first paint of
    // every comparison looks like.
    expect(render({})).toContain('Nothing to compare yet.');
  });

  it('invites a picture in the editor rather than reporting an empty one', () => {
    const markup = render({ mode: 'editor' });

    expect(markup).toContain('type="file"');
    expect(markup).toContain('Choose an image');
    expect(markup).not.toContain('Nothing to compare yet.');
  });

  it('takes the name each side was given', () => {
    const markup = render({
      before: { content: pixels(2, 2), label: 'v1.png' },
      after: { content: pixels(2, 2), label: 'v2.png' }
    });

    expect(markup).toContain('>v1.png<');
    expect(markup).toContain('>v2.png<');
  });

  it('leaves out the parts that were turned off', () => {
    const markup = render({
      before: pixels(2, 2),
      after: pixels(2, 2),
      header: false,
      navigation: false,
      zoom: false,
      summary: false
    });

    expect(markup).not.toContain('diffine-header');
    expect(markup).not.toContain('diffine-summary');
    expect(markup).not.toContain('diffine-zoom');
  });

  it('writes the sizes and the counts of a comparison it was handed', () => {
    const before = pixels(4, 4);
    const after = pixels(4, 4);

    after.data[0] = 255;
    after.data[3] = 255;

    const markup = render({
      before,
      after,
      result: diffImage(before, after, { tolerance: 0 })
    });

    // One area changed, out of sixteen pixels.
    expect(markup).toContain('6.25%');
  });

  it('speaks the language it was given', () => {
    expect(render({ locale: 'ko' })).toContain('아직 비교할 내용이 없습니다.');
  });

  it("puts an application's own words over the locale's", () => {
    expect(render({ strings: { empty: 'Pick two pictures.' } })).toContain('Pick two pictures.');
  });
});
