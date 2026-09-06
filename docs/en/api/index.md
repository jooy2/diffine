---
title: API
order: 1
---

# API

Every export of `diffine-react`, in one place. The [guide](../guide/getting-started) is where each of them is explained; this page is what to look one up in.

## Entry points

| Import                     | What it holds                                                    |
| -------------------------- | ---------------------------------------------------------------- |
| `diffine-react`            | Everything: the components, the engine and the types.            |
| `diffine-react/diff`       | The comparison, with no component reaching the bundle.           |
| `diffine-react/types`      | The types on their own, for an application naming one in a prop. |
| `diffine-react/styles.css` | The stylesheet, for both components.                             |

## `DiffineViewer`

```tsx
<DiffineViewer before={saved} after={draft} />
```

### The documents

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `before` | `string \| DiffineSource` | `''` | The document on the left. |
| `after` | `string \| DiffineSource` | `''` | The document on the right. |
| `result` | `DiffResult` | — | A comparison already worked out. `before` and `after` are ignored. |
| `diff` | `DiffOptions` | — | How the two are compared. See below. |

`DiffineSource` is `{ content: string; label?: string }`. The label is what the header calls that side; without one it is the word for it in the current locale.

### The view

| Prop | Type | Default | What it decides |
| --- | --- | --- | --- |
| `view` | `'split' \| 'unified'` | `'split'` | One document either side, or one column with both. |
| `lineNumbers` | `boolean` | `true` | Whether each line carries its number. |
| `markers` | `boolean` | `true` | Whether a changed line carries a `+`, `−` or `~`. |
| `wrap` | `boolean` | `false` | Whether a long line wraps or runs off the side. |
| `alignLines` | `boolean` | `true` | Whether a line is held level with its counterpart. |
| `connectors` | `boolean` | `true` | Whether each change is drawn as a band between the panes. |
| `syncScroll` | `boolean` | `true` | Whether scrolling one pane scrolls the other. |
| `header` | `boolean` | `true` | Whether each side is named above it. |
| `summary` | `boolean` | `true` | Whether the bar under the view is drawn. |
| `tabSize` | `number` | `4` | How wide a tab is drawn, in characters. |
| `colorScheme` | `'system' \| 'light' \| 'dark'` | `'system'` | Which palette to draw in. |
| `locale` | `'en' \| 'ko'` | `'en'` | The language of the viewer's own words. |
| `strings` | `Partial<DiffineStrings>` | — | Words to use instead of the locale's. |

`connectors` and `syncScroll` are about the space between two panes, so both are ignored in the unified view.

Anything else the component is given goes straight to the element, so `id`, `className`, `style` and the `aria-*` attributes behave as they would on a `<div>`.

### Which change a reader is on

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `selected` | `number` | — | The change being looked at, or -1. |
| `defaultSelected` | `number` | `-1` | The one to start on. |
| `onSelectedChange` | `(selected: number, change: DiffChange \| null) => void` | — | A change was moved to. |

`selected` is an index into `changes`. Passing it makes it the application's, in the usual React pair, and setting it scrolls the view exactly as pressing a button does. `onSelectedChange` is called whichever of the two is holding it.

### `DiffineStrings`

| Key              | English default                                                      |
| ---------------- | -------------------------------------------------------------------- |
| `before`         | `Before`                                                             |
| `after`          | `After`                                                              |
| `empty`          | `Nothing to compare yet.`                                            |
| `placeholder`    | `Type or paste a document here.`                                     |
| `identical`      | `The two are the same.`                                              |
| `added`          | `Added`                                                              |
| `removed`        | `Removed`                                                            |
| `changed`        | `Changed`                                                            |
| `summary`        | `{changes} changes, {inserted} lines added, {deleted} lines removed` |
| `documentSize`   | `{label}: {characters} characters, {size}`                           |
| `previousChange` | `Previous change`                                                    |
| `nextChange`     | `Next change`                                                        |
| `changePosition` | `Change {position} of {total}`                                       |

`added`, `removed`, `changed`, `summary`, `documentSize` and `changePosition` are read by a screen reader rather than shown. `summary` fills `{changes}`, `{inserted}` and `{deleted}` with the counts, and `documentSize` fills `{label}` with the name of a side and `{characters}` and `{size}` with numbers already written in the reader's own language. `placeholder` is what an empty field in the editor says.

### `DiffineHighlight`

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

Called for each line either component draws, with the whole line. The runs come back in order; a gap between two of them is drawn plain, and `null` leaves the line alone. `length` counts the same units `String.prototype.slice` does.

The line is cut at the boundaries of both these runs and the comparison's, so a changed word that is half a string literal is drawn as exactly that.

## `DiffineEditor`

```tsx
<DiffineEditor defaultBefore={saved} defaultAfter={draft} />
```

The viewer with the two panes made editable. Every prop below that the viewer also takes means the same thing there; the differences are that the sides are never held level, and that there is no unified view.

### The documents

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `before` | `string \| DiffineSource` | — | The left document, held by the application. |
| `after` | `string \| DiffineSource` | — | The right document, held by the application. |
| `defaultBefore` | `string \| DiffineSource` | `''` | What the left field starts with. |
| `defaultAfter` | `string \| DiffineSource` | `''` | What the right field starts with. |
| `onBeforeChange` | `(value: string) => void` | — | The left document was typed into. |
| `onAfterChange` | `(value: string) => void` | — | The right document was typed into. |
| `onDiff` | `(result: DiffResult) => void` | — | The comparison, every time it is worked out again. |
| `readOnly` | `boolean \| 'before' \| 'after'` | `false` | Which side cannot be typed into. |
| `diff` | `DiffOptions` | — | How the two are compared. Run again on every keystroke. |

Passing `before` or `after` makes that document the application's, in the usual React pair. Which of the two it is, is decided on the first render. `onBeforeChange` and `onAfterChange` are called whichever of the two is holding it.

### The view

| Prop | Type | Default | What it decides |
| --- | --- | --- | --- |
| `lineNumbers` | `boolean` | `true` | Whether each line carries its number. |
| `markers` | `boolean` | `true` | Whether a changed line carries a `+`, `−` or `~`. |
| `wrap` | `boolean` | `false` | Whether a long line wraps or runs off the side. |
| `connectors` | `boolean` | `true` | Whether each change is drawn as a band between the panes. |
| `syncScroll` | `boolean` | `true` | Whether scrolling one pane scrolls the other. |
| `header` | `boolean` | `true` | Whether each side is named above it. |
| `navigation` | `boolean` | `true` | Whether the buttons for moving between changes are drawn. |
| `summary` | `boolean` | `true` | Whether the bar under the fields is drawn. |
| `virtualize` | `boolean` | `true` | Whether only the lines a reader can see are drawn. |
| `tabSize` | `number` | `4` | How wide a tab is drawn, in characters. |
| `colorScheme` | `'system' \| 'light' \| 'dark'` | `'system'` | Which palette to draw in. |
| `locale` | `'en' \| 'ko'` | `'en'` | The language of the editor's own words. |
| `strings` | `Partial<DiffineStrings>` | — | Words to use instead of the locale's. |
| `highlight` | `DiffineHighlight` | — | How a line is coloured beyond the comparison. |

### Typing

| Prop | Type | Default | What it decides |
| --- | --- | --- | --- |
| `indentWithTab` | `boolean` | `false` | Whether Tab types a tab instead of moving to the next control. |
| `spellCheck` | `boolean` | `false` | Whether the browser marks its own spelling mistakes. |

With `indentWithTab` on, **Shift+Tab** moves back a control and **Escape** hands the next Tab to the browser, so the field is never one a keyboard cannot leave.

`selected`, `defaultSelected` and `onSelectedChange` are the viewer's, unchanged. Anything else the component is given goes straight to the element.

## `diffText`

```ts
diffText(before: string, after: string, options?: DiffOptions): DiffResult
```

### `DiffOptions`

| Option            | Type                                                          | Default   |
| ----------------- | ------------------------------------------------------------- | --------- |
| `inline`          | `'none' \| 'word' \| 'character'`                             | `'word'`  |
| `whitespace`      | `'exact' \| 'trailing' \| 'surrounding' \| 'amount' \| 'all'` | `'exact'` |
| `ignoreCase`      | `boolean`                                                     | `false`   |
| `inlineThreshold` | `number`                                                      | `0.3`     |
| `maxCost`         | `number`                                                      | `5000`    |

`DIFFINE_DEFAULTS` is the same table as a value.

### `DiffResult`

```ts
interface DiffResult {
  before: readonly string[];
  after: readonly string[];
  rows: readonly DiffRow[];
  changes: readonly DiffChange[];
  stats: DiffStats;
  complete: boolean;
}
```

### `DiffRow`

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

### `DiffChange`

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

Every range is half-open. Only changed runs are on the list; unchanged runs are the gaps between them.

### `DiffStats`

```ts
interface DiffStats {
  unchanged: number;
  changed: number;
  inserted: number;
  deleted: number;
}
```

`changed` counts pairs of lines that sit opposite each other and differ, so a line that was edited is one `changed` rather than one `inserted` and one `deleted`.

## `diffWords` and `diffCharacters`

```ts
diffWords(before: string, after: string, options?: DiffOptions): DiffInlineResult
diffCharacters(before: string, after: string, options?: DiffOptions): DiffInlineResult
```

```ts
interface DiffInlineResult {
  before: readonly DiffSegment[];
  after: readonly DiffSegment[];
  similarity: number;
}
```

A side each rather than one list between them, so joining a side back together gives the text that was passed in for it.

## `diffSequence`

```ts
diffSequence(before: readonly string[], after: readonly string[], options?: DiffOptions): DiffEdit[]
```

```ts
interface DiffEdit {
  kind: 'equal' | 'insert' | 'delete';
  beforeStart: number;
  beforeEnd: number;
  afterStart: number;
  afterEnd: number;
}
```

The edits cover both sequences exactly once, in order.

## Custom properties

Declared on `.diffine`, and overridden the same way.

### Colours

| Property                 | Light       | Dark        |
| ------------------------ | ----------- | ----------- |
| `--diffine-surface`      | `#ffffff`   | `#1b222c`   |
| `--diffine-text`         | `#1f2733`   | `#e4e9f0`   |
| `--diffine-muted`        | `#6e798c`   | `#8d99ad`   |
| `--diffine-border`       | `#d6dee9`   | `#2f3945`   |
| `--diffine-gutter`       | `#f4f7fb`   | `#232b36`   |
| `--diffine-accent`       | `#0e7ffc`   | `#4c9dff`   |
| `--diffine-insert-line`  | `#e7f8ee`   | `#12301f`   |
| `--diffine-insert-piece` | `#a5e9c1`   | `#206c42`   |
| `--diffine-delete-line`  | `#fdecee`   | `#351c20`   |
| `--diffine-delete-piece` | `#ffc3c8`   | `#7f303a`   |
| `--diffine-insert-text`  | `#1a7f4b`   | `#5fd08a`   |
| `--diffine-delete-text`  | `#c2333f`   | `#ff8b95`   |
| `--diffine-blank`        | `#f0f3f7`   | `#151b23`   |
| `--diffine-selection`    | `#0e7ffc33` | `#4c9dff40` |

The `-line` pair tints a whole row; the `-piece` pair picks out what moved inside it, and only ever sits on top of the paler one. The `-text` pair is the same two colours dark enough to be read as text, for the counts in the bar under the panes, which have nothing behind them but the gutter. `--diffine-selection` is the editor's alone, and has to stay see-through: the words under a selection are drawn behind the field.

### Measurements

| Property                 | Default           | What it is                                    |
| ------------------------ | ----------------- | --------------------------------------------- |
| `--diffine-height`       | `24rem`           | How tall the viewer is. `auto` grows with it. |
| `--diffine-radius`       | `0.5rem`          | The corner radius of the frame.               |
| `--diffine-font`         | A monospace stack | The typeface the documents are drawn in.      |
| `--diffine-font-size`    | `0.8125rem`       | Its size.                                     |
| `--diffine-line-height`  | `1.5rem`          | The height of one unwrapped line.             |
| `--diffine-links-width`  | `3rem`            | The width of the column between the panes.    |
| `--diffine-marker-width` | `1.25rem`         | The width of the `+`, `−` and `~` column.     |

`--diffine-digits` and `--diffine-tab-size` are written onto the element by the component, from the longest document and from `tabSize`. Setting them by hand is overridden on the next render. `--diffine-gutter-width`, `--diffine-gutter-numbers`, `--diffine-gutter-markers` and `--diffine-gutter-rule` are worked out from the two above and from which columns were asked for; they are what the gutter, the stripe that carries it past the last line, and the editor's field indent are all measured with.
