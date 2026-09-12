---
title: diffCharacters
order: 3
description: 'Compares two lines a character at a time, for two strings where a word is not the unit worth marking.'
---

# `diffCharacters`

::: fw react

```ts
diffCharacters(before: string, after: string, options?: DiffOptions): DiffInlineResult

interface DiffInlineResult {
  before: readonly DiffSegment[];
  after: readonly DiffSegment[];
  similarity: number;
}
```

:::

::: fw flutter

```dart
DiffInlineResult diffCharacters(String before, String after, [DiffOptions? options]);

class DiffInlineResult {
  final List<DiffSegment> before;
  final List<DiffSegment> after;
  final double similarity;
}
```

`diffCharacters` compares graphemes rather than code units, so an emoji is one piece and half a glyph is never marked as changed.

:::

[`diffWords`](./diff-words) with the pieces one character long, for two lines where a word is not the unit worth marking.

A side each rather than one list between them, so joining a side back together gives the text that was passed in for it.
