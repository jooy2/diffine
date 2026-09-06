<img src="docs/public/128x128.png" alt="Diffine" width="96" height="96" />

# Diffine

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/jooy2/diffine/blob/main/LICENSE) [![npm latest package](https://img.shields.io/npm/v/diffine-react/latest.svg)](https://www.npmjs.com/package/diffine-react) [![npm downloads](https://img.shields.io/npm/dm/diffine-react.svg)](https://www.npmjs.com/package/diffine-react)

### 📘 [**diffine.cdget.com**](https://diffine.cdget.com)

Guides and the full API, in English and Korean. This README is the map; each package has a quick start of its own.

---

> **Diffine works out what changed between two versions and puts it on the screen.** Two panes side by side, the matching lines held level with each other, and the words that actually moved marked inside the lines that carry them — to read in the viewer, or to type into in the editor. Two pictures get the same treatment a pixel at a time: what changed tinted over both, boxed where it is worth stepping to, under one zoom that moves the pair. The comparison and the view are one package: what the engine found is what both of them draw.

> [!NOTE]
> **`0.0.1`.** The comparisons and every mode of the view are written and they run. The names are not settled yet, so treat every export as something that can still change shape until `1.0.0`.

## Why Diffine

- **The comparison is a value, not a rendering.** `diffText` hands back rows, blocks and counts, and `diffImage` hands back a byte a pixel, the changes as rectangles, and the counts — plain objects with no React and no DOM in them. Draw one with the viewer, print it in a terminal, or work it out in a worker; the viewer is one consumer of that value rather than the only way to reach it.
- **Two levels of detail, in one pass.** Lines are matched first, then the words or characters inside a pair of lines that were changed rather than replaced. That is the difference between "this line is different" and "this word is different", and a reader needs the second one.
- **One dependency, and it is fetched rather than shipped.** The engine, the alignment and the viewer are ours: no diff library underneath, no editor component, no CSS framework. `highlight.js` is the exception, and it sits behind an `import()` along with each grammar — a page whose `language` is `plain` downloads none of it.
- **The view is made of options.** Line numbers, wrapping, holding the two sides level, the connectors between them, the unified view: each one is a prop with a default, so `TextDiff` can be cut down to what an application actually wants to show.
- **Reading and writing are one component.** `mode="editor"` lays a field over each pane and works the comparison out again on every keystroke — the same rows, the same colours, with the browser's own undo, input method and selection left where they were. `ImageDiff` takes the same word for the same idea: an empty pane invites a picture and a full one takes one dropped on it.
- **Two pictures, four ways of looking at them.** Side by side, one faded over the other, one wiped across it, or the mask on its own. `tolerance` decides how much of a difference counts, `ignoreAntialiasing` drops what a renderer's own smoothing left behind, and `align` finds the offset between two shots that are not lined up before either question is asked.
- **Types in the box.** TypeScript declarations ship with the package, so your editor knows the prop names and the values they take before you do.

## Packages

| Package                            | Registry                                                            | Requires                               | Quick start                        |
| ---------------------------------- | ------------------------------------------------------------------- | -------------------------------------- | ---------------------------------- |
| [`packages/react`](packages/react) | [npm: `diffine-react`](https://www.npmjs.com/package/diffine-react) | React 18 or 19, Node.js 20.19 or later | [README](packages/react/README.md) |

More languages are the reason the packages sit in a folder of their own rather than at the root. Each one **versions independently and keeps its own changelog** beside its own manifest — [`packages/react/CHANGELOG.md`](packages/react/CHANGELOG.md) — so a release on one side is not a release on another.

## Install

```bash
npm install diffine-react
```

`react` and `react-dom` are peer dependencies — React 18 or 19.

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

There is no install at the repository root and no root manifest of any kind — each folder is entered and run on its own.

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
