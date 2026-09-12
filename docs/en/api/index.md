---
title: API
order: 1
description: 'Every export of Diffine, a page apiece — the two views, the engine behind them, the values they pass around, and the theme.'
---

# API

<Fw react="Every export of `diffine-react`, a page apiece." flutter="Every export of `diffine`, a page apiece." /> The [guide](../guide/getting-started) is where each of them is explained; this is what to look one up in.

## Entry points

::: fw react

| Import | What it holds | Before it draws |
| --- | --- | --- |
| `diffine-react` | The whole comparison: text, pictures, patches and the types. | 2.6 kB |
| `diffine-react/diff` | The text comparison, on its own. | 2.9 kB |
| `diffine-react/image` | The picture comparison, on its own. | 2.6 kB |
| `diffine-react/patch` | Reading and writing a unified diff. | 3.3 kB |
| `diffine-react/text-diff` | `TextDiff`, and `DIFFINE_LANGUAGES`. | 17.6 kB |
| `diffine-react/image-diff` | `ImageDiff`. | 10.5 kB |
| `diffine-react/types` | The types on their own, for an application naming one in a prop. | 0 kB |
| `diffine-react/styles.css` | The stylesheet, for both components. | 4.3 kB |

Nothing reaches a bundle that did not ask for it. The root is functions and types, so a page that counts the changes without drawing them carries no React and no stylesheet; each view is its own import, so a page with one of them carries one of them. The sizes are gzipped with React left out, and they are what a page fetches before it draws — a grammar is not among them, because `TextDiff` asks for one only when it is given a `language`.

:::

::: fw flutter

```dart
import 'package:diffine/diffine.dart';
```

One import holds all of it: the two widgets, the engine, the values it returns and the theme. There is no second entry for the engine on its own, because there is nothing for one to save — a program that only calls `diffText` is a program with no reference to a widget, and the compiler drops what nothing refers to.

:::

## What is here

| Group | What is in it |
| --- | --- |
| [Components](./components/) | The two <Fw react="components" flutter="widgets" />, and every <Fw react="prop" flutter="argument" /> each of them takes. |
| [Methods](./methods/) | The engine: the comparisons, and reading and writing a patch. |
| [Types](./types/) | What those return and what they take. |
| [Theme](./theme) | <Fw react="The custom properties the stylesheet declares." flutter="Every colour and every measurement, as one value." /> |

One page per item, so the address of a page is the name of the thing on it.
