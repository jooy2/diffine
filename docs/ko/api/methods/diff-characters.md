---
title: diffCharacters
order: 3
description: '두 줄을 글자 단위로 비교합니다. 단어로 끊어 봐야 표시할 것이 없는 문자열에 씁니다.'
---

# `diffCharacters`

::: fw react

```ts
diffCharacters(before: string, after: string, options?: DiffOptions): DiffInlineResult

interface DiffInlineResult {
  before: readonly DiffSegment[];
  after: readonly DiffSegment[];
  similarity: number;
}
```

:::

::: fw flutter

```dart
DiffInlineResult diffCharacters(String before, String after, [DiffOptions? options]);

class DiffInlineResult {
  final List<DiffSegment> before;
  final List<DiffSegment> after;
  final double similarity;
}
```

`diffCharacters`는 코드 유닛이 아니라 자소를 셉니다. 그래서 이모지 하나는 하나이고, 글리프 절반이 바뀐 것으로 표시되는 일은 없습니다.

:::

조각을 한 글자로 잡은 [`diffWords`](./diff-words)입니다. 단어로 끊어 봐야 표시할 것이 없는 두 줄에 씁니다.

한 목록이 아니라 양쪽으로 나눠 돌려주므로, 한쪽을 이어 붙이면 그쪽에 넘긴 문자열이 그대로 나옵니다.
