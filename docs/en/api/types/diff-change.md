---
title: DiffChange
order: 4
description: 'One run of changed lines, as ranges into both documents and into the rows.'
---

# `DiffChange`

::: fw react

```ts
interface DiffChange {
  kind: 'insert' | 'delete' | 'replace';
  beforeStart: number;
  beforeEnd: number;
  afterStart: number;
  afterEnd: number;
  rowStart: number;
  rowEnd: number;
}
```

:::

::: fw flutter

```dart
class DiffChange {
  final DiffChangeKind kind;
  final int beforeStart;
  final int beforeEnd;
  final int afterStart;
  final int afterEnd;
  final int rowStart;
  final int rowEnd;
}
```

`DiffChangeKind` is `insert`, `delete` or `replace`.

:::

Every range is half-open. Only changed runs are on the list; unchanged runs are the gaps between them.
