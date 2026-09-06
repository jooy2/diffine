<img src="https://raw.githubusercontent.com/jooy2/diffine/main/docs/public/128x128.png" alt="Diffine" width="96" height="96" />

# diffine-react

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/jooy2/diffine/blob/main/LICENSE) [![npm latest package](https://img.shields.io/npm/v/diffine-react/latest.svg)](https://www.npmjs.com/package/diffine-react) [![npm downloads](https://img.shields.io/npm/dm/diffine-react.svg)](https://www.npmjs.com/package/diffine-react)

**Diffine works out what changed between two versions and puts it on the screen.** Two panes side by side, the matching lines held level with each other, and the words that actually moved marked inside the lines that carry them — to read, or to type into.

📘 **[diffine.cdget.com](https://diffine.cdget.com)** — guides and the full API, in English and Korean.

> **`0.0.1`.** The comparison and both modes of the view are written and they run. The names are not settled yet, so treat every export as something that can still change shape until `1.0.0`.

## Install

```bash
npm install diffine-react
```

`react` and `react-dom` are peer dependencies — React 18 or 19. The one dependency is `highlight.js`, and it is behind an `import()`: a component left on `language="plain"` fetches none of it.

## Reading a comparison

```tsx
import { TextDiff } from 'diffine-react';
import 'diffine-react/styles.css';

export function Review({ saved, draft }: { saved: string; draft: string }) {
  return <TextDiff before={saved} after={draft} />;
}
```

Each side takes a string, or a string with a name on it:

```tsx
<TextDiff
  before={{ content: saved, label: 'v1.2' }}
  after={{ content: draft, label: 'Working copy' }}
/>
```

Every part of the view is a prop with a default, so the component goes from a full side-by-side down to a bare column of lines without a stylesheet being touched:

| Prop          | Default    | What it decides                                                   |
| ------------- | ---------- | ----------------------------------------------------------------- |
| `mode`        | `'viewer'` | Whether the two documents are read or written (`'editor'`).       |
| `view`        | `'split'`  | One document either side, or one column with both (`'unified'`).  |
| `lineNumbers` | `true`     | Whether each line carries its number.                             |
| `markers`     | `true`     | Whether a changed line carries a `+`, `−` or `~` beside it.       |
| `wrap`        | `false`    | Whether a long line wraps or runs off the side.                   |
| `alignLines`  | `true`     | Whether a line is held level with its counterpart.                |
| `connectors`  | `true`     | Whether the column between the panes draws each change as a band. |
| `syncScroll`  | `true`     | Whether scrolling one pane scrolls the other.                     |
| `header`      | `true`     | Whether each side is named above it.                              |
| `navigation`  | `true`     | Whether the buttons for moving between changes are drawn.         |
| `search`      | `true`     | Whether a reader can search a pane from inside the component.     |
| `summary`     | `true`     | Whether the counts are written under the view.                    |
| `virtualize`  | `true`     | Whether only the lines a reader can see are drawn.                |
| `tabSize`     | `4`        | How wide a tab is drawn.                                          |
| `colorScheme` | `'system'` | `'light'`, `'dark'`, or the reader's own setting.                 |
| `locale`      | `'en'`     | The language of the component's own words. `'ko'` is the other.   |
| `strings`     | —          | Words to use instead of the locale's, for any of them.            |

Anything else is passed straight to the element, so `id`, `className`, `style` and the `aria-*` attributes work as they would on a `<div>`.

### Moving between changes

The buttons in the bar above the panes step through the changes and wrap at either end. Which one a reader is on is the component's to keep, or the application's:

```tsx
<TextDiff
  before={saved}
  after={draft}
  selected={index}
  onSelectedChange={(next, change) => setIndex(next)}
/>
```

Setting `selected` scrolls the view, so an application with its own list of changes beside it can drive it from there.

### Searching

Each pane has a search of its own: a button in the bar above it, a bar of its own underneath it, and Ctrl+F — Cmd+F on a Mac — for whichever pane the keyboard is in. Two panes, two queries, two counts, opened and closed one at a time, because a name being chased through the version on the left is not a name being chased through the version on the right.

Every match is marked as it is typed and the pane moves to the one being read. The query is text by default, and the three switches inside the box read it as a case-sensitive one, as whole words only, or as a regular expression.

In the editor, Ctrl+H opens the same bar with a row for replacing under it, and the caret follows the search — closing the bar leaves it on the match that was being read. Replacing goes through the browser's own editing command, so Ctrl+Z takes it back. A side that is `readOnly` gets the search without the replacing.

`search={false}` turns the whole of it off, button and shortcut together.

### Long documents

`virtualize` is on by default: a comparison of twenty thousand lines draws the forty that are on the screen and leaves the rest as height. It needs every line to be the same height, so `wrap` turns it off, and it leaves a short document alone.

### Colouring the text

`language` names what the documents are written in, and they are coloured as it.

```tsx
<TextDiff before={saved} after={draft} language="typescript" />
```

It takes a highlight.js identifier, or `plain` for a document that is not code. `DIFFINE_LANGUAGES` is the whole list with the name to write beside each one, and the bar above the panes writes that name at its right end. In `editor` mode the same corner is the list itself, as a menu, because a document somebody pasted is a document nobody knew the language of:

```tsx
<TextDiff mode="editor" defaultBefore={saved} defaultAfter={draft} defaultLanguage="python" />
```

`highlight.js` and each grammar are behind an `import()`, so nothing is fetched until a language other than `plain` is asked for, and what is fetched is that one grammar. The colours are eight custom properties — `--diffine-code-keyword` and the rest — and every class the library emits is mapped onto one of them.

`highlight` is the way in for an application that already has a highlighter of its own. It is handed a whole line and returns the runs it wants drawn differently, and it replaces `language` rather than adding to it. The line is cut at the boundaries of both that and the comparison, so a changed word that is half a string literal is drawn as exactly that.

```tsx
<TextDiff
  before={saved}
  after={draft}
  highlight={(line) =>
    tokenize(line.text).map((token) => ({
      length: token.content.length,
      className: `token ${token.type}`
    }))
  }
/>
```

### How the two are compared

```tsx
<TextDiff
  before={saved}
  after={draft}
  diff={{ inline: 'character', whitespace: 'trailing', ignoreCase: true }}
/>
```

| Option | Default | What it decides |
| --- | --- | --- |
| `inline` | `'word'` | What is compared inside a changed line: `'word'`, `'character'`, `'none'`. |
| `whitespace` | `'exact'` | `'trailing'`, `'surrounding'`, `'amount'` or `'all'` to ignore some of it. |
| `ignoreCase` | `false` | Whether `Title` and `title` are the same line. |
| `inlineThreshold` | `0.3` | How alike a pair has to be before the words inside it are worth marking. |
| `maxCost` | `5000` | The largest difference the engine works through before giving up. |

Whatever the whitespace options ignore is still drawn. They change which lines count as equal, never what a reader sees.

### Styling

Every colour and measurement is a custom property on the `.diffine` element, so a palette of your own is a handful of declarations rather than a fight with specificity:

```css
.diffine {
  --diffine-height: 40rem;
  --diffine-insert-line: #eaffea;
  --diffine-delete-line: #ffecec;
  --diffine-font-size: 0.875rem;
}
```

## Writing one

`mode="editor"` is the same comparison with the two panes made editable, worked out again as somebody types into either side.

```tsx
import { TextDiff } from 'diffine-react';
import 'diffine-react/styles.css';

export function Compose({ saved }: { saved: string }) {
  const [draft, setDraft] = useState(saved);

  return (
    <TextDiff
      mode="editor"
      before={saved}
      after={draft}
      onAfterChange={setDraft}
      readOnly="before"
    />
  );
}
```

Leave `before` and `after` out and pass `defaultBefore` and `defaultAfter` instead to let the component keep the documents itself. Either way `onBeforeChange` and `onAfterChange` report what was typed.

Each pane draws its document twice: once as the lines you see, and once as a plain `<textarea>` over the top whose own text is invisible and whose caret is not. That is what lets a tinted row, a marked word and `highlight` sit under text somebody is editing, while the field goes on being a field — its undo stack, its input method, its selection and its accessibility all the browser's.

The two sides are never held level, because a blank line put in to keep them in step would be a line somebody could put the caret in. The column between the panes says which part of one answers which part of the other.

| Prop            | Default | What it decides                                      |
| --------------- | ------- | ---------------------------------------------------- |
| `readOnly`      | `false` | Which side cannot be typed into, or `true` for both. |
| `indentWithTab` | `false` | Whether Tab types a tab instead of moving on.        |
| `spellCheck`    | `false` | Whether the browser marks its own spelling mistakes. |
| `onDiff`        | —       | The comparison, every time it is worked out again.   |

Every other prop means the same thing in both modes, except `view`, `alignLines` and `result`, which an editor ignores. With `indentWithTab` on there are two ways out of the field: Shift+Tab moves back a control, and Escape hands the next Tab to the browser.

## The comparison on its own

`diffine-react/diff` is the engine with no React and no DOM in it, for a summary line, a count in a badge, or a comparison worked out in a worker and handed to the component as a value.

```ts
import { diffText } from 'diffine-react/diff';

const result = diffText(before, after);

result.changes.length; // how many changes there are
result.stats; // { unchanged, changed, inserted, deleted }
result.rows; // the rows the component draws, one per line of the comparison
```

```ts
import { diffCharacters, diffSequence, diffWords } from 'diffine-react/diff';

diffWords('the quick fox', 'the slow fox');
// { before: [{ kind: 'equal', text: 'the ' }, { kind: 'delete', text: 'quick' }, …], … }

diffSequence(['a', 'b', 'c'], ['a', 'c']);
// [{ kind: 'equal', … }, { kind: 'delete', … }, { kind: 'equal', … }]
```

`diffSequence` takes any two arrays of tokens, for an application whose pieces are neither lines nor words.

## Entry points

| Import                     | What it is                                            |
| -------------------------- | ----------------------------------------------------- |
| `diffine-react`            | Everything: the components, the engine and the types. |
| `diffine-react/diff`       | The comparison, with no component in the bundle.      |
| `diffine-react/types`      | The types on their own.                               |
| `diffine-react/styles.css` | The stylesheet, for both components.                  |

## License

[MIT](LICENSE) © [CDGet](https://cdget.com)
