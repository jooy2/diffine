---
title: Image diff
order: 3
---

# Image diff

`ImageDiff` compares two pictures pixel by pixel and draws what it found. The pixels that changed are tinted over both sides, each run of them gets a box, and one zoom and one position move both panes together.

<DiffinePictures sample="retouched" height="24rem" />

The two pictures above are the same photograph, one of them with a patch of itself cloned over the window.

::: fw react

Nothing on this page is a screenshot: every demo is the component, comparing files this page fetched and edited in your browser.

:::

::: fw flutter

The previews on this page are the React package's, because they are drawn beside the prose. The [playground](./playground) is the Flutter widget on the same four pairs of pictures, with the options below it as switches.

:::

## The two modes

`mode` decides whether the pictures are only looked at or chosen as well.

::: fw react

```tsx
import { ImageDiff } from 'diffine-react/image-diff';
import 'diffine-react/styles.css';

<ImageDiff before={saved} after={rendered} />;
<ImageDiff mode="editor" />;
```

`viewer` is the default and draws what it was given. `editor` adds every way of putting a picture in: an empty pane opens a file picker when it is clicked, a full pane takes one dropped on it, and each side has a button in the bar for a reader who is not dragging anything. A view that draws both pictures in one pane sends what is dropped on it to whichever side is empty, and to the second one when neither is. Drop a PNG on either half below.

:::

::: fw flutter

```dart
import 'package:diffine/diffine.dart';

ImageDiff(before: saved, after: rendered);
ImageDiff(mode: DiffineMode.editor, onChoose: chooseAPicture);
```

`DiffineMode.viewer` is the default and draws what it was given. `DiffineMode.editor` puts a button on an empty pane — and what that button does is `onChoose`. Opening a file needs a picker, a picker is a plugin, and which plugin is the application's choice:

```dart
ImageDiff(
  mode: DiffineMode.editor,
  onChoose: (DiffineSide side) async {
    final XFile? file = await openFile();

    return file == null ? null : DiffineEncodedImage(await file.readAsBytes());
  },
);
```

:::

<DiffinePictures sample="badge" height="22rem" />

## Passing the two pictures

::: fw react

`before` and `after` take a `Blob`, an `ImageBitmap`, or a buffer of pixels shaped like `ImageData`, each of them on its own or with a name on it:

```tsx
<ImageDiff
  before={{ content: saved, label: 'baseline.png' }}
  after={{ content: rendered, label: 'run 4821' }}
/>
```

A `Blob` is the usual answer, because it is what a file input hands over and what a `fetch` can be asked for:

```tsx
<input type="file" accept="image/*" onChange={(event) => setAfter(event.target.files[0])} />
```

There is no URL on that list, and it is missing on purpose. A picture fetched by the component would be decoded from bytes the application never saw. Fetching it is one line, and that line is worth being the application's:

```tsx
const response = await fetch('/baseline.png');

setBefore(await response.blob());
```

In `editor` mode the component works as either a controlled or an uncontrolled one. Pass `defaultBefore` and `defaultAfter` and it keeps the pictures; pass `before` and `after` and they are the application's, with `onBeforeChange` and `onAfterChange` reporting what a reader chose. Which of the two it is, is settled on the first render, because a picture that arrived later would replace one somebody was in the middle of comparing.

:::

::: fw flutter

`before` and `after` take the bytes of a file, a picture already decoded, or a buffer of pixels — one of the three shapes of `DiffineImageContent` — and the name for the header is its own argument:

```dart
ImageDiff(
  before: DiffineEncodedImage(saved),
  beforeLabel: 'baseline.png',
  after: DiffineEncodedImage(rendered),
  afterLabel: 'run 4821',
);
```

`DiffineEncodedImage` is the usual answer, because bytes are what a file picker, an asset and a response all hand over:

```dart
final ByteData bytes = await rootBundle.load('assets/baseline.png');

setState(() => before = DiffineEncodedImage(bytes.buffer.asUint8List()));
```

The other two are `DiffineDecodedImage` for a `ui.Image` an application already holds, and `DiffinePixelImage` for a buffer from anywhere at all.

There is no URL on that list, and it is missing on purpose. A picture fetched by the widget would be decoded from bytes the application never saw. Fetching it is one line, and that line is worth being the application's.

:::

## Four ways of looking at them

`view` decides how the two are laid out. There are four because no single one of them answers every question.

`split` puts one either side. It is what says what each picture is, and it is the default.

`overlay` draws them on top of each other with a slider in the bar that fades between them. Two versions of a layout where something moved a few pixels are hard to compare side by side and easy to compare here.

<DiffinePictures sample="retouched" view="overlay" height="22rem" />

`wipe` draws the line between them and lets you take it across the picture. It is the one for lining an edge up against its own edge.

<DiffinePictures sample="retouched" view="wipe" height="22rem" />

`mask` drops both pictures and leaves what changed, over the squares that say there is nothing there. It is the view that says where to point the other three.

<DiffinePictures sample="badge" view="mask" height="20rem" />

## What is marked, and in what

`marks` tints the pixels that changed. `outlines` draws a box round each run of them, which is what stays visible when a comparison is zoomed out far enough that a changed word is three pixels wide. Both are on by default and both are plain booleans.

Pink is a pixel that changed. Green and red are the pixels only one of the two pictures covers, which is what a difference in size, or an offset, leaves behind. They are the same green and red a line that arrived or went away is drawn in.

::: fw react

None of it is a prop. The five colours are custom properties on the element:

```css
.diffine-image {
  --diffine-image-changed: rgb(232 62 140 / 0.55);
  --diffine-image-added: rgb(26 127 75 / 0.5);
  --diffine-image-removed: rgb(194 51 63 / 0.5);
  --diffine-image-outline: rgb(20 28 40 / 0.4);
  --diffine-image-marker: rgb(14 127 252 / 0.95);
}
```

They carry their own transparency because all five sit on top of the picture they are describing. A canvas cannot be styled, so these are read off the element and painted into the pixels. It is the one place in Diffine where a custom property is looked up rather than simply used, and it is why a mask is repainted when the palette under it changes.

:::

::: fw flutter

None of it is an argument. The colours are on the theme, under `image`:

```dart
ImageDiff(
  before: DiffineEncodedImage(saved),
  after: DiffineEncodedImage(rendered),
  theme: DiffineTheme.light.copyWith(
    image: const DiffineImageColours(
      changed: Color(0x8ce83e8c),
      added: Color(0x801a7f4b),
      removed: Color(0x80c2333f),
      outline: Color(0x66141c28),
      marker: Color(0xf20e7ffc),
      ground: Color(0xffeaeef4),
      chequer: Color(0xffdbe1ea),
    ),
  ),
);
```

They carry their own transparency because all of them sit on top of the picture they are describing. The mask is painted into pixels rather than styled, which is why it is painted again when the palette under it changes.

:::

## Moving around

Both panes share one viewport, so there is nothing to keep in step: a drag, a wheel or a button moves the pair.

- Drag to move, anywhere in a pane.
- Ctrl or Cmd with the wheel to zoom about the pointer. Plain wheel moves a picture larger than its pane, and scrolls the page when the whole frame is already in view.
- The buttons in the bar zoom about the middle, and the last of them fits the frame back into the pane.
- With the keyboard: the arrows move, `+` and `−` zoom, and Shift makes the arrows move further.

Above its own size the picture is drawn crisp rather than smooth. At four hundred per cent the individual pixels are the thing being looked at, and interpolation blurs them.

`navigation` draws the buttons that step from one change to the next. Stepping to one moves the view onto it and pulls in far enough to see it, unless it is already a comfortable size, in which case the zoom you set is the zoom you keep.

<Fw react="`viewport` and `defaultViewport` work the way everything else here does, taking `'fit'` or a `{ scale, x, y }`, with `onViewportChange` reporting where a reader went." flutter="`viewport` takes a `DiffineImageViewport`, or `null` for the whole frame in the pane, with `onViewportChanged` reporting where a reader went." /> The `x` and `y` are the point of the frame the middle of the pane is looking at, because a centre is what stays still when a picture is zoomed.

## How the two are compared

`diff` takes the options the engine reads, and anything left out keeps its default.

### tolerance

How different two pixels have to be, from 0 to 1, before the difference counts. The default is `0.05`.

::: fw flutter

```dart
ImageDiff(
  before: DiffineEncodedImage(saved),
  after: DiffineEncodedImage(rendered),
  diff: const DiffImageOptions(tolerance: 0.02, align: DiffImageAlign.shift),
);
```

:::

Zero means exactly equal, and that is rarely what anybody wants: a photograph saved twice by the same encoder is not byte-for-byte the same picture. The demo below is one photograph against itself re-encoded badly, compared at zero. Nothing in it changed, and a third of it comes back as a difference.

<DiffinePictures sample="saved" :tolerance="0" height="22rem" />

At the default of `0.05` the same pair comes back quiet, with a few dozen small areas where the encoder gave up on a gradient. Raise it when a comparison is noisy and lower it when it is missing something.

### ignoreAntialiasing

Whether a pixel that only differs because an edge was drawn smooth is left out. On by default.

Text and diagonals are drawn by putting part of a colour into the pixels either side of where the line really falls, and how much each one gets is the renderer's own arithmetic. So the same page drawn by two browsers differs along every letter while showing the same thing. A pixel is called smoothing when it is a blend of what surrounds it rather than a colour of its own, and the change is no larger than the step in brightness it is sitting on. A pixel that went from white to black in the middle of a white field passes neither test.

It is not free: every pixel that differs is read again with its eight neighbours.

### align

Whether an offset between the two is looked for before anything is compared. <Fw react="`'none'` by default, `'shift'` to look." flutter="`DiffImageAlign.none` by default, `.shift` to look." />

The pair below is one crop of a photograph against the same crop taken a pixel further along. Nothing in it changed and every edge in it did. Turn the switch on and the comparison finds the offset first; what is left is the strip of frame one of them no longer reaches.

<DiffinePictures sample="moved" :smoothing="false" controls height="22rem" />

`alignRadius` is how far that search goes, in pixels, and it defaults to `16`. Widening it costs time, and past a point the result stops being trustworthy: slide one picture far enough across another and something will match by accident.

### blockSize and maxRegions

`blockSize` is how coarse the grid is that changed pixels are grouped on, in pixels, and `maxRegions` is how many groups come back. Small squares split one change into several and large ones gather changes that have nothing to do with each other. Past `maxRegions` the largest are kept, the rest stay on the mask where they still show, and the result says the list is not all of them.

## Large pictures

`maxPixels` is how many pixels a picture is decoded at, and it defaults to four million.

A photograph out of a modern camera is twenty-four million, and two of them held as pictures and as buffers is most of a gigabyte before anything has been compared. Past the cap a picture is decoded smaller, which costs a little sharpness at a high zoom and keeps the <Fw react="page" flutter="app" /> from stopping. Raise it when the pictures are what the screen is for, and lower it on one that is showing forty of them.

The comparison itself is a few million pieces of arithmetic, and an application that wants that off the thread its screen is drawn on can do it elsewhere and hand over the answer:

::: fw react

```tsx
const result = await compareInAWorker(before, after);

<ImageDiff before={before} after={after} result={result} />;
```

:::

::: fw flutter

```dart
final DiffImageResult result = await Isolate.run(() => diffImage(before, after));

ImageDiff(
  before: DiffinePixelImage(before),
  after: DiffinePixelImage(after),
  result: result,
);
```

:::

The pictures are still needed. A result carries what happened to each pixel and none of the pixels themselves.

## The comparison on its own

`diffImage` is the engine, with <Fw react="no React and no DOM" flutter="no widget" /> in it:

::: fw react

```ts
import { diffImage } from 'diffine-react/image';

const result = diffImage(before, after, { align: 'shift' });

console.log(`${result.regions.length} areas, ${Math.round(result.stats.ratio * 100)}%`);
```

:::

::: fw flutter

```dart
final DiffImageResult result = diffImage(
  before,
  after,
  const DiffImageOptions(align: DiffImageAlign.shift),
);

debugPrint('${result.regions.length} areas, ${(result.stats.ratio * 100).round()}%');
```

:::

Both sides are <Fw react="`ImageData`, or anything shaped like it: `{ data, width, height }`" flutter="`DiffPixels`: `data`, `width` and `height`" />, four bytes a pixel, row by row from the top-left. What comes back is the frame the two were compared in, where each of them sits in it, a byte a pixel saying what happened to it, the changes as rectangles, and the counts. Opening a file is not part of it; decoding is a decoder's job.

The whole of it is on the [API page](../api/#diffimage).

## Everything else

`header`, `navigation`, `zoom` and `summary` each turn off a part of the frame: the names above the panes, the buttons for stepping through the changes, the zoom controls, and the bar underneath with each picture's size and how much of it moved.

`colorScheme`, `locale`, `strings` and <Fw react="the custom properties" flutter="`theme`" /> work exactly as they do on [`TextDiff`](./text-diff).
