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
- **The result is a plain value.** `diffText` returns rows, changes and counts; `diffImage` returns a byte a pixel, the changes as rectangles, and the counts. Neither has a component or a widget anywhere in it, so a badge, a terminal, a worker and an isolate can use the same call the viewer does.
- **One dependency each.** The engine, the alignment and the viewer are ours. React adds `highlight.js`, behind an `import()` with each grammar, so a page whose `language` is `plain` downloads none of it. Flutter adds `characters`, which is what Flutter already ships.
- **Every part of the view is one setting.** Line numbers, wrapping, alignment, connectors, the unified view, folding away the lines nobody edited. Each one has a default, so `TextDiff` cuts down to what an application wants to show without a stylesheet or a theme file being touched — and `renderGutter` and `renderWidget` are where a review comment or a coverage bar goes.
- **Reading and writing in one component.** The editor mode lays a field over each pane and works the comparison out again on every keystroke, with the platform's own undo, input method and selection left alone.
- **Four ways of comparing two pictures.** Side by side, faded over each other, wiped across, or the mask on its own — and `unchanged` pushes the rest of the picture back or drops it, so the change is read as a picture rather than as a mark on one. `tolerance` sets how much of a difference counts, `ignoreAntialiasing` drops what a renderer's smoothing left behind, and `align` finds the offset between two shots that are not lined up. The wheel zooms about the pointer, and the pixels under it are drawn magnified with their colours written out, both sides at once.

- **More than two, when two is not the question.** `diffImages` compares a list — three renderings of one screen, four exports of one asset — in one frame, with a mask that says which of them disagree rather than that two of them do, and `ImageDiff` draws a pane per picture marked with what that one got wrong.

- **How alike two pictures are, in one number.** `imageSimilarity` is the short question a build with a threshold in it asks, where `diffImage` is the long one a reader looking at two pictures asks: a share from 0 to 1, the counts behind it, and how far apart the pixels are on average.
- **The same library twice.** The two packages share the engine, the reading of a comparison and the palette down to the colour values, so a screen written against one reads the same written against the other.

## Packages

| Package                                | Registry                                                            | Requires                               | Quick start                          |
| -------------------------------------- | ------------------------------------------------------------------- | -------------------------------------- | ------------------------------------ |
| [`packages/react`](packages/react)     | [npm: `diffine-react`](https://www.npmjs.com/package/diffine-react) | React 18 or 19, Node.js 20.19 or later | [README](packages/react/README.md)   |
| [`packages/flutter`](packages/flutter) | [pub.dev: `diffine`](https://pub.dev/packages/diffine)              | Flutter 3.32 or later                  | [README](packages/flutter/README.md) |

Each package **versions independently and keeps its own changelog** beside its own manifest, at [`packages/react/CHANGELOG.md`](packages/react/CHANGELOG.md) and [`packages/flutter/CHANGELOG.md`](packages/flutter/CHANGELOG.md), so a release on one side is not a release on the other.

## Install

```bash
npm install diffine-react
```

`react` and `react-dom` are peer dependencies: React 18 or 19.

```tsx
import { TextDiff } from "diffine-react/text-diff";
import { ImageDiff } from "diffine-react/image-diff";
import "diffine-react/styles.css";

<TextDiff before={before} after={after} />;
<ImageDiff before={saved} after={rendered} />;
```

```bash
flutter pub add diffine
```

```dart
import 'package:diffine/diffine.dart';

TextDiff(before: before, after: after);
ImageDiff(before: DiffineEncodedImage(saved), after: DiffineEncodedImage(rendered));
```

## Repository layout

| Path               | What it is                                      | How it is run                                                                        |
| ------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------ |
| `packages/react`   | The npm package, `diffine-react`                | `cd packages/react && npm install`, then `npm test`, `npm run lint`, `npm run build` |
| `packages/flutter` | The pub.dev package, `diffine`                  | `cd packages/flutter && flutter pub get`, then `flutter test`, `flutter analyze`     |
| `docs`             | The documentation site, shared by every package | `cd docs && npm install`, then `npm run dev`                                         |

There is no install at the repository root and no root manifest of any kind. Each folder is entered and run on its own.

## Documentation

| Page                                                                   | What you will find                                                                       |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [**Getting started**](https://diffine.cdget.com/guide/getting-started) | Install and setup, end to end.                                                           |
| [**Text diff**](https://diffine.cdget.com/guide/text-diff)             | Every part of the view, the editing mode, and the settings that turn each one on or off. |
| [**Image diff**](https://diffine.cdget.com/guide/image-diff)           | Comparing two pictures, and every way of reading that.                                   |
| [**Playground**](https://diffine.cdget.com/guide/playground)           | Every mode, on documents and pictures you can change.                                    |
| [**Diff engine**](https://diffine.cdget.com/guide/diff)                | What the comparison returns, and how to read it.                                         |
| [**API**](https://diffine.cdget.com/api/)                              | Every export, function and option.                                                       |
| [**Changelog**](https://diffine.cdget.com/changelog)                   | What changed in each release.                                                            |

The site is also served in Korean at [diffine.cdget.com/ko/](https://diffine.cdget.com/ko/).

## Contributing

Issues and pull requests are both welcome. [CONTRIBUTING.md](CONTRIBUTING.md) says what to run where, what a commit message looks like, and what a change is expected to carry with it. Taking part means agreeing to the [Code of Conduct](CODE_OF_CONDUCT.md).

A security problem goes through [SECURITY.md](SECURITY.md) rather than through an issue: an issue is public from the moment it is opened.

## License

[MIT](LICENSE) © [CDGet](https://cdget.com)
