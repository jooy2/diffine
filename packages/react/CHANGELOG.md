# Changelog

> This package's history. Each language Diffine ships for keeps its own changelog beside its own manifest, because they version independently.

## v0.0.1 (2026--)

The first published version.

### Added

- **`diffText` compares two documents and hands back what it found.** The lines each was split into, the rows a side-by-side view draws, the changes in the order they appear, and the counts. It is a plain object with no React and no DOM in it, so the same call answers a badge on a page, a line in a terminal, and the viewer.

- **The words inside a changed line are compared as well as the lines.** A row that says a line changed is half an answer; `inline` decides whether the other half is words, graphemes, or nothing. A pair of lines that turns out to have too little in common is left unmarked rather than striped with the punctuation the two happen to share — `inlineThreshold` is where that line is drawn.

- **`whitespace` and `ignoreCase` decide which lines count as the same.** Trailing whitespace, whitespace at either end, how much of it there is between two words, or all of it. Whatever is ignored is still drawn, so these change which lines are called equal and never what a reader sees.

- **`diffWords`, `diffCharacters` and `diffSequence` are the engine on its own.** The first two compare a heading or a cell without a document around it. The third takes any two arrays of tokens, for an application whose pieces are neither lines nor words.

- **`maxCost` stops two documents with nothing in common from taking the page down with them.** Finding the smallest set of edits costs the size of the documents multiplied by the number of edits between them, and the answer for that case is "all of it changed" — which is not worth waiting for. Past the limit the range comes back as one replacement and `complete` says the engine gave up.

- **`diffine-react/diff` is an entry of its own**, for an application that wants the comparison without the component.
