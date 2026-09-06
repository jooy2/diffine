/**
 * How much text a document holds, and how to write that down.
 *
 * Two numbers, both of which a reader of a comparison asks for: how long the
 * document is, and how heavy it is. They are worked out in one pass over the
 * string and without allocating anything, because the editor asks for them
 * again on every keystroke and a document is not always small.
 */

/** How much text there is, counted two ways. */
export interface DocumentSize {
  /**
   * Characters, counted the way a reader counts them.
   *
   * Code points rather than the units a string is stored in, so an emoji or a
   * character outside the basic plane is one character and not two.
   */
  characters: number;
  /** What it weighs as UTF-8, which is what a file of it would. */
  bytes: number;
}

/** The size of a document, in one pass and without a copy of it. */
export function measureText(text: string): DocumentSize {
  let characters = 0;
  let bytes = 0;

  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);

    characters += 1;

    if (code < 0x80) {
      bytes += 1;
    } else if (code < 0x800) {
      bytes += 2;
    } else if (
      code >= 0xd800 &&
      code <= 0xdbff &&
      (text.charCodeAt(index + 1) & 0xfc00) === 0xdc00
    ) {
      // A surrogate pair: one character between the two units, and four bytes
      // for it. `charCodeAt` past the end is `NaN`, which fails the mask, so a
      // lone high surrogate falls through to the three-byte case below.
      bytes += 4;
      index += 1;
    } else {
      bytes += 3;
    }
  }

  return { characters, bytes };
}

/**
 * The formatters, kept rather than built again.
 *
 * `Intl.NumberFormat` is expensive to construct and free to reuse, and these
 * are asked for on every keystroke. There are two of them per language.
 */
const FORMATTERS = new Map<string, Intl.NumberFormat>();

function formatterFor(locale: string, fraction: number): Intl.NumberFormat {
  const key = `${locale}:${fraction}`;
  const held = FORMATTERS.get(key);

  if (held) {
    return held;
  }

  const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: fraction });

  FORMATTERS.set(key, formatter);

  return formatter;
}

/** A count, grouped the way the reader's language groups one. */
export function formatCount(count: number, locale: string): string {
  return formatterFor(locale, 0).format(count);
}

const UNITS = ['B', 'KB', 'MB', 'GB'] as const;

/**
 * A weight in bytes, in the largest unit that leaves a number worth reading.
 *
 * Binary units, because this is the size of something held in memory rather
 * than the size of something a disk was sold by. Whole bytes below a kilobyte
 * and one decimal above it, which is as much precision as a status bar can
 * spend.
 */
export function formatBytes(bytes: number, locale: string): string {
  let value = bytes;
  let unit = 0;

  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }

  return `${formatterFor(locale, unit === 0 ? 0 : 1).format(value)} ${UNITS[unit]}`;
}
