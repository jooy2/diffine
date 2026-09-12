---
title: DiffPixels
order: 6
description: 'A picture as bytes — red, green, blue and alpha, with the width and the height.'
---

# `DiffPixels`

| Field | Type | What it is |
| --- | --- | --- |
| `data` | <Fw react="`Uint8ClampedArray`" flutter="`Uint8List`" code /> | Red, green, blue and alpha, a byte each, `width * height * 4` long. |
| `width` | <Fw react="`number`" flutter="`int`" code /> |  |
| `height` | <Fw react="`number`" flutter="`int`" code /> |  |

<Fw react="The same shape as `ImageData`, so what a canvas hands back can be passed straight in." flutter="The same shape `ui.Image.toByteData` hands back in `ui.ImageByteFormat.rawRgba`, so a decoded picture reaches the engine without a copy of its own." />
