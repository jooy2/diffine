<img src="https://raw.githubusercontent.com/jooy2/diffine/main/docs/public/128x128.png" alt="Diffine" width="96" height="96" />

# diffine

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/jooy2/diffine/blob/main/LICENSE) [![pub package](https://img.shields.io/pub/v/diffine.svg)](https://pub.dev/packages/diffine) [![pub points](https://img.shields.io/pub/points/diffine)](https://pub.dev/packages/diffine/score)

**Diffine compares two versions and shows what changed.** A diff engine and a side-by-side viewer in one package, for text and for pictures, to read or to type into.

📘 **[diffine.cdget.com](https://diffine.cdget.com)** for the guides and the full API, in English and Korean.

## Install

```bash
flutter pub add diffine
```

The one dependency is [`characters`](https://pub.dev/packages/characters), which is the Dart team's own and is what Flutter already ships — a character-by-character comparison that split an emoji into its parts would mark half a glyph as changed.

Nothing here imports `package:flutter/material.dart` or `package:flutter/cupertino.dart`. A comparison sits inside a `MaterialApp`, a `CupertinoApp` or a bare `WidgetsApp` without bringing a second design system with it.

## Reading a comparison

```dart
import 'package:diffine/diffine.dart';

Widget review(String saved, String draft) {
  return TextDiff(before: saved, after: draft);
}
```

Each side takes the document, and a name for the header:

```dart
TextDiff(
  before: saved,
  beforeLabel: 'v1.2',
  after: draft,
  afterLabel: 'Working copy',
);
```

Every part of the view is an argument with a default, so the widget goes from a full side-by-side down to a bare column of lines without a colour being named:

| Argument         | Default                     | What it decides                                                 |
| ---------------- | --------------------------- | --------------------------------------------------------------- |
| `mode`           | `DiffineMode.viewer`        | Whether the two documents are read or written (`.editor`).      |
| `view`           | `DiffineView.split`         | One document either side, or one column with both (`.unified`). |
| `lineNumbers`    | `true`                      | Whether each line carries its number.                           |
| `markers`        | `true`                      | Whether a changed line carries a `+`, `−` or `~` beside it.     |
| `wrap`           | `false`                     | Whether a long line wraps or runs off the side.                 |
| `alignLines`     | `true`                      | Whether a line is held level with its counterpart.              |
| `collapse`       | `false`                     | Whether runs of unchanged lines far from a change are folded.   |
| `context`        | `3`                         | How many unchanged lines are kept either side of a change.      |
| `connectors`     | `true`                      | Whether the column between the panes draws each change as a band. |
| `syncScroll`     | `true`                      | Whether scrolling one pane scrolls the other.                   |
| `header`         | `true`                      | Whether each side is named above it.                            |
| `navigation`     | `true`                      | Whether the buttons for moving between changes are drawn.       |
| `search`         | `true`                      | Whether a reader can search a pane from inside the widget.      |
| `summary`        | `true`                      | Whether the counts are written under the view.                  |
| `showInvisibles` | `false`                     | Whether the spaces and tabs inside a line are drawn.            |
| `height`         | the theme's `384`           | How tall the whole comparison is. `double.infinity` fills its parent. |
| `colorScheme`    | `DiffineColorScheme.system` | `.light`, `.dark`, or the brightness of the screen around it.   |
| `locale`         | `DiffineLocale.en`          | The language of the widget's own words. `.ko` is the other.     |
| `strings`        | —                           | Words to use instead of the locale's.                           |

Only the lines a reader can see are built, whichever way those arguments are set: the panes are lists, so a comparison of twenty thousand lines draws the forty that are on the screen and the scrollbar is still the length of the document.

### Moving between changes

The buttons in the bar above the panes step through the changes and wrap at either end. Which one a reader is on is the widget's to keep, or the application's:

```dart
TextDiff(
  before: saved,
  after: draft,
  selected: index,
  onSelectedChanged: (int next, DiffChange? change) => setState(() => index = next),
);
```

Setting `selected` scrolls the view, so an application with its own list of changes beside it can drive it from there.

### Searching

Each pane has a search of its own: a button in the bar above it, a bar of its own underneath it, and Ctrl+F (Cmd+F on a Mac) for whichever pane the keyboard is in. Two panes, two queries, two counts, opened and closed one at a time, because a name being chased through the version on the left is usually not the name being chased through the version on the right.

Every match is marked as it is typed and the pane moves to the one being read. The query is text by default, and the three switches inside the box read it as a case-sensitive one, as whole words only, or as a regular expression.

In the editor, Ctrl+H opens the same bar with a row for replacing under it, and the caret follows the search. A side that is `readOnly` gets the search without the replacing.

`search: false` turns the whole of it off, button and shortcut together.

### Long documents

`collapse` is what makes a long comparison read the way a patch does: each run of unchanged lines becomes a band saying how many it stands for, with `context` of them kept either side of every change, and pressing a band puts its lines back. Both panes fold the same runs, so a split view stays level.

### Colouring the text

`language` names what the documents are written in, and they are coloured as it.

```dart
TextDiff(before: saved, after: draft, language: 'dart');
```

It takes a grammar identifier — the same ones highlight.js uses, so a `language` that works in a browser works here — or `plain` for a document that is not code. `kDiffineLanguages` is the whole list with the name to write beside each one, and the bar above the panes writes that name at its right end. In `DiffineMode.editor` the same corner is a menu that opens the list, because a document somebody pasted is a document nobody knew the language of:

```dart
TextDiff(
  mode: DiffineMode.editor,
  defaultBefore: saved,
  defaultAfter: draft,
  defaultLanguage: 'python',
);
```

The grammars are **approximate**, deliberately: a browser can fetch highlight.js and an app bundle cannot, and a correct parser for thirty-four languages is not a thing to keep beside a diff viewer. A template literal with a brace in it or a regular expression that reads as division comes out slightly wrong, and none of it changes the document — every run is cut out of the text it was given and the lengths add back up to the line.

`highlight` is the way in for an application that already has a highlighter of its own. It is handed a whole line and returns the runs it wants drawn differently, and it replaces `language` rather than adding to it. The line is cut at the boundaries of both that and the comparison, so a changed word that is half a string literal is drawn as exactly that.

```dart
TextDiff(
  before: saved,
  after: draft,
  highlight: (DiffLine line, DiffineSide side) => tokenize(line.text)
      .map((Token token) => DiffineToken(length: token.length, style: token.style))
      .toList(),
);
```

### Drawing your own on a line

A comparison knows what changed and nothing else. `renderGutter` adds a column to the gutter beside each line and `renderWidget` puts a box under one, which is where a review comment, a coverage bar or a lint warning goes. Both are called with the line and the side it is on, for the lines a pane draws rather than for the whole document.

```dart
TextDiff(
  before: saved,
  after: draft,
  renderWidget: (DiffLine line, DiffineSide side) =>
      side == DiffineSide.after && threads[line.index] != null
      ? Thread(of: threads[line.index]!)
      : null,
);
```

A widget is as tall as it is, so the line opposite is given the same height to keep the two sides level. Both belong to `DiffineMode.viewer`: an editor lays a field over its lines, and a box of unknown height between them would put the caret in the wrong place.

### How the two are compared

```dart
TextDiff(
  before: saved,
  after: draft,
  diff: const DiffOptions(
    inline: DiffInlineMode.character,
    whitespace: DiffWhitespace.trailing,
    ignoreCase: true,
  ),
);
```

| Option            | Default                   | What it decides                                                                |
| ----------------- | ------------------------- | ------------------------------------------------------------------------------ |
| `inline`          | `DiffInlineMode.word`     | What is compared inside a changed line: `.word`, `.character`, `.none`.        |
| `whitespace`      | `DiffWhitespace.exact`    | `.trailing`, `.surrounding`, `.amount` or `.all` to ignore some of it.         |
| `ignoreCase`      | `false`                   | Whether `Title` and `title` are the same line.                                 |
| `inlineThreshold` | `0.3`                     | How alike a pair has to be before the words inside it are worth marking.       |
| `ignore`          | `[]`                      | Patterns whose matches do not count, for a timestamp or an id that changes every time. |
| `maxCost`         | `5000`                    | The largest difference the engine works through before giving up.              |

Whatever the whitespace options ignore is still drawn. They change which lines count as equal, never what a reader sees.

### The palette

There is no cascade to declare custom properties in, so the palette arrives as a value instead: one object, the same names and the same colours as the React package's, handed to the widget.

```dart
TextDiff(
  before: saved,
  after: draft,
  theme: DiffineTheme.dark.copyWith(
    insertLine: const Color(0xff12301f),
    deleteLine: const Color(0xff351c20),
    fontSize: 14,
    lineHeight: 26,
  ),
);
```

It travels with the widget rather than through a global, which is worth more than the parity: one comparison can be dark inside a light screen, and two on one screen can differ. `DiffineFont` is the same idea for the typeface alone, when only the type is being changed.

## Writing one

`DiffineMode.editor` is the same comparison with the two panes made editable, worked out again as somebody types into either side.

```dart
TextDiff(
  mode: DiffineMode.editor,
  before: saved,
  after: draft,
  onAfterChanged: (String value) => setState(() => draft = value),
  readOnly: DiffineSide.before,
);
```

Leave `before` and `after` out and pass `defaultBefore` and `defaultAfter` instead to let the widget keep the documents itself. Either way `onBeforeChanged` and `onAfterChanged` report what was typed.

Each pane draws its document twice: once as the lines you see, painted, and once as an `EditableText` over the top whose own text is see-through and whose caret is not. That is what lets a tinted row, a marked word and `highlight` sit under text somebody is editing, while the field goes on being a field, with its undo, its input method, its selection and its accessibility all the framework's.

The two sides are never held level, because a blank line put in to keep them in step would be a line somebody could put the caret in. The column between the panes says which part of one answers which part of the other.

| Argument        | Default | What it decides                                           |
| --------------- | ------- | --------------------------------------------------------- |
| `readOnly`      | `null`  | Which side cannot be typed into.                          |
| `indentWithTab` | `false` | Whether Tab types a tab instead of moving on.             |
| `onDiff`        | —       | The comparison, every time it is worked out again.        |
| `applyChanges`  | `false` | Whether each change carries buttons for taking it across. |

With `applyChanges` on, every change grows a pair of arrows in the column between the panes: the one pointing left writes the right-hand version over the left, and a `readOnly` side is never written into.

Every other argument means the same thing in both modes, except `view`, `alignLines`, `collapse`, `context` and `result`, which an editor ignores. With `indentWithTab` on there are two ways out of the field: Shift+Tab moves back a control, and Escape hands the next Tab to the framework.

## Comparing two pictures

`ImageDiff` compares two pictures pixel by pixel and draws what it found: the pixels that changed tinted over both sides, a box round each run of them, and one zoom and one position shared by both panes.

```dart
ImageDiff(
  before: DiffineEncodedImage(saved),
  after: DiffineEncodedImage(rendered),
);
```

Each side takes the bytes of a file (`DiffineEncodedImage`), a picture already decoded (`DiffineDecodedImage`), or a buffer of pixels (`DiffinePixelImage`). There is no URL among them, because fetching one is the application's to do.

```dart
ImageDiff(
  before: DiffineEncodedImage(saved),
  beforeLabel: 'baseline.png',
  after: DiffineEncodedImage(rendered),
  afterLabel: 'run 4821',
  view: DiffineImageView.wipe,
  diff: const DiffImageOptions(tolerance: 0.05, align: DiffImageAlign.shift),
);
```

`view` is `.split`, `.overlay`, `.wipe` or `.mask`. `tolerance` decides how much of a difference counts, `ignoreAntialiasing` drops the pixels a renderer's own smoothing left behind, and `align` finds the offset between two shots that are not lined up. The whole of it is on the [image diff page](https://diffine.cdget.com/guide/image-diff).

`DiffineMode.editor` puts a button on an empty pane, and what that button does is `onChoose` — opening a file needs a picker, a picker is a plugin, and which plugin is the application's choice:

```dart
ImageDiff(
  mode: DiffineMode.editor,
  onChoose: (DiffineSide side) async {
    final XFile? file = await openFile();

    return file == null ? null : DiffineEncodedImage(await file.readAsBytes());
  },
);
```

## The comparison on its own

Nothing in the engine touches a widget, so `diffText` is as usable from a build script or an isolate as it is from a screen — for a summary line, a count in a badge, or a comparison worked out somewhere else and handed to the widget as a value.

```dart
final DiffResult result = diffText(before, after);

result.changes.length; // how many changes there are
result.stats; // unchanged, changed, inserted, deleted
result.rows; // the rows the widget draws, one per line of the comparison
```

```dart
diffWords('the quick fox', 'the slow fox');
// before: [equal 'the ', delete 'quick', equal ' fox'], …

diffSequence(<String>['a', 'b', 'c'], <String>['a', 'c']);
// [equal 0..1, delete 1..2, equal 2..3]
```

`diffSequence` takes any two lists of tokens, for an application whose pieces are neither lines nor words.

`diffImage` is the same for pictures, and it matters more there: comparing two photographs is a few million pieces of arithmetic, and this is how that happens in an isolate.

```dart
final DiffImageResult result = diffImage(
  before,
  after,
  const DiffImageOptions(align: DiffImageAlign.shift),
);

result.regions; // where the changes are, as rectangles
result.stats.ratio; // how much of the frame is not the same
result.mask; // a byte a pixel: 0 unchanged, and 1, 2 or 3 for the rest
```

Both sides are `DiffPixels`, which is the shape `ui.Image.toByteData` hands back. Opening a file is not part of it.

## Patches

`parsePatch` reads a unified diff into the value `diffText` returns, and `formatPatch` writes one back out. A service that already holds the comparison can send the patch instead of both documents.

```dart
final DiffPatchFile file = parsePatch(response.body).first;

TextDiff(result: file.result, beforeLabel: file.before, afterLabel: file.after);

formatPatch(
  result,
  const DiffPatchOptions(before: 'a/lib/main.dart', after: 'b/lib/main.dart'),
);
```

The lines between one hunk and the next are not in a patch, so the numbers jump there and the viewer draws a band saying how many are missing. `paintDiffImage` does the same job for two pictures: the mask as a picture of its own, ready for `ui.decodeImageFromPixels` and a PNG.

## What differs from `diffine-react`

The engine is the same, function for function: the same Myers search, the same pairing inside a replaced run, the same pixel comparison, the same patch format. What the two packages do not share is the parts that are a browser's.

| React                          | Flutter                                 | Why                                                                              |
| ------------------------------ | --------------------------------------- | -------------------------------------------------------------------------------- |
| `before={{ content, label }}`  | `before:` and `beforeLabel:`            | Dart has no union of a string and an object, and two named arguments read better than one wrapper. |
| `--diffine-*` custom properties | `DiffineTheme`                          | There is no cascade. The same names arrive as a value instead.                   |
| `highlight.js` behind `import()` | Grammars in the package                | An app bundle has no network to defer to. See "Colouring the text".              |
| `<input type="file">`          | `ImageDiff.onChoose`                    | Opening a file is a plugin, and which plugin is the application's choice.        |
| `virtualize`                   | always on                               | A list already draws what is on the screen; there was nothing left to switch off. |
| `spellCheck`                   | —                                       | The framework decides, per platform.                                             |

The gutter scrolls with a long line rather than staying against the left edge. Turning `wrap` on is the way round it, and it is the one place the two packages look different.

## License

[MIT](LICENSE) © [CDGet](https://cdget.com)
