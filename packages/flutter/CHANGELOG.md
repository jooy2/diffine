# Changelog

> This package's history. Each language Diffine ships for keeps its own changelog beside its own manifest, because they version independently.

## v0.1.0 (2026--)

The first release. Diffine for Flutter is the React package's engine and view, written again in Dart — the same comparison, the same rows, the same palette down to the colour values, and the same answers for the same arguments.

### Added

- **`TextDiff` compares two documents and draws what happened between them.** Lines are matched first and then the words inside a pair that was edited, so a changed word is a changed word rather than a changed line. Every part of the view is an argument with a default — `view`, `lineNumbers`, `markers`, `wrap`, `alignLines`, `collapse`, `context`, `connectors`, `syncScroll`, `header`, `navigation`, `search`, `summary`, `showInvisibles` — so the same widget covers a full side-by-side with connectors and a bare column of lines in a panel too narrow for anything else.

  Only the lines a reader can see are built, whichever way those arguments are set: the panes are lists rather than columns, so a comparison of twenty thousand lines draws the forty on the screen and the scrollbar is still the length of the document. There is no `virtualize` to turn off, because there was nothing left to turn off.

- **`mode: DiffineMode.editor` is the same view with the two panes made editable.** The field's own text is see-through and its caret is not, and the lines behind it are painted — so a tinted row, a marked word and a highlighter's colours sit under text somebody is typing, while the field goes on being a field with the framework's own undo, input method, selection and accessibility. `before`/`after` or `defaultBefore`/`defaultAfter` decide whether the documents are the application's or the widget's, `onBeforeChanged` and `onAfterChanged` report either way, and `readOnly` takes a side.

  `applyChanges` puts a pair of arrows on every change in the column between the panes, for the question a comparison of a saved version and a draft is usually read with: keep this, or put the other one back.

- **`ImageDiff` compares two pictures and draws what changed over both of them.** Four views rather than one — side by side, faded over each other, wiped across, or the mask on its own — because no single one of them answers "did this move, or did it change colour". `tolerance` sets how much of a difference counts, `ignoreAntialiasing` drops what a renderer's smoothing left behind, and `align` finds the offset between two shots that are not lined up.

  `loupe` shows the pixels under the pointer magnified, both sides at once, with the colour of the middle one written out and the point of the frame it sits at — because two panes at four hundred per cent say two pixels are different and stop there.

  The wheel zooms about the pointer, which `wheel` turns back into moving the picture for a comparison sitting in the middle of a screen that scrolls.

  `unchanged` decides what happens to the parts nothing happened to: drawn faint with the change at full strength, or not drawn at all so that the change is read as a picture on a plain ground rather than as a mark on one.

  A picture arrives as the bytes of a file, as a `ui.Image`, or as a buffer of pixels. There is no URL among them: fetching one is the application's to do. `onChoose` is the same refusal for opening a file — the widget draws the button and the application answers it, because a picker is a plugin and which plugin is the application's choice.

- **`imageSimilarity` answers how alike two pictures are, in one number.** `diffImage` says where two pictures differ, which is the question a reader looking at them has; a build with a threshold in it, a report ranking a hundred screenshots and a badge on a screen are all asking the shorter one. What comes back is a share from 0 to 1, the counts it came from, how large each picture was, and how far apart the pixels are on average — because a photograph saved again is unalike in most of its pixels and barely apart in any of them, and one number cannot say both.

- **The engine is its own thing.** `diffText`, `diffWords`, `diffCharacters`, `diffSequence`, `diffImage`, `imageSimilarity`, `paintDiffImage`, `parsePatch` and `formatPatch` touch no widget at all, so a build script, an isolate or a test can call them and hand the answer to the widget as a value. `diffSequence` takes any two lists of tokens, for an application whose pieces are neither lines nor words.

- **`parsePatch` reads a unified diff into exactly what `diffText` returns**, down to the words marked inside a pair of changed lines, and `formatPatch` writes one back out. A service that already holds the comparison can send a few kilobytes of patch instead of a few megabytes of documents. Where a patch is missing lines the numbers jump, and the viewer draws a band saying how many rather than pretending line 7 sits above line 40.

- **A search of its own for each pane**, with a button in the bar above it, a bar underneath it, and Ctrl+F for whichever pane the keyboard is in. Case, whole words and regular expressions are three switches inside the box; in the editor Ctrl+H opens the same bar with a row for replacing under it.

- **`language` colours the two documents**, from grammars that ship with the package. The identifiers are highlight.js's, so a `language` that works in a browser works here, and `kDiffineLanguages` is the whole list. The grammars are approximate on purpose — an app bundle has no network to fetch a real parser from, and colour is not the kind of answer that has to be right — and they never change the document: every run is cut out of the text it was given and the lengths add back up to the line. `highlight` is the way in for an application that has a highlighter of its own.

- **`renderGutter` and `renderWidget` are where the application draws its own**: a review comment, a coverage bar, a lint warning, a button for adding one. A widget is as tall as it is, and the line opposite is given the same height so the two sides stay level.

- **`DiffineTheme` is the palette as a value.** The React package declares every colour as a custom property and an application overrides the property; there is no cascade here, so the same names arrive as an object instead and `copyWith` replaces what an application means to change. It travels with the widget rather than through a global, so one comparison can be dark inside a light screen.

- **English and Korean**, through `locale`, with `strings` for an application whose words are its own or whose language is neither. Everything the colours say is said in words as well: which side a pane is, what happened to each line, how many changes there are, and what every control does.

- **No Material and no Cupertino.** Nothing in the package imports either, so a comparison sits inside a `MaterialApp`, a `CupertinoApp` or a bare `WidgetsApp` without bringing a second design system with it. The only dependency is `characters`, which is what Flutter already ships.
