---
title: DiffineRender
order: 16
description: 'renderGutter와 renderWidget이 받는 값. 줄 옆이나 아래에 애플리케이션의 것을 넣습니다.'
---

# `DiffineRender`

::: fw react

```ts
type DiffineRender = (line: DiffLine, side: DiffineSide) => React.ReactNode;
```

`renderGutter`와 `renderWidget`이 받는 형태입니다. 창이 그리는 줄마다 한 번씩 호출되므로, 가상화가 켜져 있으면 화면에 보이는 줄에 대해서만 호출됩니다. 양쪽 높이를 맞추려고 넣은 빈 칸은 줄이 아니라서 묻지 않습니다. `renderWidget`은 `virtualize`를 끕니다. 애플리케이션이 줄 아래에 그린 것은 언제든 커질 수 있고, 그런 행을 대신 세워 두면 엉뚱한 자리에 서기 때문입니다. `wrap`은 끄지 않습니다. 접힌 행의 높이는 창의 너비와 글꼴을 따르고, 둘 다 지켜보고 있습니다.

:::

::: fw flutter

```dart
typedef DiffineRender = Widget? Function(DiffLine line, DiffineSide side);
```

`renderGutter`와 `renderWidget`이 받는 형태입니다. 창이 만드는 줄마다 한 번씩 호출되므로 문서 전체가 아니라 화면에 보이는 줄에 대해서만 호출됩니다. 양쪽 높이를 맞추려고 넣은 빈 칸은 줄이 아니라서 묻지 않습니다. 넣을 것이 없는 줄에는 `null`을 돌려주세요.

`renderWidget`을 주면 줄 높이를 짐작하지 않고 모든 행을 미리 잽니다. 애플리케이션이 줄 아래에 그린 것은 그린 만큼 높고, 맞은편 줄도 같은 높이를 받아야 하기 때문입니다.

:::
