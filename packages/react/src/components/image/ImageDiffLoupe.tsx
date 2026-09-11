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
 * a pane and the question is never about one of them.
 */

import * as React from 'react';
import type { DiffineImageStrings } from '../../types.js';
import { useIsomorphicLayoutEffect } from '../../internal/layout.js';
import { colourAt, hexOf, pixelAt, SPAN, type Sample } from '../../internal/image/loupe.js';

/** How large one magnified pixel is, in the pixels CSS counts in. */
const TILE = 12;

export interface ImageDiffLoupeProps {
  samples: readonly Sample[];
  /** Where the pointer is, in the frame's own coordinates. */
  at: { x: number; y: number };
  /** Which corner it sits in, which is whichever one the pointer is not near. */
  corner: string;
  /** The grid between the tiles, and the box round the middle one. */
  outline: string;
  marker: string;
  halo: string;
  strings: DiffineImageStrings;
}

export function ImageDiffLoupe({
  samples,
  at,
  corner,
  outline,
  marker,
  halo,
  strings
}: ImageDiffLoupeProps): React.JSX.Element {
  return (
    <div className="diffine-image-loupe" data-corner={corner}>
      <div className="diffine-image-loupe-sides">
        {samples.map((sample) => (
          <Side
            key={sample.label}
            sample={sample}
            at={at}
            outline={outline}
            marker={marker}
            halo={halo}
          />
        ))}
      </div>
      <div className="diffine-image-loupe-at">
        {`${strings.at} ${Math.floor(at.x)}, ${Math.floor(at.y)}`}
      </div>
    </div>
  );
}

/** One picture's square, and the colour of the pixel in the middle of it. */
function Side({
  sample,
  at,
  outline,
  marker,
  halo
}: {
  sample: Sample;
  at: { x: number; y: number };
  outline: string;
  marker: string;
  halo: string;
}): React.JSX.Element {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const colour = colourAt(sample, at.x, at.y);
  const size = SPAN * TILE;

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
    const from = { x: middle.x - (SPAN - 1) / 2, y: middle.y - (SPAN - 1) / 2 };
    const left = Math.max(0, from.x);
    const top = Math.max(0, from.y);
    const right = Math.min(sample.picture.width, from.x + SPAN);
    const bottom = Math.min(sample.picture.height, from.y + SPAN);

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

    for (let line = 1; line < SPAN; line += 1) {
      context.moveTo(line * TILE + 0.5, 0);
      context.lineTo(line * TILE + 0.5, size);
      context.moveTo(0, line * TILE + 0.5);
      context.lineTo(size, line * TILE + 0.5);
    }

    context.stroke();
    context.globalAlpha = 1;

    const centre = ((SPAN - 1) / 2) * TILE;

    context.strokeStyle = halo;
    context.lineWidth = 3;
    context.strokeRect(centre - 0.5, centre - 0.5, TILE + 1, TILE + 1);
    context.strokeStyle = marker;
    context.lineWidth = 1.5;
    context.strokeRect(centre - 0.5, centre - 0.5, TILE + 1, TILE + 1);
  }, [sample, at.x, at.y, size, outline, marker, halo]);

  return (
    <figure className="diffine-image-loupe-side">
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
