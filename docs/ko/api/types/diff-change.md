---
title: DiffChange
order: 4
description: '이어진 변경 한 덩어리. 두 문서와 행 목록에 대한 범위로 적혀 있습니다.'
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

`DiffChangeKind`는 `insert`, `delete`, `replace`입니다.

:::

범위는 모두 끝을 포함하지 않습니다. 목록에는 바뀐 구간만 들어가고, 안 바뀐 구간은 그 사이의 빈 자리입니다.
