---
layout: home

title: Diffine
titleTemplate: A diff engine and a viewer in one package
description: Compare two versions and show what changed — a diff engine and a side-by-side viewer in one package, for React and for Flutter.

hero:
  name: Diffine
  text: See what changed
  tagline: A diff engine and a side-by-side viewer in one package, for React and for Flutter. Text and pictures, reading and editing.
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
  - title: Plain values out
    details: The engine returns rows, changes and counts as plain values. There is no component and no widget anywhere in them.
    link: /guide/diff
    linkText: The comparison
  - title: Every part is one setting
    details: Line numbers, wrapping, alignment, connectors, the unified view. Each has a default, and turning one on or off is one line.
    link: /guide/text-diff
    linkText: Text diff
  - title: One dependency
    details: highlight.js behind an import() in React, the Dart team's characters in Flutter. Nothing else comes along.
    link: /guide/getting-started
    linkText: Getting started
---

## What it does

- Compares two documents by line, then by word or character inside each changed line
- Compares two pictures pixel by pixel, with a tolerance, antialiasing and offset detection
- Split and unified views for text; split, overlay, wipe and mask for pictures
- An editor mode with <Fw react="the browser's" flutter="the platform's" /> own undo, input method and selection
- Search and replace in each pane
- Syntax highlighting for 34 languages, or your own highlighter
- Twenty thousand lines without dropping frames
- Light and dark palettes, English and Korean, keyboard and screen reader support
- <Fw react="TypeScript declarations in the package" flutter="No Material and no Cupertino, so it sits in any app" />

## Two documents

<DiffineDemo sample="code" controls colour height="24rem" :flutter="false" />

## Two pictures

<DiffinePictures sample="retouched" height="24rem" />

Both are the React package running on this page, because a page is what it draws in. The Flutter widget draws the same comparison from the same engine, and every page of the guide has both. [Getting started](./guide/getting-started) is the install and the first line of either one.
