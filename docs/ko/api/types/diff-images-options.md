---
title: DiffImagesOptions
order: 11
description: '여러 이미지를 어떻게 비교할지. 쌍이 받는 옵션 전부와, 나머지를 어느 한 장에 대고 셀지.'
---

# `DiffImagesOptions`

::: fw react

```ts
interface DiffImagesOptions extends DiffImageOptions {
  baseline?: number; // 0
}
```

:::

::: fw flutter

```dart
class DiffImagesOptions extends DiffImageOptions {
  const DiffImagesOptions({
    this.baseline = 0,
    super.tolerance,
    super.ignoreAntialiasing,
    super.align,
    super.alignRadius,
    super.blockSize,
    super.maxRegions,
  });

  final int baseline;
}
```

:::

[`DiffImageOptions`](./diff-image-options)가 가진 옵션 전부를 같은 기본값으로 받고, 하나가 더 있습니다.

여러 장 비교는 두 질문 중 하나를 묻고, `baseline`이 그중 어느 쪽인지 정합니다. 기준을 두면 "각각이 저것과 얼마나 다른가"이고, 저장해 둔 판본과 네 번의 실행을 비교하는 일이 이것입니다. 기준을 따지지 않으면 "이것들이 어디서 갈리는가"이고, 그 답은 어느 것부터 세든 같습니다. 모두가 같다고 하는 픽셀은 누가 기준이든 비트가 켜지지 않기 때문입니다.
