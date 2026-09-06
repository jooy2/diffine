import type { DiffineInput, DiffineSource } from '../types.js';

/**
 * A document and what to call it, out of either shape a component takes.
 *
 * A bare string is the document, which is what most applications pass. The
 * object form names it as well, and a name it does not carry falls back to the
 * word for that side in whatever language the component is speaking.
 */
export function sourceOf(input: DiffineInput | undefined, label: string): Required<DiffineSource> {
  if (typeof input === 'string') {
    return { content: input, label };
  }

  return { content: input?.content ?? '', label: input?.label ?? label };
}

/** The document out of either shape, or `undefined` when there was none. */
export function contentOf(input: DiffineInput | undefined): string | undefined {
  return typeof input === 'string' ? input : input?.content;
}
