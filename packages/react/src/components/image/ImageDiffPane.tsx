'use client';

/**
 * One pane of a picture comparison: a canvas, and every way a reader has of
 * moving around inside it.
 *
 * The pane owns nothing about the comparison. It is handed a frame, a viewport
 * and a list of things to draw, and it hands back what a reader did — which is
 * what makes a split view work without a line of code to keep two panes in
 * step. Both are given the same viewport, so there is no second position to
 * synchronise.
 *
 * What it does own is the canvas: how large it has to be for the screen it is
 * on, when it has to be painted again, and the pointer, wheel and keyboard that
 * change where it is looking.
 */

import * as React from 'react';
import type { DiffImageRegion, DiffineImageViewport, DiffineImageStrings } from '../../types.js';
import { useIsomorphicLayoutEffect } from '../../internal/layout.js';
import { paintPane, type Layer } from '../../internal/image/paint.js';
import { fitScale, panBy, zoomAbout, ZOOM_STEP, type Box } from '../../internal/image/viewport.js';

/** How far an arrow key moves the picture, in the pane's own pixels. */
const NUDGE = 48;

export interface ImageDiffPaneProps {
  /** Which side this is, or `both` for a view that draws the two together. */
  side: 'before' | 'after' | 'both';
  /** What it is called, which is what a screen reader is told it is. */
  name: string;
  frame: Box;
  viewport: DiffineImageViewport;
  onViewport: (viewport: DiffineImageViewport) => void;
  /** The pane measured itself, which is what a fitted view is worked out from. */
  onBox: (box: Box) => void;
  layers: readonly Layer[];
  mask: CanvasImageSource | null;
  regions: readonly DiffImageRegion[];
  current: number;
  /** What a box round a change is drawn in, and what the one being looked at is. */
  outline: string;
  marker: string;
  /** The two colours of the squares behind a picture that is see-through. */
  ground: string;
  chequer: string;
  /** Whether a picture can be dropped on it, and what to do with one. */
  editable: boolean;
  onFile?: (file: File) => void;
  /** Whether there is anything to draw at all. */
  blank: boolean;
  /** Nothing to draw yet, and why. */
  loading: boolean;
  failed: boolean;
  /** Where the line between the two pictures is, for the view that draws one. */
  wipe?: number;
  onWipe?: (wipe: number) => void;
  strings: DiffineImageStrings;
  paneRef: React.RefObject<HTMLDivElement | null>;
}

export function ImageDiffPane({
  side,
  name,
  frame,
  viewport,
  onViewport,
  onBox,
  layers,
  mask,
  regions,
  current,
  outline,
  marker,
  ground,
  chequer,
  editable,
  onFile,
  blank,
  loading,
  failed,
  wipe,
  onWipe,
  strings,
  paneRef
}: ImageDiffPaneProps): React.JSX.Element {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const dragging = React.useRef<{ x: number; y: number } | null>(null);
  const [box, setBox] = React.useState<Box>({ width: 0, height: 0 });
  const [over, setOver] = React.useState(false);

  /*
   * What the listeners below read, kept in a ref rather than in their
   * dependencies. A wheel listener has to be added by hand to be able to
   * refuse the page a scroll, and one that was torn down and put back on every
   * render would be a listener missing during the render that moved it.
   */
  const latest = React.useRef({ viewport, frame, box, onViewport });

  useIsomorphicLayoutEffect(() => {
    latest.current = { viewport, frame, box, onViewport };
  });

  /** The pane's size, in the pixels CSS counts in. */
  useIsomorphicLayoutEffect(() => {
    const element = paneRef.current;

    if (!element || typeof ResizeObserver === 'undefined') {
      return;
    }

    const measure = () => {
      const measured = { width: element.clientWidth, height: element.clientHeight };

      setBox((held) =>
        held.width === measured.width && held.height === measured.height ? held : measured
      );
      onBox(measured);
    };

    measure();

    const observer = new ResizeObserver(measure);

    observer.observe(element);

    return () => observer.disconnect();
    // `onBox` is the component's own function and is not on the list on
    // purpose: it is written inline up there, and depending on it would rebuild
    // the observer on every render.
  }, [paneRef]);

  /** The frame itself, painted whenever anything about it has changed. */
  useIsomorphicLayoutEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');

    if (!canvas || !context || box.width === 0 || box.height === 0) {
      return;
    }

    const ratio = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1;
    const width = Math.max(1, Math.round(box.width * ratio));
    const height = Math.max(1, Math.round(box.height * ratio));

    // Setting either of these clears the canvas, so they are only written when
    // they are actually different.
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    paintPane({
      context,
      pane: box,
      ratio,
      frame,
      viewport,
      layers,
      mask,
      regions,
      current,
      outline,
      marker,
      ground,
      chequer
    });
  }, [box, frame, viewport, layers, mask, regions, current, outline, marker, ground, chequer]);

  /**
   * The wheel, which does one of three things.
   *
   * Held with the modifier, it zooms about the pointer. On a picture larger
   * than the pane it moves it. On a picture that is already all in view it does
   * nothing at all — the page it is on scrolls instead, which is what a reader
   * scrolling past a comparison meant.
   */
  React.useEffect(() => {
    const element = paneRef.current;

    if (!element) {
      return;
    }

    const onWheel = (event: WheelEvent) => {
      const held = latest.current;
      const zooming = event.ctrlKey || event.metaKey;

      if (!zooming && held.viewport.scale <= fitScale(held.frame, held.box)) {
        return;
      }

      event.preventDefault();

      const bounds = element.getBoundingClientRect();

      if (zooming) {
        held.onViewport(
          zoomAbout({
            viewport: held.viewport,
            frame: held.frame,
            pane: held.box,
            // A wheel notch is not a step of a button, and it is not the same
            // size on two devices. Reading it as an exponent is what keeps a
            // trackpad's hundred small deltas smooth and a mouse's three large
            // ones from crossing the whole range.
            scale: held.viewport.scale * Math.exp(-event.deltaY / 320),
            paneX: event.clientX - bounds.left,
            paneY: event.clientY - bounds.top
          })
        );

        return;
      }

      held.onViewport(panBy(held.viewport, held.frame, -event.deltaX, -event.deltaY));
    };

    element.addEventListener('wheel', onWheel, { passive: false });

    return () => element.removeEventListener('wheel', onWheel);
  }, [paneRef]);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>): void {
    if (event.button !== 0 || blank) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    dragging.current = { x: event.clientX, y: event.clientY };
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>): void {
    const from = dragging.current;

    if (!from) {
      return;
    }

    onViewport(panBy(viewport, frame, event.clientX - from.x, event.clientY - from.y));
    dragging.current = { x: event.clientX, y: event.clientY };
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>): void {
    dragging.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  /** The keyboard, for a reader who is not holding a pointer. */
  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
    const step = event.shiftKey ? NUDGE * 4 : NUDGE;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [step, 0],
      ArrowRight: [-step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step]
    };
    const move = moves[event.key];

    if (move) {
      event.preventDefault();
      onViewport(panBy(viewport, frame, move[0], move[1]));

      return;
    }

    const zooming =
      event.key === '+' || event.key === '=' ? ZOOM_STEP : event.key === '-' ? 1 / ZOOM_STEP : 0;

    if (zooming) {
      event.preventDefault();
      onViewport(
        zoomAbout({
          viewport,
          frame,
          pane: box,
          scale: viewport.scale * zooming,
          paneX: box.width / 2,
          paneY: box.height / 2
        })
      );
    }
  }

  function take(file: File | undefined): void {
    if (file && onFile) {
      onFile(file);
    }
  }

  const dropping = editable
    ? {
        onDragOver: (event: React.DragEvent) => {
          event.preventDefault();
          setOver(true);
        },
        onDragLeave: () => setOver(false),
        onDrop: (event: React.DragEvent) => {
          event.preventDefault();
          setOver(false);
          take(event.dataTransfer.files[0]);
        }
      }
    : {};

  return (
    <div
      ref={paneRef}
      className="diffine-image-pane"
      data-side={side}
      data-blank={blank}
      data-over={over || undefined}
      role="img"
      aria-label={name}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      {...dropping}
    >
      <canvas ref={canvasRef} className="diffine-image-canvas" aria-hidden="true" />

      {wipe !== undefined && onWipe ? (
        <WipeHandle wipe={wipe} onWipe={onWipe} label={strings.wipe} />
      ) : null}

      {blank ? (
        <div className="diffine-image-blank">
          {loading ? (
            <span className="diffine-image-note">{strings.loading}</span>
          ) : (
            <>
              {failed ? <span className="diffine-image-note">{strings.unsupported}</span> : null}
              {editable ? (
                <label className="diffine-image-choose">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => take(event.target.files?.[0])}
                  />
                  <span>{strings.choose}</span>
                </label>
              ) : (
                !failed && <span className="diffine-image-note">{strings.empty}</span>
              )}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

/**
 * The line between the two pictures, and the grip that moves it.
 *
 * A slider in every sense a screen reader cares about, and a bar with a handle
 * on it to everybody else. The arrow keys move it a hundredth of the way across
 * and Home and End take it to either end, which is what the same reader would
 * get from a range input — and a range input is not a thing that can be laid
 * over a picture without being drawn as one.
 */
function WipeHandle({
  wipe,
  onWipe,
  label
}: {
  wipe: number;
  onWipe: (wipe: number) => void;
  label: string;
}): React.JSX.Element {
  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.parentElement?.getBoundingClientRect();

    if (bounds && bounds.width > 0) {
      onWipe(Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width)));
    }
  };

  return (
    <div
      className="diffine-image-wipe"
      style={{ left: `${wipe * 100}%` }}
      role="slider"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(wipe * 100)}
      tabIndex={0}
      onPointerDown={(event) => {
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.stopPropagation();
          move(event);
        }
      }}
      onKeyDown={(event) => {
        const steps: Record<string, number> = {
          ArrowLeft: wipe - 0.01,
          ArrowRight: wipe + 0.01,
          Home: 0,
          End: 1
        };
        const next = steps[event.key];

        if (next !== undefined) {
          event.preventDefault();
          onWipe(Math.min(1, Math.max(0, next)));
        }
      }}
    >
      <span className="diffine-image-grip" aria-hidden="true" />
    </div>
  );
}
