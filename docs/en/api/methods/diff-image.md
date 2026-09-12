---
title: diffImage
order: 7
description: 'Compares two pictures pixel by pixel, with a tolerance, antialiasing and offset detection.'
---

# `diffImage`

::: fw react

```ts
import { diffImage } from 'diffine-react/image';

const result = diffImage(before, after, { align: 'shift' });
```

`(before: DiffPixels, after: DiffPixels, options?: DiffImageOptions) => DiffImageResult`

:::

::: fw flutter

```dart
final DiffImageResult result = diffImage(
  before,
  after,
  const DiffImageOptions(align: DiffImageAlign.shift),
);
```

`DiffImageResult diffImage(DiffPixels before, DiffPixels after, [DiffImageOptions? options])`

:::

Compares two pictures pixel by pixel. Neither side has to be the same size as the other: what only one of them covers comes back as `added` or `removed` rather than as an error.

[`DiffImageOptions`](../types/diff-image-options) is how the two are compared, and [`DiffImageResult`](../types/diff-image-result) is what comes back.
