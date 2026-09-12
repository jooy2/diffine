---
title: DiffOptions
order: 1
description: 'How two documents are compared — the inline unit, whitespace, case, and where the comparison gives up.'
---

# `DiffOptions`

::: fw react

| Option            | Type                                                          | Default   |
| ----------------- | ------------------------------------------------------------- | --------- |
| `inline`          | `'none' \| 'word' \| 'character'`                             | `'word'`  |
| `whitespace`      | `'exact' \| 'trailing' \| 'surrounding' \| 'amount' \| 'all'` | `'exact'` |
| `ignoreCase`      | `boolean`                                                     | `false`   |
| `inlineThreshold` | `number`                                                      | `0.3`     |
| `ignore`          | `readonly RegExp[]`                                           | `[]`      |
| `maxCost`         | `number`                                                      | `5000`    |

`DIFFINE_DEFAULTS` is the same table as a value.

:::

::: fw flutter

| Option            | Type             | Default                |
| ----------------- | ---------------- | ---------------------- |
| `inline`          | `DiffInlineMode` | `DiffInlineMode.word`  |
| `whitespace`      | `DiffWhitespace` | `DiffWhitespace.exact` |
| `ignoreCase`      | `bool`           | `false`                |
| `inlineThreshold` | `double`         | `0.3`                  |
| `ignore`          | `List<RegExp>`   | `<RegExp>[]`           |
| `maxCost`         | `int`            | `5000`                 |

`DiffInlineMode` is `none`, `word` or `character`; `DiffWhitespace` is `exact`, `trailing`, `surrounding`, `amount` or `all`. `kDiffineDefaults` is the same table as a value, and `copyWith` is how one option is changed without writing the rest.

:::
