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
  edits: readonly DiffEdit[];
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
  final List<DiffEdit> edits;
}
```

:::

두 줄을 단어 단위로 비교합니다. 글자와 숫자가 이어진 덩어리, 공백이 이어진 덩어리, 나머지 문자는 하나씩입니다. [`diffText`](./diff-text)가 바뀐 줄 짝 안에서 돌리는 비교가 이것이고, 제목이나 표의 칸처럼 문서가 아닌 것을 비교할 때 따로 쓸 수 있습니다.

한 목록이 아니라 양쪽으로 나눠 돌려주므로, 한쪽을 이어 붙이면 그쪽에 넘긴 문자열이 그대로 나옵니다. 글자 단위로 보려면 [`diffCharacters`](./diff-characters)입니다.

`edits`는 두 쪽을 맞대어 둡니다. 두 줄의 조각을 읽는 순서대로 늘어놓고, 조각마다 양쪽 줄 안의 위치를 UTF-16 코드 단위로 세어 [`DiffEdit`](./diff-sequence)로 담습니다. 바뀌지 않은 두 조각 사이에서 빠진 것과 들어온 것이 함께 있으면 빠진 것이 먼저 옵니다. 두 줄을 한 줄로 그리려면 이 값이 있어야 합니다. 공백이나 대소문자를 무시하면 바뀌지 않은 조각의 길이가 양쪽에서 달라지기 때문입니다.
