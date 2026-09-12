---
title: DiffImageOptions
order: 7
description: '두 이미지를 어떻게 비교할지. 허용 오차와 경계 보정, 어긋남 탐색, 바뀐 픽셀을 묶는 방식.'
---

# `DiffImageOptions`

::: fw react

| 옵션 | 타입 | 기본값 | 무엇을 정하는지 |
| --- | --- | --- | --- |
| `tolerance` | `number` | `0.05` | 두 픽셀이 얼마나 달라야 차이로 셀지. 0에서 1. |
| `ignoreAntialiasing` | `boolean` | `true` | 경계를 부드럽게 그린 탓에만 달라진 픽셀을 뺄지. |
| `align` | `'none' \| 'shift'` | `'none'` | 비교 전에 두 이미지의 어긋남을 찾을지. |
| `alignRadius` | `number` | `16` | 그 탐색이 몇 픽셀까지 갈지. |
| `blockSize` | `number` | `16` | 달라진 픽셀을 묶는 격자가 얼마나 성긴지. |
| `maxRegions` | `number` | `200` | 돌려줄 영역의 최대 개수. 넘으면 큰 것부터 남깁니다. |

`DIFFINE_IMAGE_DEFAULTS`가 이 표를 객체로 담고 있습니다.

:::

::: fw flutter

| 옵션 | 타입 | 기본값 | 무엇을 정하는지 |
| --- | --- | --- | --- |
| `tolerance` | `double` | `0.05` | 두 픽셀이 얼마나 달라야 차이로 셀지. 0에서 1. |
| `ignoreAntialiasing` | `bool` | `true` | 경계를 부드럽게 그린 탓에만 달라진 픽셀을 뺄지. |
| `align` | `DiffImageAlign` | `DiffImageAlign.none` | 비교 전에 두 이미지의 어긋남을 찾을지. |
| `alignRadius` | `int` | `16` | 그 탐색이 몇 픽셀까지 갈지. |
| `blockSize` | `int` | `16` | 달라진 픽셀을 묶는 격자가 얼마나 성긴지. |
| `maxRegions` | `int` | `200` | 돌려줄 영역의 최대 개수. 넘으면 큰 것부터 남깁니다. |

`kDiffineImageDefaults`가 이 표를 값으로 담고 있습니다.

:::
