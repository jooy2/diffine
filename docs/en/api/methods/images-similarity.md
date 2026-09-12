---
title: imagesSimilarity
order: 10
description: 'Says how alike several pictures are as one number, and which of them is the odd one out.'
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

| Field        | What it says                                                                  |
| ------------ | ----------------------------------------------------------------------------- |
| `similarity` | How alike they all are, from 0 to 1. Times a hundred is the percentage.       |
| `identical`  | Whether not one pixel of any of them came out different.                      |
| `pixels`     | How many pixels at least one of them covers.                                  |
| `matched`    | How many of those every one of them agrees about.                             |
| `changed`    | The rest.                                                                     |
| `baseline`   | Which picture the rest were counted against.                                  |
| `each`       | How alike each picture is to the baseline, in order. The baseline's own is 1. |
| `sizes`      | How large each picture was, in order.                                         |

The shorter question [`imageSimilarity`](./image-similarity) asks about a pair, asked about a list. One picture disagreeing in a corner costs the set exactly as much as all of them disagreeing there, because what `similarity` asks is whether they agree — `each` is what says which of them did not, where the one number only says that one of them exists.

[`diffImages`](./diff-images) runs underneath, so every option means what it means there.
