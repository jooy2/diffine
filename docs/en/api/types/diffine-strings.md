---
title: DiffineStrings
order: 13
description: 'Every word the two views put on the screen, and what each of them says in English.'
---

# `DiffineStrings`

The words both views put on the screen. <Fw react="`DiffineCommonStrings`, which the two tables under it extend." flutter="Flutter keeps one table, and this is the part of it both widgets read." />

| Key              | English default                |
| ---------------- | ------------------------------ |
| `before`         | `Before`                       |
| `after`          | `After`                        |
| `empty`          | `Nothing to compare yet.`      |
| `identical`      | `The two are the same.`        |
| `previousChange` | `Previous change`              |
| `nextChange`     | `Next change`                  |
| `changePosition` | `Change {position} of {total}` |

What the document comparison adds. <Fw react="`DiffineTextStrings`, which is what `TextDiff` takes." flutter="Read by `TextDiff`." />

| Key              | English default                                                      |
| ---------------- | -------------------------------------------------------------------- |
| `placeholder`    | `Type or paste a document here.`                                     |
| `added`          | `Added`                                                              |
| `removed`        | `Removed`                                                            |
| `changed`        | `Changed`                                                            |
| `folded`         | `{lines} unchanged lines`                                            |
| `expand`         | `Show {lines} unchanged lines`                                       |
| `applyChange`    | `Take this change into {label}`                                      |
| `format`         | `{before} → {after}`                                                 |
| `mixedEndings`   | `mixed`                                                              |
| `noFinalNewline` | `no final newline`                                                   |
| `language`       | `Syntax highlighting`                                                |
| `summary`        | `{changes} changes, {inserted} lines added, {deleted} lines removed` |
| `documentSize`   | `{label}: {characters} characters, {size}`                           |
| `search`         | `Find`                                                               |
| `searchIn`       | `Find in {label}`                                                    |
| `searchPrevious` | `Previous match`                                                     |
| `searchNext`     | `Next match`                                                         |
| `searchClose`    | `Close find`                                                         |
| `searchPosition` | `Match {position} of {total}`                                        |
| `searchEmpty`    | `No matches`                                                         |
| `matchCase`      | `Match case`                                                         |
| `wholeWord`      | `Whole word`                                                         |
| `regex`          | `Regular expression`                                                 |
| `replace`        | `Replace`                                                            |
| `replaceWith`    | `Replace with`                                                       |
| `replaceAll`     | `Replace all`                                                        |

What the picture comparison adds. <Fw react="`DiffineImageStrings`, which is what `ImageDiff` takes. `DiffineStrings` is the two together, for an application that keeps one table for both." flutter="Read by `ImageDiff`." />

| Key            | English default                                      |
| -------------- | ---------------------------------------------------- |
| `imageSize`    | `{label}: {width} × {height}, {size}`                |
| `imageSummary` | `{regions} changed areas, {percent}% of the picture` |
| `choose`       | `Choose an image`                                    |
| `chooseIn`     | `Choose an image for {label}`                        |
| `unsupported`  | `That file is not an image.`                         |
| `loading`      | `Opening the picture`                                |
| `zoomOut`      | `Zoom out`                                           |
| `zoomIn`       | `Zoom in`                                            |
| `zoomFit`      | `Fit to the pane`                                    |
| `zoomLevel`    | `{percent}%`                                         |
| `fade`         | `Fade between the two`                               |
| `wipe`         | `Drag to wipe between the two`                       |
| `at`           | `At`                                                 |
| `loupeMove`    | `Drag to move the magnified pixels`                  |
| `loupeSize`    | `Drag to show more pixels`                           |

`added`, `removed`, `changed`, `summary`, `documentSize`, `changePosition`, `searchPosition`, `searchEmpty` and `imageSummary` are read by a screen reader rather than shown. `language` names the editor's menu of languages to one.

The placeholders are filled in as follows. `searchIn` and `chooseIn` fill `{label}` with the name of the side the button belongs to, so two of the same button on one <Fw react="component" flutter="widget" /> are told apart. `summary` fills `{changes}`, `{inserted}` and `{deleted}` with the counts. `documentSize` fills `{label}` with the name of a side and `{characters}` and `{size}` with numbers already written in the reader's own language, and `imageSize` fills `{width}`, `{height}` and `{size}` the same way. `imageSummary` takes `{regions}` and `{percent}`, and `zoomLevel` takes `{percent}`. `at` is what goes before the coordinates under the magnified pixels, and `loupeMove` and `loupeSize` name the handle that moves that panel and the corner that shows more pixels in it. `placeholder` is what an empty field in the editor says.

::: fw react

`strings` is a partial table, so an application changing one word passes one word — `Partial<DiffineTextStrings>` on `TextDiff` and `Partial<DiffineImageStrings>` on `ImageDiff`.

:::

::: fw flutter

`strings` is a whole `DiffineStrings` rather than a partial one, because Dart has no partial. Start from the locale's own and replace what you mean to change:

```dart
TextDiff(
  before: saved,
  after: draft,
  strings: baseStringsFor(DiffineLocale.en).copyWith(before: 'Saved', after: 'Draft'),
);
```

:::
