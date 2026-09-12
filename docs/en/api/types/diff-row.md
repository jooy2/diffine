---
title: DiffRow
order: 3
description: 'One row of a comparison, the line on each side of it, and the pieces marked inside a line.'
---

# `DiffRow`

::: fw react

```ts
interface DiffRow {
  kind: 'equal' | 'insert' | 'delete' | 'replace';
  before: DiffLine | null;
  after: DiffLine | null;
}

interface DiffLine {
  index: number;
  text: string;
  segments: readonly DiffSegment[];
}

interface DiffSegment {
  kind: 'equal' | 'insert' | 'delete';
  text: string;
}
```

:::

::: fw flutter

```dart
class DiffRow {
  final DiffRowKind kind;
  final DiffLine? before;
  final DiffLine? after;
}

class DiffLine {
  final int index;
  final String text;
  final List<DiffSegment> segments;
}

class DiffSegment {
  final DiffEditKind kind;
  final String text;
}
```

`DiffRowKind` is `equal`, `insert`, `delete` or `replace`; `DiffEditKind` is `equal`, `insert` or `delete`.

:::
