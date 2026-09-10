# Contributing to Diffine

Bug reports, fixes, documentation and new ideas are all welcome. This page covers what to know before you start.

Diffine follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Taking part means you have read it and agree to it. To report a security problem, do not open an issue; see [SECURITY.md](SECURITY.md).

## Issues

Open one at https://github.com/jooy2/diffine/issues. You can email the maintainer instead, but an issue is easier for everyone to follow.

Before you write it:

- Search for an issue that already says it.
- Say whether it is a bug, a request, or a question, in the first line.
- Say what happens and what you expected instead. A screenshot, a recording, or a pair of documents that reproduce it is worth more than a description of either.
- Give the title words somebody else would search for.
- Say which package and which version of it you are on, and whatever else could matter: the React version and the browser, or the Flutter version and the platform.
- Write in English.

## What is in this repository

There is no install at the root and no root manifest. Each folder is entered and run on its own.

| Path               | What it is                               | How to run it                                                                          |
| ------------------ | ---------------------------------------- | -------------------------------------------------------------------------------------- |
| `packages/react`   | The npm package, `diffine-react`         | `cd packages/react && npm install`, then `npm test`, `npm run lint`, `npm run build`   |
| `packages/flutter` | The pub.dev package, `diffine`           | `cd packages/flutter && flutter pub get`, then `flutter test`, `flutter analyze`       |
| `docs`             | The documentation site, in two languages | `cd docs && npm install`, then `npm run dev`                                           |

The site renders the React library from `packages/react/src` rather than from a build, so an edit to a component is on the page as soon as it is saved. That has one consequence worth knowing in advance: **a dependency added to the package has to be declared in `docs/package.json` as well**, and named in `resolve.dedupe` in `docs/.vitepress/config.ts` and in the `paths` of `docs/tsconfig.json`. The site's own workflow installs nothing under `packages/`, which is what makes a missing declaration fail in CI rather than on a machine that happens to have run `npm install` in both places.

The Flutter half of a demo is framed rather than rendered: `packages/flutter/example` is built for the web into `docs/public/flutter` by `npm run flutter` in `docs`, and shown in an `<iframe>`. It is neither committed nor built in CI, so a page whose Flutter demo is missing says so and shows the React half — which is what a contributor without a Flutter SDK sees, and it is not a failure.

## Making a change

1. Clone the repository, or rebase onto the latest commit of `main`.
2. Install, in whichever folder you are working in.
3. Set your editor up for that folder. The two JavaScript folders use ESLint and Prettier, both configured in each of them, with `npm run lint:fix` and `npm run format:fix` for the rest; `packages/flutter` uses `flutter analyze` and `dart format`.
4. Write the change.
5. Update the documentation. The site is written in **English and Korean**, and both have to be updated. Write the second one in your own words rather than translating word for word, and if you cannot write one of them, say so in the pull request and it will be filled in. A page says different things to a reader on React and a reader on Flutter through `::: fw react` and `::: fw flutter` blocks, and `<Fw react="…" flutter="…" />` for a few words inside a sentence — so a change to what one package does is a change to that package's half rather than to the page.
6. Add an entry to the changelog of the package you changed, `packages/react/CHANGELOG.md` or `packages/flutter/CHANGELOG.md`, when a user of it would notice the change. Behaviour, a public name, a default, a dependency, a supported version. A refactor that changes nothing needs no entry.
7. Add or change tests where the change earns them: a new feature, a rewrite, a bug worth a regression test, or logic intricate enough that reading it is not enough to trust it. Confirm the existing tests still pass.
8. Run `npm run lint`, `npm run typecheck` and `npm test` in `packages/react`, `flutter analyze` and `flutter test` in `packages/flutter`, and `npm run lint`, `npm run typecheck`, `npm run build` and `npm run check-links` in `docs` if you touched the site.
9. Run `flutter test --platform chrome test/diff test/image` as well when the change touches anything that asks `dart:ui` a question. It is the only thing that sees a difference between the two platforms.

`check-links` reads the built site and fails on a link that goes nowhere, which covers the case neither the build nor the typecheck does: an anchor is what an author typed and an id is what VitePress made of a heading, and the two can differ without anything reporting it. Run `npm run build` first, since it reads `docs-dist/`.

The React tests run in Node with no DOM. Anything answered by measuring an element (how tall a wrapped row is, where the band between two panes goes) cannot be checked there and is checked in a browser instead. Say in the pull request what you looked at.

The Flutter tests run under `flutter_test`, which has a real layout, so a widget test can pump a comparison and read what came out of it. `test/diff` and `test/image` run a second time in a browser, and that second run is not a formality: `dart:ui` does not answer the same on the web as it does on a device. `ImageDescriptor.width` is the case that put it there — a number everywhere else, and a throw on the web, which meant every picture handed over as the bytes of a file failed in a browser while all 187 tests passed.

Which is why anything that asks the platform a question belongs in a plain `test` rather than a `testWidgets` one. `test/image/decode_test.dart` is the example: it opens a file through `decodeImage` and needs no widget at all, so it runs in both places. A `testWidgets` suite does not finish under `--platform chrome` at all, so nothing in `test/components` or `test/package` is covered there.

Two things still need a look rather than a test: how the whole thing reads on a device, and the example gallery under `packages/flutter/example`, which is where every mode is on screen at once.

## Commit messages

There are no hard rules, but follow these where you can.

- Write in English.
- Use backticks to name a function, a variable, a folder or a file.
- Use `[scope] tag: message`. The scope names the codebase you changed, because this repository holds more than one: `[react]` and `[flutter]` for the packages, `[docs]` for the site. A change to more than one of them, or to none, leaves it out.
- Summarise what changed, not what you were doing.
- Split unrelated changes into commits of their own.
- Close an issue by ending with `(fixes #1)`, or name the number on its own to point at one without closing it.

The tags follow the [Udacity Git Commit Message Style Guide](https://udacity.github.io/git-styleguide). Use one outside the list where none of them fits.

| Tag        | Use for                                                     |
| ---------- | ----------------------------------------------------------- |
| `feat`     | A new feature                                               |
| `fix`      | A bug fix                                                   |
| `docs`     | Changes to documentation                                    |
| `style`    | Formatting, missing semicolons, and similar; no code change |
| `refactor` | Refactoring production code                                 |
| `test`     | Adding or refactoring tests; no production code change      |
| `chore`    | Updating build tasks, package manager configs, and similar  |

Three more are used here that the guide does not list: `perf` for a change made for speed, `package` for package settings, modules or GitHub configuration, and `typo` for a typo.

```text
[react] fix: stop `splitLine` from dropping the last run of a line (fixes #12)
[flutter] fix: keep the two panes level when one of them wraps
[docs] docs: describe the `language` prop on the viewer page
package: update `eslint` to v10
```

Never commit a secret, a build artifact, a dependency folder, an editor setting, or commented-out code. Removing a secret in a later commit does not remove it from the history.

## Pull requests

- Say what the change is, why it is needed, and how it works.
- Check whether somebody has already opened it.
- Keep one pull request to one change. A fix and a refactor in the same branch are two reviews in one.
- Write in English.

A maintainer reads and tests the change before it is merged. That can take a while, and you may be asked for a revision or for something the description left out.
