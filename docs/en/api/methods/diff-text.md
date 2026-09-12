---
title: diffText
order: 1
description: 'Compares two documents by line, then marks what changed inside each pair of lines that was edited.'
---

# `diffText`

::: fw react

```ts
diffText(before: string, after: string, options?: DiffOptions): DiffResult
```

:::

::: fw flutter

```dart
DiffResult diffText(String before, String after, [DiffOptions? options]);
```

:::

Compares two documents a line at a time, and marks what changed inside each pair of lines that was edited. [`DiffOptions`](../types/diff-options) is how the two are compared, and [`DiffResult`](../types/diff-result) is what comes back.
