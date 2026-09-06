import type { DiffineImageContent, DiffineImageInput, DiffineImageSource } from '../../types.js';

/**
 * A picture and what to call it, out of either shape a component takes.
 *
 * The bare picture is what most applications pass — a `File` off an input, a
 * `Blob` off a fetch. The object form names it as well, and a name it does not
 * carry falls back to the word for that side in whatever language the component
 * is speaking.
 */
export function imageSourceOf(
  input: DiffineImageInput | undefined,
  label: string
): { content: DiffineImageContent | undefined; label: string } {
  const named = isNamed(input);

  return {
    content: named ? input.content : input,
    label: (named ? input.label : undefined) ?? label
  };
}

/** The picture out of either shape, or `undefined` when there was none. */
export function imageContentOf(
  input: DiffineImageInput | undefined
): DiffineImageContent | undefined {
  return isNamed(input) ? input.content : input;
}

/**
 * Whether this is the shape with a name on it.
 *
 * `content` is the only key that tells the two apart, and nothing a picture can
 * arrive as has one: a `Blob` has `size` and `type`, an `ImageBitmap` has
 * `width` and `height`, and a buffer of pixels has `data`.
 */
function isNamed(input: DiffineImageInput | undefined): input is DiffineImageSource {
  return typeof input === 'object' && input !== null && 'content' in input;
}
