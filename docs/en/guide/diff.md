---
title: The comparison
order: 4
---

# The comparison

`diffText` works out what changed between two documents and returns it. Nothing in it touches React or the DOM, which is why it is also an entry of its own: a summary line, a count in a badge, or a comparison done in a worker needs the value rather than the view.

```ts
import { diffText } from 'diffine-react/diff';

const result = diffText(saved, draft);

result.changes.length; // 3
result.stats; // { unchanged: 41, changed: 5, inserted: 2, deleted: 1 }
```

## What comes back

| Field             | What it is                                                           |
| ----------------- | -------------------------------------------------------------------- |
| `before`, `after` | Each document, split into lines. Line endings are not part of these. |
| `rows`            | The comparison one row at a time, from the top of both documents.    |
| `changes`         | The changes, in the order they appear.                               |
| `stats`           | How much of the two ended up where.                                  |
| `complete`        | Whether the engine found the smallest set of edits or gave up.       |

### Rows

A row holds whichever side has a line on it. `equal` has both, `insert` has only `after`, `delete` has only `before`, and `replace` is a pair of lines that sit opposite each other and differ.

```ts
for (const row of result.rows) {
  if (row.kind === 'equal') {
    continue;
  }

  console.log(row.kind, row.before?.text ?? '', row.after?.text ?? '');
}
```

That `null` is what a side-by-side view draws a blank for. Anything else reading these rows can skip it instead.

A line carries `index`, which is which line of its own document it is, counted from zero; its `text` as it was written; and `segments`.

### Segments

`segments` is the line broken into the pieces that changed and the pieces that did not. Only that side's own pieces are there, so joining them back together gives the line:

```ts
const [row] = diffText('the quick fox', 'the slow fox').rows;

row.before.segments;
// [{ kind: 'equal', text: 'the ' }, { kind: 'delete', text: 'quick' }, { kind: 'equal', text: ' fox' }]
row.after.segments;
// [{ kind: 'equal', text: 'the ' }, { kind: 'insert', text: 'slow' }, { kind: 'equal', text: ' fox' }]
```

An empty list means there was nothing to compare the line against, or that the pair turned out to have too little in common to be worth marking. Either way the line is whatever its row says it is, all the way across.

### Changes

A change is a run of lines that changed together, one entry per change, which is what a reader is counting when they ask how many there are. Runs of unchanged lines are not on the list; they are the gaps between these.

Each one carries the lines it covers on both sides, and the rows it occupies:

```ts
for (const change of result.changes) {
  console.log(`${change.kind}: before lines ${change.beforeStart + 1}-${change.beforeEnd}`);
}
```

`rowStart` and `rowEnd` are what a view uses to jump to the next change, or to draw a band across a gutter.

## How the two are compared

The second argument settles it. Anything left out keeps its default, so one option is a whole answer.

### `inline`

What is compared inside a pair of lines that were edited rather than replaced outright.

`word` is the default and what a reader usually wants: it marks the word that moved rather than the few letters it shares with the word that was there before. `character` goes a level down, one grapheme at a time, which is right for a changed digit in the middle of a number. `none` leaves a changed line changed and says no more.

<DiffineDemo sample="prose" inline="character" height="16rem" />

### `whitespace`

How much of the whitespace counts. `exact` is the default; `trailing`, `surrounding`, `amount` and `all` each ignore more of it.

Whatever is ignored is still drawn. These change which lines count as equal, never what a reader sees, which is what makes `surrounding` useful for a file that was re-indented and nothing else.

<DiffineDemo sample="whitespace" whitespace="surrounding" height="10rem" summary />

### `ignoreCase`

Whether `Title` and `title` are the same line. Off by default.

With it on, a run the engine calls equal can be two different strings. That is why the pieces come back a side at a time rather than as one list between them. One list could hold only `Title` or only `title`, and it would then be showing text that was not in one of the two documents.

### `inlineThreshold`

How alike a pair of lines has to be, from 0 to 1, before the words inside them are worth marking. `0.3` by default.

Two lines that were edited share most of their words. Two lines that merely landed opposite each other share a comma and a couple of vowels, and marking those scatters meaningless scraps across the row. Below the threshold, the pair is drawn as one changed line on each side.

### `maxCost`

The largest difference the engine will work through before it gives up. `5000` by default.

Finding the smallest set of edits costs roughly the size of the two documents multiplied by the number of edits between them, so two large documents with nothing in common are the expensive case. The answer for that case is "all of it changed", which is not worth waiting for. Past this, the range comes back as one wholesale replacement and `complete` is `false`.

## Smaller pieces

`diffWords` and `diffCharacters` compare two lines without a document around them: a heading, a title, a cell of a table.

```ts
import { diffWords } from 'diffine-react/diff';

const { before, after, similarity } = diffWords('the quick fox', 'the slow fox');
```

`similarity` is the share of the two that could be paired up, counted in characters. It is what `inlineThreshold` is measured against.

`diffSequence` is the engine itself, for an application whose pieces are neither lines nor words:

```ts
import { diffSequence } from 'diffine-react/diff';

diffSequence(['a', 'b', 'c'], ['a', 'c']);
// [
//   { kind: 'equal',  beforeStart: 0, beforeEnd: 1, afterStart: 0, afterEnd: 1 },
//   { kind: 'delete', beforeStart: 1, beforeEnd: 2, afterStart: 1, afterEnd: 1 },
//   { kind: 'equal',  beforeStart: 2, beforeEnd: 3, afterStart: 1, afterEnd: 2 }
// ]
```

Both sides are compared as strings, so whatever the tokens are, they arrive here as the text that identifies them. The edits cover both sequences exactly once, in order.

## Patches

A patch is the changed lines and a few either side of each of them, which is what `git diff` writes and what every code host reads. `parsePatch` turns one into the same value `diffText` returns, so a service that already holds the comparison can send that instead of both documents.

```ts
import { parsePatch } from 'diffine-react/patch';

const [file] = parsePatch(await response.text());

file.before; // 'a/src/index.ts', the name on the `---` line
file.result; // the same shape `diffText` returns
```

One entry comes back per file the patch covers, in the order they appear, and the second argument is the same set of options `diffText` takes. A page that reads patches and a page that compares documents can be told to mark the same things.

What the format does not carry, the reader does not invent. The lines between one hunk and the next are not in the patch, so the numbers jump there: a line's `index` is still its own number in the file it came from, while `result.before` holds only the lines that arrived. Anything around the hunks is skipped rather than read, including the `diff --git` line, the mode and index lines, and the marker for a file that does not end in a newline.

`formatPatch` is the way back out, for an export button or a comparison that has to be handed to another tool.

```ts
import { formatPatch } from 'diffine-react/patch';

formatPatch(diffText(saved, draft), {
  before: 'a/src/index.ts',
  after: 'b/src/index.ts'
});
```

| Option    | What it is                                                 | Default    |
| --------- | ---------------------------------------------------------- | ---------- |
| `context` | How many unchanged lines are kept either side of a change. | `3`        |
| `before`  | The name written on the `---` line.                        | `'before'` |
| `after`   | The name written on the `+++` line.                        | `'after'`  |

Two documents that turned out to be the same give an empty string rather than a header with nothing under it, so the value itself says whether there was anything to write. A patch that is going to be applied by `git apply` or `patch` needs the real path on both lines, which is what the two names are for.

## How it works

The method is the one Eugene Myers published in 1986, in the shape described in the second half of that paper: walk the edit graph forwards from the start and backwards from the end at once, stop where the two meet, and recurse either side of the run of matches at the meeting point. It costs one pass over both documents per step and holds a row of the graph rather than the whole thing, which is what lets a large file open at all.

Two things sit on top of it. Inside a run where lines went out and lines came in, the two sides are laid out to pair the lines that look like each other rather than straight down the run. Otherwise a run that inserts a line as well as editing one gets every row after the insertion wrong. And inside a pair, the same search runs again over words or graphemes.
