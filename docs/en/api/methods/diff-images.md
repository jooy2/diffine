---
title: diffImages
order: 8
description: 'Compares several pictures at once against a baseline, and returns everywhere any of them disagree.'
---

# `diffImages`

::: fw react

```ts
import { diffImages, MOST_PICTURES } from 'diffine-react/image';

const result = diffImages([saved, chrome, firefox]);
```

`(pictures: readonly DiffPixels[], options?: DiffImagesOptions) => DiffImagesResult`

:::

::: fw flutter

```dart
final DiffImagesResult result = diffImages(<DiffPixels>[saved, chrome, firefox]);
```

`DiffImagesResult diffImages(List<DiffPixels> pictures, [DiffImagesOptions? options])`

:::

Three renderings of one screen, four exports of one asset, a saved version against the last five runs. What is wanted there is one frame with every disagreement on it, and a pair has no room for a third. Each picture is compared with the baseline exactly as [`diffImage`](./diff-image) would compare it, so every option means what it means there, and a list of two is the same answer in a different shape. [`DiffImagesOptions`](../types/diff-images-options) is that table with the baseline added to it.

What the list adds is the mask. It is a bit a picture rather than a kind: bit `i` is set where the picture at `i` differs from the baseline, so `mask[pixel] != 0` is "does anything disagree here" and `mask[pixel] & (1 << i)` is "does this one". `added` and `removed` have no place in it — whose arrival a pixel is depends on which picture is being asked about, and the answer for a list is that they disagree. [`DiffImagesResult`](../types/diff-images-result) is the whole of what comes back.

A byte holds eight bits, so eight pictures is the most one comparison takes. <Fw react="`MOST_PICTURES`" flutter="`kMostPictures`" /> is that number, and a list shorter than two or longer than it is a `RangeError` rather than an answer. The pair each picture makes with the baseline is still `diffImage`, which has no limit.
