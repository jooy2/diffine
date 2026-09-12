---
title: diffSequence
order: 4
description: '토큰 두 벌을 비교해 그 사이의 편집 목록을 돌려줍니다. 토큰이 무엇이든 상관없습니다.'
---

# `diffSequence`

::: fw react

```ts
diffSequence(before: readonly string[], after: readonly string[], options?: DiffOptions): DiffEdit[]

interface DiffEdit {
  kind: 'equal' | 'insert' | 'delete';
  beforeStart: number;
  beforeEnd: number;
  afterStart: number;
  afterEnd: number;
}
```

:::

::: fw flutter

```dart
List<DiffEdit> diffSequence(List<String> before, List<String> after, [DiffOptions? options]);

class DiffEdit {
  final DiffEditKind kind;
  final int beforeStart;
  final int beforeEnd;
  final int afterStart;
  final int afterEnd;
}
```

:::

돌아온 편집 목록은 두 배열을 순서대로 빠짐없이 한 번씩 덮습니다.
