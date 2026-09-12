---
title: TextDiff
order: 1
description: 'Two documents side by side or in one column, read or typed into. Every option, its type and its default.'
---

# `TextDiff`

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

## Modes

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

## The documents

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
| `result` | [`DiffResult`](../types/diff-result) | — | A comparison already worked out. `before` and `after` are ignored. Viewer only. |
| `diff` | [`DiffOptions`](../types/diff-options) | — | How the two are compared. |

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
| `result` | [`DiffResult?`](../types/diff-result) | — | A comparison already worked out. `before` and `after` are ignored. Viewer only. |
| `diff` | [`DiffOptions`](../types/diff-options) | `kDiffineDefaults` | How the two are compared. |

The document and its name are two arguments rather than one value, because a `String` is already the whole document. Without a label the header writes the word for that side in the current locale.

A document nobody can type into is read from the widget on every build. An editable one is controlled or uncontrolled: passing `before` or `after` makes that document the application's, passing `defaultBefore` or `defaultAfter` leaves it to the widget, and which of the two it is, is decided on the first build. `onBeforeChanged` and `onAfterChanged` are called whichever of the two is holding it.

:::

## The view

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
| `font` | [`DiffineFont`](../types/diffine-font) | — | The typeface the documents are drawn in. |
| `locale` | `'en' \| 'ko'` | `'en'` | The language of the component's own words. |
| `strings` | [`Partial<DiffineTextStrings>`](../types/diffine-strings) | — | Words to use instead of the locale's. |
| `highlight` | [`DiffineHighlight`](../types/diffine-highlight) | — | An application's own highlighter, in place of `language`. |
| `renderGutter` | [`DiffineRender`](../types/diffine-render) | — | Something of the application's own, in the gutter beside each line. |
| `renderWidget` | [`DiffineRender`](../types/diffine-render) | — | Something of the application's own, under each line. |

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
| `theme` | [`DiffineTheme?`](../theme) | — | The whole palette, and the measurements with it. |
| `font` | [`DiffineFont?`](../types/diffine-font) | — | The typeface the documents are drawn in. |
| `height` | `double?` | — | How tall the whole comparison is. `double.infinity` fills what holds it. |
| `locale` | `DiffineLocale` | `DiffineLocale.en` | The language of the widget's own words. |
| `strings` | [`DiffineStrings?`](../types/diffine-strings) | — | Words to use instead of the locale's. |
| `highlight` | [`DiffineHighlight?`](../types/diffine-highlight) | — | An application's own highlighter, in place of `language`. |
| `renderGutter` | [`DiffineRender?`](../types/diffine-render) | — | Something of the application's own, in the gutter beside each line. |
| `renderWidget` | [`DiffineRender?`](../types/diffine-render) | — | Something of the application's own, under each line. |

`collapse` and `context` are the viewer's; an editor holds whole documents in its fields and folds nothing. `applyChanges` is the editor's, because applying a change means writing a document, and its buttons live in the column `connectors` draws. `connectors` and `syncScroll` are about the space between two panes, so both are ignored in the unified view. `languageLabel` draws the name of the language in the viewer and the menu it was chosen from in the editor; `language`, `defaultLanguage` and `onLanguageChanged` are the usual pair for that choice.

There is no `virtualize`: the rows are built as they are reached, always, because that is what a `ListView` is. `renderWidget` is what turns it off, and it does so on its own — what an application draws under a line can grow at any moment, and a row standing in for one of those would be standing in the wrong place.

`tabSize` is on the theme rather than here, because how wide a tab is drawn is a measurement and the measurements live together.

:::

## Typing

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

## Which change a reader is on

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

## Searching a pane

Each pane is searched on its own: a button in the bar above it opens a bar of its own underneath it, and **Ctrl+F** — **Cmd+F** where that is the modifier — opens the one for the pane the keyboard is in. The two sides have two queries, two counts and two bars, and neither closes the other.

Matches are marked as the query is typed, the pane moves to the one being read, and **Enter** and **Shift+Enter** step through the rest. The three switches inside the box read the query as a case-sensitive one, as whole words only, and as a regular expression. **Escape** closes the bar.

The editor adds a row for replacing, which **Ctrl+H** opens together with the bar. The replacement is written as the text it is — `$1` is a dollar and a one — and it goes in through <Fw react="the browser's own editing command, so Ctrl+Z takes it back" flutter="the field's own controller, so the platform's undo takes it back" />. A `readOnly` side is searched and not replaced in.

A pane whose search is open still draws only the lines a reader can see, so a match found on line nine thousand is scrolled to and drawn there. <Fw react="`search={false}`" flutter="`search: false`" /> turns the button and the shortcuts off together, which is what a <Fw react="page" flutter="screen" /> wants if those keys belong to something else on it.
