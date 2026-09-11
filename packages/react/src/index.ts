/**
 * The comparison, which is what the rest of the package is built on.
 *
 * Everything here is a function and a type: two documents in, what changed out;
 * two pictures in, what changed out; a patch read or written. Nothing here
 * touches React or the DOM, so an application that wants the answer rather than
 * the picture — a summary line, a count in a badge, a check in a build — pays
 * for the answer alone.
 *
 * The views are their own entries, because a view is the expensive half and not
 * every page wants one:
 *
 * ```ts
 * import { TextDiff } from 'diffine-react/text-diff';
 * import { ImageDiff } from 'diffine-react/image-diff';
 * ```
 *
 * And each half of the comparison is its own entry again, for a build that
 * wants one of them: `diffine-react/diff`, `diffine-react/image` and
 * `diffine-react/patch`.
 */

export * from './types.js';
export { DIFFINE_DEFAULTS, diffCharacters, diffSequence, diffText, diffWords } from './diff.js';
export { DIFF_PIXEL_KINDS, DIFFINE_IMAGE_DEFAULTS, diffImage, paintDiffImage } from './image.js';
export { formatPatch, parsePatch } from './patch.js';
