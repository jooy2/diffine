---
layout: home

title: Diffine
titleTemplate: A diff engine and a viewer in one package
description: Compare two versions and show what changed — a diff engine and a side-by-side viewer in one package, with syntax highlighting fetched only when a language is asked for.

hero:
  name: Diffine
  text: What changed, and where
  tagline: Diffine works out what changed between two versions and puts it on the screen. Two panes side by side, the matching lines held level with each other, and the words that actually moved marked inside the lines that carry them.
  image:
    src: /256x256.png
    alt: Diffine
    width: 200
    height: 200
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: Text diff
      link: /guide/text-diff
    - theme: alt
      text: API
      link: /api/
    - theme: alt
      text: GitHub
      link: https://github.com/jooy2/diffine

features:
  - title: Two levels of detail, one pass
    details: Lines are matched first, which says where the changes are. Then the words inside a pair of lines that were edited are matched too, which says what happened in them. That is the difference between "this line is different" and "this word is different", and a reader needs the second one.
    link: /guide/diff
    linkText: The comparison
  - title: The answer is a value
    details: The comparison hands back rows, changes and counts — a plain object with no React and no DOM in it. Draw it with the viewer, print it somewhere else, or work it out in a worker and hand it over. The viewer is one consumer of that value rather than the only way to reach it.
    link: /guide/diff
    linkText: The comparison
  - title: The view is made of options
    details: Line numbers, wrapping, holding the two sides level, the connectors between them, the unified view. Each one is a prop with a default, so the component goes from a full side-by-side down to a bare column of lines without a stylesheet being touched.
    link: /guide/text-diff
    linkText: Text diff
  - title: One dependency, fetched when you use it
    details: The engine, the alignment and the viewer are ours — no diff library under the comparison, no editor component under the view, no CSS framework under the styling. highlight.js is the exception, and it sits behind an import() with each grammar, so a page that colours nothing downloads none of it.
    link: /guide/getting-started
    linkText: Getting started
---

## Where it stands

The comparison, the viewer and the picture diff are written, tested and published as [`diffine-react`](https://www.npmjs.com/package/diffine-react) on npm. Every demo on this site is that package running, drawn from the same source you would install, and the [changelog](./changelog) has what moved between releases.

The packages sit in a folder of their own because more languages are the plan. Each one will version independently and keep its own changelog beside its own manifest, so a release on one side is not a release on another.

<DiffineDemo sample="code" controls colour height="24rem" />

[Getting started](./guide/getting-started) has what exists today.
