---
title: diffWords
order: 2
description: 'Compares two lines a word at a time, which is the comparison diffText runs inside a changed pair of lines.'
---

# `diffWords`

::: fw react

```ts
diffWords(before: string, after: string, options?: DiffOptions): DiffInlineResult

interface DiffInlineResult {
  before: readonly DiffSegment[];
  after: readonly DiffSegment[];
  similarity: number;
  edits: readonly DiffEdit[];
}
```

:::

::: fw flutter

```dart
DiffInlineResult diffWords(String before, String after, [DiffOptions? options]);

class DiffInlineResult {
  final List<DiffSegment> before;
  final List<DiffSegment> after;
  final double similarity;
  final List<DiffEdit> edits;
}
```

:::

Compares two lines a word at a time: runs of letters and digits, runs of whitespace, and every other character on its own. This is the comparison [`diffText`](./diff-text) runs inside a pair of changed lines, reachable on its own for a heading, a title, a cell of a table.

A side each rather than one list between them, so joining a side back together gives the text that was passed in for it. [`diffCharacters`](./diff-characters) is the same answer a character at a time.

`edits` lays the two sides against each other: every run of both lines in the order a reader meets them, as a [`DiffEdit`](./diff-sequence) with where it sits in each, counted in UTF-16 code units. Where something went out and something came in between the same two equal runs, the deletion comes first. It is what drawing the pair as one line needs, because with whitespace or case being ignored an equal run is not the same length on both sides.
