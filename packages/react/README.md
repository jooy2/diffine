<img src="https://raw.githubusercontent.com/jooy2/diffine/main/docs/public/128x128.png" alt="Diffine" width="96" height="96" />

# diffine-react

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/jooy2/diffine/blob/main/LICENSE) [![npm latest package](https://img.shields.io/npm/v/diffine-react/latest.svg)](https://www.npmjs.com/package/diffine-react) [![npm downloads](https://img.shields.io/npm/dm/diffine-react.svg)](https://www.npmjs.com/package/diffine-react)

**Diffine compares two versions and shows what changed.** A diff engine and a side-by-side viewer in one package, for text and for pictures, to read or to type into.

📘 **[diffine.cdget.com](https://diffine.cdget.com)** for the guides and the full API, in English and Korean.

## Install

```bash
npm install diffine-react
```

`react` and `react-dom` are peer dependencies: React 18 or 19. The one dependency is `highlight.js`, and it sits behind an `import()`, so a component left on `language="plain"` fetches none of it.

## Reading a comparison

```tsx
import { TextDiff } from 'diffine-react/text-diff';
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

| Prop | Default | What it decides |
| --- | --- | --- |
| `mode` | `'viewer'` | Whether the two documents are read or written (`'editor'`). |
| `view` | `'split'` | One document either side, or one column with both (`'unified'`). |
| `lineNumbers` | `true` | Whether each line carries its number. |
| `markers` | `true` | Whether a changed line carries a `+`, `−` or `~` beside it. |
| `wrap` | `false` | Whether a long line wraps or runs off the side. |
| `alignLines` | `true` | Whether a line is held level with its counterpart. |
| `collapse` | `false` | Whether runs of unchanged lines far from a change are folded. |
| `context` | `3` | How many unchanged lines are kept either side of a change. |
| `connectors` | `true` | Whether the column between the panes draws each change as a band. |
| `syncScroll` | `true` | Whether scrolling one pane scrolls the other. |
| `header` | `true` | Whether each side is named above it. |
| `navigation` | `true` | Whether the buttons for moving between changes are drawn. |
| `search` | `true` | Whether a reader can search a pane from inside the component. |
| `summary` | `true` | Whether the counts are written under the view. |
| `virtualize` | `true` | Whether only the lines a reader can see are drawn. |
| `showInvisibles` | `false` | Whether the spaces and tabs inside a line are drawn. |
| `tabSize` | `4` | How wide a tab is drawn. |
| `colorScheme` | `'system'` | `'light'`, `'dark'`, or the reader's own setting. |
| `locale` | `'en'` | The language of the component's own words. `'ko'` is the other. |
| `strings` | — | Words to use instead of the locale's, for any of them. |

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

Each pane has a search of its own: a button in the bar above it, a bar of its own underneath it, and Ctrl+F (Cmd+F on a Mac) for whichever pane the keyboard is in. Two panes, two queries, two counts, opened and closed one at a time, because a name being chased through the version on the left is usually not the name being chased through the version on the right.

Every match is marked as it is typed and the pane moves to the one being read. The query is text by default, and the three switches inside the box read it as a case-sensitive one, as whole words only, or as a regular expression.

In the editor, Ctrl+H opens the same bar with a row for replacing under it, and the caret follows the search, so closing the bar leaves it on the match that was being read. Replacing goes through the browser's own editing command, so Ctrl+Z takes it back. A side that is `readOnly` gets the search without the replacing.

`search={false}` turns the whole of it off, button and shortcut together.

### Long documents

`virtualize` is on by default: a comparison of twenty thousand lines draws the forty that are on the screen and leaves the rest as height. With `wrap` on the rows are not all the same height, so the ones that have been drawn are measured and kept and the rest stand at the average of those. It leaves a short document alone, and it stays off where `renderWidget` is given and in a wrapped editor.

`collapse` is the other half of a long comparison: each run of unchanged lines becomes a band saying how many it stands for, with `context` of them kept either side of every change, and pressing a band puts its lines back.

### Colouring the text

`language` names what the documents are written in, and they are coloured as it.

```tsx
<TextDiff before={saved} after={draft} language="typescript" />
```

It takes a highlight.js identifier, or `plain` for a document that is not code. `DIFFINE_LANGUAGES` is the whole list with the name to write beside each one, and the bar above the panes writes that name at its right end. In `editor` mode the same corner is a menu that opens the list, because a document somebody pasted is a document nobody knew the language of:

```tsx
<TextDiff mode="editor" defaultBefore={saved} defaultAfter={draft} defaultLanguage="python" />
```

`highlight.js` and each grammar are behind an `import()`, so nothing is fetched until a language other than `plain` is asked for, and what is fetched is that one grammar. The colours are eight custom properties (`--diffine-code-keyword` and the rest) that every class the library emits is mapped onto.

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

### Drawing your own on a line

A comparison knows what changed and nothing else. `renderGutter` adds a column to the gutter beside each line and `renderWidget` puts a box under one, which is where a review comment, a coverage bar or a lint warning goes. Both are called with the line and the side it is on, for the lines a pane draws rather than for the whole document.

```tsx
<TextDiff
  before={saved}
  after={draft}
  renderWidget={(line, side) =>
    side === 'after' && threads[line.index] ? <Thread of={threads[line.index]} /> : null
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
| `ignore` | `[]` | Patterns whose matches do not count, for a timestamp or an id that changes every time. |
| `maxCost` | `5000` | The largest difference the engine works through before giving up. |

Whatever the whitespace options ignore is still drawn. They change which lines count as equal, never what a reader sees.

### Styling

Every colour and measurement is a custom property on the `.diffine` element, so a palette of your own is a handful of declarations rather than rules that have to win on specificity:

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
import { TextDiff } from 'diffine-react/text-diff';
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

Each pane draws its document twice: once as the lines you see, and once as a plain `<textarea>` over the top whose own text is invisible and whose caret is not. That is what lets a tinted row, a marked word and `highlight` sit under text somebody is editing, while the field goes on being a field, with its undo stack, its input method, its selection and its accessibility all the browser's.

The two sides are never held level, because a blank line put in to keep them in step would be a line somebody could put the caret in. The column between the panes says which part of one answers which part of the other.

| Prop            | Default | What it decides                                           |
| --------------- | ------- | --------------------------------------------------------- |
| `readOnly`      | `false` | Which side cannot be typed into, or `true` for both.      |
| `indentWithTab` | `false` | Whether Tab types a tab instead of moving on.             |
| `spellCheck`    | `false` | Whether the browser marks its own spelling mistakes.      |
| `onDiff`        | —       | The comparison, every time it is worked out again.        |
| `applyChanges`  | `false` | Whether each change carries buttons for taking it across. |

With `applyChanges` on, every change grows a pair of arrows in the column between the panes: the one pointing left writes the right-hand version over the left, and a `readOnly` side is never written into. The write goes through the browser's own editing command, so Ctrl+Z takes it back.

Every other prop means the same thing in both modes, except `view`, `alignLines`, `collapse`, `context` and `result`, which an editor ignores. With `indentWithTab` on there are two ways out of the field: Shift+Tab moves back a control, and Escape hands the next Tab to the browser.

## Comparing two pictures

`ImageDiff` compares two pictures pixel by pixel and draws what it found: the pixels that changed tinted over both sides, a box round each run of them, and one zoom and one position shared by both panes.

```tsx
import { ImageDiff } from 'diffine-react/image-diff';
import 'diffine-react/styles.css';

<ImageDiff before={saved} after={rendered} />;
```

Each side takes a `Blob`, an `ImageBitmap`, or a buffer of pixels shaped like `ImageData`: a `File` off an input, or the body of a `fetch`. There is no URL among them, because fetching one is the application's to do.

```tsx
<ImageDiff
  before={{ content: saved, label: 'baseline.png' }}
  after={{ content: rendered, label: 'run 4821' }}
  view="wipe"
  diff={{ tolerance: 0.05, align: 'shift' }}
/>
```

`view` is `split`, `overlay`, `wipe` or `mask`; `mode="editor"` lets a reader drop a picture on either pane. `tolerance` decides how much of a difference counts, `ignoreAntialiasing` drops the pixels a renderer's own smoothing left behind, and `align` finds the offset between two shots that are not lined up. The whole of it is on the [image diff page](https://diffine.cdget.com/guide/image-diff).

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

`diffine-react/image` is the same for pictures, and it matters more there: comparing two photographs is a few million pieces of arithmetic, and this is how that happens in a worker.

```ts
import { diffImage } from 'diffine-react/image';

const result = diffImage(before, after, { align: 'shift' });

result.regions; // where the changes are, as rectangles
result.stats.ratio; // how much of the frame is not the same
result.mask; // a byte a pixel: 0 unchanged, and 1, 2 or 3 for the rest
```

Both sides are `ImageData`, or anything shaped like it. Opening a file is not part of it.

## Patches

`diffine-react/patch` reads a unified diff into the value `diffText` returns, and writes one back out. A service that already holds the comparison can send the patch instead of both documents.

```ts
import { formatPatch, parsePatch } from 'diffine-react/patch';

const [file] = parsePatch(await response.text());

<TextDiff result={file.result} before={file.before} after={file.after} />;

formatPatch(result, { context: 3, before: 'a/src/index.ts', after: 'b/src/index.ts' });
```

The lines between one hunk and the next are not in a patch, so the numbers jump there and the viewer draws a band saying how many are missing. `paintDiffImage` does the same job for two pictures: the mask as a picture of its own, ready for a canvas and a PNG.

## Entry points

Every entry is its own bundle, and importing one costs what that one is. The root is the comparison and nothing else — no React, no stylesheet, no menu of languages — so a page that only counts the changes carries a couple of kilobytes.

| Import | What it is | Before it draws |
| --- | --- | --- |
| `diffine-react` | The whole comparison: text, pictures, patches, types. | 2.6 kB |
| `diffine-react/diff` | The text comparison on its own. | 2.9 kB |
| `diffine-react/image` | The picture comparison on its own. | 2.6 kB |
| `diffine-react/patch` | Reading and writing a unified diff. | 3.3 kB |
| `diffine-react/text-diff` | `TextDiff`, and the list its menu of languages is made from. | 17.6 kB |
| `diffine-react/image-diff` | `ImageDiff`. | 10.5 kB |
| `diffine-react/types` | The types on their own. | 0 kB |
| `diffine-react/styles.css` | The stylesheet, for both components. | 4.3 kB |

The sizes are gzipped, with React left out because it is the page's already, and they are what a page fetches before it draws anything. A grammar is not among them: `TextDiff` colours a document with a file it asks for when it is given a `language`, and a viewer that is given none never asks. `npm run size` is what measures this, and CI fails a change that outgrows a budget.

## License

[MIT](LICENSE) © [CDGet](https://cdget.com)
