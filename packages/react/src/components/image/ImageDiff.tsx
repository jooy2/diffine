'use client';

import * as React from 'react';
import type {
  DiffImageOptions,
  DiffImageRegion,
  DiffImageResult,
  DiffineColorScheme,
  DiffineImageInput,
  DiffineImageView,
  DiffineImageViewport,
  DiffineLocale,
  DiffineMode,
  DiffineSide,
  DiffineStrings
} from '../../types.js';
import { useControlled } from '../../internal/controlled.js';
import { fill, stringsFor } from '../../internal/i18n.js';
import { useIsomorphicLayoutEffect } from '../../internal/layout.js';
import { formatNumber } from '../../internal/measure.js';
import type { Layer } from '../../internal/image/paint.js';
import { imageContentOf, imageSourceOf } from '../../internal/image/source.js';
import { useComparison, useMask, usePalette, usePicture } from '../../internal/image/useImages.js';
import {
  fitViewport,
  viewportOn,
  zoomAbout,
  ZOOM_STEP,
  type Box
} from '../../internal/image/viewport.js';
import { Frame, Minus, Plus } from '../shared/DiffineIcons.js';
import { DiffineNav } from '../shared/DiffineNav.js';
import { ImageDiffPane } from './ImageDiffPane.js';
import { ImageDiffSummary } from './ImageDiffSummary.js';

export interface ImageDiffProps extends Omit<
  React.ComponentPropsWithoutRef<'div'>,
  'children' | 'title' | 'onChange' | 'defaultValue'
> {
  /**
   * Whether the two pictures are only looked at, or chosen as well.
   *
   * `viewer` draws what the application passed. `editor` draws the same thing
   * with a way of putting a picture into either side: an empty pane invites one,
   * a full one takes a picture dropped on it, and each side has a button for
   * the reader who is not dragging anything.
   *
   * @default 'viewer'
   */
  mode?: DiffineMode;

  /**
   * The picture on the left, as a `Blob`, an `ImageBitmap`, a buffer of pixels,
   * or any of those with a name on it.
   *
   * There is no URL among them on purpose — see {@link DiffineImageContent}.
   * An application that has a URL fetches it and passes what comes back, which
   * is one line, and the difference is that the line is the application's.
   */
  before?: DiffineImageInput;
  /** The picture on the right. */
  after?: DiffineImageInput;

  /** What the left side starts with, when the component is to keep it. Editor only. */
  defaultBefore?: DiffineImageInput;
  /** What the right side starts with. Editor only. */
  defaultAfter?: DiffineImageInput;

  /** A picture was chosen for the left side. */
  onBeforeChange?: (value: File) => void;
  /** A picture was chosen for the right side. */
  onAfterChange?: (value: File) => void;

  /**
   * The comparison, every time it is worked out again, and `null` while there
   * are not two pictures to compare.
   */
  onDiff?: (result: DiffImageResult | null) => void;

  /**
   * A comparison that has already been worked out, drawn as it is.
   *
   * Which is worth more here than it is for text: comparing two photographs is
   * a few million pieces of arithmetic, and this is how that happens in a
   * worker, on a server, or once for a page that draws the same pair twice.
   *
   * The pictures are still needed. A result says what happened to each pixel
   * and holds none of them, so both sides go on being decoded to be drawn.
   */
  result?: DiffImageResult;

  /**
   * How the two are compared. Anything left out keeps its default, so
   * `{ align: 'shift' }` is a whole answer.
   */
  diff?: DiffImageOptions;

  /**
   * How the two are laid out: side by side, one faded over the other, one wiped
   * across the other, or neither of them and only what changed.
   *
   * @default 'split'
   */
  view?: DiffineImageView;

  /**
   * How much of the second picture is let through in the `overlay` view, from 0
   * to 1. The slider in the bar above moves it.
   *
   * @default 0.5
   */
  fade?: number;
  /** The overlay was faded. */
  onFadeChange?: (fade: number) => void;

  /**
   * Where the line between the two pictures is in the `wipe` view, from 0 for
   * the left edge to 1 for the right.
   *
   * @default 0.5
   */
  wipe?: number;
  /** The line was moved. */
  onWipeChange?: (wipe: number) => void;

  /**
   * How many pixels a picture is decoded at, at most.
   *
   * A photograph out of a modern camera is twenty-four million pixels, and two
   * of them held as bitmaps and as buffers is most of a gigabyte before
   * anything has been compared. Past this a picture is decoded smaller, which
   * costs a little sharpness at a high zoom and is the difference between a
   * page that answers and a page that stops.
   *
   * @default 4000000
   */
  maxPixels?: number;

  /**
   * Whether the pixels that changed are tinted.
   * @default true
   */
  marks?: boolean;

  /**
   * Whether a box is drawn round each change.
   *
   * The tint says which pixels; the boxes say where to look, and they are what
   * stays visible when a comparison is zoomed out far enough that a changed
   * word is three pixels wide.
   *
   * @default true
   */
  outlines?: boolean;

  /**
   * Whether each side is named above it.
   * @default true
   */
  header?: boolean;

  /**
   * Whether the buttons for moving between the changes are drawn.
   * @default true
   */
  navigation?: boolean;

  /**
   * Whether the zoom controls are drawn.
   * @default true
   */
  zoom?: boolean;

  /**
   * Whether the bar under the panes is drawn: how large each picture is, and
   * how much of it moved.
   * @default true
   */
  summary?: boolean;

  /**
   * Where a reader is looking, or `fit` for the whole frame in the pane.
   *
   * Passing it makes it the application's in the usual React pair: the pane
   * reports where a drag, a wheel or a button would have taken it and does not
   * move on its own.
   */
  viewport?: DiffineImageViewport | 'fit';
  /** Where to start looking, when the component is to keep it. @default 'fit' */
  defaultViewport?: DiffineImageViewport | 'fit';
  /** A reader moved or zoomed, or a button did. */
  onViewportChange?: (viewport: DiffineImageViewport) => void;

  /** Which change a reader has stepped to, as an index into `regions`, or -1. */
  selected?: number;
  /** Which change to start on, when the component is to keep it. @default -1 */
  defaultSelected?: number;
  /** A change was stepped to, by the buttons or by the application. */
  onSelectedChange?: (selected: number, region: DiffImageRegion | null) => void;

  /**
   * Which palette to draw in. `system` follows the reader's own setting.
   * @default 'system'
   */
  colorScheme?: DiffineColorScheme;

  /**
   * The language of the component's own words.
   * @default 'en'
   */
  locale?: DiffineLocale;

  /** Words to use instead of the locale's, for any of them. */
  strings?: Partial<DiffineStrings>;
}

/** Nothing to draw, so that a pane with no picture in it is still a pane. */
const NO_LAYERS: readonly Layer[] = [];

/**
 * Two pictures, what changed between them, and every way of looking at that.
 *
 * ```tsx
 * import { ImageDiff } from 'diffine-react';
 * import 'diffine-react/styles.css';
 *
 * <ImageDiff before={saved} after={rendered} diff={{ align: 'shift' }} />;
 * <ImageDiff mode="editor" view="wipe" />;
 * ```
 *
 * The comparison is `diffImage` and nothing else: the same mask, the same
 * regions, the same counts an application would get from calling it itself.
 * What the component adds is everything that turns those into something a
 * person can read — the changed pixels tinted over the pictures, a box round
 * each change, buttons that step from one to the next, and one zoom shared by
 * both panes so that two pictures are never looking at different parts of
 * themselves.
 *
 * Four views rather than one, because no single one of them answers the
 * question. Side by side says what each picture is; fading between them says
 * whether something moved; wiping one across the other lines an edge up against
 * its own edge; and the mask on its own says where to point the other three.
 */
export function ImageDiff({
  mode = 'viewer',
  before,
  after,
  defaultBefore,
  defaultAfter,
  onBeforeChange,
  onAfterChange,
  onDiff,
  result,
  diff,
  view = 'split',
  fade: fadeProp,
  onFadeChange,
  wipe: wipeProp,
  onWipeChange,
  maxPixels = 4_000_000,
  marks = true,
  outlines = true,
  header = true,
  navigation = true,
  zoom = true,
  summary = true,
  viewport: viewportProp,
  defaultViewport = 'fit',
  onViewportChange,
  selected: selectedProp,
  defaultSelected = -1,
  onSelectedChange,
  colorScheme = 'system',
  locale = 'en',
  strings: overrides,
  className,
  style,
  ...rest
}: ImageDiffProps): React.JSX.Element {
  const editing = mode === 'editor';
  const split = view === 'split';
  const strings = React.useMemo(() => stringsFor(locale, overrides), [locale, overrides]);

  const beforeSource = imageSourceOf(before ?? defaultBefore, strings.before);
  const afterSource = imageSourceOf(after ?? defaultAfter, strings.after);

  const [beforeHeld, setBeforeHeld] = useControlled(
    imageContentOf(before),
    imageContentOf(defaultBefore)
  );
  const [afterHeld, setAfterHeld] = useControlled(
    imageContentOf(after),
    imageContentOf(defaultAfter)
  );
  const [rejected, setRejected] = React.useState<DiffineSide | null>(null);

  const root = React.useRef<HTMLDivElement>(null);
  const firstPane = React.useRef<HTMLDivElement>(null);
  const secondPane = React.useRef<HTMLDivElement>(null);

  const beforeLoaded = usePicture(editing ? beforeHeld : beforeSource.content, maxPixels);
  const afterLoaded = usePicture(editing ? afterHeld : afterSource.content, maxPixels);
  const beforePicture = beforeLoaded.picture;
  const afterPicture = afterLoaded.picture;

  const comparison = useComparison({
    before: beforePicture,
    after: afterPicture,
    options: diff ?? {},
    given: result
  });

  const palette = usePalette(root, colorScheme);
  const mask = useMask(comparison, palette);

  /*
   * The comparison, handed on once per comparison. The callback is kept in a
   * ref rather than depended on, so an application that writes the handler
   * inline is told when the pictures changed rather than on every render.
   */
  const latest = React.useRef(onDiff);

  useIsomorphicLayoutEffect(() => {
    latest.current = onDiff;
  });

  React.useEffect(() => {
    latest.current?.(comparison);
  }, [comparison]);

  /**
   * The frame, and where each picture sits in it.
   *
   * The comparison answers this once it has run, offset and all. Until then —
   * and there is always an until then, because the pictures are drawn before
   * they are compared — both are laid corner to corner in a frame as large as
   * the larger of them, which is where they would be with no offset anyway.
   */
  const frame = React.useMemo(() => {
    if (comparison) {
      return {
        width: comparison.width,
        height: comparison.height,
        before: comparison.before,
        after: comparison.after
      };
    }

    const first = {
      x: 0,
      y: 0,
      width: beforePicture?.width ?? 0,
      height: beforePicture?.height ?? 0
    };
    const second = {
      x: 0,
      y: 0,
      width: afterPicture?.width ?? 0,
      height: afterPicture?.height ?? 0
    };

    return {
      width: Math.max(first.width, second.width),
      height: Math.max(first.height, second.height),
      before: first,
      after: second
    };
  }, [comparison, beforePicture, afterPicture]);

  const [box, setBox] = React.useState<Box>({ width: 0, height: 0 });
  const onBox = React.useCallback((measured: Box) => {
    setBox((held) =>
      held.width === measured.width && held.height === measured.height ? held : measured
    );
  }, []);

  const [heldViewport, setViewport] = useControlled<DiffineImageViewport | 'fit'>(
    viewportProp,
    defaultViewport
  );
  const [fade, setFade] = useControlled(fadeProp, 0.5);
  const [wipe, setWipe] = useControlled(wipeProp, 0.5);
  const [selected, setSelected] = useControlled(selectedProp, defaultSelected);

  const viewport = heldViewport === 'fit' ? fitViewport(frame, box) : heldViewport;

  function look(next: DiffineImageViewport | 'fit'): void {
    setViewport(next);
    onViewportChange?.(next === 'fit' ? fitViewport(frame, box) : next);
  }

  const regions = outlines && comparison ? comparison.regions : [];
  const changes = comparison?.regions ?? [];

  /** One change on from wherever a reader is, and round the ends. */
  function step(direction: 1 | -1): void {
    if (changes.length === 0) {
      return;
    }

    const from = selected < 0 ? (direction === 1 ? -1 : 0) : selected;
    const next = (from + direction + changes.length) % changes.length;

    setSelected(next);
    onSelectedChange?.(next, changes[next]);
    look(viewportOn({ viewport, frame, pane: box, area: changes[next] }));
  }

  function scale(by: number): void {
    look(
      zoomAbout({
        viewport,
        frame,
        pane: box,
        scale: viewport.scale * by,
        paneX: box.width / 2,
        paneY: box.height / 2
      })
    );
  }

  /** A picture arrived, from a button or from something dropped on a pane. */
  function take(side: DiffineSide, file: File): void {
    if (!file.type.startsWith('image/')) {
      setRejected(side);

      return;
    }

    setRejected((held) => (held === side ? null : held));

    if (side === 'before') {
      setBeforeHeld(file);
      onBeforeChange?.(file);

      return;
    }

    setAfterHeld(file);
    onAfterChange?.(file);
  }

  /** Which side a picture dropped on a pane drawing both of them belongs to. */
  const bothTake = (file: File) => take(beforePicture ? 'after' : 'before', file);

  /**
   * What each pane draws, and in what order.
   *
   * Held rather than rebuilt on every render, because this is what the pane
   * paints from: a new array a render is a canvas painted again for a keystroke
   * somewhere else on the page.
   */
  const layers = React.useMemo(() => {
    const first: Layer | null = beforePicture
      ? { picture: beforePicture, area: frame.before }
      : null;
    const second: Layer | null = afterPicture ? { picture: afterPicture, area: frame.after } : null;
    const both = (one: Layer | null, other: Layer | null) =>
      [one, other].filter((layer) => layer !== null);

    if (view === 'mask') {
      return { before: NO_LAYERS, after: NO_LAYERS, both: NO_LAYERS };
    }

    const together =
      view === 'overlay'
        ? both(first, second && { ...second, alpha: fade })
        : view === 'wipe'
          ? both(first && { ...first, to: wipe }, second && { ...second, from: wipe })
          : both(first, second);

    return {
      before: first ? [first] : NO_LAYERS,
      after: second ? [second] : NO_LAYERS,
      both: together
    };
  }, [view, fade, wipe, beforePicture, afterPicture, frame]);

  const blank = !beforePicture && !afterPicture;
  const loading = beforeLoaded.loading || afterLoaded.loading;
  const failed = beforeLoaded.failed || afterLoaded.failed || rejected !== null;
  const bothLabel = `${beforeSource.label} → ${afterSource.label}`;

  const shared = {
    frame,
    viewport,
    onViewport: look,
    onBox,
    mask: marks ? mask : null,
    regions,
    current: selected,
    outline: palette?.outline ?? 'transparent',
    marker: palette?.marker ?? 'transparent',
    editable: editing,
    strings
  };

  const tools = (navigation && changes.length > 0) || zoom || (editing && !split);
  const bar = header || tools;

  return (
    <div
      ref={root}
      className={['diffine diffine-image', className].filter(Boolean).join(' ')}
      data-view={view}
      data-scheme={colorScheme}
      style={style}
      {...rest}
    >
      {bar ? (
        <div className="diffine-header">
          <div className="diffine-title" data-side={split ? 'before' : 'both'}>
            {header ? (
              <span className="diffine-label">{split ? beforeSource.label : bothLabel}</span>
            ) : null}
            {editing && split ? (
              <div className="diffine-tools">
                <Chooser onFile={(file) => take('before', file)} strings={strings} />
              </div>
            ) : null}
            {!split && tools ? (
              <Tools
                changes={changes}
                selected={selected}
                onStep={step}
                onScale={scale}
                onFit={() => look('fit')}
                viewport={viewport}
                navigation={navigation}
                zoom={zoom}
                fading={view === 'overlay'}
                fade={fade}
                onFade={(value) => {
                  setFade(value);
                  onFadeChange?.(value);
                }}
                chooser={editing ? <Chooser onFile={bothTake} strings={strings} /> : null}
                locale={locale}
                strings={strings}
              />
            ) : null}
          </div>
          {split ? (
            <div className="diffine-title" data-side="after">
              {header ? <span className="diffine-label">{afterSource.label}</span> : null}
              {tools ? (
                <Tools
                  changes={changes}
                  selected={selected}
                  onStep={step}
                  onScale={scale}
                  onFit={() => look('fit')}
                  viewport={viewport}
                  navigation={navigation}
                  zoom={zoom}
                  fading={false}
                  fade={fade}
                  onFade={setFade}
                  chooser={
                    editing ? (
                      <Chooser onFile={(file) => take('after', file)} strings={strings} />
                    ) : null
                  }
                  locale={locale}
                  strings={strings}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="diffine-body">
        {split ? (
          <>
            <ImageDiffPane
              {...shared}
              side="before"
              name={beforeSource.label}
              layers={layers.before}
              blank={!beforePicture}
              loading={beforeLoaded.loading}
              failed={beforeLoaded.failed || rejected === 'before'}
              onFile={(file) => take('before', file)}
              paneRef={firstPane}
            />
            <div className="diffine-image-gap" aria-hidden="true" />
            <ImageDiffPane
              {...shared}
              side="after"
              name={afterSource.label}
              layers={layers.after}
              blank={!afterPicture}
              loading={afterLoaded.loading}
              failed={afterLoaded.failed || rejected === 'after'}
              onFile={(file) => take('after', file)}
              paneRef={secondPane}
            />
          </>
        ) : (
          <ImageDiffPane
            {...shared}
            side="both"
            name={bothLabel}
            layers={layers.both}
            blank={blank}
            loading={loading}
            failed={failed}
            onFile={bothTake}
            wipe={view === 'wipe' ? wipe : undefined}
            onWipe={
              view === 'wipe'
                ? (value) => {
                    setWipe(value);
                    onWipeChange?.(value);
                  }
                : undefined
            }
            paneRef={firstPane}
          />
        )}
      </div>

      {summary ? (
        <ImageDiffSummary
          before={
            beforePicture
              ? {
                  label: beforeSource.label,
                  width: beforePicture.width,
                  height: beforePicture.height,
                  bytes: beforePicture.bytes
                }
              : null
          }
          after={
            afterPicture
              ? {
                  label: afterSource.label,
                  width: afterPicture.width,
                  height: afterPicture.height,
                  bytes: afterPicture.bytes
                }
              : null
          }
          result={comparison}
          split={split}
          locale={locale}
          strings={strings}
        />
      ) : null}
    </div>
  );
}

/** Everything at the right end of the bar, in the order it is read. */
function Tools({
  changes,
  selected,
  onStep,
  onScale,
  onFit,
  viewport,
  navigation,
  zoom,
  fading,
  fade,
  onFade,
  chooser,
  locale,
  strings
}: {
  changes: readonly DiffImageRegion[];
  selected: number;
  onStep: (direction: 1 | -1) => void;
  onScale: (by: number) => void;
  onFit: () => void;
  viewport: DiffineImageViewport;
  navigation: boolean;
  zoom: boolean;
  fading: boolean;
  fade: number;
  onFade: (fade: number) => void;
  chooser: React.ReactNode;
  locale: DiffineLocale;
  strings: DiffineStrings;
}): React.JSX.Element {
  return (
    <div className="diffine-tools">
      {chooser}
      {fading ? (
        <input
          type="range"
          className="diffine-image-fade"
          min={0}
          max={100}
          value={Math.round(fade * 100)}
          title={strings.fade}
          aria-label={strings.fade}
          onChange={(event) => onFade(Number(event.target.value) / 100)}
        />
      ) : null}
      {navigation && changes.length > 0 ? (
        <DiffineNav total={changes.length} current={selected} onStep={onStep} strings={strings} />
      ) : null}
      {zoom ? (
        <div className="diffine-zoom">
          <button
            type="button"
            className="diffine-nav-button"
            title={strings.zoomOut}
            aria-label={strings.zoomOut}
            onClick={() => onScale(1 / ZOOM_STEP)}
          >
            <Minus />
          </button>
          <span className="diffine-nav-position" aria-hidden="true">
            {fill(strings.zoomLevel, { percent: formatNumber(viewport.scale * 100, locale, 0) })}
          </span>
          <button
            type="button"
            className="diffine-nav-button"
            title={strings.zoomIn}
            aria-label={strings.zoomIn}
            onClick={() => onScale(ZOOM_STEP)}
          >
            <Plus />
          </button>
          <button
            type="button"
            className="diffine-nav-button"
            title={strings.zoomFit}
            aria-label={strings.zoomFit}
            onClick={onFit}
          >
            <Frame />
          </button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * The button for choosing a picture, for the reader who is not dragging one.
 *
 * A label around a file input rather than a button beside a hidden one. The
 * input is what a keyboard and a screen reader find, the label is what a
 * pointer hits, and neither of them needs a line of JavaScript to open the
 * browser's own dialog.
 */
function Chooser({
  onFile,
  strings
}: {
  onFile: (file: File) => void;
  strings: DiffineStrings;
}): React.JSX.Element {
  return (
    <label className="diffine-image-choose" data-compact="true" title={strings.choose}>
      <input
        type="file"
        accept="image/*"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            onFile(file);
          }
        }}
      />
      <span>{strings.choose}</span>
    </label>
  );
}
