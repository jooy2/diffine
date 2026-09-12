---
title: DiffineFont
order: 14
description: 'The typeface the documents are drawn in, for an application that keeps it in its own state.'
---

# `DiffineFont`

::: fw react

```ts
interface DiffineFont {
  family?: string;
  size?: string | number;
  lineHeight?: string | number;
  letterSpacing?: string | number;
}
```

The same four values as `--diffine-font`, `--diffine-font-size`, `--diffine-line-height` and `--diffine-letter-spacing`, for an application that holds the typeface in its own state rather than in its own CSS. Anything left out keeps the stylesheet's value. A number is pixels and a string is whatever CSS makes of it.

`family` has to be a monospace stack, and `lineHeight` has to be a length rather than a bare multiplier: a row is that tall whether or not it has a line in it, the editor's field is laid over rows that are, and the rows a long comparison does not draw are stood in for by exactly that much height.

:::

::: fw flutter

```dart
class DiffineFont {
  const DiffineFont({
    this.family,
    this.familyFallback,
    this.size,
    this.lineHeight,
    this.letterSpacing,
  });
}
```

The typeface half of the theme, on its own, for a screen that sets the size and keeps every colour. Anything left out keeps the theme's value, so `DiffineFont(size: 15)` is a whole answer. Everything is in logical pixels.

`family` has to be monospace, and `lineHeight` is a length rather than a multiplier: a row is that tall whether or not it has a line in it, the editor's field is laid over rows that are, and the rows a long comparison has not built yet are stood in for by exactly that much height.

:::
