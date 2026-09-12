---
title: paintDiffImage
order: 11
description: '이미지 비교 마스크를 그림 한 장으로 만듭니다. 그것으로 파일을 써야 할 때 씁니다.'
---

# `paintDiffImage`

::: fw react

```ts
paintDiffImage(result: DiffImageResult, paint?: DiffImagePaint): DiffPixels

interface DiffImagePaint {
  changed?: [number, number, number, number]; // [232, 62, 140, 255]
  added?: [number, number, number, number]; // [26, 127, 75, 255]
  removed?: [number, number, number, number]; // [194, 51, 63, 255]
  unchanged?: [number, number, number, number]; // [0, 0, 0, 0]
}
```

마스크를 프레임 크기의 그림 한 장으로 만듭니다. 이것으로 파일을 써야 하는 애플리케이션을 위한 것입니다. 색은 CSS 문자열이 아니라 바이트 네 개입니다. CSS 색을 읽으려면 브라우저에 물어봐야 하기 때문입니다. 파일로 쓰는 일은, 파일을 읽는 일과 마찬가지로 애플리케이션의 몫입니다.

:::

::: fw flutter

```dart
DiffPixels paintDiffImage(DiffImageResult result, [DiffImagePaint? paint]);

class DiffImagePaint {
  const DiffImagePaint({this.changed, this.added, this.removed, this.unchanged});

  final Color? changed; // Color(0xffe83e8c)
  final Color? added; // Color(0xff1a7f4b)
  final Color? removed; // Color(0xffc2333f)
  final Color? unchanged; // 투명
}
```

마스크를 프레임 크기의 그림 한 장으로 만듭니다. 이것으로 파일을 써야 하는 애플리케이션을 위한 것입니다. 돌아오는 것은 `DiffPixels`이므로 `ui.decodeImageFromPixels`로 그릴 것을, 인코더로 저장할 것을 만들면 됩니다. 파일로 쓰는 일은, 파일을 읽는 일과 마찬가지로 애플리케이션의 몫입니다.

:::
