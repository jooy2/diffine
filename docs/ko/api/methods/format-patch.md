---
title: formatPatch
order: 5
description: '비교 결과를 유니파이드 diff로 씁니다. 앞뒤로 남길 줄 수와 머리말에 적히는 두 이름까지.'
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

비교 결과를 유니파이드 diff로 씁니다. `context`는 변경 앞뒤로 남길 그대로인 줄의 수이고, `before`와 `after`는 머리말에 적히는 두 이름입니다.

두 문서가 같으면 빈 문자열을 돌려줍니다. 반대로 읽는 쪽은 [`parsePatch`](./parse-patch)입니다.
