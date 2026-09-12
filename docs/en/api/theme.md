---
title: Theme
order: 4
description: 'Every colour and every measurement the two views draw with, and how an application overrides one.'
---

# Theme

::: fw react

## Custom properties

Declared on `.diffine`, and overridden the same way.

### Colours

| Property                   | Light       | Dark        |
| -------------------------- | ----------- | ----------- |
| `--diffine-surface`        | `#ffffff`   | `#1b222c`   |
| `--diffine-text`           | `#1f2733`   | `#e4e9f0`   |
| `--diffine-muted`          | `#6e798c`   | `#8d99ad`   |
| `--diffine-border`         | `#d6dee9`   | `#2f3945`   |
| `--diffine-gutter`         | `#f4f7fb`   | `#232b36`   |
| `--diffine-accent`         | `#0e7ffc`   | `#4c9dff`   |
| `--diffine-invisible`      | `#b6c0cf`   | `#4b5768`   |
| `--diffine-insert-line`    | `#e7f8ee`   | `#12301f`   |
| `--diffine-insert-piece`   | `#a5e9c1`   | `#206c42`   |
| `--diffine-delete-line`    | `#fdecee`   | `#351c20`   |
| `--diffine-delete-piece`   | `#ffc3c8`   | `#7f303a`   |
| `--diffine-insert-text`    | `#1a7f4b`   | `#5fd08a`   |
| `--diffine-delete-text`    | `#c2333f`   | `#ff8b95`   |
| `--diffine-search`         | `#ffe9a8`   | `#5c4713`   |
| `--diffine-search-current` | `#ffbd3d`   | `#8a5c0f`   |
| `--diffine-blank`          | `#f0f3f7`   | `#151b23`   |
| `--diffine-selection`      | `#0e7ffc33` | `#4c9dff40` |

What a picture comparison paints with, and the two behind it:

| Property                  | Light                    | Dark                      |
| ------------------------- | ------------------------ | ------------------------- |
| `--diffine-image-changed` | `rgb(232 62 140 / 0.55)` | `rgb(255 92 168 / 0.55)`  |
| `--diffine-image-added`   | `rgb(26 127 75 / 0.5)`   | `rgb(63 190 122 / 0.5)`   |
| `--diffine-image-removed` | `rgb(194 51 63 / 0.5)`   | `rgb(255 106 116 / 0.5)`  |
| `--diffine-image-outline` | `rgb(20 28 40 / 0.85)`   | `rgb(228 233 240 / 0.85)` |
| `--diffine-image-marker`  | `rgb(14 127 252 / 0.95)` | `rgb(76 157 255 / 0.95)`  |
| `--diffine-image-halo`    | `rgb(255 255 255 / 0.6)` | `rgb(6 10 16 / 0.6)`      |
| `--diffine-image-ground`  | `#eaeef4`                | `#151b23`                 |
| `--diffine-image-chequer` | `#dbe1ea`                | `#1e2530`                 |

The `-line` pair tints a whole row; the `-piece` pair picks out what moved inside it, and only ever sits on top of the paler one. The `-text` pair is the same two colours dark enough to be read as text, for the counts in the bar under the panes, which have nothing behind them but the gutter. The `--diffine-search` pair is what a search marks: the first every match, the second the one a reader has been taken to. They are a third colour rather than the accent, because a match can land on a row that is already tinted green or red and it has to be legible on all three grounds. `--diffine-selection` is the editor's alone, and has to stay see-through: the words under a selection are drawn behind the field.

### Measurements

| Property                   | Default           | What it is                                    |
| -------------------------- | ----------------- | --------------------------------------------- |
| `--diffine-height`         | `24rem`           | How tall the viewer is. `auto` grows with it. |
| `--diffine-radius`         | `0.5rem`          | The corner radius of the frame.               |
| `--diffine-font`           | A monospace stack | The typeface the documents are drawn in.      |
| `--diffine-font-size`      | `0.8125rem`       | Its size.                                     |
| `--diffine-line-height`    | `1.5rem`          | The height of one unwrapped line.             |
| `--diffine-letter-spacing` | `normal`          | How far apart the letters are.                |
| `--diffine-links-width`    | `3rem`            | The width of the column between the panes.    |
| `--diffine-marker-width`   | `1.25rem`         | The width of the `+`, `−` and `~` column.     |

`--diffine-digits` and `--diffine-tab-size` are written onto the element by the component, from the longest document and from `tabSize`. Setting them by hand is overridden on the next render. `--diffine-gutter-width`, `--diffine-gutter-numbers`, `--diffine-gutter-markers` and `--diffine-gutter-rule` are worked out from the two above and from which columns were asked for; they are what the gutter, the stripe that carries it past the last line, and the editor's field indent are all measured with.

:::

::: fw flutter

## The palette

`DiffineTheme` is every colour and every measurement, as one value. `DiffineTheme.light` and `DiffineTheme.dark` are the two the widgets use, and `copyWith` is how an application changes a few of them:

```dart
TextDiff(
  before: saved,
  after: draft,
  theme: DiffineTheme.light.copyWith(accent: const Color(0xff7c4dff), height: 640),
);
```

Passing a theme settles `colorScheme` as well: a theme is a decision about which palette this is.

### Colours

| Field           | Light       | Dark        |
| --------------- | ----------- | ----------- |
| `surface`       | `#ffffff`   | `#1b222c`   |
| `text`          | `#1f2733`   | `#e4e9f0`   |
| `muted`         | `#6e798c`   | `#8d99ad`   |
| `border`        | `#d6dee9`   | `#2f3945`   |
| `gutter`        | `#f4f7fb`   | `#232b36`   |
| `accent`        | `#0e7ffc`   | `#4c9dff`   |
| `invisible`     | `#b6c0cf`   | `#4b5768`   |
| `insertLine`    | `#e7f8ee`   | `#12301f`   |
| `insertPiece`   | `#a5e9c1`   | `#206c42`   |
| `deleteLine`    | `#fdecee`   | `#351c20`   |
| `deletePiece`   | `#ffc3c8`   | `#7f303a`   |
| `insertText`    | `#1a7f4b`   | `#5fd08a`   |
| `deleteText`    | `#c2333f`   | `#ff8b95`   |
| `search`        | `#ffe9a8`   | `#5c4713`   |
| `searchCurrent` | `#ffbd3d`   | `#8a5c0f`   |
| `blank`         | `#f0f3f7`   | `#151b23`   |
| `selection`     | `#0e7ffc33` | `#4c9dff40` |

The `Line` pair tints a whole row; the `Piece` pair picks out what moved inside it, and only ever sits on top of the paler one. The `Text` pair is the same two colours dark enough to be read as text, for the counts in the bar under the panes, which have nothing behind them but the gutter. `search` and `searchCurrent` are what a search marks: the first every match, the second the one a reader has been taken to. They are a third colour rather than the accent, because a match can land on a row that is already tinted green or red and it has to be legible on all three grounds. `selection` is the editor's alone, and has to stay see-through: the words under a selection are painted behind the field.

`code` is a `DiffineCodeColours` with the eight a highlighter draws with — `keyword`, `string`, `comment`, `number`, `title`, `type`, `variable` and `meta` — and `image` is a `DiffineImageColours` with what a picture comparison paints with and the two behind them:

| `theme.image` | Light            | Dark             |
| ------------- | ---------------- | ---------------- |
| `changed`     | `#e83e8c` at 55% | `#ff5ca8` at 55% |
| `added`       | `#1a7f4b` at 50% | `#3fbe7a` at 50% |
| `removed`     | `#c2333f` at 50% | `#ff6a74` at 50% |
| `outline`     | `#141c28` at 85% | `#e4e9f0` at 85% |
| `marker`      | `#0e7ffc` at 95% | `#4c9dff` at 95% |
| `halo`        | `#ffffff` at 60% | `#060a10` at 60% |
| `ground`      | `#eaeef4`        | `#151b23`        |
| `chequer`     | `#dbe1ea`        | `#1e2530`        |

### Measurements

| Field                | Default           | What it is                                 |
| -------------------- | ----------------- | ------------------------------------------ |
| `height`             | `384`             | How tall the viewer is, in logical pixels. |
| `radius`             | `8`               | The corner radius of the frame.            |
| `fontFamily`         | A monospace stack | The typeface the documents are drawn in.   |
| `fontFamilyFallback` | `['monospace']`   | What to fall back to for a missing glyph.  |
| `fontSize`           | `13`              | Its size.                                  |
| `lineHeight`         | `24`              | The height of one unwrapped line.          |
| `letterSpacing`      | —                 | How far apart the letters are.             |
| `linksWidth`         | `48`              | The width of the column between the panes. |
| `tabSize`            | `4`               | How wide a tab is drawn, in characters.    |

`height` is what `TextDiff(height:)` overrides for one comparison, and `double.infinity` on either fills whatever holds it. `lineHeight` is a length rather than a multiplier, because a row is that tall whether or not it has a line in it — the editor's field is laid over rows that are, and a row the list has not built yet is stood in for by exactly that much height.

:::
