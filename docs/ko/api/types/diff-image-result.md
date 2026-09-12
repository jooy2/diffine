---
title: DiffImageResult
order: 8
description: 'diffImage가 돌려주는 값. 프레임과 마스크와 영역 목록과 집계.'
---

# `DiffImageResult`

| 필드 | 타입 | 무엇인지 |
| --- | --- | --- |
| `width` | <Fw react="`number`" flutter="`int`" code /> | 두 이미지를 비교한 프레임. |
| `height` | <Fw react="`number`" flutter="`int`" code /> |  |
| `before` | `DiffImageArea` | 그 프레임에서 첫 번째 이미지가 놓인 자리. |
| `after` | `DiffImageArea` | 두 번째 이미지가 놓인 자리. |
| `offset` | <Fw react="`{ x, y }`" flutter="`DiffImageOffset`" code /> | 둘을 맞추려고 두 번째를 얼마나 옮겼는지. |
| `mask` | `Uint8List` | 프레임의 픽셀마다 무슨 일이 있었는지, 한 줄씩. |
| `regions` | <Fw react="`DiffImageRegion[]`" flutter="`List<DiffImageRegion>`" code /> | 변경이 있는 자리. 읽는 순서대로. |
| `stats` | `DiffImageStats` | 프레임이 어느 쪽으로 얼마나 갔는지. |
| `complete` | <Fw react="`boolean`" flutter="`bool`" code /> | 영역 목록이 전부인지. |

`mask`의 한 바이트는 <Fw react="`DIFF_PIXEL_KINDS`" flutter="`kDiffPixelKinds`" code />의 인덱스입니다. <Fw react="`['equal', 'changed', 'added', 'removed']`" flutter="`[DiffPixelKind.equal, .changed, .added, .removed]`" code />이므로 `0`이 그대로인 픽셀이고 나머지는 달라진 픽셀입니다.

`offset`은 내용이 어디 있었는지가 아니라 어디로 옮겼는지입니다. 내용이 1픽셀 오른쪽에 그려진 이미지는 1픽셀 왼쪽으로 옮기므로 `x`는 `-1`입니다.
