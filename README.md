<img src="docs/public/128x128.png" alt="Diffine" width="96" height="96" />

# Diffine

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/jooy2/diffine/blob/main/LICENSE) [![npm latest package](https://img.shields.io/npm/v/diffine-react/latest.svg)](https://www.npmjs.com/package/diffine-react) [![npm downloads](https://img.shields.io/npm/dm/diffine-react.svg)](https://www.npmjs.com/package/diffine-react)

### 📘 [**diffine.cdget.com**](https://diffine.cdget.com)

Guides and the full API, in English and Korean. This README is the map; each package has a quick start of its own.

---

> **Diffine compares two versions and shows what changed.** A diff engine and a side-by-side viewer in one package, for text and for pictures, to read or to type into.

## What you get

- **Lines, then words.** Lines are matched first, then the words or characters inside a pair of lines that was edited rather than replaced.
- **A patch is a comparison too.** `parsePatch` reads a unified diff into the same value `diffText` returns, so a service that already holds the comparison can send that instead of both documents, and `formatPatch` writes one back out for anything downstream that reads the format.
- **The result is a plain object.** `diffText` returns rows, changes and counts; `diffImage` returns a byte a pixel, the changes as rectangles, and the counts. Both are plain objects with no React and no DOM in them, so a badge, a terminal and a worker can use the same call the viewer does.
- **One dependency, fetched rather than shipped.** The engine, the alignment and the viewer are ours. `highlight.js` is the only dependency and it sits behind an `import()` with each grammar, so a page whose `language` is `plain` downloads none of it.
- **Every part of the view is a prop.** Line numbers, wrapping, alignment, connectors, the unified view, folding away the lines nobody edited. Each one has a default, so `TextDiff` cuts down to what an application wants to show without a stylesheet being touched — and `renderGutter` and `renderWidget` are where a review comment or a coverage bar goes.
- **Reading and writing in one component.** `mode="editor"` lays a field over each pane and works the comparison out again on every keystroke, with the browser's own undo, input method and selection left alone.
- **Four ways of comparing two pictures.** Side by side, faded over each other, wiped across, or the mask on its own. `tolerance` sets how much of a difference counts, `ignoreAntialiasing` drops what a renderer's smoothing left behind, and `align` finds the offset between two shots that are not lined up.
- **Types in the box.** TypeScript declarations ship with the package.

## Packages

| Package                            | Registry                                                            | Requires                               | Quick start                        |
| ---------------------------------- | ------------------------------------------------------------------- | -------------------------------------- | ---------------------------------- |
| [`packages/react`](packages/react) | [npm: `diffine-react`](https://www.npmjs.com/package/diffine-react) | React 18 or 19, Node.js 20.19 or later | [README](packages/react/README.md) |

The packages sit in a folder of their own because more are planned. Each one **versions independently and keeps its own changelog** beside its own manifest, at [`packages/react/CHANGELOG.md`](packages/react/CHANGELOG.md), so a release on one side is not a release on another.

## Install

```bash
npm install diffine-react
```

`react` and `react-dom` are peer dependencies: React 18 or 19.

```tsx
import { ImageDiff, TextDiff } from "diffine-react";
import "diffine-react/styles.css";

<TextDiff before={before} after={after} />;
<ImageDiff before={saved} after={rendered} />;
```

## Repository layout

| Path             | What it is                                      | How it is run                                                                        |
| ---------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------ |
| `packages/react` | The npm package, `diffine-react`                | `cd packages/react && npm install`, then `npm test`, `npm run lint`, `npm run build` |
| `docs`           | The documentation site, shared by every package | `cd docs && npm install`, then `npm run dev`                                         |

There is no install at the repository root and no root manifest of any kind. Each folder is entered and run on its own.

## Documentation

| Page                                                                   | What you will find                                       |
| ---------------------------------------------------------------------- | -------------------------------------------------------- |
| [**Getting started**](https://diffine.cdget.com/guide/getting-started) | Install and setup, end to end.                           |
| [**Text diff**](https://diffine.cdget.com/guide/text-diff)             | Every part of the view, the editing mode, and the props. |
| [**Image diff**](https://diffine.cdget.com/guide/image-diff)           | Comparing two pictures, and every way of reading that.   |
| [**Playground**](https://diffine.cdget.com/guide/playground)           | Every mode, on documents and pictures you can change.    |
| [**Diff engine**](https://diffine.cdget.com/guide/diff)                | What the comparison returns, and how to read it.         |
| [**API**](https://diffine.cdget.com/api/)                              | Every export, function and option.                       |
| [**Changelog**](https://diffine.cdget.com/changelog)                   | What changed in each release.                            |

The site is also served in Korean at [diffine.cdget.com/ko/](https://diffine.cdget.com/ko/).

## Contributing

Issues and pull requests are both welcome. [CONTRIBUTING.md](CONTRIBUTING.md) says what to run where, what a commit message looks like, and what a change is expected to carry with it. Taking part means agreeing to the [Code of Conduct](CODE_OF_CONDUCT.md).

A security problem goes through [SECURITY.md](SECURITY.md) rather than through an issue: an issue is public from the moment it is opened.

## License

[MIT](LICENSE) © [CDGet](https://cdget.com)
