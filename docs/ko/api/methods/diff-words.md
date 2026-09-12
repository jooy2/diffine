---
title: diffWords
order: 2
description: '두 줄을 단어 단위로 비교합니다. diffText가 바뀐 줄 짝 안에서 돌리는 비교입니다.'
---

# `diffWords`

::: fw react

```ts
diffWords(before: string, after: string, options?: DiffOptions): DiffInlineResult

interface DiffInlineResult {
  before: readonly DiffSegment[];
  after: readonly DiffSegment[];
  similarity: number;
}
```

:::

::: fw flutter

```dart
DiffInlineResult diffWords(String before, String after, [DiffOptions? options]);

class DiffInlineResult {
  final List<DiffSegment> before;
  final List<DiffSegment> after;
  final double similarity;
}
```

:::

두 줄을 단어 단위로 비교합니다. 글자와 숫자가 이어진 덩어리, 공백이 이어진 덩어리, 나머지 문자는 하나씩입니다. [`diffText`](./diff-text)가 바뀐 줄 짝 안에서 돌리는 비교가 이것이고, 제목이나 표의 칸처럼 문서가 아닌 것을 비교할 때 따로 쓸 수 있습니다.

한 목록이 아니라 양쪽으로 나눠 돌려주므로, 한쪽을 이어 붙이면 그쪽에 넘긴 문자열이 그대로 나옵니다. 글자 단위로 보려면 [`diffCharacters`](./diff-characters)입니다.
