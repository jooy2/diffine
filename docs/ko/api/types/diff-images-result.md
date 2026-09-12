---
title: DiffImagesResult
order: 12
description: '기준 한 장에 여러 장을 비교했을 때 돌아오는 값.'
---

# `DiffImagesResult`

[`diffImages`](../methods/diff-images)는 `DiffImageResult`가 아니라 이것을 돌려줍니다. 목록에는 `before`와 `after`가 없고, 마스크는 픽셀에 무슨 일이 있었는지가 아니라 어느 이미지가 갈리는지를 말합니다.

| 필드       | 무엇인지                                                              |
| ---------- | --------------------------------------------------------------------- |
| `width`    | 전부를 비교한 프레임의 너비.                                          |
| `height`   | 높이.                                                                 |
| `areas`    | 각 이미지가 그 안에서 놓인 자리, 넘긴 순서대로.                       |
| `offsets`  | 기준에 맞추려고 각 이미지를 얼마나 옮겼는지.                          |
| `baseline` | 나머지를 견준 기준.                                                   |
| `mask`     | 이미지당 비트 하나. `i`번째 비트는 `i`번째가 기준과 다를 때 켜집니다. |
| `regions`  | 변경이 있는 자리, 읽는 순서대로.                                      |
| `stats`    | `DiffImagesStats`.                                                    |
| `complete` | 영역 목록이 전부인지.                                                 |

`DiffImagesStats`는 쌍에서와 같은 `pixels`, `covered`, `unchanged`, `changed`, `ratio`에 더해, 각 이미지가 기준과 다른 픽셀 수를 말하는 `apart`를 가집니다.

[`imagesSimilarity`](../methods/images-similarity)가 돌려주는 `DiffImagesSimilarity`는 같은 집계를 비율로 바꾼 것입니다.
