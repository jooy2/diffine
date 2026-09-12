---
title: DiffImagesResult
order: 12
description: 'What a comparison of several pictures against a baseline returns.'
---

# `DiffImagesResult`

[`diffImages`](../methods/diff-images) returns this rather than a `DiffImageResult`: a list has no `before` and `after`, and the mask says which of them disagree rather than what happened to a pixel.

| Field      | What it is                                                                          |
| ---------- | ----------------------------------------------------------------------------------- |
| `width`    | How wide the frame all of them were compared in is.                                 |
| `height`   | How tall it is.                                                                     |
| `areas`    | Where each picture sits in it, in the order they were given.                        |
| `offsets`  | How far each was moved to line it up with the baseline.                             |
| `baseline` | Which of them the rest were counted against.                                        |
| `mask`     | A bit a picture: bit `i` is set where the picture at `i` differs from the baseline. |
| `regions`  | Where the changes are, in reading order.                                            |
| `stats`    | A `DiffImagesStats`.                                                                |
| `complete` | Whether the list of regions holds all of them.                                      |

`DiffImagesStats` is `pixels`, `covered`, `unchanged`, `changed` and `ratio` as a pair's is, with `apart` saying how many pixels each picture disagrees with the baseline about.

`DiffImagesSimilarity`, which [`imagesSimilarity`](../methods/images-similarity) returns, is the same counts as shares.
