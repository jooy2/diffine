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
import type { DiffImageOptions, DiffImageResult, DiffineImageContent } from '../../types.js';
import { diffImage } from '../../image.js';
import { decodeImage, releasePicture, type Picture } from './decode.js';
import { paintMask, type MaskColours } from './paint.js';
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
