'use client';

import * as React from 'react';
import type {
  DiffImageOptions,
  DiffImageRegion,
  DiffImageResult,
  DiffImagesResult,
  DiffineColorScheme,
  DiffineImageInput,
  DiffineImageUnchanged,
  DiffineImageView,
  DiffineImageWheel,
  DiffineImageViewport,
  DiffineLocale,
  DiffineMode,
  DiffineSide,
  DiffineImageStrings
} from '../../types.js';
import { useControlled } from '../../internal/controlled.js';
import { fill } from '../../internal/strings/common.js';
import { imageStrings } from '../../internal/strings/image.js';
import { useIsomorphicLayoutEffect } from '../../internal/layout.js';
import { formatNumber } from '../../internal/measure.js';
import type { Layer } from '../../internal/image/paint.js';
import { SPAN, type Sample } from '../../internal/image/loupe.js';
import { imageContentOf, imageSourceOf } from '../../internal/image/source.js';
import {
  keyOf,
  useComparison,
  useManyComparison,
  useManyStencil,
  useMask,
  useMasks,
  usePalette,
  usePicture,
  usePictures,
  useStencil
} from '../../internal/image/useImages.js';
import {
  fitViewport,
  viewportOn,
  zoomAbout,
  ZOOM_STEP,
  type Box
} from '../../internal/image/viewport.js';
import { Frame, Minus, Plus } from '../shared/DiffineIcons.js';
import { DiffineNav } from '../shared/DiffineNav.js';
import { ImageDiffLoupe, type LoupePlace } from './ImageDiffLoupe.js';
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

  /**
   * Several pictures rather than two, compared all at once.
   *
   * Three renderings of one screen from three machines, four exports of one
   * asset, a saved version against the last five runs. Each is drawn in a pane
   * of its own with what it disagrees with the baseline about marked on it, and
   * the pane holding the baseline is marked with everywhere anything disagrees
   * — because the baseline disagrees with nothing, and a pane with nothing on
   * it reads as a pane nobody looked at.
   *
   * Passing it is what turns the list on: `before` and `after` are then
   * ignored, and so is everything that names one of them. At most
   * {@link MOST_PICTURES}, which is what the comparison holds.
   *
   * `overlay` and `wipe` are a question about two pictures and fall back to
   * `split` for more than two. `mask` and `split` both work for any number.
   */
  pictures?: readonly DiffineImageInput[];

  /**
   * Which of them the rest are counted against, as an index into `pictures`.
   *
   * Ignored without `pictures`, where the first picture is always the one the
   * second is compared with.
   *
   * @default 0
   */
  baseline?: number;

  /**
   * A comparison of the list that has already been worked out, drawn as it is.
   *
   * `result` for a list, and ignored without `pictures` exactly as `result` is
   * ignored with it.
   */
  picturesResult?: DiffImagesResult;

  /**
   * The comparison of the list, every time it is worked out again, and `null`
   * while there are not enough pictures to compare.
   *
   * `onDiff` for a list. A comparison of several is a different answer from a
   * comparison of two rather than a longer one, so it arrives through a
   * different callback rather than as a union nobody can narrow.
   */
  onPicturesDiff?: (result: DiffImagesResult | null) => void;

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
   * What is done with the parts of the picture nothing happened to.
   *
   * `keep` draws both pictures as they are, with the changed pixels tinted over
   * them. `dim` draws them faint and draws what changed as it is, so the change
   * is what the eye lands on and the rest of the picture is still there to say
   * where in it the change was. `hide` draws only what changed, on a plain
   * ground — which is the view for reading a change as a picture rather than as
   * a mark on one, and the one to pair with `marks={false}`.
   *
   * It is not part of `view` because it is a different question and holds
   * across all four of those.
   *
   * @default 'keep'
   */
  unchanged?: DiffineImageUnchanged;

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
   * What the wheel does over a pane.
   *
   * `zoom` zooms about the pointer a notch at a time, which is what a picture
   * viewer does, and Shift with it moves the picture instead. `pan` moves a
   * picture larger than its pane and lets the page scroll once the whole frame
   * is in view, with the modifier to zoom — which is what a comparison sitting
   * in the middle of an article wants, because a reader scrolling past it
   * should scroll past it.
   *
   * @default 'zoom'
   */
  wheel?: DiffineImageWheel;

  /**
   * Whether the pixels under the pointer are shown magnified, with the colour
   * of the one in the middle written out.
   *
   * Two panes at four hundred per cent say two pixels are different and stop
   * there, and what a reader asks next is what the two actually are. Both sides
   * are shown whichever pane the pointer is over, because a split view has one
   * picture a pane and the question is never about one of them.
   *
   * It follows a pointer and not a finger, so a reader on a touch screen never
   * sees it.
   *
   * @default true
   */
  loupe?: boolean;

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
  strings?: Partial<DiffineImageStrings>;
}

/** Nothing to draw, so that a pane with no picture in it is still a pane. */
const NO_LAYERS: readonly Layer[] = [];

/** No boxes either, held rather than built so a pane is not painted again for one. */
const NO_REGIONS: readonly DiffImageRegion[] = [];

/** And nothing under the pointer, for a comparison with the loupe turned off. */
const NO_SAMPLES: readonly Sample[] = [];

/**
 * Two pictures, what changed between them, and every way of looking at that.
 *
 * ```tsx
 * import { ImageDiff } from 'diffine-react/image-diff';
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
  pictures,
  baseline = 0,
  picturesResult,
  onPicturesDiff,
  defaultBefore,
  defaultAfter,
  onBeforeChange,
  onAfterChange,
  onDiff,
  result,
  diff,
  view = 'split',
  unchanged = 'keep',
  fade: fadeProp,
  onFadeChange,
  wipe: wipeProp,
  onWipeChange,
  wheel = 'zoom',
  loupe = true,
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
  /*
   * A list or a pair, and everything below is written for a list.
   *
   * The pair keeps its own path through the comparison rather than being a list
   * of two, because `diffImage` answers more about two pictures than
   * `diffImages` does: which of them a pixel arrived in, and how far apart the
   * two are on average. A list has nowhere to put either — whose arrival a
   * pixel is has no answer when there are four of them — so the pair would lose
   * something by being folded in.
   */
  const many = pictures !== undefined;
  const editing = mode === 'editor' && !many;
  const strings = React.useMemo(() => imageStrings(locale, overrides), [locale, overrides]);

  const beforeSource = imageSourceOf(before ?? defaultBefore, strings.before);
  const afterSource = imageSourceOf(after ?? defaultAfter, strings.after);
  const sources = React.useMemo(
    () =>
      (pictures ?? []).map((input, at) =>
        imageSourceOf(input, fill(strings.picture, { number: String(at + 1) }))
      ),
    [pictures, strings]
  );

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

  const beforeLoaded = usePicture(
    many ? undefined : editing ? beforeHeld : beforeSource.content,
    maxPixels
  );
  const afterLoaded = usePicture(
    many ? undefined : editing ? afterHeld : afterSource.content,
    maxPixels
  );
  const contents = React.useMemo(() => sources.map((source) => source.content), [sources]);
  const picturesLoaded = usePictures(contents, maxPixels);

  const pair = useComparison({
    before: many ? null : beforeLoaded.picture,
    after: many ? null : afterLoaded.picture,
    options: diff ?? {},
    given: many ? undefined : result
  });
  const all = useManyComparison({
    pictures: React.useMemo(
      () => (many ? picturesLoaded.map((loaded) => loaded.picture) : []),
      [many, picturesLoaded]
    ),
    options: React.useMemo(() => ({ ...diff, baseline }), [diff, baseline]),
    given: many ? picturesResult : undefined
  });

  /** Every picture, in the order the panes draw them, whichever way they arrived. */
  const loaded = many ? picturesLoaded : [beforeLoaded, afterLoaded];
  const labels = many
    ? sources.map((source) => source.label)
    : [beforeSource.label, afterSource.label];
  const shown = loaded.map((one) => one.picture);
  const sizes = shown.map((one) => (one ? `${one.width}x${one.height}` : '-')).join();
  const named = labels.join();
  /** What says the pictures themselves changed, for the memos that read them. */
  const drawn = keyOf(shown);
  const compared = many ? all !== null : pair !== null;
  /*
   * How the pictures are laid out, which is `view` unless `view` is a question
   * about two of them. Fading one over another and wiping one across another
   * both ask "which two", and a list of more than two has no answer — so they
   * fall back to the panes, which is the view that says what every picture is.
   */
  const laid = shown.length > 2 && (view === 'overlay' || view === 'wipe') ? 'split' : view;
  const split = laid === 'split';
  const regionsOf = (many ? all?.regions : pair?.regions) ?? NO_REGIONS;
  const ratio = (many ? all?.stats.ratio : pair?.stats.ratio) ?? 0;
  const whole = (many ? all?.complete : pair?.complete) ?? true;

  const palette = usePalette(root, colorScheme);
  const pairMask = useMask(pair, palette);
  const manyMasks = useMasks(all, palette);
  /** What each pane draws over its own picture, and what one pane draws over all of them. */
  const masks = many ? manyMasks : [pairMask, pairMask];
  const union = many ? (manyMasks[all?.baseline ?? 0] ?? null) : pairMask;
  const stencil = useStencil(pair, !many && unchanged !== 'keep');
  const manyStencil = useManyStencil(all, many && unchanged !== 'keep');

  /*
   * The comparison, handed on once per comparison. The callback is kept in a
   * ref rather than depended on, so an application that writes the handler
   * inline is told when the pictures changed rather than on every render.
   */
  const latest = React.useRef({ onDiff, onPicturesDiff });

  useIsomorphicLayoutEffect(() => {
    latest.current = { onDiff, onPicturesDiff };
  });

  React.useEffect(() => {
    latest.current.onDiff?.(pair);
  }, [pair]);

  React.useEffect(() => {
    latest.current.onPicturesDiff?.(all);
  }, [all]);

  /**
   * The frame, and where each picture sits in it.
   *
   * The comparison answers this once it has run, offsets and all. Until then —
   * and there is always an until then, because the pictures are drawn before
   * they are compared — every one of them is laid corner to corner in a frame
   * as large as the largest, which is where they would be with no offset
   * anyway.
   */
  const frame = React.useMemo(() => {
    if (many && all) {
      return { width: all.width, height: all.height, areas: all.areas };
    }

    if (!many && pair) {
      return { width: pair.width, height: pair.height, areas: [pair.before, pair.after] };
    }

    const areas = shown.map((picture) => ({
      x: 0,
      y: 0,
      width: picture?.width ?? 0,
      height: picture?.height ?? 0
    }));

    return {
      width: Math.max(0, ...areas.map((area) => area.width)),
      height: Math.max(0, ...areas.map((area) => area.height)),
      areas
    };
    // `shown` is a new array every render out of the same pictures, and the
    // only thing the fallback reads of them is how large they are — so `sizes`
    // is what says it changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [many, all, pair, sizes]);

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

  /*
   * Held rather than worked out on every render. `fitViewport` builds a fresh
   * object each time it is called, and the panes paint whenever the viewport
   * they were handed is a different object — so a comparison left at its
   * default of `fit` repainted both canvases for every render of whatever page
   * it is on.
   */
  const viewport = React.useMemo(
    () => (heldViewport === 'fit' ? fitViewport(frame, box) : heldViewport),
    [heldViewport, frame, box]
  );

  function look(next: DiffineImageViewport | 'fit'): void {
    setViewport(next);
    onViewportChange?.(next === 'fit' ? fitViewport(frame, box) : next);
  }

  const regions = outlines ? regionsOf : NO_REGIONS;
  const changes = regionsOf;
  // A comparison with fewer changes than the last one leaves a reader pointing
  // at a change that is no longer there.
  const current = selected < changes.length ? selected : -1;

  /** One change on from wherever a reader is, and round the ends. */
  function step(direction: 1 | -1): void {
    if (changes.length === 0) {
      return;
    }

    const from = current < 0 ? (direction === 1 ? -1 : 0) : current;
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
  const bothTake = (file: File) => take(shown[0] ? 'after' : 'before', file);

  /**
   * What each pane draws, and in what order.
   *
   * Held rather than rebuilt on every render, because this is what the pane
   * paints from: a new array a render is a canvas painted again for a keystroke
   * somewhere else on the page.
   */
  const layers = React.useMemo(() => {
    const each: (Layer | null)[] = shown.map((picture, at) =>
      picture ? { picture, area: frame.areas[at] } : null
    );
    const alone = each.map((layer) => (layer ? [layer] : NO_LAYERS));

    if (laid === 'mask') {
      return { each: shown.map(() => NO_LAYERS), both: NO_LAYERS };
    }

    /*
     * The fade and the wipe are a question about two pictures — which of these
     * two is underneath, and where does one stop and the other start — so they
     * draw the first two and nothing else. A list of more than two never
     * reaches here: `laid` sends it to the panes instead.
     */
    const together =
      laid === 'overlay'
        ? [each[0], each[1] && { ...each[1], alpha: fade }]
        : laid === 'wipe'
          ? [each[0] && { ...each[0], to: wipe }, each[1] && { ...each[1], from: wipe }]
          : each;

    return { each: alone, both: together.filter((layer) => layer !== null) };
    // As in the frame above: `shown` is a new array every render, and `drawn`
    // is what says the pictures in it changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [laid, fade, wipe, frame, drawn]);

  /**
   * Both sides for the loupe, whichever pane the pointer ends up over.
   *
   * The areas are the frame's, so the same point of the frame reads the same
   * pixel of every picture however far apart they were held.
   */
  const samples = React.useMemo<readonly Sample[]>(() => {
    if (!loupe) {
      return NO_SAMPLES;
    }

    return shown.flatMap((picture, at) =>
      picture ? [{ label: labels[at], picture, area: frame.areas[at] }] : []
    );
    // As above: `drawn` is what says the pictures changed, and `labels` is
    // rebuilt from the same sources every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loupe, drawn, frame, named]);

  /**
   * What the loupe is looking at, which pane reported it, and where the panel
   * has been put.
   *
   * The panel belongs to the comparison rather than to a pane because it shows
   * every picture and sits over all of them — and because a panel that jumped
   * from pane to pane as the pointer crossed between them would be the thing a
   * reader watched.
   */
  const [looking, setLooking] = React.useState<{
    /** Which pane reported it, as a place in the list, or -1 for a pane drawing all of them. */
    side: number;
    at: { x: number; y: number };
  } | null>(null);
  const [span, setSpan] = React.useState(SPAN);
  const [place, setPlace] = React.useState<LoupePlace | null>(null);
  /** Whether one of the panel's handles is being held, in which case it stays. */
  const grabbed = React.useRef(false);

  const watching = (side: number) =>
    loupe && samples.length > 0
      ? (at: { x: number; y: number } | null) => setLooking(at ? { side, at } : null)
      : null;

  const blank = shown.every((picture) => picture === null);
  const loading = loaded.some((one) => one.loading);
  const failed = loaded.some((one) => one.failed) || rejected !== null;
  const bothLabel = labels.join(' → ');

  const shared = {
    frame,
    viewport,
    onViewport: look,
    onBox,
    unchanged,
    stencil: many ? manyStencil : stencil,
    regions,
    current,
    outline: palette?.outline ?? 'transparent',
    marker: palette?.marker ?? 'transparent',
    halo: palette?.halo ?? 'transparent',
    ground: palette?.ground ?? 'transparent',
    chequer: palette?.chequer ?? 'transparent',
    editable: editing,
    wheel,
    strings
  };

  const tools = (navigation && changes.length > 0) || zoom || (editing && !split);
  /*
   * Where the controls go. A title has room for a name and a row of buttons
   * when there are two of them and none when there are five, so past two they
   * get a row of their own rather than squeezing the name out of the last one.
   */
  const stacked = split && labels.length > 2;
  const bar = header || (tools && !stacked);

  return (
    <div
      ref={root}
      className={['diffine diffine-image', className].filter(Boolean).join(' ')}
      data-view={laid}
      data-scheme={colorScheme}
      // How many parts the bars above and below are cut into, because a
      // stylesheet cannot count panes.
      style={{ ...style, '--diffine-panes': split ? shown.length : 1 } as React.CSSProperties}
      {...rest}
    >
      {bar ? (
        <div className="diffine-header">
          {/*
           * One title a pane, so that a name sits over the picture it belongs
           * to and the controls sit at the end of the row. A view that draws
           * every picture in one pane has one title, and the names run along
           * it.
           */}
          {(split ? labels : [bothLabel]).map((label, at) => {
            const last = at === (split ? labels.length : 1) - 1;

            return (
              <div
                key={at}
                className="diffine-title"
                data-side={split ? (at === 0 ? 'before' : last ? 'after' : 'between') : 'both'}
              >
                {header ? <span className="diffine-label">{label}</span> : null}
                {editing && split && !last ? (
                  <div className="diffine-tools">
                    <Chooser
                      label={label}
                      onFile={(file) => take('before', file)}
                      strings={strings}
                    />
                  </div>
                ) : null}
                {last && tools && !stacked ? (
                  <Tools
                    changes={changes}
                    selected={current}
                    onStep={step}
                    onScale={scale}
                    onFit={() => look('fit')}
                    viewport={viewport}
                    navigation={navigation}
                    zoom={zoom}
                    fading={laid === 'overlay'}
                    fade={fade}
                    onFade={(value) => {
                      setFade(value);
                      onFadeChange?.(value);
                    }}
                    chooser={
                      editing ? (
                        <Chooser
                          label={split ? label : bothLabel}
                          onFile={split ? (file) => take('after', file) : bothTake}
                          strings={strings}
                        />
                      ) : null
                    }
                    locale={locale}
                    strings={strings}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {tools && stacked ? (
        <div className="diffine-image-controls">
          <Tools
            changes={changes}
            selected={current}
            onStep={step}
            onScale={scale}
            onFit={() => look('fit')}
            viewport={viewport}
            navigation={navigation}
            zoom={zoom}
            fading={false}
            fade={fade}
            onFade={setFade}
            chooser={null}
            locale={locale}
            strings={strings}
          />
        </div>
      ) : null}

      <div
        className="diffine-body"
        onPointerLeave={() => {
          if (!grabbed.current) {
            setLooking(null);
          }
        }}
      >
        {split ? (
          shown.map((picture, at) => (
            <React.Fragment key={at}>
              {at > 0 ? <div className="diffine-image-gap" aria-hidden="true" /> : null}
              <ImageDiffPane
                {...shared}
                side={at === 0 ? 'before' : at === shown.length - 1 ? 'after' : 'between'}
                name={labels[at]}
                layers={layers.each[at]}
                mask={marks ? (masks[at] ?? null) : null}
                blank={!picture}
                loading={loaded[at].loading}
                failed={loaded[at].failed || rejected === (at === 0 ? 'before' : 'after')}
                onFile={(file) => take(at === 0 ? 'before' : 'after', file)}
                onLook={watching(at)}
              />
            </React.Fragment>
          ))
        ) : (
          <ImageDiffPane
            {...shared}
            side="both"
            name={bothLabel}
            layers={layers.both}
            mask={marks ? union : null}
            blank={blank}
            loading={loading}
            failed={failed}
            onFile={bothTake}
            wipe={laid === 'wipe' ? wipe : undefined}
            onWipe={
              laid === 'wipe'
                ? (value) => {
                    setWipe(value);
                    onWipeChange?.(value);
                  }
                : undefined
            }
            onLook={watching(-1)}
          />
        )}

        {looking && samples.length > 0 && !blank ? (
          <ImageDiffLoupe
            samples={samples}
            at={looking.at}
            span={span}
            onSpan={setSpan}
            place={place}
            onPlace={setPlace}
            // Away from the side being read, so that the panel is never over
            // the part of the picture the question is about. One pane has no
            // other side, so it starts where a panel starts.
            start={looking.side === 0 ? 'right' : 'left'}
            onGrabbed={(held) => {
              grabbed.current = held;
            }}
            outline={palette?.outline ?? 'transparent'}
            marker={palette?.marker ?? 'transparent'}
            halo={palette?.halo ?? 'transparent'}
            strings={strings}
          />
        ) : null}
      </div>

      {summary ? (
        <ImageDiffSummary
          pictures={shown.map((picture, at) =>
            picture
              ? {
                  label: labels[at],
                  width: picture.width,
                  height: picture.height,
                  bytes: picture.bytes
                }
              : null
          )}
          changed={ratio}
          regions={changes.length}
          complete={whole}
          compared={compared}
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
  strings: DiffineImageStrings;
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
  label,
  onFile,
  strings
}: {
  label: string;
  onFile: (file: File) => void;
  strings: DiffineImageStrings;
}): React.JSX.Element {
  const said = fill(strings.chooseIn, { label });

  return (
    <label className="diffine-image-choose" data-compact="true" title={said}>
      <input
        type="file"
        accept="image/*"
        aria-label={said}
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
