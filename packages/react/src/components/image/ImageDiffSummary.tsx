'use client';

import * as React from 'react';
import type { DiffImageResult, DiffineLocale, DiffineImageStrings } from '../../types.js';
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
  before: ImageMetrics | null;
  after: ImageMetrics | null;
  result: DiffImageResult | null;
  /** Whether the panes are side by side, so the bar is halved as they are. */
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
  before,
  after,
  result,
  split,
  locale,
  strings
}: ImageDiffSummaryProps): React.JSX.Element {
  const changed = result ? result.stats.ratio : 0;
  // Nothing has been compared, so there is nothing to say about it — and
  // "the two are the same" is not the thing to say about two panes that are
  // still empty.
  const sentence = !result
    ? ''
    : changed === 0
      ? strings.identical
      : fill(strings.imageSummary, {
          regions: formatCount(result.regions.length, locale),
          percent: formatNumber(changed * 100, locale)
        });

  const tally = !result ? null : (
    <div className="diffine-tally" title={sentence} aria-hidden="true">
      {changed === 0 ? (
        <span className="diffine-tally-item" data-kind="identical">
          <TallyIcon kind="identical" />
        </span>
      ) : (
        <>
          <span className="diffine-tally-item" data-kind="region">
            <TallyIcon kind="region" />
            {formatCount(result.regions.length, locale)}
            {result.complete ? '' : '+'}
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

  // One row when there is one pane, because each half of a split bar is under
  // the pane it is talking about and there is nothing to be under here.
  if (!split) {
    return (
      <div className="diffine-summary">
        <div className="diffine-metrics" data-side="both">
          <Metric picture={before} locale={locale} strings={strings} />
          <Metric picture={after} locale={locale} strings={strings} />
          {tally}
        </div>
        {said}
      </div>
    );
  }

  return (
    <div className="diffine-summary">
      <div className="diffine-metrics" data-side="before">
        <Metric picture={before} locale={locale} strings={strings} />
      </div>
      <div className="diffine-metrics" data-side="after">
        <Metric picture={after} locale={locale} strings={strings} />
        {tally}
      </div>
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
