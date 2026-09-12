---
title: DiffResult
order: 2
description: 'diffText가 돌려주는 값. 줄과 행과 변경 목록과 집계, 그리고 각 문서가 어떻게 쓰였는지.'
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

`DiffLineEnding`은 `lf`, `crlf`, `cr`, `mixed`, `none`입니다.

:::

`format`은 문서에 무엇이 들어 있는지가 아니라 문서가 어떻게 쓰였는지입니다. 알 수 없으면 없습니다. 패치에서 읽어 온 비교 결과는 두 파일을 본 적이 없습니다.
