---
layout: home

title: Diffine
titleTemplate: A diff engine and a viewer in one package
description: Compare two versions and show what changed — a diff engine and a side-by-side viewer in one package, with syntax highlighting fetched only when a language is asked for.

hero:
  name: Diffine
  text: See what changed
  tagline: A diff engine and a side-by-side viewer for React, in one package. Text and pictures, reading and editing.
  image:
    src: /hero.png
    alt: Diffine
    width: 300
    height: 300
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: Playground
      link: /guide/playground
    - theme: alt
      text: API
      link: /api/
    - theme: alt
      text: GitHub
      link: https://github.com/jooy2/diffine

features:
  - title: Lines and words
    details: Lines are matched first, then the words inside a pair of lines that was edited.
    link: /guide/diff
    linkText: The comparison
  - title: Plain objects out
    details: The engine returns rows, changes and counts as plain objects, with no React and no DOM in them.
    link: /guide/diff
    linkText: The comparison
  - title: Every part is a prop
    details: Line numbers, wrapping, alignment, connectors, the unified view. Each has a default, and none needs a stylesheet.
    link: /guide/text-diff
    linkText: Text diff
  - title: One dependency
    details: highlight.js, behind an import(). A page that colours nothing downloads none of it.
    link: /guide/getting-started
    linkText: Getting started
---

## What it does

- Compares two documents by line, then by word or character inside each changed line
- Compares two pictures pixel by pixel, with a tolerance, antialiasing and offset detection
- Split and unified views for text; split, overlay, wipe and mask for pictures
- An editor mode with the browser's own undo, input method and selection
- Search and replace in each pane
- Syntax highlighting for 34 languages, or your own highlighter
- Twenty thousand lines without dropping frames
- Light and dark palettes, English and Korean, keyboard and screen reader support
- TypeScript declarations in the package

## Two documents

<DiffineDemo sample="code" controls colour height="24rem" />

## Two pictures

<DiffinePictures sample="retouched" height="24rem" />

Both are the published package running on this page. [Getting started](./guide/getting-started) is the install and the first component.
