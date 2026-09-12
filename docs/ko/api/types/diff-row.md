---
title: DiffRow
order: 3
description: '비교 결과의 행 하나와 양쪽 줄, 그리고 줄 안에서 표시된 조각.'
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

`DiffRowKind`는 `equal`, `insert`, `delete`, `replace`이고 `DiffEditKind`는 `equal`, `insert`, `delete`입니다.

:::
