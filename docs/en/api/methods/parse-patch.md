---
title: parsePatch
order: 6
description: 'Reads a unified diff back into comparisons, one entry per file the patch covers.'
---

# `parsePatch`

::: fw react

```ts
parsePatch(patch: string, options?: DiffOptions): DiffPatchFile[]

interface DiffPatchFile {
  before: string;
  after: string;
  result: DiffResult;
}
```

:::

::: fw flutter

```dart
List<DiffPatchFile> parsePatch(String patch, [DiffOptions? options]);

class DiffPatchFile {
  final String before;
  final String after;
  final DiffResult result;
}
```

:::

A unified diff read back into comparisons, one entry per file the patch covers. `result.before` holds the lines the patch carried rather than the whole document, while each line's `index` is its own number in the file it came from.

[`formatPatch`](./format-patch) writes one.
