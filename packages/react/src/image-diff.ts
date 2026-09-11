/**
 * The picture comparison, as something to put on a page.
 *
 * The same bargain `diffine-react/text-diff` makes for documents, made again
 * for pixels. `diffine-react/image` is the comparison and returns a value;
 * this is the view of one, with the panes, the zoom, the fade and the wipe.
 *
 * The stylesheet is the one thing this cannot bring with it. `diffine-react/
 * styles.css` goes in wherever an application keeps its stylesheets.
 */

export { ImageDiff } from './components/image/ImageDiff.js';
export type { ImageDiffProps } from './components/image/ImageDiff.js';

export type {
  DiffineColorScheme,
  DiffineCommonStrings,
  DiffineImageContent,
  DiffineImageInput,
  DiffineImageSource,
  DiffineImageStrings,
  DiffineImageUnchanged,
  DiffineImageView,
  DiffineImageViewport,
  DiffineLocale,
  DiffineSide
} from './types.js';
