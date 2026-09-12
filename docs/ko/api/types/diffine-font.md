---
title: DiffineFont
order: 14
description: '문서를 그리는 서체. 서체를 애플리케이션이 직접 들고 있을 때 씁니다.'
---

# `DiffineFont`

::: fw react

```ts
interface DiffineFont {
  family?: string;
  size?: string | number;
  lineHeight?: string | number;
  letterSpacing?: string | number;
}
```

`--diffine-font`, `--diffine-font-size`, `--diffine-line-height`, `--diffine-letter-spacing`와 같은 값 네 개입니다. 글꼴을 CSS가 아니라 자기 상태로 관리하는 애플리케이션을 위한 것입니다. 빠뜨린 값은 스타일시트의 값을 그대로 씁니다. 수는 픽셀이고, 문자열은 CSS가 읽는 대로입니다.

`family`는 고정폭 스택이어야 하고, `lineHeight`는 배수가 아니라 길이여야 합니다. 줄에 글자가 있든 없든 행의 높이가 그만큼이고, 에디터의 입력란이 그 행 위에 겹쳐지며, 긴 비교에서 그리지 않는 줄도 정확히 그만큼의 높이로 대신하기 때문입니다.

:::

::: fw flutter

```dart
class DiffineFont {
  const DiffineFont({
    this.family,
    this.familyFallback,
    this.size,
    this.lineHeight,
    this.letterSpacing,
  });
}
```

테마에서 글꼴 부분만 떼어 놓은 것입니다. 크기만 바꾸고 색은 그대로 두려는 화면을 위한 것입니다. 빠뜨린 값은 테마의 값을 그대로 쓰므로 `DiffineFont(size: 15)` 하나로 끝납니다. 단위는 모두 논리 픽셀입니다.

`family`는 고정폭이어야 하고, `lineHeight`는 배수가 아니라 길이입니다. 줄에 글자가 있든 없든 행의 높이가 그만큼이고, 에디터의 입력란이 그 행 위에 겹쳐지며, 아직 만들지 않은 행도 정확히 그만큼의 높이로 대신하기 때문입니다.

:::
