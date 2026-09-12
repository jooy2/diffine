---
title: DiffResult
order: 2
description: 'What diffText returns — the lines, the rows, the changes, the counts, and how each document was written.'
---

# `DiffResult`

::: fw react

```ts
interface DiffResult {
  before: readonly string[];
  after: readonly string[];
  rows: readonly DiffRow[];
  changes: readonly DiffChange[];
  stats: DiffStats;
  complete: boolean;
  format?: { before: DiffFormat; after: DiffFormat };
}

interface DiffFormat {
  ending: 'lf' | 'crlf' | 'cr' | 'mixed' | 'none';
  finalNewline: boolean;
  byteOrderMark: boolean;
}
```

:::

::: fw flutter

```dart
class DiffResult {
  final List<String> before;
  final List<String> after;
  final List<DiffRow> rows;
  final List<DiffChange> changes;
  final DiffStats stats;
  final bool complete;
  final DiffDocumentFormat? format;
}

class DiffDocumentFormat {
  final DiffFormat before;
  final DiffFormat after;
}

class DiffFormat {
  final DiffLineEnding ending;
  final bool finalNewline;
  final bool byteOrderMark;
}
```

`DiffLineEnding` is `lf`, `crlf`, `cr`, `mixed` or `none`.

:::

`format` is how each document is written rather than what is in it, and it is left out where nobody could know it — a comparison read back out of a patch never saw either file.
