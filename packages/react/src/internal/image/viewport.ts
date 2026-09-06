/**
 * Where a reader is looking, and the arithmetic that moves them.
 *
 * A viewport is three numbers — how far in, and the point of the frame the
 * middle of the pane is on — and everything a reader can do to a picture is one
 * of these functions applied to those three. Keeping it that small is what lets
 * two panes share one: a split view is not two pictures being scrolled in step,
 * it is two panes drawing the same viewport, so there is nothing to keep in
 * step in the first place.
 *
 * A centre rather than a corner, because a centre is what stays still. Zooming
 * about the top-left corner sends whatever a reader was looking at off the
 * edge; zooming about a point keeps that point under the pointer, and both fall
 * out of the same two lines below.
 */

import type { DiffineImageViewport } from '../../types.js';

/** How large the frame is, and how large the box drawing it is. */
export interface Box {
  width: number;
  height: number;
}

/** How much one press of a zoom button changes the scale. */
export const ZOOM_STEP = 1.6;

/** As far out and as far in as a reader can go. */
export const MIN_SCALE = 0.02;
export const MAX_SCALE = 64;

const clamp = (value: number, least: number, most: number) =>
  Math.min(Math.max(value, least), most);

/** The scale at which the whole frame is in the pane, with a little room round it. */
export function fitScale(frame: Box, pane: Box): number {
  if (frame.width <= 0 || frame.height <= 0 || pane.width <= 0 || pane.height <= 0) {
    return 1;
  }

  return clamp(
    Math.min(pane.width / frame.width, pane.height / frame.height),
    MIN_SCALE,
    MAX_SCALE
  );
}

/** The whole frame, in the middle of the pane. */
export function fitViewport(frame: Box, pane: Box): DiffineImageViewport {
  return { scale: fitScale(frame, pane), x: frame.width / 2, y: frame.height / 2 };
}

/**
 * A viewport nobody can lose the picture out of.
 *
 * The centre is held inside the frame rather than the frame inside the pane. A
 * picture smaller than the pane it is in would otherwise be dragged to the
 * middle and pinned there, which is not what a reader comparing the corner of
 * two screenshots wants.
 */
export function clampViewport(viewport: DiffineImageViewport, frame: Box): DiffineImageViewport {
  return {
    scale: clamp(viewport.scale, MIN_SCALE, MAX_SCALE),
    x: clamp(viewport.x, 0, frame.width),
    y: clamp(viewport.y, 0, frame.height)
  };
}

/** Where a point of the pane, measured from its top-left corner, is in the frame. */
export function frameAt(
  viewport: DiffineImageViewport,
  pane: Box,
  paneX: number,
  paneY: number
): { x: number; y: number } {
  return {
    x: viewport.x + (paneX - pane.width / 2) / viewport.scale,
    y: viewport.y + (paneY - pane.height / 2) / viewport.scale
  };
}

/** Where a point of the frame is in the pane. */
export function paneAt(
  viewport: DiffineImageViewport,
  pane: Box,
  frameX: number,
  frameY: number
): { x: number; y: number } {
  return {
    x: pane.width / 2 + (frameX - viewport.x) * viewport.scale,
    y: pane.height / 2 + (frameY - viewport.y) * viewport.scale
  };
}

/**
 * The same view at a different scale, with one point of the pane left where it
 * was.
 *
 * That point is the pointer for a wheel, and the middle of the pane for a
 * button. Both are the same move: work out what the point is looking at, change
 * the scale, and shift the centre so it is looking at it still.
 */
export function zoomAbout({
  viewport,
  frame,
  pane,
  scale,
  paneX,
  paneY
}: {
  viewport: DiffineImageViewport;
  frame: Box;
  pane: Box;
  scale: number;
  paneX: number;
  paneY: number;
}): DiffineImageViewport {
  const held = frameAt(viewport, pane, paneX, paneY);
  const next = clamp(scale, MIN_SCALE, MAX_SCALE);

  return clampViewport(
    {
      scale: next,
      x: held.x - (paneX - pane.width / 2) / next,
      y: held.y - (paneY - pane.height / 2) / next
    },
    frame
  );
}

/** The same view, moved by a number of the pane's own pixels. */
export function panBy(
  viewport: DiffineImageViewport,
  frame: Box,
  paneX: number,
  paneY: number
): DiffineImageViewport {
  return clampViewport(
    {
      scale: viewport.scale,
      x: viewport.x - paneX / viewport.scale,
      y: viewport.y - paneY / viewport.scale
    },
    frame
  );
}

/**
 * The view moved onto a rectangle, and pulled in far enough to see it.
 *
 * Only far enough, and never further out than the reader already was: stepping
 * to the next change should move the picture, not undo the zoom somebody set to
 * look at the last one. A change that is already comfortably in view therefore
 * only takes the centre with it.
 */
export function viewportOn({
  viewport,
  frame,
  pane,
  area
}: {
  viewport: DiffineImageViewport;
  frame: Box;
  pane: Box;
  area: { x: number; y: number; width: number; height: number };
}): DiffineImageViewport {
  const around = Math.max(area.width, 1) * 2;
  const enough = fitScale({ width: around, height: Math.max(area.height, 1) * 2 }, pane);

  return clampViewport(
    {
      scale: Math.min(viewport.scale, enough),
      x: area.x + area.width / 2,
      y: area.y + area.height / 2
    },
    frame
  );
}
