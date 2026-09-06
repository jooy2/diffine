'use client';

import * as React from 'react';
import type { DiffineLocale, DiffineStrings } from '../../types.js';
import { fill } from '../../internal/i18n.js';
import { formatBytes, formatCount, measureText } from '../../internal/measure.js';
import { TallyIcon } from './DiffineIcons.js';

export interface DiffineSummaryProps {
  /** The left document, as it stands, for its own end of the bar. */
  before: string;
  /** The right document. */
  after: string;
  /** What each side is called, which is what its size is announced under. */
  beforeLabel: string;
  afterLabel: string;
  /** How many changes there are, and how many lines each way. */
  changes: number;
  inserted: number;
  deleted: number;
  /** Whether the column between the panes is drawn, so the bar matches it. */
  linked: boolean;
  locale: DiffineLocale;
  strings: DiffineStrings;
}

/**
 * The bar under the panes: what each document weighs, and what happened between
 * them.
 *
 * It is laid out on the same grid as the header, so the left half sits under
 * the left pane and the right half under the right one — which is the whole
 * reason each side's size can be written without a word saying which side it
 * belongs to. The counts go at the right end of the right half, where the
 * buttons for moving between changes sit in the bar above.
 *
 * What is drawn is a `+`, a `−` and a `~` against three numbers, which are the
 * same three marks the gutter puts beside a line. A reader who has learnt them
 * once has learnt them here, and the bar stays the same width in every language
 * instead of being a sentence that fits in one of them.
 *
 * A screen reader is told the sentence rather than the marks. Only that
 * sentence is live: the sizes change on every keystroke, and a bar that read
 * them out as somebody typed would be unusable.
 */
export function DiffineSummary({
  before,
  after,
  beforeLabel,
  afterLabel,
  changes,
  inserted,
  deleted,
  linked,
  locale,
  strings
}: DiffineSummaryProps): React.JSX.Element {
  const beforeSize = React.useMemo(() => measureText(before), [before]);
  const afterSize = React.useMemo(() => measureText(after), [after]);

  const sentence =
    changes === 0 ? strings.identical : fill(strings.summary, { changes, inserted, deleted });

  return (
    <div className="diffine-summary">
      <div className="diffine-metrics" data-side="before">
        <Metric
          label={beforeLabel}
          characters={beforeSize.characters}
          bytes={beforeSize.bytes}
          locale={locale}
          strings={strings}
        />
      </div>
      {linked ? <div className="diffine-summary-gap" aria-hidden="true" /> : null}
      <div className="diffine-metrics" data-side="after">
        <Metric
          label={afterLabel}
          characters={afterSize.characters}
          bytes={afterSize.bytes}
          locale={locale}
          strings={strings}
        />
        <div className="diffine-tally" title={sentence} aria-hidden="true">
          {changes === 0 ? (
            <span className="diffine-tally-item" data-kind="identical">
              <TallyIcon kind="identical" />
            </span>
          ) : (
            <>
              <span className="diffine-tally-item" data-kind="change">
                <TallyIcon kind="change" />
                {formatCount(changes, locale)}
              </span>
              <span className="diffine-tally-item" data-kind="insert">
                <TallyIcon kind="insert" />
                {formatCount(inserted, locale)}
              </span>
              <span className="diffine-tally-item" data-kind="delete">
                <TallyIcon kind="delete" />
                {formatCount(deleted, locale)}
              </span>
            </>
          )}
        </div>
      </div>
      <span className="diffine-said" role="status">
        {sentence}
      </span>
    </div>
  );
}

/** One side's size: the sentence for a screen reader, the numbers for the eye. */
function Metric({
  label,
  characters,
  bytes,
  locale,
  strings
}: {
  label: string;
  characters: number;
  bytes: number;
  locale: DiffineLocale;
  strings: DiffineStrings;
}): React.JSX.Element {
  const count = formatCount(characters, locale);
  const size = formatBytes(bytes, locale);
  const said = fill(strings.documentSize, { label, characters: count, size });

  return (
    <span className="diffine-metric" title={said}>
      <span className="diffine-said">{said}</span>
      <span aria-hidden="true">
        <TallyIcon kind="document" />
        {`${count} · ${size}`}
      </span>
    </span>
  );
}
