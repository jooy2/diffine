---
title: diffImage
order: 7
description: '두 이미지를 픽셀 단위로 비교합니다. 허용 오차, 경계 보정, 어긋남 보정을 지원합니다.'
---

# `diffImage`

::: fw react

```ts
import { diffImage } from 'diffine-react/image';

const result = diffImage(before, after, { align: 'shift' });
```

`(before: DiffPixels, after: DiffPixels, options?: DiffImageOptions) => DiffImageResult`

:::

::: fw flutter

```dart
final DiffImageResult result = diffImage(
  before,
  after,
  const DiffImageOptions(align: DiffImageAlign.shift),
);
```

`DiffImageResult diffImage(DiffPixels before, DiffPixels after, [DiffImageOptions? options])`

:::

두 이미지를 픽셀 단위로 비교합니다. 크기가 같을 필요는 없습니다. 한쪽만 덮는 자리는 오류가 아니라 `added`나 `removed`로 돌아옵니다.

어떻게 비교할지는 [`DiffImageOptions`](../types/diff-image-options)이고, 돌아오는 값은 [`DiffImageResult`](../types/diff-image-result)입니다.
