'use client';

import * as React from 'react';
import type { DiffineStrings } from '../../types.js';
import { DIFFINE_LANGUAGES, languageName } from '../../internal/highlight/catalogue.js';

/**
 * What the documents are being coloured as, at the right end of the bar above
 * them.
 *
 * Two components draw this and they draw it differently, which is the whole of
 * why there are two exports here rather than one with a boolean. A viewer is
 * given its language by the application and says which one it is; an editor is
 * given a document somebody pasted and has no idea what it is, so it asks.
 */

export interface DiffineLanguageNameProps {
  language: string | undefined;
  strings: DiffineStrings;
}

/** The name of the language, for a view an application already decided about. */
export function DiffineLanguageName({
  language,
  strings
}: DiffineLanguageNameProps): React.JSX.Element {
  return (
    <span className="diffine-language" title={strings.language}>
      {languageName(language)}
    </span>
  );
}

export interface DiffineLanguagePickerProps {
  language: string;
  onLanguageChange: (language: string) => void;
  strings: DiffineStrings;
}

/**
 * The same name, as a menu, for a view whose documents arrive by being typed in.
 *
 * A `<select>` rather than a menu built out of `<div>`s. What a reader wants
 * from a list of thirty-five languages is to open it and press `p`, and that is
 * the browser's own behaviour on the platform they are using rather than
 * something to be written again here — along with the keyboard, the touch
 * target and the screen reader.
 */
export function DiffineLanguagePicker({
  language,
  onLanguageChange,
  strings
}: DiffineLanguagePickerProps): React.JSX.Element {
  return (
    <select
      className="diffine-language diffine-language-menu"
      value={language}
      title={strings.language}
      aria-label={strings.language}
      onChange={(event) => onLanguageChange(event.target.value)}
    >
      {DIFFINE_LANGUAGES.map((option) => (
        <option key={option.id} value={option.id}>
          {option.name}
        </option>
      ))}
    </select>
  );
}
