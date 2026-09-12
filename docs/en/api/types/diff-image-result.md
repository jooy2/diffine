---
title: DiffImageResult
order: 8
description: 'What diffImage returns — the frame, the mask, the regions and the counts.'
---

# `DiffImageResult`

| Field | Type | What it is |
| --- | --- | --- |
| `width` | <Fw react="`number`" flutter="`int`" code /> | The frame both pictures were compared in. |
| `height` | <Fw react="`number`" flutter="`int`" code /> |  |
| `before` | `DiffImageArea` | Where the first picture sits in that frame. |
| `after` | `DiffImageArea` | Where the second one sits. |
| `offset` | <Fw react="`{ x, y }`" flutter="`DiffImageOffset`" code /> | How far the second was moved to line the two up. |
| `mask` | `Uint8List` | What happened to each pixel of the frame, row by row. |
| `regions` | <Fw react="`DiffImageRegion[]`" flutter="`List<DiffImageRegion>`" code /> | Where the changes are, in reading order. |
| `stats` | `DiffImageStats` | How much of the frame ended up where. |
| `complete` | <Fw react="`boolean`" flutter="`bool`" code /> | Whether the list of regions holds all of them. |

A byte of `mask` is an index into <Fw react="`DIFF_PIXEL_KINDS`" flutter="`kDiffPixelKinds`" code />, which is <Fw react="`['equal', 'changed', 'added', 'removed']`" flutter="`[DiffPixelKind.equal, .changed, .added, .removed]`" code /> — so `0` is a pixel that did not change and anything else is a pixel that did.

`offset` is where the move went rather than where the contents were: a picture drawn a pixel further to the right than the first is moved a pixel to the left, and `x` is `-1`.
