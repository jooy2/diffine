---
title: imagesSimilarity
order: 10
description: '여러 이미지가 얼마나 닮았는지 숫자 하나로 말하고, 그중 어느 것이 유별난지 짚어 줍니다.'
---

# `imagesSimilarity`

::: fw react

```ts
imagesSimilarity(pictures: readonly DiffPixels[], options?: DiffImagesOptions): DiffImagesSimilarity
```

:::

::: fw flutter

```dart
DiffImagesSimilarity imagesSimilarity(List<DiffPixels> pictures, [DiffImagesOptions? options]);
```

:::

| 필드         | 무엇을 말하나                                                   |
| ------------ | --------------------------------------------------------------- |
| `similarity` | 전부가 얼마나 닮았는지, 0에서 1까지. 100을 곱하면 퍼센트입니다. |
| `identical`  | 어느 것에서도 픽셀 하나 달라지지 않았는지.                      |
| `pixels`     | 적어도 한 장이 덮는 픽셀 수.                                    |
| `matched`    | 그중 모두가 같다고 하는 픽셀 수.                                |
| `changed`    | 나머지.                                                         |
| `baseline`   | 나머지를 어느 이미지에 대고 셌는지.                             |
| `each`       | 각 이미지가 기준과 얼마나 닮았는지, 준 순서대로. 기준 자신은 1. |
| `sizes`      | 각 이미지가 얼마나 컸는지, 순서대로.                            |

쌍에 대해 [`imageSimilarity`](./image-similarity)가 묻는 짧은 질문을, 목록에 대해 묻습니다. 한 장이 구석에서 갈리든 전부가 그 자리에서 갈리든 `similarity`가 치르는 값은 같습니다. 묻는 것이 "모두 같은가"이기 때문입니다. 어느 것이 그러지 않았는지는 `each`가 말합니다. 숫자 하나로는 그런 것이 있다는 사실까지만 알 수 있습니다.

밑에서는 [`diffImages`](./diff-images)가 돌므로, 옵션의 뜻도 거기서와 같습니다.
