---
title: paintDiffImage
order: 11
description: 'Turns the mask of a picture comparison into a picture, for an application that has to write a file out of it.'
---

# `paintDiffImage`

::: fw react

```ts
paintDiffImage(result: DiffImageResult, paint?: DiffImagePaint): DiffPixels

interface DiffImagePaint {
  changed?: [number, number, number, number]; // [232, 62, 140, 255]
  added?: [number, number, number, number]; // [26, 127, 75, 255]
  removed?: [number, number, number, number]; // [194, 51, 63, 255]
  unchanged?: [number, number, number, number]; // [0, 0, 0, 0]
}
```

The mask as a picture the size of the frame, for an application that has to write a file out of it. Four bytes a colour rather than a CSS string, because reading one means asking a browser what it means. Writing the file is the application's, exactly as reading one is.

:::

::: fw flutter

```dart
DiffPixels paintDiffImage(DiffImageResult result, [DiffImagePaint? paint]);

class DiffImagePaint {
  const DiffImagePaint({this.changed, this.added, this.removed, this.unchanged});

  final Color? changed; // Color(0xffe83e8c)
  final Color? added; // Color(0xff1a7f4b)
  final Color? removed; // Color(0xffc2333f)
  final Color? unchanged; // transparent
}
```

The mask as a picture the size of the frame, for an application that has to write a file out of it. What comes back is a `DiffPixels`, so `ui.decodeImageFromPixels` turns it into something to draw and an encoder turns it into something to save. Writing the file is the application's, exactly as reading one is.

:::
