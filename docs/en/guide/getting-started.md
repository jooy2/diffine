---
title: Getting started
order: 1
---

# Getting started

Diffine ships as one package per framework. Today that is React, and this page is the whole of what it takes to put a comparison on a page.

## Requirements

- **React 18 or 19**, as a peer dependency, along with `react-dom`.
- **Node.js 20.19 or later** to build with.
- A browser with `ResizeObserver`, which every current one has. Without it the view still draws; it stops re-measuring when the window is resized.

## Install

```bash
npm install diffine-react
```

`react` and `react-dom` are peer dependencies, so the copies your project already has are the ones Diffine uses. Nothing else comes with the package.

## Draw a comparison

Two props and a stylesheet:

```tsx
import { TextDiff } from 'diffine-react';
import 'diffine-react/styles.css';

export function Review({ saved, draft }: { saved: string; draft: string }) {
  return <TextDiff before={saved} after={draft} />;
}
```

<DiffineDemo sample="code" />

The stylesheet is imported once, anywhere in the application. It declares nothing outside the `.diffine` element, so where it sits in your import order does not matter.

### Name the two sides

A bare string is the document. The object form names it as well, and the name is what the header over each pane says:

```tsx
<TextDiff
  before={{ content: saved, label: 'v1.2' }}
  after={{ content: draft, label: 'Working copy' }}
/>
```

### Set the height

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

## Where to go next

- [**Text diff**](./text-diff) — every part of the view, the editing mode, and the prop that turns each one on or off.
- [**The comparison**](./diff) — what the engine returns, and how to read it without drawing anything.
- [**API**](../api/) — every export, function and option, in one place.
