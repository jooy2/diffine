import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { diffText, parsePatch } from 'diffine-react';
import { TextDiff } from 'diffine-react/text-diff';
import type { TextDiffProps } from 'diffine-react/text-diff';
import { foldPlan } from '../src/internal/fold.js';

const render = (props: TextDiffProps) => renderToStaticMarkup(<TextDiff {...props} />);

/** Every line the markup holds, cut out one at a time. */
function linesOf(markup: string): string[] {
  return markup
    .split('<div class="diffine-line"')
    .slice(1)
    .map((piece) => piece.slice(0, piece.indexOf('</div>')));
}

/** The words in every band, from both panes. */
function bandsOf(markup: string): string[] {
  return linesOf(markup)
    .filter((piece) => piece.includes('data-kind="fold"'))
    .map((piece) => piece.slice(piece.indexOf('>') + 1).replace(/<[^>]*>/gu, ''));
}

/** Every line of one pane, band or not, as `kind` and the words in it. */
function drawnOf(markup: string, side: string): string[] {
  return linesOf(markup)
    .filter((piece) => piece.includes(`data-side="${side}"`))
    .map((piece) => {
      const kind = /data-kind="([^"]+)"/u.exec(piece);
      const text = piece.slice(piece.indexOf('>') + 1).replace(/<[^>]*>/gu, '');

      return `${kind?.[1] ?? '?'} ${text}`;
    });
}

/** A document of numbered lines. */
const numbered = (count: number) =>
  Array.from({ length: count }, (_unused, index) => `line ${index + 1}`).join('\n');

const NOTHING = new Set<number>();
const BEFORE = numbered(30);
const AFTER = BEFORE.replace('line 15\n', 'line fifteen\n');

describe('foldPlan', () => {
  it('folds nothing at all when it is not asked to', () => {
    const { rows } = diffText(BEFORE, AFTER);

    expect(foldPlan(rows, { collapse: false, context: 3, opened: NOTHING })).toBeNull();
  });

  it('keeps the lines either side of a change and folds the rest away', () => {
    const { rows } = diffText(BEFORE, AFTER);
    const plan = foldPlan(rows, { collapse: true, context: 3, opened: NOTHING });

    // Rows 0 to 13 are unchanged, row 14 is the change, and 15 to 29 are
    // unchanged again. Three rows survive on each side of it.
    expect(plan?.bands[0]).toEqual({ start: 0, end: 11, lines: 11, expandable: true });
    expect(plan?.bands[18]).toEqual({ start: 18, end: 30, lines: 12, expandable: true });
    expect([...(plan?.hidden ?? [])].filter(Boolean)).toHaveLength(23);
  });

  it('keeps nothing at the top and the bottom, where there is no change to surround', () => {
    const { rows } = diffText(BEFORE, AFTER);
    const plan = foldPlan(rows, { collapse: true, context: 0, opened: NOTHING });

    expect(plan?.bands[0]?.end).toBe(14);
    expect(plan?.bands[15]?.end).toBe(30);
  });

  it('draws the run a reader opened, and leaves the others folded', () => {
    const { rows } = diffText(BEFORE, AFTER);
    const plan = foldPlan(rows, { collapse: true, context: 3, opened: new Set([0]) });

    expect(plan?.bands[0]).toBeUndefined();
    expect(plan?.hidden[0]).toBe(0);
    expect(plan?.bands[18]).toBeDefined();
  });

  it('folds a comparison that found no changes at all into one band', () => {
    const { rows } = diffText(BEFORE, BEFORE);
    const plan = foldPlan(rows, { collapse: true, context: 3, opened: NOTHING });

    expect(plan?.bands[0]).toEqual({ start: 0, end: 30, lines: 30, expandable: true });
  });

  it('says where a patch is missing lines, whether or not anything is folded', () => {
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
    const plan = foldPlan(rows, { collapse: false, context: 3, opened: NOTHING });

    expect(plan?.bands[1]).toEqual({ start: 1, end: 1, lines: 38, expandable: false });
    expect([...(plan?.hidden ?? [])].filter(Boolean)).toHaveLength(0);
  });
});

describe('TextDiff, folded', () => {
  it('draws no band until it is asked to', () => {
    expect(bandsOf(render({ before: BEFORE, after: AFTER }))).toEqual([]);
  });

  it('says how many lines each band stands for', () => {
    const markup = render({ before: BEFORE, after: AFTER, collapse: true });

    expect(bandsOf(markup)).toEqual([
      '11 unchanged lines',
      '12 unchanged lines',
      '11 unchanged lines',
      '12 unchanged lines'
    ]);
  });

  it('folds both sides the same way, so the two stay level', () => {
    const markup = render({ before: BEFORE, after: AFTER, collapse: true });

    expect(drawnOf(markup, 'before')).toEqual([
      'fold 11 unchanged lines',
      'equal 12line 12',
      'equal 13line 13',
      'equal 14line 14',
      'replace 15~Changed: line 15',
      'equal 16line 16',
      'equal 17line 17',
      'equal 18line 18',
      'fold 12 unchanged lines'
    ]);
    expect(drawnOf(markup, 'after').map((line) => line.split(' ')[0])).toEqual(
      drawnOf(markup, 'before').map((line) => line.split(' ')[0])
    );
  });

  it('folds a unified column as well', () => {
    const markup = render({ before: BEFORE, after: AFTER, collapse: true, view: 'unified' });

    expect(bandsOf(markup)).toEqual(['11 unchanged lines', '12 unchanged lines']);
  });

  it('reads the number of lines kept from `context`', () => {
    const markup = render({ before: BEFORE, after: AFTER, collapse: true, context: 1 });

    expect(bandsOf(markup).slice(0, 2)).toEqual(['13 unchanged lines', '14 unchanged lines']);
  });

  it('makes a band a button only where the lines can be opened', () => {
    const markup = render({ before: BEFORE, after: AFTER, collapse: true });

    expect(markup).toContain('<button type="button" class="diffine-fold"');
    expect(markup).toContain('aria-label="Show 11 unchanged lines"');
  });

  it('draws what a patch is missing without offering to open it', () => {
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
    const markup = render({ result: parsePatch(patch)[0].result });

    expect(bandsOf(markup)).toEqual(['38 unchanged lines', '38 unchanged lines']);
    expect(markup).not.toContain('<button type="button" class="diffine-fold"');
  });

  it('never folds a document somebody can type into', () => {
    const markup = render({
      mode: 'editor',
      defaultBefore: BEFORE,
      defaultAfter: AFTER,
      collapse: true
    });

    expect(bandsOf(markup)).toEqual([]);
  });

  it('writes the count in the language the viewer was given', () => {
    const markup = render({ before: BEFORE, after: AFTER, collapse: true, locale: 'ko' });

    expect(bandsOf(markup)[0]).toBe('변경 없는 11줄');
  });
});
