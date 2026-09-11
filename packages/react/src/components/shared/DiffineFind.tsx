'use client';

import * as React from 'react';
import type { DiffineTextStrings } from '../../types.js';
import { fill } from '../../internal/strings/common.js';
import type { DocumentSearch } from '../../internal/search.js';
import { Chevron, Cross } from './DiffineIcons.js';

/**
 * Looking for a run of text in one pane, and reading what turned up.
 *
 * There is one of these per pane rather than one per component, and everything
 * about it follows from that. Each side of a split view is opened, typed into,
 * counted and closed on its own, because the two documents are two documents: a
 * name a reader is chasing through the version on the left is not a name they
 * are chasing through the version on the right, and one box over both of them
 * would answer the wrong question twice.
 *
 * The bar sits under the pane it belongs to, on the same grid the header and
 * the bar of counts are on, so the half of the component it is under is the
 * half it searches.
 *
 * Nothing here is imported: `TextDiff` fetches this module the first time a
 * reader opens a search, so a page whose readers never look for anything never
 * downloads it. The button that opens one is in `DiffineFindToggle.tsx`, which
 * is drawn from the start and therefore imported from the start.
 */

export interface DiffineFindProps {
  search: DocumentSearch;
  /** What this pane is called, which is what names the bar to a screen reader. */
  label: string;
  /** Whether there is a document here to write into, which a viewer has not. */
  replaceable: boolean;
  /** Writes the replacement over the match being read. */
  onReplace?: () => void;
  /** Writes it over every match. */
  onReplaceAll?: () => void;
  /** Puts the focus back where a reader would want it, once the bar has closed. */
  onClose: () => void;
  strings: DiffineTextStrings;
}

/** One pane's search bar: the query, what it found, and the way through it. */
export function DiffineFind({
  search,
  label,
  replaceable,
  onReplace,
  onReplaceAll,
  onClose,
  strings
}: DiffineFindProps): React.JSX.Element {
  const field = React.useRef<HTMLInputElement>(null);
  const total = search.matches.length;
  /** The count, with a `+` where there are more matches than were collected. */
  const counted = search.capped ? `${total}+` : total;
  const nothing = search.query !== '' && total === 0;

  /*
   * The box takes the focus every time the bar is asked for, and its contents
   * are selected with it — so the shortcut pressed a second time is a new
   * search rather than a caret dropped somewhere in the last one.
   */
  React.useEffect(() => {
    field.current?.focus();
    field.current?.select();
  }, [search.wanted]);

  function close(): void {
    search.hide();
    onClose();
  }

  /** Escape leaves, and Enter is the button beside the box. */
  function onQueryKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      search.step(event.shiftKey ? -1 : 1);
    }
  }

  function onReplacementKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'Enter') {
      event.preventDefault();

      if (event.shiftKey) {
        onReplaceAll?.();
      } else {
        onReplace?.();
      }
    }
  }

  return (
    <div className="diffine-find" role="search" aria-label={fill(strings.searchIn, { label })}>
      {replaceable ? (
        <button
          type="button"
          className="diffine-icon-button diffine-find-more"
          aria-expanded={search.replacing}
          aria-label={strings.replace}
          title={strings.replace}
          onClick={() => search.setReplacing(!search.replacing)}
        >
          <Chevron />
        </button>
      ) : null}

      <div className="diffine-find-rows">
        <div className="diffine-find-row">
          <div className="diffine-find-box" data-empty={nothing ? 'true' : undefined}>
            <input
              ref={field}
              type="text"
              className="diffine-find-input"
              value={search.query}
              onChange={(event) => search.setQuery(event.target.value)}
              onKeyDown={onQueryKeyDown}
              placeholder={strings.search}
              aria-label={strings.search}
              aria-invalid={search.invalid || nothing}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
            <div className="diffine-find-flags">
              <Flag
                mark="Aa"
                name="case"
                on={search.options.matchCase}
                label={strings.matchCase}
                onToggle={() => search.setOptions({ matchCase: !search.options.matchCase })}
              />
              <Flag
                mark="ab"
                name="word"
                on={search.options.wholeWord}
                label={strings.wholeWord}
                onToggle={() => search.setOptions({ wholeWord: !search.options.wholeWord })}
              />
              <Flag
                mark=".*"
                name="regex"
                on={search.options.regex}
                label={strings.regex}
                onToggle={() => search.setOptions({ regex: !search.options.regex })}
              />
            </div>
          </div>

          {/* Drawn for the eye and hidden from a screen reader, which is told the
              same thing in a sentence when it changes — exactly as the count of
              changes in the bar above is. A fraction read out as "one slash
              four" is not what anybody meant by it. */}
          <span className="diffine-find-count" aria-hidden="true">
            {`${total === 0 ? 0 : search.current + 1} / ${counted}`}
          </span>
          <span className="diffine-said" role="status">
            {search.query === ''
              ? ''
              : total === 0
                ? strings.searchEmpty
                : fill(strings.searchPosition, {
                    position: search.current + 1,
                    total: counted
                  })}
          </span>

          <button
            type="button"
            className="diffine-icon-button"
            disabled={total === 0}
            title={strings.searchPrevious}
            aria-label={strings.searchPrevious}
            onClick={() => search.step(-1)}
          >
            <Chevron up />
          </button>
          <button
            type="button"
            className="diffine-icon-button"
            disabled={total === 0}
            title={strings.searchNext}
            aria-label={strings.searchNext}
            onClick={() => search.step(1)}
          >
            <Chevron />
          </button>
          <button
            type="button"
            className="diffine-icon-button"
            title={strings.searchClose}
            aria-label={strings.searchClose}
            onClick={close}
          >
            <Cross />
          </button>
        </div>

        {replaceable && search.replacing ? (
          <div className="diffine-find-row">
            <div className="diffine-find-box">
              <input
                type="text"
                className="diffine-find-input"
                value={search.replacement}
                onChange={(event) => search.setReplacement(event.target.value)}
                onKeyDown={onReplacementKeyDown}
                placeholder={strings.replaceWith}
                aria-label={strings.replaceWith}
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
              />
            </div>
            <button
              type="button"
              className="diffine-find-action"
              disabled={total === 0}
              title={strings.replace}
              onClick={() => onReplace?.()}
            >
              {strings.replace}
            </button>
            <button
              type="button"
              className="diffine-find-action"
              disabled={total === 0}
              title={strings.replaceAll}
              onClick={() => onReplaceAll?.()}
            >
              {strings.replaceAll}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** One of the three switches inside the box: case, whole words, expression. */
function Flag({
  mark,
  name,
  on,
  label,
  onToggle
}: {
  mark: string;
  name: string;
  on: boolean;
  label: string;
  onToggle: () => void;
}): React.JSX.Element {
  return (
    <button
      type="button"
      className="diffine-find-flag"
      data-flag={name}
      aria-pressed={on}
      aria-label={label}
      title={label}
      // The press is what switches it, and the focus stays in the box it came
      // from — so a reader who has typed a query does not have to find their
      // way back to it to carry on typing.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onToggle}
    >
      {mark}
    </button>
  );
}
