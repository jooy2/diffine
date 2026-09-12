---
title: diffImages
order: 8
description: '여러 장을 한 번에 기준 한 장과 비교하고, 어디서든 갈리는 자리를 전부 돌려줍니다.'
---

# `diffImages`

::: fw react

```ts
import { diffImages, MOST_PICTURES } from 'diffine-react/image';

const result = diffImages([saved, chrome, firefox]);
```

`(pictures: readonly DiffPixels[], options?: DiffImagesOptions) => DiffImagesResult`

:::

::: fw flutter

```dart
final DiffImagesResult result = diffImages(<DiffPixels>[saved, chrome, firefox]);
```

`DiffImagesResult diffImages(List<DiffPixels> pictures, [DiffImagesOptions? options])`

:::

한 화면을 세 곳에서 그린 결과, 한 이미지를 네 가지로 내보낸 파일, 저장해 둔 판본과 최근 다섯 번의 실행. 이럴 때 필요한 것은 모든 어긋남이 한 프레임에 얹힌 그림인데, 쌍에는 셋째 자리가 없습니다. 각 이미지는 [`diffImage`](./diff-image)가 비교하듯 기준과 그대로 비교되므로 옵션의 뜻도 쌍에서와 같고, 두 장짜리 목록은 같은 답을 다른 모양으로 돌려줍니다. [`DiffImagesOptions`](../types/diff-images-options)는 그 옵션 표에 기준 하나가 더해진 것입니다.

목록이 더하는 것은 마스크입니다. 종류가 아니라 이미지당 비트 하나입니다. `i`번째 비트는 `i`번째 이미지가 기준과 다른 자리에 켜지므로, `mask[pixel] != 0`은 "여기서 뭔가 갈리는가"이고 `mask[pixel] & (1 << i)`는 "이 이미지가 갈리는가"입니다. `added`와 `removed`는 여기 들어갈 자리가 없습니다. 어떤 픽셀이 누구의 등장인지는 어느 이미지를 두고 묻느냐에 달렸고, 목록에 대한 답은 "갈린다"뿐입니다. 돌아오는 값 전체는 [`DiffImagesResult`](../types/diff-images-result)에 있습니다.

바이트 하나는 비트 여덟 개이므로 한 번에 비교할 수 있는 것은 여덟 장까지입니다. <Fw react="`MOST_PICTURES`" flutter="`kMostPictures`" />가 그 수이고, 두 장보다 적거나 그보다 많은 목록은 답이 아니라 `RangeError`입니다. 각 이미지가 기준과 이루는 쌍은 여전히 제한이 없는 `diffImage`입니다.
