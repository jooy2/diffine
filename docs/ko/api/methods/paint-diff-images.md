---
title: paintDiffImages
order: 12
description: '여러 장을 비교한 마스크를 그림으로 만듭니다. 전부를 한 장에 그리거나, 하나씩 따로 그립니다.'
---

# `paintDiffImages`

::: fw react

```ts
paintDiffImages(result: DiffImagesResult, paint?: DiffImagePaint & { picture?: number }): DiffPixels
```

:::

::: fw flutter

```dart
DiffPixels paintDiffImages(DiffImagesResult result, {DiffImagePaint? paint, int? picture});
```

:::

[`paintDiffImage`](./paint-diff-image)가 쌍에 대해 하는 일, 곧 답과 파일 사이의 한 걸음을 목록에 대해 합니다. `picture`를 주지 않으면 어느 하나라도 갈리는 픽셀을 전부 칠합니다. 네 장을 비교한 실행에 한 장만 붙인다면 이것입니다. 주면 그 이미지가 기준과 갈리는 자리만 칠합니다. 네 장이면 네 파일이고, 각각이 어디서 유별난지를 그림으로 말합니다.

여기서 `added`와 `removed`는 쓰이지 않아 색도 `changed`와 `unchanged`만 읽습니다. 어떤 픽셀이 누구의 등장인지는 어느 이미지를 두고 묻느냐에 달렸고, 목록에 대한 답은 "갈린다"뿐이기 때문입니다.
