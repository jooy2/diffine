---
title: imageSimilarity
order: 9
description: 'Says how alike two pictures are as one number, with the counts that number was worked out from.'
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

| Field        | What it says                                                           |
| ------------ | ---------------------------------------------------------------------- |
| `similarity` | How alike the two are, from 0 to 1. Times a hundred is the percentage. |
| `identical`  | Whether not one pixel came out different.                              |
| `pixels`     | How many pixels at least one of the two covers.                        |
| `matched`    | How many of those came out the same.                                   |
| `changed`    | How many both cover and disagree about.                                |
| `added`      | How many only the second covers.                                       |
| `removed`    | How many only the first covers.                                        |
| `distance`   | How far apart two pixels are on average, over the pixels both cover.   |
| `before`     | How large the first picture was.                                       |
| `after`      | How large the second one was.                                          |

The whole comparison runs underneath, so every option means what it means there. A comparison already worked out needs no second pass: `1 - result.stats.ratio` is the same number.
