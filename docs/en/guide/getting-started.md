---
title: Getting started
order: 1
---

# Getting started

Diffine ships as one package per framework, and the two are one library. They share the engine, the reading of a comparison, and the palette down to the colour values. Pick yours in the sidebar. The switch sits above the menu, and it changes what every page on this site says.

|  |  |  |
| --- | --- | --- |
| **React** | [`diffine-react`](https://www.npmjs.com/package/diffine-react) on npm | The viewer, the editor and the engine |
| **Flutter** | [`diffine`](https://pub.dev/packages/diffine) on pub.dev | The viewer, the editor and the engine |

## Requirements

::: fw react

- **React 18 or 19**, as a peer dependency, along with `react-dom`.
- **Node.js 20.19 or later** to build with.
- A browser with `ResizeObserver`, which every current one has. Without it the view still draws; it stops re-measuring when the window is resized.

:::

::: fw flutter

- **Flutter 3.32 or later**, and the Dart SDK that comes with it.
- Nothing else. The package imports neither Material nor Cupertino, so it sits inside a `MaterialApp`, a `CupertinoApp` or a bare `WidgetsApp` without pulling in a second design system.

:::

## Install

::: fw react

```bash
npm install diffine-react
```

`react` and `react-dom` are peer dependencies, so the copies your project already has are the ones Diffine uses. The one dependency is `highlight.js`, and it sits behind an `import()` — a component left on `language="plain"` fetches none of it.

:::

::: fw flutter

```bash
flutter pub add diffine
```

The one dependency is [`characters`](https://pub.dev/packages/characters), the Dart team's own, which is what Flutter already ships: a character-by-character comparison that split an emoji into its parts would mark half a glyph as changed.

:::

## Draw a comparison

::: fw react

Two props and a stylesheet:

```tsx
import { TextDiff } from 'diffine-react/text-diff';
import 'diffine-react/styles.css';

export function Review({ saved, draft }: { saved: string; draft: string }) {
  return <TextDiff before={saved} after={draft} />;
}
```

:::

::: fw flutter

Two arguments and one import:

```dart
import 'package:diffine/diffine.dart';

Widget review(String saved, String draft) {
  return TextDiff(before: saved, after: draft);
}
```

:::

<DiffineDemo sample="code" />

::: fw react

The stylesheet is imported once, anywhere in the application. It declares nothing outside the `.diffine` element, so where it sits in your import order does not matter.

:::

::: fw flutter

Nothing to wire. The palette travels with the widget instead of through a global, so one comparison can be dark inside a light screen.

:::

### Name the two sides

::: fw react

A bare string is the document. The object form names it as well, and the name is what the header over each pane says:

```tsx
<TextDiff
  before={{ content: saved, label: 'v1.2' }}
  after={{ content: draft, label: 'Working copy' }}
/>
```

:::

::: fw flutter

The document is one argument and its name is another, and the name is what the header over each pane says:

```dart
TextDiff(
  before: saved,
  beforeLabel: 'v1.2',
  after: draft,
  afterLabel: 'Working copy',
);
```

:::

### Set the height

::: fw react

It is `24rem` tall by default and scrolls inside that. Give it a height of your own on the element, or set the custom property the default comes from:

```tsx
<TextDiff before={saved} after={draft} style={{ height: '40rem' }} />
```

```css
.diffine {
  --diffine-height: 40rem;
}
```

`--diffine-height: auto` makes it as tall as the comparison, and leaves the scrolling to the page.

:::

::: fw flutter

It is 384 logical pixels tall by default and scrolls inside that. Give it a height of your own, or take the whole of whatever holds it:

```dart
TextDiff(before: saved, after: draft, height: 640);

Expanded(child: TextDiff(before: saved, after: draft, height: double.infinity));
```

The same number is on the theme, for an application setting it in one place rather than at every call:

```dart
TextDiff(
  before: saved,
  after: draft,
  theme: DiffineTheme.light.copyWith(height: 640),
);
```

:::

## Where to go next

- [**Text diff**](./text-diff) — every part of the view, the editing mode, and the <Fw react="prop" flutter="argument" /> that turns each one on or off.
- [**Image diff**](./image-diff) — comparing two pictures pixel by pixel, and every way of reading that.
- [**The comparison**](./diff) — what the engine returns, and how to read it without drawing anything.
- [**API**](../api/) — every export, function and option, in one place.
