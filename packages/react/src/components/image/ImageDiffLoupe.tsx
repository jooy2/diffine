'use client';

/**
 * The pixels under the pointer, at the size a reader can count them.
 *
 * Two panes at four hundred per cent answer "these are different" and stop
 * there. What is asked next is what the two actually are, and no amount of zoom
 * answers it: a pixel on a screen is a colour a reader has to take a guess at.
 * So the loupe says both — a square of each picture magnified far enough that a
 * pixel is a tile, and underneath it the colour of the middle one written out.
 *
 * Both sides, whichever pane the pointer is over. A split view has one picture
 * a pane and the question is never about one of them, which is also why the
 * panel belongs to the comparison rather than to a pane: it sits over both.
 *
 * It stays where it is put. A panel that moves itself out from under the
 * pointer is a panel a reader watches instead of the picture, so it starts on
 * the side away from the pane being read and then only moves when it is
 * dragged.
 */

import * as React from 'react';
import type { DiffineImageStrings } from '../../types.js';
import { useIsomorphicLayoutEffect } from '../../internal/layout.js';
import { colourAt, hexOf, pixelAt, type Sample } from '../../internal/image/loupe.js';
import { Grip, Move } from '../shared/DiffineIcons.js';

/** How large one magnified pixel is, in the pixels CSS counts in. */
const TILE = 12;

/** How few and how many of them fit across one square. */
export const LEAST_SPAN = 3;
export const MOST_SPAN = 41;

/** Where the panel is, in the pixels of the box it is placed in. */
export interface LoupePlace {
  x: number;
  y: number;
}

export interface ImageDiffLoupeProps {
  samples: readonly Sample[];
  /** Where the pointer is, in the frame's own coordinates. */
  at: { x: number; y: number };
  /** How many pixels across one square shows. */
  span: number;
  onSpan: (span: number) => void;
  /** Where a reader has put it, or `null` for wherever it starts. */
  place: LoupePlace | null;
  onPlace: (place: LoupePlace) => void;
  /** Which edge it starts against, for as long as nobody has moved it. */
  start: 'left' | 'right';
  /**
   * A handle was taken hold of, or let go.
   *
   * A drag that ends past the edge of the comparison is a pointer that has left
   * it, and the panel would go away under the hand that was moving it. This is
   * what says to keep it until the hand lets go.
   */
  onGrabbed: (grabbed: boolean) => void;
  /** The grid between the tiles, and the box round the middle one. */
  outline: string;
  marker: string;
  halo: string;
  strings: DiffineImageStrings;
}

/** The size a span comes out as, in the pixels CSS counts in. */
const sizeOf = (span: number) => span * TILE;

/** A span a reader dragged to: odd, so that one pixel is the middle one. */
function spanOf(size: number): number {
  const tiles = Math.round(size / TILE);
  const odd = tiles % 2 === 0 ? tiles + 1 : tiles;

  return Math.min(Math.max(odd, LEAST_SPAN), MOST_SPAN);
}

export function ImageDiffLoupe({
  samples,
  at,
  span,
  onSpan,
  place,
  onPlace,
  start,
  onGrabbed,
  outline,
  marker,
  halo,
  strings
}: ImageDiffLoupeProps): React.JSX.Element {
  const panel = React.useRef<HTMLDivElement>(null);

  /**
   * A drag of the handle or of the corner, in one place.
   *
   * The pointer is captured by whichever control started it, so a reader who
   * drags past the edge of the comparison goes on dragging — and the pane
   * underneath never sees the move, so the picture does not travel with the
   * panel.
   */
  const dragging = React.useRef<{
    kind: 'move' | 'size';
    x: number;
    y: number;
    place: LoupePlace;
    span: number;
  } | null>(null);

  function grab(kind: 'move' | 'size', event: React.PointerEvent<HTMLElement>): void {
    const element = panel.current;
    const within = element?.offsetParent as HTMLElement | null | undefined;

    if (event.button !== 0 || !element) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    onGrabbed(true);

    dragging.current = {
      kind,
      x: event.clientX,
      y: event.clientY,
      // Where it is now, whether that is where it was put or where it began.
      place: place ?? {
        x: start === 'left' ? 0 : Math.max(0, (within?.clientWidth ?? 0) - element.offsetWidth),
        y: 0
      },
      span
    };
  }

  function onDrag(event: React.PointerEvent<HTMLElement>): void {
    const held = dragging.current;
    const element = panel.current;
    const within = element?.offsetParent as HTMLElement | null | undefined;

    if (!held || !element) {
      return;
    }

    event.stopPropagation();

    const moved = { x: event.clientX - held.x, y: event.clientY - held.y };

    if (held.kind === 'move') {
      const room = {
        x: Math.max(0, (within?.clientWidth ?? 0) - element.offsetWidth),
        y: Math.max(0, (within?.clientHeight ?? 0) - element.offsetHeight)
      };

      onPlace({
        x: Math.min(Math.max(held.place.x + moved.x, 0), room.x),
        y: Math.min(Math.max(held.place.y + moved.y, 0), room.y)
      });

      return;
    }

    // The panel is as many squares wide as there are sides, so a pull sideways
    // is shared between them and a pull downwards is not.
    const across = samples.length > 0 ? moved.x / samples.length : moved.x;

    onSpan(spanOf(sizeOf(held.span) + Math.max(across, moved.y)));
  }

  function onLetGo(event: React.PointerEvent<HTMLElement>): void {
    if (dragging.current) {
      event.stopPropagation();
      dragging.current = null;
      onGrabbed(false);
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  /** What both controls do once one of them has been taken hold of. */
  const dragged = { onPointerMove: onDrag, onPointerUp: onLetGo, onPointerCancel: onLetGo };

  return (
    <div
      ref={panel}
      className="diffine-image-loupe"
      data-start={place ? undefined : start}
      style={place ? { left: `${place.x}px`, top: `${place.y}px` } : undefined}
    >
      <div className="diffine-image-loupe-bar">
        <span
          className="diffine-image-loupe-grab"
          role="presentation"
          title={strings.loupeMove}
          onPointerDown={(event) => grab('move', event)}
          {...dragged}
        >
          <Move />
        </span>
        <span className="diffine-image-loupe-at">
          {`${strings.at} ${Math.floor(at.x)}, ${Math.floor(at.y)}`}
        </span>
      </div>

      <div className="diffine-image-loupe-sides">
        {samples.map((sample) => (
          <Side
            key={sample.label}
            sample={sample}
            at={at}
            span={span}
            outline={outline}
            marker={marker}
            halo={halo}
          />
        ))}
      </div>

      <span
        className="diffine-image-loupe-size"
        role="presentation"
        title={strings.loupeSize}
        onPointerDown={(event) => grab('size', event)}
        {...dragged}
      >
        <Grip />
      </span>
    </div>
  );
}

/** One picture's square, and the colour of the pixel in the middle of it. */
function Side({
  sample,
  at,
  span,
  outline,
  marker,
  halo
}: {
  sample: Sample;
  at: { x: number; y: number };
  span: number;
  outline: string;
  marker: string;
  halo: string;
}): React.JSX.Element {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const colour = colourAt(sample, at.x, at.y);
  const size = sizeOf(span);

  useIsomorphicLayoutEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');

    if (!canvas || !context) {
      return;
    }

    const ratio = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1;
    const width = Math.round(size * ratio);

    if (canvas.width !== width || canvas.height !== width) {
      canvas.width = width;
      canvas.height = width;
    }

    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, size, size);

    /*
     * The square of the picture around the pointer, drawn without
     * interpolation — a tile a pixel is the whole point, and a browser asked to
     * make it smooth would give back the blur a reader zoomed in to see past.
     *
     * Clipped by hand rather than by the browser. `drawImage` will take a
     * source rectangle hanging off the edge of a picture and fit what it found
     * to the whole destination, which would slide every tile off the grid at
     * the one place a reader is most likely to be looking.
     */
    const middle = pixelAt(sample, at.x, at.y);
    const from = { x: middle.x - (span - 1) / 2, y: middle.y - (span - 1) / 2 };
    const left = Math.max(0, from.x);
    const top = Math.max(0, from.y);
    const right = Math.min(sample.picture.width, from.x + span);
    const bottom = Math.min(sample.picture.height, from.y + span);

    if (right > left && bottom > top) {
      context.imageSmoothingEnabled = false;
      context.drawImage(
        sample.picture.drawable,
        left,
        top,
        right - left,
        bottom - top,
        (left - from.x) * TILE,
        (top - from.y) * TILE,
        (right - left) * TILE,
        (bottom - top) * TILE
      );
    }

    // The grid, which is what turns a magnified picture into pixels somebody
    // can count, and then the box round the one the pointer is on.
    context.strokeStyle = outline;
    context.globalAlpha = 0.35;
    context.lineWidth = 1;
    context.beginPath();

    for (let line = 1; line < span; line += 1) {
      context.moveTo(line * TILE + 0.5, 0);
      context.lineTo(line * TILE + 0.5, size);
      context.moveTo(0, line * TILE + 0.5);
      context.lineTo(size, line * TILE + 0.5);
    }

    context.stroke();
    context.globalAlpha = 1;

    const centre = ((span - 1) / 2) * TILE;

    context.strokeStyle = halo;
    context.lineWidth = 3;
    context.strokeRect(centre - 0.5, centre - 0.5, TILE + 1, TILE + 1);
    context.strokeStyle = marker;
    context.lineWidth = 1.5;
    context.strokeRect(centre - 0.5, centre - 0.5, TILE + 1, TILE + 1);
  }, [sample, at.x, at.y, span, size, outline, marker, halo]);

  return (
    <figure className="diffine-image-loupe-side" style={{ width: `${size}px` }}>
      <canvas
        ref={canvasRef}
        className="diffine-image-loupe-canvas"
        style={{ width: `${size}px`, height: `${size}px` }}
        aria-hidden="true"
      />
      <figcaption>
        <span className="diffine-image-loupe-label">{sample.label}</span>
        <span className="diffine-image-loupe-colour">
          {colour ? (
            <>
              <span
                className="diffine-image-loupe-chip"
                style={{
                  background: `rgb(${colour[0]} ${colour[1]} ${colour[2]} / ${colour[3] / 255})`
                }}
                aria-hidden="true"
              />
              {hexOf(colour)}
            </>
          ) : (
            '—'
          )}
        </span>
      </figcaption>
    </figure>
  );
}
