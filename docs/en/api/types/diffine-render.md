---
title: DiffineRender
order: 16
description: "What renderGutter and renderWidget take, for something of the application's own beside or under a line."
---

# `DiffineRender`

::: fw react

```ts
type DiffineRender = (line: DiffLine, side: DiffineSide) => React.ReactNode;
```

What `renderGutter` and `renderWidget` take. Called once for each line a pane draws, so with the rows virtualised it is called for what is on the screen. A blank that holds the two sides level is not a line, and nothing is asked about it. `renderWidget` turns `virtualize` off, because what an application draws under a line can grow at any moment and a row standing in for one of those would be standing in the wrong place. `wrap` does not: a wrapped row's height follows the width of its pane and the typeface, and both are watched.

:::

::: fw flutter

```dart
typedef DiffineRender = Widget? Function(DiffLine line, DiffineSide side);
```

What `renderGutter` and `renderWidget` take. Called once for each line a pane builds, so it is called for what is on the screen rather than for the whole document. A blank that holds the two sides level is not a line, and nothing is asked about it. Return `null` for a line with nothing to add.

`renderWidget` measures every row up front instead of assuming the line height, because what an application draws under a line is as tall as it is and the line opposite has to be given the same height.

:::
