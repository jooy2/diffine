---
title: parsePatch
order: 6
description: '유니파이드 diff를 다시 비교 결과로 읽습니다. 패치가 다루는 파일마다 하나씩 돌려줍니다.'
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

유니파이드 diff를 다시 비교 결과로 읽습니다. 패치가 다루는 파일마다 하나씩 돌려주며, `result.before`에는 문서 전체가 아니라 패치가 실어 온 줄만 들어갑니다. 각 줄의 `index`는 원래 파일에서의 번호입니다.

쓰는 쪽은 [`formatPatch`](./format-patch)입니다.
