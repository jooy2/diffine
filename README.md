<img src="docs/public/128x128.png" alt="Diffine" width="96" height="96" />

# Diffine

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/jooy2/diffine/blob/main/LICENSE) [![npm latest package](https://img.shields.io/npm/v/diffine-react/latest.svg)](https://www.npmjs.com/package/diffine-react) [![npm downloads](https://img.shields.io/npm/dm/diffine-react.svg)](https://www.npmjs.com/package/diffine-react)

### 📘 [**diffine.cdget.com**](https://diffine.cdget.com)

Guides and the full API, in English and Korean. This README is the map; each package has a quick start of its own.

---

> **Diffine works out what changed between two versions and puts it on the screen.** Two panes side by side, the matching lines held level with each other, and the words that actually moved marked inside the lines that carry them — to read in the viewer, or to type into in the editor. The comparison and the view are one package: what the engine found is what both of them draw.

> [!NOTE]
> **`0.0.1`.** The comparison, the viewer and the editor are written and they run. The names are not settled yet, so treat every export as something that can still change shape until `1.0.0`.

## Why Diffine

- **The comparison is a value, not a rendering.** `diffText` hands back rows, blocks and counts — a plain object with no React and no DOM in it. Draw it with the viewer, print it in a terminal, or send it somewhere else; the viewer is one consumer of that value rather than the only way to reach it.
- **Two levels of detail, in one pass.** Lines are matched first, then the words or characters inside a pair of lines that were changed rather than replaced. That is the difference between "this line is different" and "this word is different", and a reader needs the second one.
- **Nothing in the dependency list.** The engine, the alignment and the viewer are ours. There is no diff library underneath, no editor component, and no CSS framework.
- **The viewer is made of options.** Line numbers, wrapping, holding the two sides level, the connectors between them, the unified view: each one is a prop with a default, so the component can be cut down to what an application actually wants to show.
- **The editor is the same view, made editable.** A field over each pane, and the comparison worked out again on every keystroke — with the browser's own undo, input method and selection left where they were.
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
import { DiffineViewer } from "diffine-react";
import "diffine-react/styles.css";

<DiffineViewer before={before} after={after} />;
```

## Repository layout

| Path             | What it is                                      | How it is run                                                                        |
| ---------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------ |
| `packages/react` | The npm package, `diffine-react`                | `cd packages/react && npm install`, then `npm test`, `npm run lint`, `npm run build` |
| `docs`           | The documentation site, shared by every package | `cd docs && npm install`, then `npm run dev`                                         |

There is no install at the repository root and no root manifest of any kind — each folder is entered and run on its own.

## Documentation

| Page                                                                   | What you will find                                            |
| ---------------------------------------------------------------------- | ------------------------------------------------------------- |
| [**Getting started**](https://diffine.cdget.com/guide/getting-started) | Install and setup, end to end.                                |
| [**Viewer**](https://diffine.cdget.com/guide/viewer)                   | Every part of the view, and the prop that turns it on or off. |
| [**Editor**](https://diffine.cdget.com/guide/editor)                   | The two panes made editable, and what that costs.             |
| [**Playground**](https://diffine.cdget.com/guide/playground)           | Both components, on documents you can change.                 |
| [**Diff engine**](https://diffine.cdget.com/guide/diff)                | What the comparison returns, and how to read it.              |
| [**API**](https://diffine.cdget.com/api/)                              | Every component, function and option.                         |
| [**Changelog**](https://diffine.cdget.com/changelog)                   | What changed in each release.                                 |

The site is also served in Korean at [diffine.cdget.com/ko/](https://diffine.cdget.com/ko/).

## License

[MIT](LICENSE) © [CDGet](https://cdget.com)
