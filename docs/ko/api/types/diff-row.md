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
  edits?: readonly DiffEdit[];
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
  final List<DiffEdit>? edits;
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

`edits`는 왼쪽 줄이 오른쪽 줄로 바뀐 과정을 조각마다 두 줄 안의 위치와 함께 담습니다. 안에서 조각을 짚어 낸 `replace` 행에만 있고, `merged` 보기가 줄 하나를 그릴 때 쓰는 것이 이 값입니다. 애플리케이션이 직접 만든 행은 이 값을 빼도 되고, 그러면 두 줄로 그려집니다. 조각을 어떻게 놓는지는 [`diffWords`](../methods/diff-words)에 있습니다.
