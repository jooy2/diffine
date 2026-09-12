---
title: Image diff
order: 3
---

# Image diff

`ImageDiff` compares two pictures pixel by pixel and draws what it found. The pixels that changed are tinted over both sides, each run of them gets a box, and one zoom and one position move both panes together.

<DiffinePictures sample="retouched" height="24rem" />

The two pictures above are the same photograph, and the second has a patch of itself cloned over the window — the kind of edit a comparison is usually reached for, where the question is which part of the picture somebody worked on.

What is drawn over them is three things, and they are the same three on every demo on this page:

- **Pink** is a pixel both pictures cover and disagree about. That is the square in the window.
- **A box** is drawn round each run of those, so a change three pixels wide is still somewhere to look when the whole picture is in the pane. It is a dashed line one pixel wide in two colours, so that whichever of the two the photograph under it matches, the other one shows. The **blue** box, solid rather than dashed, is the change the buttons in the bar have stepped to.
- **Green and red** are the pixels only one of the two pictures covers, which is what a difference in size or an offset leaves behind. There are none here, because the two are the same size.

The bar underneath counts it up: one changed area, and what share of the picture it is.

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

A box is drawn twice at the same width: `halo` solid, and `outline` dashed over it. One colour cannot be seen on every picture, because a picture is whatever colour it is, and a dark box on the dark half of a photograph is a box nobody finds — which is exactly where the changes tend to be. Two make one thin marquee that always shows. The box round the change a reader has stepped to is `marker`, solid rather than dashed, which is what tells it from the rest without making it heavier.

::: fw react

None of it is a prop. The colours are custom properties on the element:

```css
.diffine-image {
  --diffine-image-changed: rgb(232 62 140 / 0.55);
  --diffine-image-added: rgb(26 127 75 / 0.5);
  --diffine-image-removed: rgb(194 51 63 / 0.5);
  --diffine-image-outline: rgb(20 28 40 / 0.85);
  --diffine-image-marker: rgb(14 127 252 / 0.95);
  --diffine-image-halo: rgb(255 255 255 / 0.6);
}
```

They carry their own transparency because all of them sit on top of the picture they are describing. A canvas cannot be styled, so these are read off the element and painted into the pixels. It is the one place in Diffine where a custom property is looked up rather than simply used, and it is why a mask is repainted when the palette under it changes.

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
      outline: Color(0xd9141c28),
      marker: Color(0xf20e7ffc),
      halo: Color(0x99ffffff),
      ground: Color(0xffeaeef4),
      chequer: Color(0xffdbe1ea),
    ),
  ),
);
```

They carry their own transparency because all of them sit on top of the picture they are describing. The mask is painted into pixels rather than styled, which is why it is painted again when the palette under it changes.

:::

## What happens to the rest of the picture

`marks` and `outlines` say what is done with the pixels that changed. `unchanged` says what is done with the ones that did not, and the two are separate questions: it holds across all four views.

`keep` is the default and does nothing. Both pictures are drawn as they are and the changes are tinted over them.

`dim` draws them faint and draws what changed as it is. The change is what the eye lands on, and the rest of the picture is still there to say where in it the change was — which is what a mask on its own cannot say.

<Fw react="`marks={false}`" flutter="`marks: false`" /> goes with it. Once what changed is being drawn as itself, tinting the same pixels pink is one answer over the top of another.

<DiffinePictures sample="retouched" unchanged="dim" :marks="false" height="22rem" />

`hide` draws only what changed, on a plain ground. It is the view for reading a change as a picture rather than as a mark on one: what is in that rectangle, on the left and on the right, with nothing else in the frame.

<DiffinePictures sample="retouched" unchanged="hide" :marks="false" height="22rem" />

::: fw react

```tsx
<ImageDiff before={saved} after={rendered} unchanged="dim" marks={false} />
```

:::

::: fw flutter

```dart
ImageDiff(
  before: DiffineEncodedImage(saved),
  after: DiffineEncodedImage(rendered),
  unchanged: DiffineImageUnchanged.dim,
  marks: false,
);
```

:::

## More than two pictures

<DiffinePictures sample="retouched" several height="22rem" />

## Moving around

Both panes share one viewport, so there is nothing to keep in step: a drag, a wheel or a button moves the pair.

- Drag to move, anywhere in a pane.
- The wheel zooms about the pointer, a notch at a time. Shift with it moves the picture instead.
- The buttons in the bar zoom about the middle, and the last of them fits the frame back into the pane.
- With the keyboard: the arrows move, `+` and `−` zoom, and Shift makes the arrows move further.

`wheel` is the one of those worth a second thought. It is `zoom` by default, which is what a picture viewer does and what a comparison that is the page wants — and it means the page does not scroll while the pointer is over a pane. A comparison sitting in the middle of an article wants the other answer, because a reader scrolling past it should scroll past it:

::: fw react

```tsx
<ImageDiff before={saved} after={rendered} wheel="pan" />
```

:::

::: fw flutter

```dart
ImageDiff(
  before: DiffineEncodedImage(saved),
  after: DiffineEncodedImage(rendered),
  wheel: DiffineImageWheel.pan,
);
```

:::

`pan` moves a picture larger than its pane, lets the page scroll once the whole frame is in view, and zooms with Ctrl or Cmd held.

Above its own size the picture is drawn crisp rather than smooth. At four hundred per cent the individual pixels are the thing being looked at, and interpolation blurs them.

## The pixels themselves

Two panes at four hundred per cent say two pixels are different and stop there, and what a reader asks next is what the two actually are — the same grey a shade darker, or a different colour altogether. `loupe` answers it. Move the pointer over either pane and the pixels around it are drawn magnified, both sides at once, with the colour of the one in the middle written out and the point of the frame it sits at.

Both sides whichever pane the pointer is over, because a split view has one picture a pane and the question is never about one of them. It follows a pointer rather than a finger, so a reader on a touch screen never sees it.

It stays where it is put. The panel starts against the edge away from the pane being read — and at the left where there is only one pane — because a panel that moved itself from corner to corner to stay out from under the pointer is the thing a reader ends up watching. Drag the handle in its bar to put it anywhere in the comparison, and pull the corner to show more pixels at once: the tiles stay the size they are and there are more of them, up to forty-one across.

It is on by default. <Fw react="`loupe={false}`" flutter="`loupe: false`" /> turns it off.

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

Text and diagonals are drawn by putting part of a colour into the pixels either side of where the line really falls, and how much each one gets is the renderer's own arithmetic. So the same page drawn by two browsers differs along every letter while showing the same thing.

A pixel is called smoothing when the **same edge** runs through it in both pictures and the change is no larger than the weaker of the two steps. An edge is a step in brightness with something level within a pixel of it — somewhere with two pixels of exactly one colour side by side — and the pixel has to be a blend of what surrounds it rather than a colour of its own in at least one of the two. A pixel that went from white to black in the middle of a white field is on no edge at all.

Both pictures, and the weaker of the two steps, is what tells an edge drawn twice from an edge that arrived. A patch pasted over a flat part of a photograph brings an edge with it that the other picture has nothing to answer with, and taking the stronger step would let that edge excuse its own arrival — half the boundary of the cloned patch at the top of this page used to come back as pixels that had not changed.

The level test is what keeps a photograph honest. Nearly every pixel of a rainy window or a knitted blanket lies between the pixels around it, and the range across a texture is most of the scale, so without something level nearby the allowance would be wide enough to drop a change that really happened.

It is not free: every pixel that differs is read again with the pixels around it.

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

The whole of it is on the [API page](../api/methods/diff-image).

## Comparing several at once

`diffImages` is the engine behind `pictures`, with the same bargain `diffImage` makes:

::: fw react

```ts
import { diffImages, imagesSimilarity } from 'diffine-react/image';

const result = diffImages([saved, chrome, firefox]);
const { similarity, each } = imagesSimilarity([saved, chrome, firefox]);
```

:::

::: fw flutter

```dart
final DiffImagesResult result = diffImages(<DiffPixels>[saved, chrome, firefox]);
final DiffImagesSimilarity alike = imagesSimilarity(<DiffPixels>[saved, chrome, firefox]);
```

:::

Every option means what it means for a pair, because every pair is compared exactly as `diffImage` would compare it. A list of two gives the same answer in a different shape.

The shape is the mask. It is a bit a picture rather than a kind: bit `i` is set where the picture at `i` differs from the baseline, so `mask[pixel] != 0` is "does anything disagree here" and `mask[pixel] & (1 << i)` is "does this one". That is what lets each pane be marked with its own disagreement rather than with everybody's. `added` and `removed` have no place in it — whose arrival a pixel is depends on which picture is being asked about, and the answer for a list is that they disagree.

`stats` counts the frame the way a pair's does, with `apart` saying how many pixels each picture disagrees with the baseline about. `imagesSimilarity` turns that into shares: one number for the set, and `each` naming the odd one out, which the one number only says exists.

`paintDiffImages` writes the mask out as a picture, of all of them at once or of one on its own — four files, one a picture, saying who is the odd one out where.

A byte holds eight bits, so eight pictures is the most one comparison takes. <Fw react="`MOST_PICTURES`" flutter="`kMostPictures`" /> is that number, and the pair each of them makes with the baseline is still `diffImage`, which has no limit.

The three of them are on the API pages for [`diffImages`](../api/methods/diff-images), [`imagesSimilarity`](../api/methods/images-similarity) and [`paintDiffImages`](../api/methods/paint-diff-images).

## How alike the two are

`diffImage` answers "where did these two differ", which is the question a reader looking at them has. A build with a threshold in it, a report ranking a hundred screenshots and a badge on a page are all asking the shorter one, and `imageSimilarity` is the shorter one:

::: fw react

```ts
import { imageSimilarity } from 'diffine-react/image';

const { similarity, changed, distance } = imageSimilarity(before, after);

if (similarity < 0.995) {
  throw new Error(`${changed} pixels moved — ${(similarity * 100).toFixed(2)}% alike`);
}
```

:::

::: fw flutter

```dart
final DiffImageSimilarity alike = imageSimilarity(before, after);

if (alike.similarity < 0.995) {
  throw StateError('${alike.changed} pixels moved — '
      '${(alike.similarity * 100).toStringAsFixed(2)}% alike');
}
```

:::

`similarity` is a share of the pixels at least one of the two pictures covers, so a pixel only one of them reaches counts against it and two pictures of different sizes cannot be 1. Beside it are the counts it came from — `matched`, `changed`, `added`, `removed` — and the size of each picture, because a share means less when the two differ.

`distance` is the other half of the answer. `similarity` counts the pixels that moved and `distance` measures how far they moved, on the same scale `tolerance` is on. A photograph saved again by a worse encoder is unalike in most of its pixels and barely apart in any of them; a screenshot with a panel painted over is the opposite. One number cannot say both.

It is the whole comparison underneath, so every option means what it means above, and an application that already has a result needs no second pass — `1 - result.stats.ratio` is the same number.

Both sides are pixels here as well. Turning a file into pixels is <Fw react="`createImageBitmap` and a canvas" flutter="`decodeImageFromList` and `toByteData`" />, which is the application's, exactly as it is for `diffImage`:

::: fw react

```ts
async function pixelsOf(file: Blob): Promise<ImageData> {
  const bitmap = await createImageBitmap(file);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const context = canvas.getContext('2d');

  context.drawImage(bitmap, 0, 0);

  return context.getImageData(0, 0, bitmap.width, bitmap.height);
}

const alike = imageSimilarity(await pixelsOf(saved), await pixelsOf(rendered));
```

:::

::: fw flutter

```dart
Future<DiffPixels> pixelsOf(Uint8List file) async {
  final ui.Image image = await decodeImageFromList(file);
  final ByteData? bytes = await image.toByteData(format: ui.ImageByteFormat.rawRgba);

  return DiffPixels(
    data: bytes!.buffer.asUint8List(),
    width: image.width,
    height: image.height,
  );
}

final DiffImageSimilarity alike = imageSimilarity(
  await pixelsOf(saved),
  await pixelsOf(rendered),
);
```

:::

## Everything else

`header`, `navigation`, `zoom` and `summary` each turn off a part of the frame: the names above the panes, the buttons for stepping through the changes, the zoom controls, and the bar underneath with each picture's size and how much of it moved.

`colorScheme`, `locale`, `strings` and <Fw react="the custom properties" flutter="`theme`" /> work exactly as they do on [`TextDiff`](./text-diff).
