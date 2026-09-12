---
title: imageSimilarity
order: 9
description: '두 이미지가 얼마나 닮았는지 숫자 하나로 말하고, 그 숫자를 만든 집계도 함께 돌려줍니다.'
---

# `imageSimilarity`

::: fw react

```ts
imageSimilarity(before: DiffPixels, after: DiffPixels, options?: DiffImageOptions): DiffImageSimilarity
```

:::

::: fw flutter

```dart
DiffImageSimilarity imageSimilarity(DiffPixels before, DiffPixels after, [DiffImageOptions? options]);
```

:::

| 필드         | 무엇을 말하는지                                                      |
| ------------ | -------------------------------------------------------------------- |
| `similarity` | 두 이미지가 얼마나 닮았는지, 0에서 1까지. 100을 곱하면 퍼센트입니다. |
| `identical`  | 한 픽셀도 다르지 않은지.                                             |
| `pixels`     | 둘 가운데 하나라도 덮는 픽셀 수.                                     |
| `matched`    | 그중 값이 같은 픽셀 수.                                              |
| `changed`    | 둘 다 덮고 값이 다른 픽셀 수.                                        |
| `added`      | 두 번째만 덮는 픽셀 수.                                              |
| `removed`    | 첫 번째만 덮는 픽셀 수.                                              |
| `distance`   | 둘 다 덮는 픽셀의 평균 색 거리.                                      |
| `before`     | 첫 번째 이미지의 크기.                                               |
| `after`      | 두 번째 이미지의 크기.                                               |

안에서 비교 전체가 돌아가므로 옵션의 뜻은 `diffImage`에서와 같습니다. 이미 구한 결과가 있다면 다시 돌릴 필요가 없습니다. `1 - result.stats.ratio`가 같은 값입니다.
