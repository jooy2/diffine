---
title: paintDiffImages
order: 12
description: 'Turns the mask of a comparison of several pictures into a picture, of all of them or of one on its own.'
---

# `paintDiffImages`

::: fw react

```ts
paintDiffImages(result: DiffImagesResult, paint?: DiffImagePaint & { picture?: number }): DiffPixels
```

:::

::: fw flutter

```dart
DiffPixels paintDiffImages(DiffImagesResult result, {DiffImagePaint? paint, int? picture});
```

:::

The same step between an answer and a file that [`paintDiffImage`](./paint-diff-image) is, for a comparison of a list. With no `picture` it paints every pixel any of them disagrees about, which is the one image a build attaches to a run that compared four. With one, it paints what that picture alone disagrees with the baseline about — four files, one a picture, saying who is the odd one out where.

`added` and `removed` do not apply here, so only `changed` and `unchanged` are read off the colours: whose arrival a pixel is depends on which of the pictures is being asked about, and the answer for a list is that they disagree.
