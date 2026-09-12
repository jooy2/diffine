---
title: ImageDiff
order: 2
description: 'Two pictures or a list of them, side by side, faded, wiped or masked. Every option, its type and its default.'
---

# `ImageDiff`

::: fw react

```tsx
<ImageDiff before={saved} after={rendered} />
<ImageDiff mode="editor" view="wipe" />
```

:::

::: fw flutter

```dart
ImageDiff(before: DiffineEncodedImage(saved), after: DiffineEncodedImage(rendered));
ImageDiff(mode: DiffineMode.editor, view: DiffineImageView.wipe, onChoose: pick);
```

:::

## The pictures

::: fw react

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `mode` | `'viewer' \| 'editor'` | `'viewer'` | Whether the pictures are only looked at, or chosen as well. |
| `before` | `DiffineImageInput` | — | The picture on the left. |
| `after` | `DiffineImageInput` | — | The picture on the right. |
| `pictures` | `readonly DiffineImageInput[]` | — | Several pictures rather than two. Turns the list on. |
| `baseline` | `number` | `0` | Which of them the rest are counted against. |
| `picturesResult` | [`DiffImagesResult`](../types/diff-images-result) | — | A comparison of the list already worked out. |
| `onPicturesDiff` | `(result: DiffImagesResult \| null) => void` | — | The comparison of the list. |
| `defaultBefore` | `DiffineImageInput` | — | What the left side starts with. Editor only. |
| `defaultAfter` | `DiffineImageInput` | — | What the right side starts with. Editor only. |
| `onBeforeChange` | `(value: File) => void` | — | A picture was chosen for the left side. |
| `onAfterChange` | `(value: File) => void` | — | A picture was chosen for the right side. |
| `onDiff` | `(result: DiffImageResult \| null) => void` | — | The comparison, every time it is worked out again. |
| `result` | [`DiffImageResult`](../types/diff-image-result) | — | A comparison already worked out. The pictures are still drawn. |
| `diff` | [`DiffImageOptions`](../types/diff-image-options) | — | How the two are compared. See [`diffImage`](../methods/diff-image). |
| `maxPixels` | `number` | `4000000` | How many pixels a picture is decoded at, at most. |

`DiffineImageInput` is a picture or a picture with a name on it: `Blob | ImageBitmap | DiffPixels`, or `{ content, label }` around one of those. A URL is not among them — fetching one is the application's to do, and what arrives here is what it already holds.

`editor` mode is the usual React pair. `defaultBefore` and `defaultAfter` leave the pictures to the component; `before` and `after` make them the application's, and `onBeforeChange` and `onAfterChange` are called either way.

:::

::: fw flutter

| Argument | Type | Default | What it is |
| --- | --- | --- | --- |
| `mode` | `DiffineMode` | `DiffineMode.viewer` | Whether the pictures are only looked at, or chosen as well. |
| `before` | `DiffineImageContent?` | — | The picture on the left. |
| `after` | `DiffineImageContent?` | — | The picture on the right. |
| `beforeLabel` | `String?` | — | What the header calls the left side. |
| `afterLabel` | `String?` | — | What it calls the right side. |
| `pictures` | `List<DiffineImageContent>?` | — | Several pictures rather than two. Turns the list on. |
| `pictureLabels` | `List<String>?` | — | What each of them is called. |
| `baseline` | `int` | `0` | Which of them the rest are counted against. |
| `picturesResult` | [`DiffImagesResult?`](../types/diff-images-result) | — | A comparison of the list already worked out. |
| `onPicturesDiff` | `ValueChanged<DiffImagesResult?>?` | — | The comparison of the list. |
| `onChoose` | `Future<DiffineImageContent?> Function(DiffineSide)?` | — | A reader asked for a picture. Editor only. |
| `onDiff` | `ValueChanged<DiffImageResult?>?` | — | The comparison, every time it is worked out again. |
| `result` | [`DiffImageResult?`](../types/diff-image-result) | — | A comparison already worked out. The pictures are still drawn. |
| `diff` | [`DiffImageOptions`](../types/diff-image-options) | `kDiffineImageDefaults` | How the two are compared. See [`diffImage`](../methods/diff-image). |
| `maxPixels` | `int` | `4000000` | How many pixels a picture is decoded at, at most. |

`DiffineImageContent` is a sealed class with three shapes: `DiffineEncodedImage` around the bytes of a file, `DiffineDecodedImage` around a `ui.Image` the application already has, and `DiffinePixelImage` around a `DiffPixels`. A URL is not among them — fetching one is the application's to do, and what arrives here is what it already holds.

`onChoose` is the editor's, and it is the whole of it: the widget asks for a picture for one side and the application answers with one, or with `null` for a reader who changed their mind. A file picker is a plugin and a permission, and neither belongs inside a diff viewer.

:::

## The view

::: fw react

| Prop | Type | Default | What it decides |
| --- | --- | --- | --- |
| `view` | `'split' \| 'overlay' \| 'wipe' \| 'mask'` | `'split'` | How the two are laid out. |
| `unchanged` | `'keep' \| 'dim' \| 'hide'` | `'keep'` | What is done with the parts nothing happened to. |
| `wheel` | `'zoom' \| 'pan'` | `'zoom'` | What the wheel does over a pane. |
| `loupe` | `boolean` | `true` | Whether the pixels under the pointer are shown magnified. |
| `fade` | `number` | `0.5` | How much of the second picture is let through. Overlay only. |
| `onFadeChange` | `(fade: number) => void` | — | The overlay was faded. |
| `wipe` | `number` | `0.5` | Where the line between the two is, from 0 to 1. Wipe only. |
| `onWipeChange` | `(wipe: number) => void` | — | The line was moved. |
| `marks` | `boolean` | `true` | Whether the pixels that changed are tinted. |
| `outlines` | `boolean` | `true` | Whether a box is drawn round each change. |
| `header` | `boolean` | `true` | Whether each side is named above it. |
| `navigation` | `boolean` | `true` | Whether the buttons for stepping through the changes are drawn. |
| `zoom` | `boolean` | `true` | Whether the zoom controls are drawn. |
| `summary` | `boolean` | `true` | Whether the bar under the panes is drawn. |
| `colorScheme` | `'system' \| 'light' \| 'dark'` | `'system'` | Which palette to draw in. |
| `locale` | `'en' \| 'ko'` | `'en'` | The language of the component's own words. |
| `strings` | [`Partial<DiffineImageStrings>`](../types/diffine-strings) | — | Words to use instead of the locale's. |

`split` draws two panes; the other three draw one, with both names over it. What the marks are drawn in is five [custom properties](../theme#colours) rather than props, because a canvas is painted rather than styled.

:::

::: fw flutter

| Argument | Type | Default | What it decides |
| --- | --- | --- | --- |
| `view` | `DiffineImageView` | `DiffineImageView.split` | How the two are laid out. |
| `unchanged` | `DiffineImageUnchanged` | `.keep` | What is done with the parts nothing happened to. |
| `wheel` | `DiffineImageWheel` | `.zoom` | What the wheel does over a pane. |
| `loupe` | `bool` | `true` | Whether the pixels under the pointer are shown magnified. |
| `fade` | `double?` | `0.5` | How much of the second picture is let through. Overlay only. |
| `onFadeChanged` | `ValueChanged<double>?` | — | The overlay was faded. |
| `wipe` | `double?` | `0.5` | Where the line between the two is, from 0 to 1. Wipe only. |
| `onWipeChanged` | `ValueChanged<double>?` | — | The line was moved. |
| `marks` | `bool` | `true` | Whether the pixels that changed are tinted. |
| `outlines` | `bool` | `true` | Whether a box is drawn round each change. |
| `header` | `bool` | `true` | Whether each side is named above it. |
| `navigation` | `bool` | `true` | Whether the buttons for stepping through the changes are drawn. |
| `zoom` | `bool` | `true` | Whether the zoom controls are drawn. |
| `summary` | `bool` | `true` | Whether the bar under the panes is drawn. |
| `colorScheme` | `DiffineColorScheme` | `.system` | Which palette to draw in. |
| `theme` | [`DiffineTheme?`](../theme) | — | The whole palette, and the measurements with it. |
| `height` | `double?` | — | How tall the whole comparison is. |
| `locale` | `DiffineLocale` | `DiffineLocale.en` | The language of the widget's own words. |
| `strings` | [`DiffineStrings?`](../types/diffine-strings) | — | Words to use instead of the locale's. |

`split` draws two panes; the other three draw one, with both names over it. What the marks are drawn in is `theme.image`, seven colours of the [palette](../theme#the-palette).

:::

## Moving around

::: fw react

| Prop | Type | Default | What it decides |
| --- | --- | --- | --- |
| `viewport` | `DiffineImageViewport \| 'fit'` | — | Where a reader is looking. |
| `defaultViewport` | `DiffineImageViewport \| 'fit'` | `'fit'` | Where to start looking. |
| `onViewportChange` | `(viewport: DiffineImageViewport) => void` | — | A reader moved or zoomed, or a button did. |
| `selected` | `number` | — | Which change a reader has stepped to, or -1. |
| `defaultSelected` | `number` | `-1` | Which change to start on. |
| `onSelectedChange` | `(selected: number, region: DiffImageRegion \| null) => void` | — | A change was stepped to. |

`DiffineImageViewport` is `{ scale, x, y }`: how many screen pixels one pixel of the frame is drawn as, and the point of the frame the middle of the pane is looking at. Both panes are given the same one, which is what makes a split view move together.

:::

::: fw flutter

| Argument | Type | Default | What it decides |
| --- | --- | --- | --- |
| `viewport` | `DiffineImageViewport?` | — | Where a reader is looking. `null` fits the frame to the pane. |
| `onViewportChanged` | `ValueChanged<DiffineImageViewport>?` | — | A reader moved or zoomed, or a button did. |
| `selected` | `int?` | — | Which change a reader has stepped to, or -1. |
| `defaultSelected` | `int` | `-1` | Which change to start on. |
| `onSelectedChanged` | `void Function(int, DiffImageRegion?)?` | — | A change was stepped to. |

`DiffineImageViewport` is `{ scale, x, y }`: how many logical pixels one pixel of the frame is drawn as, and the point of the frame the middle of the pane is looking at. Both panes are given the same one, which is what makes a split view move together. There is no `defaultViewport`: `null` is the fit, and it is also where an uncontrolled pane starts.

:::
