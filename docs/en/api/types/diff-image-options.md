---
title: DiffImageOptions
order: 7
description: 'How two pictures are compared — tolerance, antialiasing, the offset search, and how changed pixels are grouped.'
---

# `DiffImageOptions`

::: fw react

| Option | Type | Default | What it decides |
| --- | --- | --- | --- |
| `tolerance` | `number` | `0.05` | How different two pixels have to be, from 0 to 1, before it counts. |
| `ignoreAntialiasing` | `boolean` | `true` | Whether a pixel that only differs because an edge was drawn smooth is left out. |
| `align` | `'none' \| 'shift'` | `'none'` | Whether an offset between the two is looked for first. |
| `alignRadius` | `number` | `16` | How far that search goes, in pixels. |
| `blockSize` | `number` | `16` | How coarse the grid is that changed pixels are grouped on. |
| `maxRegions` | `number` | `200` | The most regions to return. Past this the largest are kept. |

`DIFFINE_IMAGE_DEFAULTS` is that table as an object.

:::

::: fw flutter

| Option | Type | Default | What it decides |
| --- | --- | --- | --- |
| `tolerance` | `double` | `0.05` | How different two pixels have to be, from 0 to 1, before it counts. |
| `ignoreAntialiasing` | `bool` | `true` | Whether a pixel that only differs because an edge was drawn smooth is left out. |
| `align` | `DiffImageAlign` | `DiffImageAlign.none` | Whether an offset between the two is looked for first. |
| `alignRadius` | `int` | `16` | How far that search goes, in pixels. |
| `blockSize` | `int` | `16` | How coarse the grid is that changed pixels are grouped on. |
| `maxRegions` | `int` | `200` | The most regions to return. Past this the largest are kept. |

`kDiffineImageDefaults` is that table as a value.

:::
