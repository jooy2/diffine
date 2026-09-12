---
title: DiffImageStats
order: 10
description: 'How much of the frame was left alone, changed, added or removed, and how far apart the two pictures are.'
---

# `DiffImageStats`

| Field       | What it counts                                                       |
| ----------- | -------------------------------------------------------------------- |
| `pixels`    | How many pixels the frame holds.                                     |
| `covered`   | How many of those at least one of the two pictures reaches.          |
| `unchanged` | Pixels both cover and agree about.                                   |
| `changed`   | Pixels both cover and disagree about.                                |
| `added`     | Pixels only the second picture covers.                               |
| `removed`   | Pixels only the first one covers.                                    |
| `ratio`     | Everything that is not `unchanged`, as a share of `covered`.         |
| `distance`  | How far apart two pixels are on average, over the pixels both cover. |

The four counts add up to `covered` rather than to `pixels`. Two pictures one of which is wider and the other taller leave a corner of the frame neither of them reaches, and those pixels are nothing at all rather than pixels that agree.
