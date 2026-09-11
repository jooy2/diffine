/**
 * Putting a comparison on a canvas.
 *
 * Two jobs, and they run at different times. The mask is turned into something
 * drawable once, when the comparison changes or the palette does — it is a
 * picture the size of the frame, and building it is not something to do while a
 * reader is dragging. The pane is painted on every frame of that drag, and does
 * as little as a paint can: set a transform, draw two or three images through
 * it, stroke a few rectangles.
 *
 * Everything is drawn through the same transform rather than cut out and scaled
 * by hand. A browser clips and samples an image far better than arithmetic here
 * would, and it does it on the graphics card — which is the difference between
 * a picture that follows the pointer and one that catches up with it.
 */

import type {
  DiffImageArea,
  DiffImageRegion,
  DiffImageResult,
  DiffineImageUnchanged,
  DiffineImageViewport
} from '../../types.js';
import { ADDED, CHANGED, REMOVED } from './compare.js';
import type { Picture } from './decode.js';
import { bytesOfColour, surfaceOf, type Surface } from './surface.js';
import { paneAt, type Box } from './viewport.js';

/** Which way round the four bytes of a pixel are in a 32-bit word. */
const LITTLE_ENDIAN = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;

/** One colour, packed the way the mask's own memory is laid out. */
function packed(colour: string): number {
  const [red, green, blue, alpha] = bytesOfColour(colour);

  return LITTLE_ENDIAN
    ? ((alpha << 24) | (blue << 16) | (green << 8) | red) >>> 0
    : ((red << 24) | (green << 16) | (blue << 8) | alpha) >>> 0;
}

/** What each kind of changed pixel is painted in, as CSS colours. */
export interface MaskColours {
  changed: string;
  added: string;
  removed: string;
}

/** How large one square of the transparency chequer is, in pane pixels. */
const CHEQUER = 8;

/** How much of a picture is left where the rest of it is drawn faint. */
const FAINT = 0.2;

/**
 * Somewhere the size of the pane to build one frame's composite on.
 *
 * Cutting a picture down to what changed is two draws and a composite
 * operation, and a composite operation applies to everything already on the
 * canvas — so it cannot happen on the canvas the picture is already on. It
 * happens here instead and arrives as one `drawImage`.
 *
 * Kept between paints and resized when the pane is, because a pane being
 * dragged asks for sixty of these a second and none of them outlives the paint
 * that made it.
 */
let scratch: Surface | null = null;

function scratchOf(width: number, height: number): Surface {
  if (!scratch || scratch.canvas.width !== width || scratch.canvas.height !== height) {
    scratch = surfaceOf(width, height);
  } else {
    scratch.setTransform(1, 0, 0, 1, 0, 0);
    scratch.globalCompositeOperation = 'source-over';
    scratch.globalAlpha = 1;
    scratch.clearRect(0, 0, width, height);
  }

  return scratch;
}

/** The chequers, built once a palette rather than once a frame. */
const CHEQUERS = new Map<string, CanvasPattern | null>();

/**
 * The squares that say a picture is see-through, as a pattern to fill with.
 *
 * A pattern rather than a loop of rectangles: a pane four hundred squares
 * across would be four hundred draw calls a frame, and a reader dragging a
 * picture asks for sixty frames a second. It is kept between paints because the
 * only thing it depends on is two colours.
 */
function chequerOf(
  context: CanvasRenderingContext2D,
  ground: string,
  square: string
): CanvasPattern | null {
  const key = `${ground}|${square}`;
  const held = CHEQUERS.get(key);

  if (held !== undefined) {
    return held;
  }

  const tile = surfaceOf(CHEQUER * 2, CHEQUER * 2);

  tile.fillStyle = ground;
  tile.fillRect(0, 0, CHEQUER * 2, CHEQUER * 2);
  tile.fillStyle = square;
  tile.fillRect(0, 0, CHEQUER, CHEQUER);
  tile.fillRect(CHEQUER, CHEQUER, CHEQUER, CHEQUER);

  const pattern = context.createPattern(tile.canvas, 'repeat');

  CHEQUERS.set(key, pattern);

  return pattern;
}

/**
 * The mask as a picture the size of the frame, ready to be drawn over either
 * side.
 *
 * Written a word at a time rather than a byte at a time. The mask is one byte a
 * pixel and the surface is four, so the loop is a lookup and a store per pixel
 * — which is what keeps a frame of ten million pixels somewhere around a
 * hundredth of what comparing it cost.
 */
export function paintMask(result: DiffImageResult, colours: MaskColours): CanvasImageSource | null {
  const { width, height, mask } = result;

  if (width <= 0 || height <= 0) {
    return null;
  }

  const painted = new Uint8ClampedArray(width * height * 4);
  const words = new Uint32Array(painted.buffer);
  const paints = new Uint32Array(4);

  paints[CHANGED] = packed(colours.changed);
  paints[ADDED] = packed(colours.added);
  paints[REMOVED] = packed(colours.removed);

  for (let pixel = 0; pixel < words.length; pixel += 1) {
    const kind = mask[pixel];

    if (kind !== 0) {
      words[pixel] = paints[kind];
    }
  }

  const surface = surfaceOf(width, height);

  surface.putImageData(new ImageData(painted, width, height), 0, 0);

  return surface.canvas;
}

/**
 * The mask again, opaque wherever anything happened and see-through everywhere
 * else.
 *
 * What the tint above is for is saying which pixels changed. What this is for
 * is cutting the pictures down to them: drawn into a pane with
 * `destination-in`, it leaves the parts of the picture that moved and takes
 * away the parts that did not. That is the whole of {@link PaintOptions.unchanged} —
 * the changed pixels of the picture itself, at full strength, over whatever the
 * rest of the frame has been reduced to.
 *
 * A picture of its own rather than the tint drawn twice, because the tint
 * carries the palette's transparency in its pixels, and a stencil that is 55%
 * opaque cuts out a picture that is 55% there.
 */
export function paintStencil(result: DiffImageResult): CanvasImageSource | null {
  const { width, height, mask } = result;

  if (width <= 0 || height <= 0) {
    return null;
  }

  const painted = new Uint8ClampedArray(width * height * 4);
  const words = new Uint32Array(painted.buffer);
  const solid = 0xffffffff;

  for (let pixel = 0; pixel < words.length; pixel += 1) {
    if (mask[pixel] !== 0) {
      words[pixel] = solid;
    }
  }

  const surface = surfaceOf(width, height);

  surface.putImageData(new ImageData(painted, width, height), 0, 0);

  return surface.canvas;
}

/** One picture drawn into a pane, and how much of the pane it is drawn in. */
export interface Layer {
  picture: Picture;
  /** Where it sits in the frame. */
  area: DiffImageArea;
  /** How much of it is let through, from 0 to 1. */
  alpha?: number;
  /** The slice of the pane it is drawn in, across from 0 to 1. */
  from?: number;
  to?: number;
}

export interface PaintOptions {
  context: CanvasRenderingContext2D;
  /** The pane, in the pixels CSS counts in. */
  pane: Box;
  /** How many device pixels there are to one of those. */
  ratio: number;
  frame: Box;
  viewport: DiffineImageViewport;
  layers: readonly Layer[];
  mask: CanvasImageSource | null;
  /** What is done with the pixels nothing happened to. */
  unchanged: DiffineImageUnchanged;
  /** The mask as something to cut the pictures down to, for the two modes that do. */
  stencil: CanvasImageSource | null;
  regions: readonly DiffImageRegion[];
  /** Which region a reader has stepped to, or -1. */
  current: number;
  /** What a region is outlined in, and what the one being looked at is outlined in. */
  outline: string;
  marker: string;
  /** What is drawn under both of those, so that a line shows on any picture. */
  halo: string;
  /** The two colours the transparency chequer is made of. */
  ground: string;
  chequer: string;
}

/** Puts the frame's coordinates under the drawing commands that follow. */
function look(context: Surface, viewport: DiffineImageViewport, pane: Box): void {
  context.translate(pane.width / 2, pane.height / 2);
  context.scale(viewport.scale, viewport.scale);
  context.translate(-viewport.x, -viewport.y);
}

/**
 * The pictures, drawn through the viewport into whichever surface is asked for.
 *
 * `faint` is how much of each one is let through, on top of whatever the layer
 * itself asked for. It is what a picture whose unchanged half is being pushed
 * back is drawn at, and 1 everywhere else.
 */
function drawLayers({
  target,
  layers,
  pane,
  viewport,
  smooth,
  faint
}: {
  target: Surface;
  layers: readonly Layer[];
  pane: Box;
  viewport: DiffineImageViewport;
  smooth: boolean;
  faint: number;
}): void {
  for (const layer of layers) {
    if (
      layer.alpha === 0 ||
      (layer.from !== undefined && layer.to !== undefined && layer.from >= layer.to)
    ) {
      continue;
    }

    target.save();

    if (layer.from !== undefined || layer.to !== undefined) {
      const from = (layer.from ?? 0) * pane.width;

      target.beginPath();
      target.rect(from, 0, (layer.to ?? 1) * pane.width - from, pane.height);
      target.clip();
    }

    target.globalAlpha = (layer.alpha ?? 1) * faint;
    look(target, viewport, pane);
    target.imageSmoothingEnabled = smooth;
    target.drawImage(
      layer.picture.drawable,
      layer.area.x,
      layer.area.y,
      layer.area.width,
      layer.area.height
    );
    target.restore();
  }
}

/** One frame of the pane: the pictures, what changed, and where. */
export function paintPane({
  context,
  pane,
  ratio,
  frame,
  viewport,
  layers,
  mask,
  unchanged,
  stencil,
  regions,
  current,
  outline,
  marker,
  halo,
  ground,
  chequer
}: PaintOptions): void {
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, pane.width, pane.height);

  /*
   * The frame, before anything is drawn in it.
   *
   * In the pane's own pixels rather than the frame's, so that the squares stay
   * the size of squares however far a reader has zoomed in — what they are
   * saying is "there is nothing here", and nothing does not have a resolution.
   *
   * The squares are the chequer's answer to "what is behind this picture", and
   * they are the wrong answer once the picture has been pushed back on purpose.
   * Then the ground is plain, and what it says is "this part did not change".
   */
  const topLeft = paneAt(viewport, pane, 0, 0);
  const bottomRight = paneAt(viewport, pane, frame.width, frame.height);
  const plain = unchanged !== 'keep';
  const pattern = plain ? null : chequerOf(context, ground, chequer);

  if (bottomRight.x > topLeft.x && bottomRight.y > topLeft.y && (pattern || plain)) {
    context.fillStyle = pattern ?? ground;
    context.fillRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
  }

  // Crisp above its own size and smooth below it. A reader who has zoomed in to
  // four hundred per cent is counting pixels, and interpolation is exactly what
  // they zoomed in to see past.
  const smooth = viewport.scale < 1;
  const faint = unchanged === 'dim' ? FAINT : unchanged === 'hide' ? 0 : 1;

  if (faint > 0) {
    drawLayers({ target: context, layers, pane, viewport, smooth, faint });
  }

  /*
   * The pixels that changed, at full strength, over whatever the rest of the
   * frame was reduced to.
   *
   * Drawn away from the pane and composited back, because cutting a picture
   * down to a shape is a composite operation and one of those applies to
   * everything already on a canvas — the ground included.
   */
  if (plain && stencil && layers.length > 0) {
    const width = Math.max(1, Math.round(pane.width * ratio));
    const height = Math.max(1, Math.round(pane.height * ratio));
    const cut = scratchOf(width, height);

    cut.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawLayers({ target: cut, layers, pane, viewport, smooth, faint: 1 });

    cut.save();
    cut.globalCompositeOperation = 'destination-in';
    look(cut, viewport, pane);
    cut.imageSmoothingEnabled = smooth;
    cut.drawImage(stencil, 0, 0, frame.width, frame.height);
    cut.restore();

    context.drawImage(cut.canvas, 0, 0, pane.width, pane.height);
  }

  if (mask) {
    context.save();
    look(context, viewport, pane);
    context.imageSmoothingEnabled = smooth;
    context.drawImage(mask, 0, 0, frame.width, frame.height);
    context.restore();
  }

  if (regions.length === 0) {
    return;
  }

  /*
   * The outlines, in the pane's own pixels rather than the frame's, so that a
   * box round a change is a line one pixel wide however far in a reader has
   * gone — and not a line sixteen pixels wide with a picture behind it.
   *
   * Each one is drawn twice: a wider line in the colour that contrasts with the
   * palette, and the line itself on top of it. A single line cannot be seen on
   * every picture, because a picture is whatever colour it is — a dark box on
   * the dark half of a photograph is a box nobody finds, and it was exactly
   * where the changes tend to be. A pair always shows, whichever of the two the
   * picture underneath happens to match.
   */
  context.save();
  context.lineJoin = 'miter';

  for (const [index, region] of regions.entries()) {
    const topLeft = paneAt(viewport, pane, region.x, region.y);
    const bottomRight = paneAt(viewport, pane, region.x + region.width, region.y + region.height);

    if (
      bottomRight.x < 0 ||
      bottomRight.y < 0 ||
      topLeft.x > pane.width ||
      topLeft.y > pane.height
    ) {
      continue;
    }

    const chosen = index === current;
    const left = Math.round(topLeft.x) - 0.5;
    const top = Math.round(topLeft.y) - 0.5;
    const width = Math.max(Math.round(bottomRight.x - topLeft.x) + 1, 2);
    const height = Math.max(Math.round(bottomRight.y - topLeft.y) + 1, 2);

    context.lineWidth = chosen ? 4 : 3;
    context.strokeStyle = halo;
    context.strokeRect(left, top, width, height);

    context.lineWidth = chosen ? 2 : 1;
    context.strokeStyle = chosen ? marker : outline;
    context.strokeRect(left, top, width, height);
  }

  context.restore();
}
