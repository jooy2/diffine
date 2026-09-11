'use client';

import * as React from 'react';
import type { DiffineLocale, DiffineImageStrings } from '../../types.js';
import { fill } from '../../internal/strings/common.js';
import { formatBytes, formatCount, formatNumber } from '../../internal/measure.js';
import { TallyIcon } from '../shared/DiffineIcons.js';

/** One picture's own numbers, for the end of the bar that belongs to it. */
export interface ImageMetrics {
  label: string;
  width: number;
  height: number;
  bytes: number;
}

export interface ImageDiffSummaryProps {
  /** One entry a picture, in the order the panes are drawn, or `null` for a pane with none. */
  pictures: readonly (ImageMetrics | null)[];
  /** How much of the frame moved, how many areas it is, and whether that is all of them. */
  changed: number;
  regions: number;
  complete: boolean;
  /** Whether there is a comparison at all. */
  compared: boolean;
  /** Whether the panes are side by side, so the bar is cut into as many parts. */
  split: boolean;
  locale: DiffineLocale;
  strings: DiffineImageStrings;
}

/**
 * The bar under the panes: how large each picture is, and how much of it moved.
 *
 * The same bar the text comparison draws, counting different things. Each side
 * writes its own size under its own pane, which is what makes "1536 × 1024, 240
 * KB" a complete sentence with no word saying whose it is, and the counts go at
 * the right-hand end where the buttons for stepping through the changes sit in
 * the bar above.
 *
 * A share rather than a count of pixels. Nobody knows what forty thousand
 * pixels means, and everybody knows what two per cent of a picture means — the
 * number of areas beside it is what says whether that two per cent is one thing
 * or forty.
 */
export function ImageDiffSummary({
  pictures,
  changed,
  regions,
  complete,
  compared,
  split,
  locale,
  strings
}: ImageDiffSummaryProps): React.JSX.Element {
  // Nothing has been compared, so there is nothing to say about it — and
  // "they are the same" is not the thing to say about panes that are still
  // empty.
  const sentence = !compared
    ? ''
    : changed === 0
      ? strings.identical
      : fill(strings.imageSummary, {
          regions: formatCount(regions, locale),
          percent: formatNumber(changed * 100, locale)
        });

  const tally = !compared ? null : (
    <div className="diffine-tally" title={sentence} aria-hidden="true">
      {changed === 0 ? (
        <span className="diffine-tally-item" data-kind="identical">
          <TallyIcon kind="identical" />
        </span>
      ) : (
        <>
          <span className="diffine-tally-item" data-kind="region">
            <TallyIcon kind="region" />
            {formatCount(regions, locale)}
            {complete ? '' : '+'}
          </span>
          <span className="diffine-tally-item" data-kind="change">
            <TallyIcon kind="change" />
            {`${formatNumber(changed * 100, locale)}%`}
          </span>
        </>
      )}
    </div>
  );

  const said = (
    <span className="diffine-said" role="status">
      {sentence}
    </span>
  );

  /*
   * One part of the bar per pane, so that each picture's size is written under
   * the picture it belongs to. A view that draws every picture in one pane has
   * one part, and the sizes run along it.
   */
  if (!split) {
    return (
      <div className="diffine-summary">
        <div className="diffine-metrics" data-side="both">
          {pictures.map((picture, at) => (
            <Metric key={at} picture={picture} locale={locale} strings={strings} />
          ))}
          {tally}
        </div>
        {said}
      </div>
    );
  }

  return (
    <div className="diffine-summary">
      {pictures.map((picture, at) => (
        <div
          key={at}
          className="diffine-metrics"
          data-side={at === 0 ? 'before' : at === pictures.length - 1 ? 'after' : 'between'}
        >
          <Metric picture={picture} locale={locale} strings={strings} />
          {at === pictures.length - 1 ? tally : null}
        </div>
      ))}
      {said}
    </div>
  );
}

/** One picture's size: the sentence for a screen reader, the numbers for the eye. */
function Metric({
  picture,
  locale,
  strings
}: {
  picture: ImageMetrics | null;
  locale: DiffineLocale;
  strings: DiffineImageStrings;
}): React.JSX.Element | null {
  if (!picture) {
    return null;
  }

  const width = formatCount(picture.width, locale);
  const height = formatCount(picture.height, locale);
  const size = formatBytes(picture.bytes, locale);
  const said = fill(strings.imageSize, { label: picture.label, width, height, size });

  return (
    <span className="diffine-metric" title={said}>
      <span className="diffine-said">{said}</span>
      <span aria-hidden="true">
        <TallyIcon kind="picture" />
        {`${width} × ${height} · ${size}`}
      </span>
    </span>
  );
}
