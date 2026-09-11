---
title: API
order: 1
---

# API

<Fw react="Every export of `diffine-react`, in one place." flutter="Every export of `diffine`, in one place." /> The [guide](../guide/getting-started) is where each of them is explained; this page is what to look one up in.

## Entry points

::: fw react

| Import | What it holds | Before it draws |
| --- | --- | --- |
| `diffine-react` | The whole comparison: text, pictures, patches and the types. | 2.6 kB |
| `diffine-react/diff` | The text comparison, on its own. | 2.9 kB |
| `diffine-react/image` | The picture comparison, on its own. | 2.6 kB |
| `diffine-react/patch` | Reading and writing a unified diff. | 3.3 kB |
| `diffine-react/text-diff` | `TextDiff`, and `DIFFINE_LANGUAGES`. | 17.6 kB |
| `diffine-react/image-diff` | `ImageDiff`. | 10.5 kB |
| `diffine-react/types` | The types on their own, for an application naming one in a prop. | 0 kB |
| `diffine-react/styles.css` | The stylesheet, for both components. | 4.3 kB |

Nothing reaches a bundle that did not ask for it. The root is functions and types, so a page that counts the changes without drawing them carries no React and no stylesheet; each view is its own import, so a page with one of them carries one of them. The sizes are gzipped with React left out, and they are what a page fetches before it draws — a grammar is not among them, because `TextDiff` asks for one only when it is given a `language`.

:::

::: fw flutter

```dart
import 'package:diffine/diffine.dart';
```

One import holds all of it: the two widgets, the engine, the values it returns and the theme. There is no second entry for the engine on its own, because there is nothing for one to save — a program that only calls `diffText` is a program with no reference to a widget, and the compiler drops what nothing refers to.

:::

## `TextDiff`

::: fw react

```tsx
<TextDiff before={saved} after={draft} />
<TextDiff mode="editor" defaultBefore={saved} defaultAfter={draft} />
```

:::

::: fw flutter

```dart
TextDiff(before: saved, after: draft);
TextDiff(mode: DiffineMode.editor, defaultBefore: saved, defaultAfter: draft);
```

:::

### Modes

::: fw react

| Prop   | Type                   | Default    | What it decides                                |
| ------ | ---------------------- | ---------- | ---------------------------------------------- |
| `mode` | `'viewer' \| 'editor'` | `'viewer'` | Whether the two documents are read or written. |

:::

::: fw flutter

| Argument | Type          | Default              | What it decides                                |
| -------- | ------------- | -------------------- | ---------------------------------------------- |
| `mode`   | `DiffineMode` | `DiffineMode.viewer` | Whether the two documents are read or written. |

:::

<Fw react="One component draws both." flutter="One widget draws both." /> `editor` lays a field over each pane, so the comparison is worked out again as somebody types into it; everything else — the rows, the tints, the marked words, the bands, the buttons, the search — is the same in both.

::: fw react

Several props are ignored in `editor` mode: `view`, `alignLines`, `collapse`, `context`, `renderGutter` and `renderWidget`, because a field cannot be a unified column, cannot be padded out with blanks somebody could type into, cannot hide the lines somebody is typing, and cannot have something of the application's own between its lines; and `result`, because a comparison worked out elsewhere is a comparison of documents nobody has typed into yet. Going the other way, `readOnly`, `indentWithTab`, `spellCheck`, `defaultBefore`, `defaultAfter` and `onLanguageChange` do nothing in `viewer` mode.

:::

::: fw flutter

Several arguments are ignored in `DiffineMode.editor`: `view`, `alignLines`, `collapse`, `context`, `renderGutter` and `renderWidget`, because a field cannot be a unified column, cannot be padded out with blanks somebody could put the caret in, cannot hide the lines somebody is typing, and cannot have something of the application's own between its lines; and `result`, because a comparison worked out elsewhere is a comparison of documents nobody has typed into yet. Going the other way, `readOnly`, `indentWithTab`, `defaultBefore`, `defaultAfter` and `onLanguageChanged` do nothing in `DiffineMode.viewer`.

:::

### The documents

::: fw react

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `before` | `string \| DiffineSource` | `''` | The document on the left. |
| `after` | `string \| DiffineSource` | `''` | The document on the right. |
| `defaultBefore` | `string \| DiffineSource` | `''` | What the left field starts with. Editor only. |
| `defaultAfter` | `string \| DiffineSource` | `''` | What the right field starts with. Editor only. |
| `onBeforeChange` | `(value: string) => void` | — | The left document was typed into. |
| `onAfterChange` | `(value: string) => void` | — | The right document was typed into. |
| `onDiff` | `(result: DiffResult) => void` | — | The comparison, every time it is worked out again. |
| `readOnly` | `boolean \| 'before' \| 'after'` | `false` | Which side cannot be typed into. Editor only. |
| `result` | `DiffResult` | — | A comparison already worked out. `before` and `after` are ignored. Viewer only. |
| `diff` | `DiffOptions` | — | How the two are compared. See below. |

`DiffineSource` is `{ content: string; label?: string }`. The label is what the header calls that side; without one it is the word for it in the current locale.

A document nobody can type into is read from the props on every render. An editable one is the usual React pair instead: passing `before` or `after` makes that document the application's, passing `defaultBefore` or `defaultAfter` leaves it to the component, and which of the two it is, is decided on the first render. `onBeforeChange` and `onAfterChange` are called whichever of the two is holding it.

:::

::: fw flutter

| Argument | Type | Default | What it is |
| --- | --- | --- | --- |
| `before` | `String?` | — | The document on the left. |
| `after` | `String?` | — | The document on the right. |
| `beforeLabel` | `String?` | — | What the header calls the left side. |
| `afterLabel` | `String?` | — | What it calls the right side. |
| `defaultBefore` | `String?` | — | What the left field starts with. Editor only. |
| `defaultAfter` | `String?` | — | What the right field starts with. Editor only. |
| `onBeforeChanged` | `ValueChanged<String>?` | — | The left document was typed into. |
| `onAfterChanged` | `ValueChanged<String>?` | — | The right document was typed into. |
| `onDiff` | `ValueChanged<DiffResult>?` | — | The comparison, every time it is worked out again. |
| `readOnly` | `DiffineSide?` | — | Which side cannot be typed into. Editor only. |
| `result` | `DiffResult?` | — | A comparison already worked out. `before` and `after` are ignored. Viewer only. |
| `diff` | `DiffOptions` | `kDiffineDefaults` | How the two are compared. See below. |

The document and its name are two arguments rather than one value, because a `String` is already the whole document. Without a label the header writes the word for that side in the current locale.

A document nobody can type into is read from the widget on every build. An editable one is controlled or uncontrolled: passing `before` or `after` makes that document the application's, passing `defaultBefore` or `defaultAfter` leaves it to the widget, and which of the two it is, is decided on the first build. `onBeforeChanged` and `onAfterChanged` are called whichever of the two is holding it.

:::

### The view

::: fw react

| Prop | Type | Default | What it decides |
| --- | --- | --- | --- |
| `view` | `'split' \| 'unified'` | `'split'` | One document either side, or one column with both. |
| `lineNumbers` | `boolean` | `true` | Whether each line carries its number. |
| `markers` | `boolean` | `true` | Whether a changed line carries a `+`, `−` or `~`. |
| `wrap` | `boolean` | `false` | Whether a long line wraps or runs off the side. |
| `alignLines` | `boolean` | `true` | Whether a line is held level with its counterpart. |
| `collapse` | `boolean` | `false` | Whether runs of unchanged lines far from a change are folded away. |
| `context` | `number` | `3` | How many unchanged lines are kept either side of a change. |
| `connectors` | `boolean` | `true` | Whether each change is drawn as a band between the panes. |
| `applyChanges` | `boolean` | `false` | Whether each change carries buttons for writing it into the other document. |
| `syncScroll` | `boolean` | `true` | Whether scrolling one pane scrolls the other. |
| `header` | `boolean` | `true` | Whether each side is named above it. |
| `navigation` | `boolean` | `true` | Whether the buttons for moving between changes are drawn. |
| `search` | `boolean` | `true` | Whether a reader can search a pane from inside the component. |
| `summary` | `boolean` | `true` | Whether the bar under the view is drawn. |
| `virtualize` | `boolean` | `true` | Whether only the lines a reader can see are drawn. |
| `showInvisibles` | `boolean` | `false` | Whether the spaces and tabs inside a line are drawn. |
| `language` | `string` | `'plain'` | What the documents are written in, so they are coloured as it. |
| `defaultLanguage` | `string` | `'plain'` | Which one to start on, when the component is to keep it. |
| `onLanguageChange` | `(language: string) => void` | — | A language was chosen from the menu. Editor only. |
| `languageLabel` | `boolean` | `false` | Whether that language is drawn at the right end of the bar. |
| `tabSize` | `number` | `4` | How wide a tab is drawn, in characters. |
| `colorScheme` | `'system' \| 'light' \| 'dark'` | `'system'` | Which palette to draw in. |
| `font` | `DiffineFont` | — | The typeface the documents are drawn in. |
| `locale` | `'en' \| 'ko'` | `'en'` | The language of the component's own words. |
| `strings` | `Partial<DiffineTextStrings>` | — | Words to use instead of the locale's. |
| `highlight` | `DiffineHighlight` | — | An application's own highlighter, in place of `language`. |
| `renderGutter` | `DiffineRender` | — | Something of the application's own, in the gutter beside each line. |
| `renderWidget` | `DiffineRender` | — | Something of the application's own, under each line. |

`collapse` and `context` are the viewer's; an editor holds whole documents in its fields and folds nothing. `applyChanges` is the editor's, because applying a change means writing a document, and its buttons live in the column `connectors` draws. `connectors` and `syncScroll` are about the space between two panes, so both are ignored in the unified view. `languageLabel` draws the name of the language in `viewer` mode and the menu it was chosen from in `editor` mode; `language`, `defaultLanguage` and `onLanguageChange` are the usual pair for that choice.

Anything else the component is given goes straight to the element, so `id`, `className`, `style` and the `aria-*` attributes behave as they would on a `<div>`.

:::

::: fw flutter

| Argument | Type | Default | What it decides |
| --- | --- | --- | --- |
| `view` | `DiffineView` | `DiffineView.split` | One document either side, or one column with both. |
| `lineNumbers` | `bool` | `true` | Whether each line carries its number. |
| `markers` | `bool` | `true` | Whether a changed line carries a `+`, `−` or `~`. |
| `wrap` | `bool` | `false` | Whether a long line wraps or runs off the side. |
| `alignLines` | `bool` | `true` | Whether a line is held level with its counterpart. |
| `collapse` | `bool` | `false` | Whether runs of unchanged lines far from a change are folded away. |
| `context` | `int` | `3` | How many unchanged lines are kept either side of a change. |
| `connectors` | `bool` | `true` | Whether each change is drawn as a band between the panes. |
| `applyChanges` | `bool` | `false` | Whether each change carries buttons for writing it into the other document. |
| `syncScroll` | `bool` | `true` | Whether scrolling one pane scrolls the other. |
| `header` | `bool` | `true` | Whether each side is named above it. |
| `navigation` | `bool` | `true` | Whether the buttons for moving between changes are drawn. |
| `search` | `bool` | `true` | Whether a reader can search a pane from inside the widget. |
| `summary` | `bool` | `true` | Whether the bar under the view is drawn. |
| `showInvisibles` | `bool` | `false` | Whether the spaces and tabs inside a line are drawn. |
| `language` | `String?` | — | What the documents are written in, so they are coloured as it. |
| `defaultLanguage` | `String` | `'plain'` | Which one to start on, when the widget is to keep it. |
| `onLanguageChanged` | `ValueChanged<String>?` | — | A language was chosen from the menu. Editor only. |
| `languageLabel` | `bool` | `true` | Whether that language is drawn at the right end of the bar. |
| `colorScheme` | `DiffineColorScheme` | `.system` | Which palette to draw in. |
| `theme` | `DiffineTheme?` | — | The whole palette, and the measurements with it. |
| `font` | `DiffineFont?` | — | The typeface the documents are drawn in. |
| `height` | `double?` | — | How tall the whole comparison is. `double.infinity` fills what holds it. |
| `locale` | `DiffineLocale` | `DiffineLocale.en` | The language of the widget's own words. |
| `strings` | `DiffineStrings?` | — | Words to use instead of the locale's. |
| `highlight` | `DiffineHighlight?` | — | An application's own highlighter, in place of `language`. |
| `renderGutter` | `DiffineRender?` | — | Something of the application's own, in the gutter beside each line. |
| `renderWidget` | `DiffineRender?` | — | Something of the application's own, under each line. |

`collapse` and `context` are the viewer's; an editor holds whole documents in its fields and folds nothing. `applyChanges` is the editor's, because applying a change means writing a document, and its buttons live in the column `connectors` draws. `connectors` and `syncScroll` are about the space between two panes, so both are ignored in the unified view. `languageLabel` draws the name of the language in the viewer and the menu it was chosen from in the editor; `language`, `defaultLanguage` and `onLanguageChanged` are the usual pair for that choice.

There is no `virtualize`: the rows are built as they are reached, always, because that is what a `ListView` is. `renderWidget` is what turns it off, and it does so on its own — what an application draws under a line can grow at any moment, and a row standing in for one of those would be standing in the wrong place.

`tabSize` is on the theme rather than here, because how wide a tab is drawn is a measurement and the measurements live together.

:::

### Typing

::: fw react

| Prop | Type | Default | What it decides |
| --- | --- | --- | --- |
| `indentWithTab` | `boolean` | `false` | Whether Tab types a tab instead of moving to the next control. |
| `spellCheck` | `boolean` | `false` | Whether the browser marks its own spelling mistakes. |

Both are `editor` mode's. With `indentWithTab` on, **Shift+Tab** moves back a control and **Escape** hands the next Tab to the browser, so the field is never one a keyboard cannot leave.

:::

::: fw flutter

| Argument | Type | Default | What it decides |
| --- | --- | --- | --- |
| `indentWithTab` | `bool` | `false` | Whether Tab types a tab instead of moving to the next control. |

Editor only. With it on, **Shift+Tab** moves back a control and **Escape** hands the next Tab to the framework, so the field is never one a keyboard cannot leave.

There is no `spellCheck`. Spelling is the platform's on the platforms that have it and nothing at all on the ones that do not, and an argument that did nothing on half of them would be a promise the widget cannot keep.

:::

### Which change a reader is on

::: fw react

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `selected` | `number` | — | The change being looked at, or -1. |
| `defaultSelected` | `number` | `-1` | The one to start on. |
| `onSelectedChange` | `(selected: number, change: DiffChange \| null) => void` | — | A change was moved to. |

`selected` is an index into `changes`. Passing it makes it the application's, in the usual React pair, and setting it scrolls the view exactly as pressing a button does. `onSelectedChange` is called whichever of the two is holding it.

:::

::: fw flutter

| Argument | Type | Default | What it is |
| --- | --- | --- | --- |
| `selected` | `int?` | — | The change being looked at, or -1. |
| `defaultSelected` | `int` | `-1` | The one to start on. |
| `onSelectedChanged` | `void Function(int, DiffChange?)?` | — | A change was moved to. |

`selected` is an index into `changes`. Passing it makes it the application's, and setting it scrolls the view exactly as pressing a button does. `onSelectedChanged` is called whichever of the two is holding it.

:::

### Searching a pane

Each pane is searched on its own: a button in the bar above it opens a bar of its own underneath it, and **Ctrl+F** — **Cmd+F** where that is the modifier — opens the one for the pane the keyboard is in. The two sides have two queries, two counts and two bars, and neither closes the other.

Matches are marked as the query is typed, the pane moves to the one being read, and **Enter** and **Shift+Enter** step through the rest. The three switches inside the box read the query as a case-sensitive one, as whole words only, and as a regular expression. **Escape** closes the bar.

The editor adds a row for replacing, which **Ctrl+H** opens together with the bar. The replacement is written as the text it is — `$1` is a dollar and a one — and it goes in through <Fw react="the browser's own editing command, so Ctrl+Z takes it back" flutter="the field's own controller, so the platform's undo takes it back" />. A `readOnly` side is searched and not replaced in.

A pane whose search is open still draws only the lines a reader can see, so a match found on line nine thousand is scrolled to and drawn there. <Fw react="`search={false}`" flutter="`search: false`" /> turns the button and the shortcuts off together, which is what a <Fw react="page" flutter="screen" /> wants if those keys belong to something else on it.

### `DiffineStrings`

The words both views put on the screen. <Fw react="`DiffineCommonStrings`, which the two tables under it extend." flutter="Flutter keeps one table, and this is the part of it both widgets read." />

| Key              | English default                |
| ---------------- | ------------------------------ |
| `before`         | `Before`                       |
| `after`          | `After`                        |
| `empty`          | `Nothing to compare yet.`      |
| `identical`      | `The two are the same.`        |
| `previousChange` | `Previous change`              |
| `nextChange`     | `Next change`                  |
| `changePosition` | `Change {position} of {total}` |

What the document comparison adds. <Fw react="`DiffineTextStrings`, which is what `TextDiff` takes." flutter="Read by `TextDiff`." />

| Key              | English default                                                      |
| ---------------- | -------------------------------------------------------------------- |
| `placeholder`    | `Type or paste a document here.`                                     |
| `added`          | `Added`                                                              |
| `removed`        | `Removed`                                                            |
| `changed`        | `Changed`                                                            |
| `folded`         | `{lines} unchanged lines`                                            |
| `expand`         | `Show {lines} unchanged lines`                                       |
| `applyChange`    | `Take this change into {label}`                                      |
| `format`         | `{before} → {after}`                                                 |
| `mixedEndings`   | `mixed`                                                              |
| `noFinalNewline` | `no final newline`                                                   |
| `language`       | `Syntax highlighting`                                                |
| `summary`        | `{changes} changes, {inserted} lines added, {deleted} lines removed` |
| `documentSize`   | `{label}: {characters} characters, {size}`                           |
| `search`         | `Find`                                                               |
| `searchIn`       | `Find in {label}`                                                    |
| `searchPrevious` | `Previous match`                                                     |
| `searchNext`     | `Next match`                                                         |
| `searchClose`    | `Close find`                                                         |
| `searchPosition` | `Match {position} of {total}`                                        |
| `searchEmpty`    | `No matches`                                                         |
| `matchCase`      | `Match case`                                                         |
| `wholeWord`      | `Whole word`                                                         |
| `regex`          | `Regular expression`                                                 |
| `replace`        | `Replace`                                                            |
| `replaceWith`    | `Replace with`                                                       |
| `replaceAll`     | `Replace all`                                                        |

What the picture comparison adds. <Fw react="`DiffineImageStrings`, which is what `ImageDiff` takes. `DiffineStrings` is the two together, for an application that keeps one table for both." flutter="Read by `ImageDiff`." />

| Key            | English default                                      |
| -------------- | ---------------------------------------------------- |
| `imageSize`    | `{label}: {width} × {height}, {size}`                |
| `imageSummary` | `{regions} changed areas, {percent}% of the picture` |
| `choose`       | `Choose an image`                                    |
| `chooseIn`     | `Choose an image for {label}`                        |
| `unsupported`  | `That file is not an image.`                         |
| `loading`      | `Opening the picture`                                |
| `zoomOut`      | `Zoom out`                                           |
| `zoomIn`       | `Zoom in`                                            |
| `zoomFit`      | `Fit to the pane`                                    |
| `zoomLevel`    | `{percent}%`                                         |
| `fade`         | `Fade between the two`                               |
| `wipe`         | `Drag to wipe between the two`                       |

`added`, `removed`, `changed`, `summary`, `documentSize`, `changePosition`, `searchPosition`, `searchEmpty` and `imageSummary` are read by a screen reader rather than shown. `language` names the editor's menu of languages to one.

The placeholders are filled in as follows. `searchIn` and `chooseIn` fill `{label}` with the name of the side the button belongs to, so two of the same button on one <Fw react="component" flutter="widget" /> are told apart. `summary` fills `{changes}`, `{inserted}` and `{deleted}` with the counts. `documentSize` fills `{label}` with the name of a side and `{characters}` and `{size}` with numbers already written in the reader's own language, and `imageSize` fills `{width}`, `{height}` and `{size}` the same way. `imageSummary` takes `{regions}` and `{percent}`, and `zoomLevel` takes `{percent}`. `placeholder` is what an empty field in the editor says.

::: fw react

`strings` is a partial table, so an application changing one word passes one word — `Partial<DiffineTextStrings>` on `TextDiff` and `Partial<DiffineImageStrings>` on `ImageDiff`.

:::

::: fw flutter

`strings` is a whole `DiffineStrings` rather than a partial one, because Dart has no partial. Start from the locale's own and replace what you mean to change:

```dart
TextDiff(
  before: saved,
  after: draft,
  strings: baseStringsFor(DiffineLocale.en).copyWith(before: 'Saved', after: 'Draft'),
);
```

:::

### `DiffineFont`

::: fw react

```ts
interface DiffineFont {
  family?: string;
  size?: string | number;
  lineHeight?: string | number;
  letterSpacing?: string | number;
}
```

The same four values as `--diffine-font`, `--diffine-font-size`, `--diffine-line-height` and `--diffine-letter-spacing`, for an application that holds the typeface in its own state rather than in its own CSS. Anything left out keeps the stylesheet's value. A number is pixels and a string is whatever CSS makes of it.

`family` has to be a monospace stack, and `lineHeight` has to be a length rather than a bare multiplier: a row is that tall whether or not it has a line in it, the editor's field is laid over rows that are, and the rows a long comparison does not draw are stood in for by exactly that much height.

:::

::: fw flutter

```dart
class DiffineFont {
  const DiffineFont({
    this.family,
    this.familyFallback,
    this.size,
    this.lineHeight,
    this.letterSpacing,
  });
}
```

The typeface half of the theme, on its own, for a screen that sets the size and keeps every colour. Anything left out keeps the theme's value, so `DiffineFont(size: 15)` is a whole answer. Everything is in logical pixels.

`family` has to be monospace, and `lineHeight` is a length rather than a multiplier: a row is that tall whether or not it has a line in it, the editor's field is laid over rows that are, and the rows a long comparison has not built yet are stood in for by exactly that much height.

:::

### The list of languages

::: fw react

```ts
interface DiffineLanguageOption {
  id: string;
  name: string;
}

const DIFFINE_LANGUAGES: readonly DiffineLanguageOption[];
```

Every language `language` accepts, `plain` first and then thirty-four highlight.js identifiers in alphabetical order. `id` is what `language` takes and `name` is what the bar writes beside the panes — English in every locale, because `TypeScript` is `TypeScript` in all of them. It is names and nothing else: the grammars sit behind an `import()` apiece, so a menu built from this list costs a list.

The editor's own menu is built from this list, and an application building a menu somewhere else should build it from the same one rather than from a copy that goes stale.

`highlight.js` and each grammar sit behind an `import()`. Nothing is fetched until a language other than `plain` is asked for, and what is fetched then is that one grammar. The first paint after it arrives is the document coloured; the one before it is the document.

:::

::: fw flutter

```dart
class DiffineLanguageOption {
  final String id;
  final String name;
}

const List<DiffineLanguageOption> kDiffineLanguages;

DiffineHighlight? diffineHighlighterFor(String? language, List<String> before, List<String> after);
```

Every language `language` accepts, `plain` first and then thirty-four identifiers in alphabetical order — the same identifiers the React package takes, so a service that stores one alongside a document stores the same string for both. `id` is what `language` takes and `name` is what the bar writes beside the panes, in English in every locale.

The editor's own menu is built from this list, and an application building a menu somewhere else should build it from the same one rather than from a copy that goes stale.

The grammars are in the package rather than fetched, because an app bundle has no network to defer to. They are approximate for the same reason: a correct parser for thirty-four languages is not a thing to keep beside a diff viewer. `diffineHighlighterFor` is the one behind `language`, exposed for an application that wants to colour something else with the same rules.

:::

### `DiffineRender`

::: fw react

```ts
type DiffineRender = (line: DiffLine, side: DiffineSide) => React.ReactNode;
```

What `renderGutter` and `renderWidget` take. Called once for each line a pane draws, so with the rows virtualised it is called for what is on the screen. A blank that holds the two sides level is not a line, and nothing is asked about it. `renderWidget` turns `virtualize` off, because what an application draws under a line can grow at any moment and a row standing in for one of those would be standing in the wrong place. `wrap` does not: a wrapped row's height follows the width of its pane and the typeface, and both are watched.

:::

::: fw flutter

```dart
typedef DiffineRender = Widget? Function(DiffLine line, DiffineSide side);
```

What `renderGutter` and `renderWidget` take. Called once for each line a pane builds, so it is called for what is on the screen rather than for the whole document. A blank that holds the two sides level is not a line, and nothing is asked about it. Return `null` for a line with nothing to add.

`renderWidget` measures every row up front instead of assuming the line height, because what an application draws under a line is as tall as it is and the line opposite has to be given the same height.

:::

### `DiffineHighlight`

::: fw react

```ts
type DiffineHighlight = (
  line: DiffLine,
  side: 'before' | 'after'
) => readonly DiffineToken[] | null | undefined;

interface DiffineToken {
  /** How many characters of the line this run covers. */
  length: number;
  className?: string;
  style?: React.CSSProperties;
}
```

Called for each line the component draws, with the whole line. The runs come back in order; a gap between two of them is drawn plain, and `null` leaves the line alone. `length` counts the same units `String.prototype.slice` does.

:::

::: fw flutter

```dart
typedef DiffineHighlight = List<DiffineToken>? Function(DiffLine line, DiffineSide side);

class DiffineToken {
  const DiffineToken({required this.length, this.kind, this.style});

  /// How many characters of the line this run covers.
  final int length;
  final DiffineTokenKind? kind;
  final TextStyle? style;
}
```

Called for each line the widget draws, with the whole line. The runs come back in order; a gap between two of them is drawn plain, and `null` leaves the line alone. `length` counts UTF-16 code units, which is what `String.substring` counts.

`kind` is one of `keyword`, `string`, `comment`, `number`, `title`, `type`, `variable` and `meta`, and the theme turns it into a colour — which is what lets a highlighter of the application's own follow the palette a reader chose. `style` is for one that has already decided, and a run carrying it ignores `kind`.

:::

The line is cut at the boundaries of both these runs and the comparison's, so a changed word that is half a string literal is drawn as exactly that.

Passing this replaces `language` rather than adding to it. A line has one set of runs, and two highlighters cutting it at once is not a question with an answer.

## `ImageDiff`

::: fw react

```tsx
<ImageDiff before={saved} after={rendered} />
<ImageDiff mode="editor" view="wipe" />
```

:::

::: fw flutter

```dart
ImageDiff(before: DiffineEncodedImage(saved), after: DiffineEncodedImage(rendered));
ImageDiff(mode: DiffineMode.editor, view: DiffineImageView.wipe, onChoose: pick);
```

:::

### The pictures

::: fw react

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `mode` | `'viewer' \| 'editor'` | `'viewer'` | Whether the pictures are only looked at, or chosen as well. |
| `before` | `DiffineImageInput` | — | The picture on the left. |
| `after` | `DiffineImageInput` | — | The picture on the right. |
| `defaultBefore` | `DiffineImageInput` | — | What the left side starts with. Editor only. |
| `defaultAfter` | `DiffineImageInput` | — | What the right side starts with. Editor only. |
| `onBeforeChange` | `(value: File) => void` | — | A picture was chosen for the left side. |
| `onAfterChange` | `(value: File) => void` | — | A picture was chosen for the right side. |
| `onDiff` | `(result: DiffImageResult \| null) => void` | — | The comparison, every time it is worked out again. |
| `result` | `DiffImageResult` | — | A comparison already worked out. The pictures are still drawn. |
| `diff` | `DiffImageOptions` | — | How the two are compared. See [`diffImage`](#diffimage). |
| `maxPixels` | `number` | `4000000` | How many pixels a picture is decoded at, at most. |

`DiffineImageInput` is a picture or a picture with a name on it: `Blob | ImageBitmap | DiffPixels`, or `{ content, label }` around one of those. A URL is not among them — fetching one is the application's to do, and what arrives here is what it already holds.

`editor` mode is the usual React pair. `defaultBefore` and `defaultAfter` leave the pictures to the component; `before` and `after` make them the application's, and `onBeforeChange` and `onAfterChange` are called either way.

:::

::: fw flutter

| Argument | Type | Default | What it is |
| --- | --- | --- | --- |
| `mode` | `DiffineMode` | `DiffineMode.viewer` | Whether the pictures are only looked at, or chosen as well. |
| `before` | `DiffineImageContent?` | — | The picture on the left. |
| `after` | `DiffineImageContent?` | — | The picture on the right. |
| `beforeLabel` | `String?` | — | What the header calls the left side. |
| `afterLabel` | `String?` | — | What it calls the right side. |
| `onChoose` | `Future<DiffineImageContent?> Function(DiffineSide)?` | — | A reader asked for a picture. Editor only. |
| `onDiff` | `ValueChanged<DiffImageResult?>?` | — | The comparison, every time it is worked out again. |
| `result` | `DiffImageResult?` | — | A comparison already worked out. The pictures are still drawn. |
| `diff` | `DiffImageOptions` | `kDiffineImageDefaults` | How the two are compared. See [`diffImage`](#diffimage). |
| `maxPixels` | `int` | `4000000` | How many pixels a picture is decoded at, at most. |

`DiffineImageContent` is a sealed class with three shapes: `DiffineEncodedImage` around the bytes of a file, `DiffineDecodedImage` around a `ui.Image` the application already has, and `DiffinePixelImage` around a `DiffPixels`. A URL is not among them — fetching one is the application's to do, and what arrives here is what it already holds.

`onChoose` is the editor's, and it is the whole of it: the widget asks for a picture for one side and the application answers with one, or with `null` for a reader who changed their mind. A file picker is a plugin and a permission, and neither belongs inside a diff viewer.

:::

### The view

::: fw react

| Prop | Type | Default | What it decides |
| --- | --- | --- | --- |
| `view` | `'split' \| 'overlay' \| 'wipe' \| 'mask'` | `'split'` | How the two are laid out. |
| `unchanged` | `'keep' \| 'dim' \| 'hide'` | `'keep'` | What is done with the parts nothing happened to. |
| `fade` | `number` | `0.5` | How much of the second picture is let through. Overlay only. |
| `onFadeChange` | `(fade: number) => void` | — | The overlay was faded. |
| `wipe` | `number` | `0.5` | Where the line between the two is, from 0 to 1. Wipe only. |
| `onWipeChange` | `(wipe: number) => void` | — | The line was moved. |
| `marks` | `boolean` | `true` | Whether the pixels that changed are tinted. |
| `outlines` | `boolean` | `true` | Whether a box is drawn round each change. |
| `header` | `boolean` | `true` | Whether each side is named above it. |
| `navigation` | `boolean` | `true` | Whether the buttons for stepping through the changes are drawn. |
| `zoom` | `boolean` | `true` | Whether the zoom controls are drawn. |
| `summary` | `boolean` | `true` | Whether the bar under the panes is drawn. |
| `colorScheme` | `'system' \| 'light' \| 'dark'` | `'system'` | Which palette to draw in. |
| `locale` | `'en' \| 'ko'` | `'en'` | The language of the component's own words. |
| `strings` | `Partial<DiffineImageStrings>` | — | Words to use instead of the locale's. |

`split` draws two panes; the other three draw one, with both names over it. What the marks are drawn in is five [custom properties](#colours) rather than props, because a canvas is painted rather than styled.

:::

::: fw flutter

| Argument | Type | Default | What it decides |
| --- | --- | --- | --- |
| `view` | `DiffineImageView` | `DiffineImageView.split` | How the two are laid out. |
| `unchanged` | `DiffineImageUnchanged` | `.keep` | What is done with the parts nothing happened to. |
| `fade` | `double?` | `0.5` | How much of the second picture is let through. Overlay only. |
| `onFadeChanged` | `ValueChanged<double>?` | — | The overlay was faded. |
| `wipe` | `double?` | `0.5` | Where the line between the two is, from 0 to 1. Wipe only. |
| `onWipeChanged` | `ValueChanged<double>?` | — | The line was moved. |
| `marks` | `bool` | `true` | Whether the pixels that changed are tinted. |
| `outlines` | `bool` | `true` | Whether a box is drawn round each change. |
| `header` | `bool` | `true` | Whether each side is named above it. |
| `navigation` | `bool` | `true` | Whether the buttons for stepping through the changes are drawn. |
| `zoom` | `bool` | `true` | Whether the zoom controls are drawn. |
| `summary` | `bool` | `true` | Whether the bar under the panes is drawn. |
| `colorScheme` | `DiffineColorScheme` | `.system` | Which palette to draw in. |
| `theme` | `DiffineTheme?` | — | The whole palette, and the measurements with it. |
| `height` | `double?` | — | How tall the whole comparison is. |
| `locale` | `DiffineLocale` | `DiffineLocale.en` | The language of the widget's own words. |
| `strings` | `DiffineStrings?` | — | Words to use instead of the locale's. |

`split` draws two panes; the other three draw one, with both names over it. What the marks are drawn in is `theme.image`, seven colours of the [palette](#the-palette).

:::

### Moving around

::: fw react

| Prop | Type | Default | What it decides |
| --- | --- | --- | --- |
| `viewport` | `DiffineImageViewport \| 'fit'` | — | Where a reader is looking. |
| `defaultViewport` | `DiffineImageViewport \| 'fit'` | `'fit'` | Where to start looking. |
| `onViewportChange` | `(viewport: DiffineImageViewport) => void` | — | A reader moved or zoomed, or a button did. |
| `selected` | `number` | — | Which change a reader has stepped to, or -1. |
| `defaultSelected` | `number` | `-1` | Which change to start on. |
| `onSelectedChange` | `(selected: number, region: DiffImageRegion \| null) => void` | — | A change was stepped to. |

`DiffineImageViewport` is `{ scale, x, y }`: how many screen pixels one pixel of the frame is drawn as, and the point of the frame the middle of the pane is looking at. Both panes are given the same one, which is what makes a split view move together.

:::

::: fw flutter

| Argument | Type | Default | What it decides |
| --- | --- | --- | --- |
| `viewport` | `DiffineImageViewport?` | — | Where a reader is looking. `null` fits the frame to the pane. |
| `onViewportChanged` | `ValueChanged<DiffineImageViewport>?` | — | A reader moved or zoomed, or a button did. |
| `selected` | `int?` | — | Which change a reader has stepped to, or -1. |
| `defaultSelected` | `int` | `-1` | Which change to start on. |
| `onSelectedChanged` | `void Function(int, DiffImageRegion?)?` | — | A change was stepped to. |

`DiffineImageViewport` is `{ scale, x, y }`: how many logical pixels one pixel of the frame is drawn as, and the point of the frame the middle of the pane is looking at. Both panes are given the same one, which is what makes a split view move together. There is no `defaultViewport`: `null` is the fit, and it is also where an uncontrolled pane starts.

:::

## `diffText`

::: fw react

```ts
diffText(before: string, after: string, options?: DiffOptions): DiffResult
```

:::

::: fw flutter

```dart
DiffResult diffText(String before, String after, [DiffOptions? options]);
```

:::

### `DiffOptions`

::: fw react

| Option            | Type                                                          | Default   |
| ----------------- | ------------------------------------------------------------- | --------- |
| `inline`          | `'none' \| 'word' \| 'character'`                             | `'word'`  |
| `whitespace`      | `'exact' \| 'trailing' \| 'surrounding' \| 'amount' \| 'all'` | `'exact'` |
| `ignoreCase`      | `boolean`                                                     | `false`   |
| `inlineThreshold` | `number`                                                      | `0.3`     |
| `ignore`          | `readonly RegExp[]`                                           | `[]`      |
| `maxCost`         | `number`                                                      | `5000`    |

`DIFFINE_DEFAULTS` is the same table as a value.

:::

::: fw flutter

| Option            | Type             | Default                |
| ----------------- | ---------------- | ---------------------- |
| `inline`          | `DiffInlineMode` | `DiffInlineMode.word`  |
| `whitespace`      | `DiffWhitespace` | `DiffWhitespace.exact` |
| `ignoreCase`      | `bool`           | `false`                |
| `inlineThreshold` | `double`         | `0.3`                  |
| `ignore`          | `List<RegExp>`   | `<RegExp>[]`           |
| `maxCost`         | `int`            | `5000`                 |

`DiffInlineMode` is `none`, `word` or `character`; `DiffWhitespace` is `exact`, `trailing`, `surrounding`, `amount` or `all`. `kDiffineDefaults` is the same table as a value, and `copyWith` is how one option is changed without writing the rest.

:::

### `DiffResult`

::: fw react

```ts
interface DiffResult {
  before: readonly string[];
  after: readonly string[];
  rows: readonly DiffRow[];
  changes: readonly DiffChange[];
  stats: DiffStats;
  complete: boolean;
  format?: { before: DiffFormat; after: DiffFormat };
}

interface DiffFormat {
  ending: 'lf' | 'crlf' | 'cr' | 'mixed' | 'none';
  finalNewline: boolean;
  byteOrderMark: boolean;
}
```

:::

::: fw flutter

```dart
class DiffResult {
  final List<String> before;
  final List<String> after;
  final List<DiffRow> rows;
  final List<DiffChange> changes;
  final DiffStats stats;
  final bool complete;
  final DiffDocumentFormat? format;
}

class DiffDocumentFormat {
  final DiffFormat before;
  final DiffFormat after;
}

class DiffFormat {
  final DiffLineEnding ending;
  final bool finalNewline;
  final bool byteOrderMark;
}
```

`DiffLineEnding` is `lf`, `crlf`, `cr`, `mixed` or `none`.

:::

`format` is how each document is written rather than what is in it, and it is left out where nobody could know it — a comparison read back out of a patch never saw either file.

### `DiffRow`

::: fw react

```ts
interface DiffRow {
  kind: 'equal' | 'insert' | 'delete' | 'replace';
  before: DiffLine | null;
  after: DiffLine | null;
}

interface DiffLine {
  index: number;
  text: string;
  segments: readonly DiffSegment[];
}

interface DiffSegment {
  kind: 'equal' | 'insert' | 'delete';
  text: string;
}
```

:::

::: fw flutter

```dart
class DiffRow {
  final DiffRowKind kind;
  final DiffLine? before;
  final DiffLine? after;
}

class DiffLine {
  final int index;
  final String text;
  final List<DiffSegment> segments;
}

class DiffSegment {
  final DiffEditKind kind;
  final String text;
}
```

`DiffRowKind` is `equal`, `insert`, `delete` or `replace`; `DiffEditKind` is `equal`, `insert` or `delete`.

:::

### `DiffChange`

::: fw react

```ts
interface DiffChange {
  kind: 'insert' | 'delete' | 'replace';
  beforeStart: number;
  beforeEnd: number;
  afterStart: number;
  afterEnd: number;
  rowStart: number;
  rowEnd: number;
}
```

:::

::: fw flutter

```dart
class DiffChange {
  final DiffChangeKind kind;
  final int beforeStart;
  final int beforeEnd;
  final int afterStart;
  final int afterEnd;
  final int rowStart;
  final int rowEnd;
}
```

`DiffChangeKind` is `insert`, `delete` or `replace`.

:::

Every range is half-open. Only changed runs are on the list; unchanged runs are the gaps between them.

### `DiffStats`

::: fw react

```ts
interface DiffStats {
  unchanged: number;
  changed: number;
  inserted: number;
  deleted: number;
}
```

:::

::: fw flutter

```dart
class DiffStats {
  final int unchanged;
  final int changed;
  final int inserted;
  final int deleted;
}
```

:::

`changed` counts pairs of lines that sit opposite each other and differ, so a line that was edited is one `changed` rather than one `inserted` and one `deleted`.

## `diffWords` and `diffCharacters`

::: fw react

```ts
diffWords(before: string, after: string, options?: DiffOptions): DiffInlineResult
diffCharacters(before: string, after: string, options?: DiffOptions): DiffInlineResult

interface DiffInlineResult {
  before: readonly DiffSegment[];
  after: readonly DiffSegment[];
  similarity: number;
}
```

:::

::: fw flutter

```dart
DiffInlineResult diffWords(String before, String after, [DiffOptions? options]);
DiffInlineResult diffCharacters(String before, String after, [DiffOptions? options]);

class DiffInlineResult {
  final List<DiffSegment> before;
  final List<DiffSegment> after;
  final double similarity;
}
```

`diffCharacters` compares graphemes rather than code units, so an emoji is one piece and half a glyph is never marked as changed.

:::

A side each rather than one list between them, so joining a side back together gives the text that was passed in for it.

## `diffSequence`

::: fw react

```ts
diffSequence(before: readonly string[], after: readonly string[], options?: DiffOptions): DiffEdit[]

interface DiffEdit {
  kind: 'equal' | 'insert' | 'delete';
  beforeStart: number;
  beforeEnd: number;
  afterStart: number;
  afterEnd: number;
}
```

:::

::: fw flutter

```dart
List<DiffEdit> diffSequence(List<String> before, List<String> after, [DiffOptions? options]);

class DiffEdit {
  final DiffEditKind kind;
  final int beforeStart;
  final int beforeEnd;
  final int afterStart;
  final int afterEnd;
}
```

:::

The edits cover both sequences exactly once, in order.

## `formatPatch` and `parsePatch`

::: fw react

```ts
formatPatch(result: DiffResult, options?: DiffPatchOptions): string
parsePatch(patch: string, options?: DiffOptions): DiffPatchFile[]

interface DiffPatchOptions {
  context?: number; // 3
  before?: string; // 'before'
  after?: string; // 'after'
}

interface DiffPatchFile {
  before: string;
  after: string;
  result: DiffResult;
}
```

:::

::: fw flutter

```dart
String formatPatch(DiffResult result, [DiffPatchOptions? options]);
List<DiffPatchFile> parsePatch(String patch, [DiffOptions? options]);

class DiffPatchOptions {
  const DiffPatchOptions({this.context = 3, this.before = 'before', this.after = 'after'});
}

class DiffPatchFile {
  final String before;
  final String after;
  final DiffResult result;
}
```

:::

`formatPatch` returns an empty string for two documents that are the same. `parsePatch` returns one entry per file the patch covers; `result.before` holds the lines the patch carried rather than the whole document, while each line's `index` is its own number in the file it came from.

## `diffImage`

::: fw react

```ts
import { diffImage } from 'diffine-react/image';

const result = diffImage(before, after, { align: 'shift' });
```

`(before: DiffPixels, after: DiffPixels, options?: DiffImageOptions) => DiffImageResult`

:::

::: fw flutter

```dart
final DiffImageResult result = diffImage(
  before,
  after,
  const DiffImageOptions(align: DiffImageAlign.shift),
);
```

`DiffImageResult diffImage(DiffPixels before, DiffPixels after, [DiffImageOptions? options])`

:::

Compares two pictures pixel by pixel. Neither side has to be the same size as the other: what only one of them covers comes back as `added` or `removed` rather than as an error.

### `DiffPixels`

| Field | Type | What it is |
| --- | --- | --- |
| `data` | <Fw react="`Uint8ClampedArray`" flutter="`Uint8List`" code /> | Red, green, blue and alpha, a byte each, `width * height * 4` long. |
| `width` | <Fw react="`number`" flutter="`int`" code /> |  |
| `height` | <Fw react="`number`" flutter="`int`" code /> |  |

<Fw react="The same shape as `ImageData`, so what a canvas hands back can be passed straight in." flutter="The same shape `ui.Image.toByteData` hands back in `ui.ImageByteFormat.rawRgba`, so a decoded picture reaches the engine without a copy of its own." />

### `DiffImageOptions`

::: fw react

| Option | Type | Default | What it decides |
| --- | --- | --- | --- |
| `tolerance` | `number` | `0.05` | How different two pixels have to be, from 0 to 1, before it counts. |
| `ignoreAntialiasing` | `boolean` | `true` | Whether a pixel that only differs because an edge was drawn smooth is left out. |
| `align` | `'none' \| 'shift'` | `'none'` | Whether an offset between the two is looked for first. |
| `alignRadius` | `number` | `16` | How far that search goes, in pixels. |
| `blockSize` | `number` | `16` | How coarse the grid is that changed pixels are grouped on. |
| `maxRegions` | `number` | `200` | The most regions to return. Past this the largest are kept. |

`DIFFINE_IMAGE_DEFAULTS` is that table as an object.

:::

::: fw flutter

| Option | Type | Default | What it decides |
| --- | --- | --- | --- |
| `tolerance` | `double` | `0.05` | How different two pixels have to be, from 0 to 1, before it counts. |
| `ignoreAntialiasing` | `bool` | `true` | Whether a pixel that only differs because an edge was drawn smooth is left out. |
| `align` | `DiffImageAlign` | `DiffImageAlign.none` | Whether an offset between the two is looked for first. |
| `alignRadius` | `int` | `16` | How far that search goes, in pixels. |
| `blockSize` | `int` | `16` | How coarse the grid is that changed pixels are grouped on. |
| `maxRegions` | `int` | `200` | The most regions to return. Past this the largest are kept. |

`kDiffineImageDefaults` is that table as a value.

:::

### `DiffImageResult`

| Field | Type | What it is |
| --- | --- | --- |
| `width` | <Fw react="`number`" flutter="`int`" code /> | The frame both pictures were compared in. |
| `height` | <Fw react="`number`" flutter="`int`" code /> |  |
| `before` | `DiffImageArea` | Where the first picture sits in that frame. |
| `after` | `DiffImageArea` | Where the second one sits. |
| `offset` | <Fw react="`{ x, y }`" flutter="`DiffImageOffset`" code /> | How far the second was moved to line the two up. |
| `mask` | `Uint8List` | What happened to each pixel of the frame, row by row. |
| `regions` | <Fw react="`DiffImageRegion[]`" flutter="`List<DiffImageRegion>`" code /> | Where the changes are, in reading order. |
| `stats` | `DiffImageStats` | How much of the frame ended up where. |
| `complete` | <Fw react="`boolean`" flutter="`bool`" code /> | Whether the list of regions holds all of them. |

A byte of `mask` is an index into <Fw react="`DIFF_PIXEL_KINDS`" flutter="`kDiffPixelKinds`" code />, which is <Fw react="`['equal', 'changed', 'added', 'removed']`" flutter="`[DiffPixelKind.equal, .changed, .added, .removed]`" code /> — so `0` is a pixel that did not change and anything else is a pixel that did.

`offset` is where the move went rather than where the contents were: a picture drawn a pixel further to the right than the first is moved a pixel to the left, and `x` is `-1`.

### `DiffImageRegion`

`{ x, y, width, height, pixels }` — the smallest rectangle holding one run of changed pixels, and how many of them are inside it. `DiffImageArea` is the same without the count.

### `DiffImageStats`

| Field       | What it counts                                                       |
| ----------- | -------------------------------------------------------------------- |
| `pixels`    | How many pixels the frame holds.                                     |
| `covered`   | How many of those at least one of the two pictures reaches.          |
| `unchanged` | Pixels both cover and agree about.                                   |
| `changed`   | Pixels both cover and disagree about.                                |
| `added`     | Pixels only the second picture covers.                               |
| `removed`   | Pixels only the first one covers.                                    |
| `ratio`     | Everything that is not `unchanged`, as a share of `covered`.         |
| `distance`  | How far apart two pixels are on average, over the pixels both cover. |

The four counts add up to `covered` rather than to `pixels`. Two pictures one of which is wider and the other taller leave a corner of the frame neither of them reaches, and those pixels are nothing at all rather than pixels that agree.

## `imageSimilarity`

::: fw react

```ts
imageSimilarity(before: DiffPixels, after: DiffPixels, options?: DiffImageOptions): DiffImageSimilarity
```

:::

::: fw flutter

```dart
DiffImageSimilarity imageSimilarity(DiffPixels before, DiffPixels after, [DiffImageOptions? options]);
```

:::

| Field        | What it says                                                           |
| ------------ | ---------------------------------------------------------------------- |
| `similarity` | How alike the two are, from 0 to 1. Times a hundred is the percentage. |
| `identical`  | Whether not one pixel came out different.                              |
| `pixels`     | How many pixels at least one of the two covers.                        |
| `matched`    | How many of those came out the same.                                   |
| `changed`    | How many both cover and disagree about.                                |
| `added`      | How many only the second covers.                                       |
| `removed`    | How many only the first covers.                                        |
| `distance`   | How far apart two pixels are on average, over the pixels both cover.   |
| `before`     | How large the first picture was.                                       |
| `after`      | How large the second one was.                                          |

The whole comparison runs underneath, so every option means what it means there. A comparison already worked out needs no second pass: `1 - result.stats.ratio` is the same number.

## `paintDiffImage`

::: fw react

```ts
paintDiffImage(result: DiffImageResult, paint?: DiffImagePaint): DiffPixels

interface DiffImagePaint {
  changed?: [number, number, number, number]; // [232, 62, 140, 255]
  added?: [number, number, number, number]; // [26, 127, 75, 255]
  removed?: [number, number, number, number]; // [194, 51, 63, 255]
  unchanged?: [number, number, number, number]; // [0, 0, 0, 0]
}
```

The mask as a picture the size of the frame, for an application that has to write a file out of it. Four bytes a colour rather than a CSS string, because reading one means asking a browser what it means. Writing the file is the application's, exactly as reading one is.

:::

::: fw flutter

```dart
DiffPixels paintDiffImage(DiffImageResult result, [DiffImagePaint? paint]);

class DiffImagePaint {
  const DiffImagePaint({this.changed, this.added, this.removed, this.unchanged});

  final Color? changed; // Color(0xffe83e8c)
  final Color? added; // Color(0xff1a7f4b)
  final Color? removed; // Color(0xffc2333f)
  final Color? unchanged; // transparent
}
```

The mask as a picture the size of the frame, for an application that has to write a file out of it. What comes back is a `DiffPixels`, so `ui.decodeImageFromPixels` turns it into something to draw and an encoder turns it into something to save. Writing the file is the application's, exactly as reading one is.

:::

::: fw react

## Custom properties

Declared on `.diffine`, and overridden the same way.

### Colours

| Property                   | Light       | Dark        |
| -------------------------- | ----------- | ----------- |
| `--diffine-surface`        | `#ffffff`   | `#1b222c`   |
| `--diffine-text`           | `#1f2733`   | `#e4e9f0`   |
| `--diffine-muted`          | `#6e798c`   | `#8d99ad`   |
| `--diffine-border`         | `#d6dee9`   | `#2f3945`   |
| `--diffine-gutter`         | `#f4f7fb`   | `#232b36`   |
| `--diffine-accent`         | `#0e7ffc`   | `#4c9dff`   |
| `--diffine-invisible`      | `#b6c0cf`   | `#4b5768`   |
| `--diffine-insert-line`    | `#e7f8ee`   | `#12301f`   |
| `--diffine-insert-piece`   | `#a5e9c1`   | `#206c42`   |
| `--diffine-delete-line`    | `#fdecee`   | `#351c20`   |
| `--diffine-delete-piece`   | `#ffc3c8`   | `#7f303a`   |
| `--diffine-insert-text`    | `#1a7f4b`   | `#5fd08a`   |
| `--diffine-delete-text`    | `#c2333f`   | `#ff8b95`   |
| `--diffine-search`         | `#ffe9a8`   | `#5c4713`   |
| `--diffine-search-current` | `#ffbd3d`   | `#8a5c0f`   |
| `--diffine-blank`          | `#f0f3f7`   | `#151b23`   |
| `--diffine-selection`      | `#0e7ffc33` | `#4c9dff40` |

What a picture comparison paints with, and the two behind it:

| Property                  | Light                    | Dark                      |
| ------------------------- | ------------------------ | ------------------------- |
| `--diffine-image-changed` | `rgb(232 62 140 / 0.55)` | `rgb(255 92 168 / 0.55)`  |
| `--diffine-image-added`   | `rgb(26 127 75 / 0.5)`   | `rgb(63 190 122 / 0.5)`   |
| `--diffine-image-removed` | `rgb(194 51 63 / 0.5)`   | `rgb(255 106 116 / 0.5)`  |
| `--diffine-image-outline` | `rgb(20 28 40 / 0.85)`   | `rgb(228 233 240 / 0.85)` |
| `--diffine-image-marker`  | `rgb(14 127 252 / 0.95)` | `rgb(76 157 255 / 0.95)`  |
| `--diffine-image-halo`    | `rgb(255 255 255 / 0.6)` | `rgb(6 10 16 / 0.6)`      |
| `--diffine-image-ground`  | `#eaeef4`                | `#151b23`                 |
| `--diffine-image-chequer` | `#dbe1ea`                | `#1e2530`                 |

The `-line` pair tints a whole row; the `-piece` pair picks out what moved inside it, and only ever sits on top of the paler one. The `-text` pair is the same two colours dark enough to be read as text, for the counts in the bar under the panes, which have nothing behind them but the gutter. The `--diffine-search` pair is what a search marks: the first every match, the second the one a reader has been taken to. They are a third colour rather than the accent, because a match can land on a row that is already tinted green or red and it has to be legible on all three grounds. `--diffine-selection` is the editor's alone, and has to stay see-through: the words under a selection are drawn behind the field.

### Measurements

| Property                   | Default           | What it is                                    |
| -------------------------- | ----------------- | --------------------------------------------- |
| `--diffine-height`         | `24rem`           | How tall the viewer is. `auto` grows with it. |
| `--diffine-radius`         | `0.5rem`          | The corner radius of the frame.               |
| `--diffine-font`           | A monospace stack | The typeface the documents are drawn in.      |
| `--diffine-font-size`      | `0.8125rem`       | Its size.                                     |
| `--diffine-line-height`    | `1.5rem`          | The height of one unwrapped line.             |
| `--diffine-letter-spacing` | `normal`          | How far apart the letters are.                |
| `--diffine-links-width`    | `3rem`            | The width of the column between the panes.    |
| `--diffine-marker-width`   | `1.25rem`         | The width of the `+`, `−` and `~` column.     |

`--diffine-digits` and `--diffine-tab-size` are written onto the element by the component, from the longest document and from `tabSize`. Setting them by hand is overridden on the next render. `--diffine-gutter-width`, `--diffine-gutter-numbers`, `--diffine-gutter-markers` and `--diffine-gutter-rule` are worked out from the two above and from which columns were asked for; they are what the gutter, the stripe that carries it past the last line, and the editor's field indent are all measured with.

:::

::: fw flutter

## The palette

`DiffineTheme` is every colour and every measurement, as one value. `DiffineTheme.light` and `DiffineTheme.dark` are the two the widgets use, and `copyWith` is how an application changes a few of them:

```dart
TextDiff(
  before: saved,
  after: draft,
  theme: DiffineTheme.light.copyWith(accent: const Color(0xff7c4dff), height: 640),
);
```

Passing a theme settles `colorScheme` as well: a theme is a decision about which palette this is.

### Colours

| Field           | Light       | Dark        |
| --------------- | ----------- | ----------- |
| `surface`       | `#ffffff`   | `#1b222c`   |
| `text`          | `#1f2733`   | `#e4e9f0`   |
| `muted`         | `#6e798c`   | `#8d99ad`   |
| `border`        | `#d6dee9`   | `#2f3945`   |
| `gutter`        | `#f4f7fb`   | `#232b36`   |
| `accent`        | `#0e7ffc`   | `#4c9dff`   |
| `invisible`     | `#b6c0cf`   | `#4b5768`   |
| `insertLine`    | `#e7f8ee`   | `#12301f`   |
| `insertPiece`   | `#a5e9c1`   | `#206c42`   |
| `deleteLine`    | `#fdecee`   | `#351c20`   |
| `deletePiece`   | `#ffc3c8`   | `#7f303a`   |
| `insertText`    | `#1a7f4b`   | `#5fd08a`   |
| `deleteText`    | `#c2333f`   | `#ff8b95`   |
| `search`        | `#ffe9a8`   | `#5c4713`   |
| `searchCurrent` | `#ffbd3d`   | `#8a5c0f`   |
| `blank`         | `#f0f3f7`   | `#151b23`   |
| `selection`     | `#0e7ffc33` | `#4c9dff40` |

The `Line` pair tints a whole row; the `Piece` pair picks out what moved inside it, and only ever sits on top of the paler one. The `Text` pair is the same two colours dark enough to be read as text, for the counts in the bar under the panes, which have nothing behind them but the gutter. `search` and `searchCurrent` are what a search marks: the first every match, the second the one a reader has been taken to. They are a third colour rather than the accent, because a match can land on a row that is already tinted green or red and it has to be legible on all three grounds. `selection` is the editor's alone, and has to stay see-through: the words under a selection are painted behind the field.

`code` is a `DiffineCodeColours` with the eight a highlighter draws with — `keyword`, `string`, `comment`, `number`, `title`, `type`, `variable` and `meta` — and `image` is a `DiffineImageColours` with what a picture comparison paints with and the two behind them:

| `theme.image` | Light            | Dark             |
| ------------- | ---------------- | ---------------- |
| `changed`     | `#e83e8c` at 55% | `#ff5ca8` at 55% |
| `added`       | `#1a7f4b` at 50% | `#3fbe7a` at 50% |
| `removed`     | `#c2333f` at 50% | `#ff6a74` at 50% |
| `outline`     | `#141c28` at 85% | `#e4e9f0` at 85% |
| `marker`      | `#0e7ffc` at 95% | `#4c9dff` at 95% |
| `halo`        | `#ffffff` at 60% | `#060a10` at 60% |
| `ground`      | `#eaeef4`        | `#151b23`        |
| `chequer`     | `#dbe1ea`        | `#1e2530`        |

### Measurements

| Field                | Default           | What it is                                 |
| -------------------- | ----------------- | ------------------------------------------ |
| `height`             | `384`             | How tall the viewer is, in logical pixels. |
| `radius`             | `8`               | The corner radius of the frame.            |
| `fontFamily`         | A monospace stack | The typeface the documents are drawn in.   |
| `fontFamilyFallback` | `['monospace']`   | What to fall back to for a missing glyph.  |
| `fontSize`           | `13`              | Its size.                                  |
| `lineHeight`         | `24`              | The height of one unwrapped line.          |
| `letterSpacing`      | —                 | How far apart the letters are.             |
| `linksWidth`         | `48`              | The width of the column between the panes. |
| `tabSize`            | `4`               | How wide a tab is drawn, in characters.    |

`height` is what `TextDiff(height:)` overrides for one comparison, and `double.infinity` on either fills whatever holds it. `lineHeight` is a length rather than a multiplier, because a row is that tall whether or not it has a line in it — the editor's field is laid over rows that are, and a row the list has not built yet is stood in for by exactly that much height.

:::
