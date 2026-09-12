---
title: DiffPixels
order: 6
description: '바이트로 본 이미지. 빨강과 초록과 파랑과 알파, 그리고 너비와 높이.'
---

# `DiffPixels`

| 필드 | 타입 | 무엇인지 |
| --- | --- | --- |
| `data` | <Fw react="`Uint8ClampedArray`" flutter="`Uint8List`" code /> | 빨강, 초록, 파랑, 알파를 1바이트씩. 길이는 `width * height * 4`. |
| `width` | <Fw react="`number`" flutter="`int`" code /> |  |
| `height` | <Fw react="`number`" flutter="`int`" code /> |  |

<Fw react="`ImageData`와 같은 모양입니다. 캔버스가 돌려준 것을 그대로 넣으면 됩니다." flutter="`ui.Image.toByteData`를 `ui.ImageByteFormat.rawRgba`로 부르면 나오는 모양입니다. 해석해 둔 이미지를 따로 복사하지 않고 엔진에 넣을 수 있습니다." />
