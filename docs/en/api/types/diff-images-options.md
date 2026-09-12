---
title: DiffImagesOptions
order: 11
description: 'How several pictures are compared: every option a pair takes, and which of them the rest are counted against.'
---

# `DiffImagesOptions`

::: fw react

```ts
interface DiffImagesOptions extends DiffImageOptions {
  baseline?: number; // 0
}
```

:::

::: fw flutter

```dart
class DiffImagesOptions extends DiffImageOptions {
  const DiffImagesOptions({
    this.baseline = 0,
    super.tolerance,
    super.ignoreAntialiasing,
    super.align,
    super.alignRadius,
    super.blockSize,
    super.maxRegions,
  });

  final int baseline;
}
```

:::

Every option [`DiffImageOptions`](./diff-image-options) has, with the same defaults, and one more.

A comparison of several asks one of two questions, and `baseline` decides which. With a baseline it is "how does each of these differ from that one", which is what a saved version against four runs is. Without one it is "where do these disagree at all", and the answer to that is the same whichever of them the counting starts from: a pixel they all agree about has no bit set whoever is the baseline.
