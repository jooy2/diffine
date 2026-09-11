'use client';

import * as React from 'react';
import type { DiffFormat, DiffineLocale, DiffineTextStrings } from '../../types.js';
import { fill } from '../../internal/strings/common.js';
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
  /** How each document is written, where the comparison could work it out. */
  format?: { before: DiffFormat; after: DiffFormat };
  locale: DiffineLocale;
  strings: DiffineTextStrings;
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
  format,
  locale,
  strings
}: DiffineSummaryProps): React.JSX.Element {
  const beforeSize = React.useMemo(() => measureText(before), [before]);
  const afterSize = React.useMemo(() => measureText(after), [after]);

  const sentence =
    changes === 0 ? strings.identical : fill(strings.summary, { changes, inserted, deleted });
  const written =
    format && differs(format.before, format.after)
      ? fill(strings.format, {
          before: describe(format.before, strings),
          after: describe(format.after, strings)
        })
      : null;

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
        {written ? (
          <span className="diffine-format" title={written}>
            {written}
          </span>
        ) : null}
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

/**
 * Whether two documents with the same lines in them are not the same file.
 *
 * A document with no line ending anywhere in it — one line, or nothing at all —
 * is left out. It has no ending to be the wrong one and no last line to be
 * missing one, and saying that a single line differs from a file in how it is
 * written would be true of every single line there has ever been.
 */
function differs(before: DiffFormat, after: DiffFormat): boolean {
  if (before.ending === 'none' || after.ending === 'none') {
    return false;
  }

  return (
    before.ending !== after.ending ||
    before.finalNewline !== after.finalNewline ||
    before.byteOrderMark !== after.byteOrderMark
  );
}

/** One document's way of being written, in as few words as it takes. */
function describe(format: DiffFormat, strings: DiffineTextStrings): string {
  const parts: string[] = [];

  if (format.ending !== 'none') {
    // `CRLF` and `LF` are what every editor calls these, in every language.
    parts.push(format.ending === 'mixed' ? strings.mixedEndings : format.ending.toUpperCase());
  }

  if (format.byteOrderMark) {
    parts.push('BOM');
  }

  if (!format.finalNewline) {
    parts.push(strings.noFinalNewline);
  }

  return parts.join(', ');
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
  strings: DiffineTextStrings;
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
