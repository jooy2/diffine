---
title: formatPatch
order: 5
description: 'Writes a comparison out as a unified diff, with the context and the two names its header carries.'
---

# `formatPatch`

::: fw react

```ts
formatPatch(result: DiffResult, options?: DiffPatchOptions): string

interface DiffPatchOptions {
  context?: number; // 3
  before?: string; // 'before'
  after?: string; // 'after'
}
```

:::

::: fw flutter

```dart
String formatPatch(DiffResult result, [DiffPatchOptions? options]);

class DiffPatchOptions {
  const DiffPatchOptions({this.context = 3, this.before = 'before', this.after = 'after'});
}
```

:::

A comparison written out as a unified diff. `context` is how many unchanged lines are kept either side of a change, and `before` and `after` are the two names written into the header.

It returns an empty string for two documents that are the same. [`parsePatch`](./parse-patch) reads one back.
