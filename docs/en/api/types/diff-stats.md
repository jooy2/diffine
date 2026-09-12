---
title: DiffStats
order: 5
description: 'How many lines were left alone, changed, added and removed.'
---

# `DiffStats`

::: fw react

```ts
interface DiffStats {
  unchanged: number;
  changed: number;
  inserted: number;
  deleted: number;
}
```

:::

::: fw flutter

```dart
class DiffStats {
  final int unchanged;
  final int changed;
  final int inserted;
  final int deleted;
}
```

:::

`changed` counts pairs of lines that sit opposite each other and differ, so a line that was edited is one `changed` rather than one `inserted` and one `deleted`.
