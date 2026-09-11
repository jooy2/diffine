/**
 * The document comparison, as something to put on a page.
 *
 * Its own entry because a viewer is the expensive half of this package and not
 * every application wants it: `diffine-react` is the comparison, and this is
 * the picture of one. A page that only counts the changes imports the first and
 * carries none of what is here — no React, no stylesheet, no menu of languages.
 *
 * The stylesheet is the one thing this cannot bring with it. `diffine-react/
 * styles.css` goes in wherever an application keeps its stylesheets.
 */

export { TextDiff } from './components/text/TextDiff.js';
export type { TextDiffProps } from './components/text/TextDiff.js';
export { DIFFINE_LANGUAGES } from './internal/highlight/catalogue.js';

export type {
  DiffineColorScheme,
  DiffineCommonStrings,
  DiffineFont,
  DiffineHighlight,
  DiffineInput,
  DiffineLanguageOption,
  DiffineLocale,
  DiffineMode,
  DiffineRender,
  DiffineSide,
  DiffineSource,
  DiffineTextStrings,
  DiffineToken,
  DiffineView
} from './types.js';
