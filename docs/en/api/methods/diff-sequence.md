---
title: diffSequence
order: 4
description: 'Compares two sequences of tokens and returns the edits between them, whatever the tokens are.'
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

The edits cover both sequences exactly once, in order.
