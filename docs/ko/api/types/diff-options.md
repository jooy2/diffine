---
title: DiffOptions
order: 1
description: '두 문서를 어떻게 비교할지. 비교 단위와 공백과 대소문자, 그리고 어디서 포기할지.'
---

# `DiffOptions`

::: fw react

| 옵션              | 타입                                                          | 기본값    |
| ----------------- | ------------------------------------------------------------- | --------- |
| `inline`          | `'none' \| 'word' \| 'character'`                             | `'word'`  |
| `whitespace`      | `'exact' \| 'trailing' \| 'surrounding' \| 'amount' \| 'all'` | `'exact'` |
| `ignoreCase`      | `boolean`                                                     | `false`   |
| `inlineThreshold` | `number`                                                      | `0.3`     |
| `ignore`          | `readonly RegExp[]`                                           | `[]`      |
| `maxCost`         | `number`                                                      | `5000`    |

`DIFFINE_DEFAULTS`가 이 표를 값으로 담고 있습니다.

:::

::: fw flutter

| 옵션              | 타입             | 기본값                 |
| ----------------- | ---------------- | ---------------------- |
| `inline`          | `DiffInlineMode` | `DiffInlineMode.word`  |
| `whitespace`      | `DiffWhitespace` | `DiffWhitespace.exact` |
| `ignoreCase`      | `bool`           | `false`                |
| `inlineThreshold` | `double`         | `0.3`                  |
| `ignore`          | `List<RegExp>`   | `<RegExp>[]`           |
| `maxCost`         | `int`            | `5000`                 |

`DiffInlineMode`는 `none`, `word`, `character`이고 `DiffWhitespace`는 `exact`, `trailing`, `surrounding`, `amount`, `all`입니다. `kDiffineDefaults`가 이 표를 값으로 담고 있고, 옵션 하나만 바꿀 때는 `copyWith`를 쓰면 됩니다.

:::
