<img src="https://raw.githubusercontent.com/jooy2/diffine/main/docs/public/128x128.png" alt="Diffine" width="96" height="96" />

# diffine-react

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/jooy2/diffine/blob/main/LICENSE) [![npm latest package](https://img.shields.io/npm/v/diffine-react/latest.svg)](https://www.npmjs.com/package/diffine-react) [![npm downloads](https://img.shields.io/npm/dm/diffine-react.svg)](https://www.npmjs.com/package/diffine-react)

**Diffine works out what changed between two versions and puts it on the screen.** Two panes side by side, the matching lines held level with each other, and the words that actually moved marked inside the lines that carry them.

📘 **[diffine.cdget.com](https://diffine.cdget.com)** — guides and the full API, in English and Korean.

> **`0.0.1`.** The comparison and the viewer are written and they run. The names are not settled yet, so treat every export as something that can still change shape until `1.0.0`.

## Install

```bash
npm install diffine-react
```

`react` and `react-dom` are peer dependencies — React 18 or 19. Nothing else comes with the package.

## The viewer

```tsx
import { DiffineViewer } from 'diffine-react';
import 'diffine-react/styles.css';

export function Review({ saved, draft }: { saved: string; draft: string }) {
  return <DiffineViewer before={saved} after={draft} />;
}
```

Each side takes a string, or a string with a name on it:

```tsx
<DiffineViewer
  before={{ content: saved, label: 'v1.2' }}
  after={{ content: draft, label: 'Working copy' }}
/>
```

Every part of the view is a prop with a default, so the component goes from a full side-by-side down to a bare column of lines without a stylesheet being touched:

| Prop          | Default    | What it decides                                                   |
| ------------- | ---------- | ----------------------------------------------------------------- |
| `view`        | `'split'`  | One document either side, or one column with both (`'unified'`).  |
| `lineNumbers` | `true`     | Whether each line carries its number.                             |
| `markers`     | `true`     | Whether a changed line carries a `+`, `−` or `~` beside it.       |
| `wrap`        | `false`    | Whether a long line wraps or runs off the side.                   |
| `alignLines`  | `true`     | Whether a line is held level with its counterpart.                |
| `connectors`  | `true`     | Whether the column between the panes draws each change as a band. |
| `syncScroll`  | `true`     | Whether scrolling one pane scrolls the other.                     |
| `header`      | `true`     | Whether each side is named above it.                              |
| `navigation`  | `true`     | Whether the buttons for moving between changes are drawn.         |
| `summary`     | `true`     | Whether the counts are written under the view.                    |
| `virtualize`  | `true`     | Whether only the lines a reader can see are drawn.                |
| `tabSize`     | `4`        | How wide a tab is drawn.                                          |
| `colorScheme` | `'system'` | `'light'`, `'dark'`, or the reader's own setting.                 |
| `locale`      | `'en'`     | The language of the viewer's own words. `'ko'` is the other one.  |
| `strings`     | —          | Words to use instead of the locale's, for any of them.            |

Anything else is passed straight to the element, so `id`, `className`, `style` and the `aria-*` attributes work as they would on a `<div>`.

### Moving between changes

The buttons in the bar above the panes step through the changes and wrap at either end. Which one a reader is on is the viewer's to keep, or the application's:

```tsx
<DiffineViewer
  before={saved}
  after={draft}
  selected={index}
  onSelectedChange={(next, change) => setIndex(next)}
/>
```

Setting `selected` scrolls the view, so an application with its own list of changes beside the viewer can drive it from there.

### Long documents

`virtualize` is on by default: a comparison of twenty thousand lines draws the forty that are on the screen and leaves the rest as height. It needs every line to be the same height, so `wrap` turns it off, and it leaves a short document alone.

### Colouring the text

`highlight` is handed a whole line and returns the runs it wants drawn differently. The line is cut at the boundaries of both that and the comparison, so a changed word that is half a string literal is drawn as exactly that.

```tsx
<DiffineViewer
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
<DiffineViewer
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

## The comparison on its own

`diffine-react/diff` is the engine with no React and no DOM in it, for a summary line, a count in a badge, or a comparison worked out in a worker and handed to the viewer as a value.

```ts
import { diffText } from 'diffine-react/diff';

const result = diffText(before, after);

result.changes.length; // how many changes there are
result.stats; // { unchanged, changed, inserted, deleted }
result.rows; // the rows the viewer draws, one per line of the comparison
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

| Import                     | What it is                                        |
| -------------------------- | ------------------------------------------------- |
| `diffine-react`            | Everything: the viewer, the engine and the types. |
| `diffine-react/diff`       | The comparison, with no component in the bundle.  |
| `diffine-react/types`      | The types on their own.                           |
| `diffine-react/styles.css` | The viewer's stylesheet.                          |

## License

[MIT](LICENSE) © [CDGet](https://cdget.com)
