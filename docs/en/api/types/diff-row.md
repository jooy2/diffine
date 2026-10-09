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

`DiffRowKind` is `equal`, `insert`, `delete` or `replace`; `DiffEditKind` is `equal`, `insert` or `delete`.

:::

`edits` is how the line on the left became the line on the right, run by run, with where each run sits in both lines. Only a `replace` row whose lines were marked inside has it, and it is what the `merged` view draws one line from. A row an application built by hand can leave it out, and is then drawn as two lines. See [`diffWords`](../methods/diff-words) for how the runs are laid out.
