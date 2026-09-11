'use client';

/**
 * Getting two pictures onto the page, and the comparison of them off the render.
 *
 * Neither of the two things this does can happen while React is rendering.
 * Decoding a file is asynchronous by nature, and comparing four million pixels
 * is not something to do inside a `useMemo` that a resize could run again — so
 * both are effects that put their answer in state, and the component draws
 * whatever has arrived so far. What a reader sees is the two pictures first and
 * the marks over them a moment later, which is the right order anyway: the
 * pictures are what they came to look at.
 */

import * as React from 'react';
import type {
  DiffImageOptions,
  DiffImageResult,
  DiffImagesOptions,
  DiffImagesResult,
  DiffineImageContent
} from '../../types.js';
import { diffImage, diffImages } from '../../image.js';
import { decodeImage, releasePicture, type Picture } from './decode.js';
import { paintBits, paintMask, paintStencil, stencilBits, type MaskColours } from './paint.js';
import { useIsomorphicLayoutEffect } from '../layout.js';

/** A picture on its way in, or the reason it never arrived. */
export interface Loaded {
  picture: Picture | null;
  loading: boolean;
  /** Whether what was handed over turned out not to be a picture at all. */
  failed: boolean;
}

/** What came back from one decode, and what it was a decode of. */
interface Decoded {
  content: DiffineImageContent;
  picture: Picture | null;
  failed: boolean;
}

/**
 * One side, decoded.
 *
 * Whether it is still arriving is not held anywhere: it is what it means for
 * the last decode to have been of something else. Deriving it that way rather
 * than setting a flag is what keeps a prop that changes twice in a row from
 * showing the first picture again on the way to the second.
 *
 * The cleanup marks the decode abandoned, so that a file which finishes after
 * the props moved on does not overwrite the picture that replaced it — and
 * closes the bitmap, which is memory the garbage collector cannot reach.
 */
export function usePicture(content: DiffineImageContent | undefined, maxPixels: number): Loaded {
  const [decoded, setDecoded] = React.useState<Decoded | null>(null);
  const current = decoded && decoded.content === content ? decoded : null;

  React.useEffect(() => {
    if (!content) {
      return;
    }

    let gone = false;
    let held: Picture | null = null;

    decodeImage(content, maxPixels).then(
      (picture) => {
        if (gone) {
          releasePicture(picture);

          return;
        }

        held = picture;
        setDecoded({ content, picture, failed: false });
      },
      () => {
        if (!gone) {
          setDecoded({ content, picture: null, failed: true });
        }
      }
    );

    return () => {
      gone = true;
      releasePicture(held);

      /*
       * What was just closed cannot be left in state, because a closed bitmap
       * still held is a bitmap something is about to try to draw. It happens
       * whenever this runs without the picture having changed — a different
       * `maxPixels`, or a module reloaded under a running page — and the
       * functional form is what keeps it from clearing an answer that arrived
       * in the meantime.
       */
      if (held) {
        setDecoded((decoded) => (decoded?.picture === held ? null : decoded));
      }
    };
  }, [content, maxPixels]);

  return {
    picture: current?.picture ?? null,
    loading: Boolean(content) && !current,
    failed: current?.failed ?? false
  };
}

/**
 * The comparison of the two, worked out once per pair rather than per render.
 *
 * It is deferred, for the same reason the syntax highlighter is: comparing four
 * million pixels takes long enough to be felt, and the pictures are what a
 * reader came to see. So the pass that puts them on the screen is not the pass
 * that compares them — the panes paint, and the marks arrive in a render React
 * is free to interrupt.
 *
 * Which leaves one render where the answer is about the pair before this one,
 * and the identity check at the end is what refuses it. A mask drawn over the
 * wrong picture, even for a frame, is worse than no mask.
 *
 * `given` is a comparison the application already has, from a worker or from a
 * build, and passing it skips the work. What it cannot skip is the pictures: a
 * result carries what happened to each pixel and none of the pixels themselves.
 */
export function useComparison({
  before,
  after,
  options,
  given
}: {
  before: Picture | null;
  after: Picture | null;
  options: DiffImageOptions;
  given: DiffImageResult | undefined;
}): DiffImageResult | null {
  const { tolerance, ignoreAntialiasing, align, alignRadius, blockSize, maxRegions } = options;
  const settledBefore = React.useDeferredValue(before);
  const settledAfter = React.useDeferredValue(after);

  const worked = React.useMemo(() => {
    if (given || !settledBefore || !settledAfter) {
      return null;
    }

    return {
      before: settledBefore,
      after: settledAfter,
      result: diffImage(settledBefore.pixels, settledAfter.pixels, {
        tolerance,
        ignoreAntialiasing,
        align,
        alignRadius,
        blockSize,
        maxRegions
      })
    };
  }, [
    settledBefore,
    settledAfter,
    given,
    tolerance,
    ignoreAntialiasing,
    align,
    alignRadius,
    blockSize,
    maxRegions
  ]);

  return given ?? (worked?.before === before && worked?.after === after ? worked.result : null);
}

/** The custom properties a canvas has to be told about, because it has no CSS. */
const PROPERTIES = {
  changed: '--diffine-image-changed',
  added: '--diffine-image-added',
  removed: '--diffine-image-removed',
  outline: '--diffine-image-outline',
  marker: '--diffine-image-marker',
  halo: '--diffine-image-halo',
  ground: '--diffine-image-ground',
  chequer: '--diffine-image-chequer'
} as const;

/** What the mask and the boxes round the changes are drawn in. */
export interface Palette extends MaskColours {
  outline: string;
  marker: string;
  halo: string;
  ground: string;
  chequer: string;
}

/**
 * The palette, read off the component itself.
 *
 * This is the one place in Diffine where a custom property is looked up rather
 * than simply used, and a canvas is the reason: it cannot be styled, so the
 * colours have to reach the pixels as numbers. What it buys is that an
 * application recolours a picture comparison exactly as it recolours everything
 * else here — five properties on the element, no props.
 *
 * Which means reading them again whenever they could have changed: a different
 * palette on the component, or the reader's own system turning the lights off
 * under one that follows along.
 */
export function usePalette(
  root: React.RefObject<HTMLElement | null>,
  scheme: string
): Palette | null {
  const [palette, setPalette] = React.useState<Palette | null>(null);
  const [dark, setDark] = React.useState(false);

  React.useEffect(() => {
    if (scheme !== 'system' || typeof matchMedia !== 'function') {
      return;
    }

    const query = matchMedia('(prefers-color-scheme: dark)');
    const listener = () => setDark(query.matches);

    query.addEventListener('change', listener);

    return () => query.removeEventListener('change', listener);
  }, [scheme]);

  useIsomorphicLayoutEffect(() => {
    const element = root.current;

    if (!element) {
      return;
    }

    const styles = getComputedStyle(element);

    setPalette(
      Object.fromEntries(
        Object.entries(PROPERTIES).map(([kind, property]) => [
          kind,
          styles.getPropertyValue(property).trim() || 'transparent'
        ])
      ) as unknown as Palette
    );
    // `dark` and `scheme` are not read here. They are what says the colours
    // above could have changed since the last time they were.
  }, [root, scheme, dark]);

  return palette;
}

/**
 * The mask as something drawable, painted again whenever it or the palette
 * changes.
 */
export function useMask(
  result: DiffImageResult | null,
  palette: Palette | null
): CanvasImageSource | null {
  return React.useMemo(
    () => (result && palette ? paintMask(result, palette) : null),
    [result, palette]
  );
}

/**
 * The mask again as something to cut the pictures down to, for the two ways of
 * reading a comparison that do that.
 *
 * Built only when one of them is asked for, because it is a picture the size of
 * the frame and a comparison drawn the usual way has no use for it.
 */
export function useStencil(
  result: DiffImageResult | null,
  wanted: boolean
): CanvasImageSource | null {
  return React.useMemo(() => (result && wanted ? paintStencil(result) : null), [result, wanted]);
}

/* ---------------------------------------------------------------------------
 * Several pictures
 * ------------------------------------------------------------------------- */

/**
 * A number for each picture that has been handed over, so that a list of them
 * has a key an effect — or a memo — can depend on.
 *
 * A dependency list has to be the same length on every render, and a list of
 * pictures is not — so the list is turned into one string of the numbers below.
 * The map is weak and the number is only ever read, so asking for one during a
 * render changes nothing about what is rendered.
 */
const NUMBERS = new WeakMap<object, number>();

let counted = 0;

export function keyOf(things: readonly (object | null | undefined)[]): string {
  return things
    .map((content) => {
      if (!content) {
        return '-';
      }

      let number = NUMBERS.get(content);

      if (number === undefined) {
        counted += 1;
        number = counted;
        NUMBERS.set(content, number);
      }

      return number;
    })
    .join(',');
}

/** Nothing decoded, held rather than built so an empty list is one value. */
const NOTHING: ReadonlyMap<DiffineImageContent, Decoded> = new Map();

/**
 * A list of pictures, decoded.
 *
 * The same bargain {@link usePicture} makes, made for a list that can change
 * length. Which is why it is a second hook rather than the first one called
 * several times: a component calls the same hooks in the same order on every
 * render, and "one per picture" is not that.
 */
export function usePictures(
  contents: readonly (DiffineImageContent | undefined)[],
  maxPixels: number
): readonly Loaded[] {
  const [decoded, setDecoded] = React.useState<ReadonlyMap<DiffineImageContent, Decoded>>(NOTHING);
  const key = keyOf(contents);

  React.useEffect(() => {
    let gone = false;
    const mine: Picture[] = [];

    for (const content of contents) {
      if (!content) {
        continue;
      }

      decodeImage(content, maxPixels).then(
        (picture) => {
          if (gone) {
            releasePicture(picture);

            return;
          }

          mine.push(picture);
          setDecoded((held) => new Map(held).set(content, { content, picture, failed: false }));
        },
        () => {
          if (!gone) {
            setDecoded((held) =>
              new Map(held).set(content, { content, picture: null, failed: true })
            );
          }
        }
      );
    }

    return () => {
      gone = true;

      for (const picture of mine) {
        releasePicture(picture);
      }

      setDecoded(NOTHING);
    };
    // The list itself is not on the list: `key` is what says it changed, and
    // an array built inline by the caller is a new array every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, maxPixels]);

  return contents.map((content) => {
    const held = content ? decoded.get(content) : undefined;

    return {
      picture: held?.picture ?? null,
      loading: Boolean(content) && !held,
      failed: held?.failed ?? false
    };
  });
}

/**
 * The comparison of a list, worked out once per list rather than per render.
 *
 * The same deferral {@link useComparison} makes, and the same refusal of an
 * answer about the pictures before these ones.
 */
export function useManyComparison({
  pictures,
  options,
  given
}: {
  pictures: readonly (Picture | null)[];
  options: DiffImagesOptions;
  given: DiffImagesResult | undefined;
}): DiffImagesResult | null {
  const { tolerance, ignoreAntialiasing, align, alignRadius, blockSize, maxRegions, baseline } =
    options;
  const settled = React.useDeferredValue(pictures);
  const ready = settled.length >= 2 && settled.every((picture) => picture !== null);
  const key = keyOf(settled);

  const worked = React.useMemo(() => {
    const pixels = settled.flatMap((picture) => (picture ? [picture.pixels] : []));

    if (given || !ready || pixels.length !== settled.length) {
      return null;
    }

    return {
      pictures: settled,
      result: diffImages(pixels, {
        tolerance,
        ignoreAntialiasing,
        align,
        alignRadius,
        blockSize,
        maxRegions,
        baseline
      })
    };
    // `settled` is the list itself and `key` is what says it changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    key,
    ready,
    given,
    tolerance,
    ignoreAntialiasing,
    align,
    alignRadius,
    blockSize,
    maxRegions,
    baseline
  ]);

  return given ?? (worked && sameList(worked.pictures, pictures) ? worked.result : null);
}

/** Whether two lists hold the same pictures, in the same order. */
function sameList(one: readonly (Picture | null)[], other: readonly (Picture | null)[]): boolean {
  return one.length === other.length && one.every((picture, at) => picture === other[at]);
}

/**
 * One drawable per picture: where that picture disagrees with the baseline.
 *
 * The baseline's own is everywhere anything disagrees, because the baseline
 * disagrees with nothing and a pane with nothing marked on it reads as a pane
 * nobody looked at.
 */
export function useMasks(
  result: DiffImagesResult | null,
  palette: Palette | null
): readonly (CanvasImageSource | null)[] {
  return React.useMemo(() => {
    if (!result || !palette) {
      return [];
    }

    return result.areas.map((_, at) =>
      paintBits(result, palette.changed, at === result.baseline ? 0xff : 1 << at)
    );
  }, [result, palette]);
}

/** The same list as one shape to cut the pictures down to, for the modes that do. */
export function useManyStencil(
  result: DiffImagesResult | null,
  wanted: boolean
): CanvasImageSource | null {
  return React.useMemo(() => (result && wanted ? stencilBits(result) : null), [result, wanted]);
}
