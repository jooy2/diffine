/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { DiffPixels } from 'diffine-react';
import { ImageDiff } from 'diffine-react/image-diff';
import { TextDiff } from 'diffine-react/text-diff';
import { ImageDiffLoupe } from '../src/components/image/ImageDiffLoupe.js';
import type { Sample } from '../src/internal/image/loupe.js';
import { imageStrings } from '../src/internal/strings/image.js';

/**
 * The components drawn larger or smaller than their default.
 *
 * Nearly all of it is the stylesheet's: the component writes one number on its
 * element and every length in the file is multiplied by it. So what is checked
 * here is the number that is written, the few sizes the component works out
 * for itself, and the stylesheet — that nothing in it was written in a unit the
 * number never reaches.
 */

const pixels = (width: number, height: number): DiffPixels => ({
  data: new Uint8ClampedArray(width * height * 4),
  width,
  height
});

const text = (scale?: number) =>
  renderToStaticMarkup(<TextDiff before="one" after="two" scale={scale} />);

const image = (scale?: number) =>
  renderToStaticMarkup(<ImageDiff before={pixels(2, 2)} after={pixels(2, 2)} scale={scale} />);

describe('scale', () => {
  it('writes the number on the element of both components', () => {
    expect(text(1.25)).toContain('--diffine-scale:1.25');
    expect(image(0.875)).toContain('--diffine-scale:0.875');
  });

  it('writes nothing at the default, so a value set around the component reaches it', () => {
    for (const scale of [undefined, 1]) {
      expect(text(scale)).not.toContain('--diffine-scale');
      expect(image(scale)).not.toContain('--diffine-scale');
    }
  });

  it('reads anything that is not a positive number as the default', () => {
    for (const scale of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(text(scale)).not.toContain('--diffine-scale');
      expect(image(scale)).not.toContain('--diffine-scale');
    }
  });

  it("leaves an application's own typeface as it was written, for the stylesheet to multiply", () => {
    const markup = renderToStaticMarkup(
      <TextDiff before="one" after="two" font={{ size: 15 }} scale={1.2} />
    );

    expect(markup).toContain('--diffine-font-size:15px');
    expect(markup).toContain('--diffine-scale:1.2');
  });

  it('keeps the count of panes next to it on a picture comparison', () => {
    const markup = image(1.5);

    expect(markup).toContain('--diffine-scale:1.5');
    expect(markup).toContain('--diffine-panes:2');
  });
});

describe('the loupe, drawn larger or smaller', () => {
  const sample: Sample = {
    label: 'before',
    picture: {
      drawable: null as unknown as CanvasImageSource,
      pixels: pixels(4, 4),
      width: 4,
      height: 4,
      bytes: 0,
      reduced: false,
      owned: false
    },
    area: { x: 0, y: 0, width: 4, height: 4 }
  };

  const loupe = (scale: number) =>
    renderToStaticMarkup(
      <ImageDiffLoupe
        samples={[sample]}
        at={{ x: 1, y: 1 }}
        span={9}
        onSpan={() => {}}
        place={null}
        onPlace={() => {}}
        start="left"
        onGrabbed={() => {}}
        outline="black"
        marker="blue"
        halo="white"
        scale={scale}
        strings={imageStrings('en', undefined)}
      />
    );

  it('draws a magnified pixel twelve pixels wide at the default', () => {
    expect(loupe(1)).toContain('width:108px;height:108px');
  });

  it('draws it at the scale it was given', () => {
    expect(loupe(1.25)).toContain('width:135px;height:135px');
    expect(loupe(1.5)).toContain('width:162px;height:162px');
  });

  it('keeps every tile a whole number of pixels wide', () => {
    // Twelve at seven eighths is ten and a half, which would put every other
    // line of the grid between two of the screen's pixels.
    expect(loupe(0.875)).toContain('width:99px;height:99px');
  });
});

describe('the stylesheet', () => {
  const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8').replace(
    /\/\*[\s\S]*?\*\//g,
    ''
  );
  const declarations = css
    .split(/[;{}]/)
    .map((declaration) => declaration.trim())
    .filter((declaration) => declaration !== '');

  it('counts every length in the unit the scale multiplies', () => {
    // A rule written in `rem` is a rule that stays the same size while
    // everything around it grows. These five are rems on purpose: the box, the
    // unit itself, and the two sizes of the type, which are multiplied where
    // they are used.
    const inRem = declarations
      .filter((declaration) => /\drem\b/.test(declaration))
      .map((declaration) => declaration.slice(0, declaration.indexOf(':')).trim());

    expect(new Set(inRem)).toEqual(
      new Set([
        '--diffine-height',
        '--diffine-radius',
        '--diffine-unit',
        '--diffine-font-size',
        '--diffine-line-height'
      ])
    );
  });

  it('multiplies the size of the type everywhere it is used', () => {
    const uses = [...css.matchAll(/var\(--diffine-(?:font-size|line-height)\)[^;]*/g)];

    expect(uses.length).toBeGreaterThan(0);

    for (const [use] of uses) {
      expect(use).toMatch(/^var\(--diffine-[\w-]+\) \* var\(--diffine-scale, 1\)\)/);
    }
  });
});
