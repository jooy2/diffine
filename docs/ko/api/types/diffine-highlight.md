---
title: DiffineHighlight
order: 17
description: 'language 대신 쓰는 애플리케이션 자신의 강조기. 돌려주는 구간과, 줄이 그 경계에서 어떻게 잘리는지.'
---

# `DiffineHighlight`

::: fw react

```ts
type DiffineHighlight = (
  line: DiffLine,
  side: 'before' | 'after'
) => readonly DiffineToken[] | null | undefined;

interface DiffineToken {
  /** 이 구간이 줄에서 차지하는 글자 수. */
  length: number;
  className?: string;
  style?: React.CSSProperties;
}
```

컴포넌트가 그리는 줄마다, 줄 전체를 넘겨 호출합니다. 구간은 순서대로 읽고 사이의 빈 곳은 그냥 그리며, `null`이면 그 줄은 손대지 않습니다. `length`는 `String.prototype.slice`와 같은 단위로 셉니다.

:::

::: fw flutter

```dart
typedef DiffineHighlight = List<DiffineToken>? Function(DiffLine line, DiffineSide side);

class DiffineToken {
  const DiffineToken({required this.length, this.kind, this.style});

  /// 이 구간이 줄에서 차지하는 글자 수.
  final int length;
  final DiffineTokenKind? kind;
  final TextStyle? style;
}
```

위젯이 그리는 줄마다, 줄 전체를 넘겨 호출합니다. 구간은 순서대로 읽고 사이의 빈 곳은 그냥 그리며, `null`이면 그 줄은 손대지 않습니다. `length`는 `String.substring`과 같은 단위인 UTF-16 코드 유닛으로 셉니다.

`kind`는 `keyword`, `string`, `comment`, `number`, `title`, `type`, `variable`, `meta` 중 하나이고, 색은 테마가 정합니다. 애플리케이션이 만든 강조기도 읽는 사람이 고른 팔레트를 따라가게 하려는 것입니다. `style`은 색을 이미 정한 강조기를 위한 것이고, `style`이 있는 구간은 `kind`를 보지 않습니다.

:::

줄은 이 구간과 비교 결과의 경계를 모두 반영해 잘립니다. 문자열의 절반인 바뀐 단어는 문자열의 절반인 바뀐 단어로 그려집니다.

이것을 주면 `language`에 더해지는 것이 아니라 `language`를 대신합니다. 한 줄에는 구간이 한 벌뿐이고, 둘이 동시에 자르는 것에는 답이 없습니다.
