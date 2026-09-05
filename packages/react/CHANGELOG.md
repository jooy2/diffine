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

- **`DiffineViewer` draws two documents side by side.** The matching lines are held level with each other, a line with no counterpart gets a blank opposite it, and the column between the panes draws each change as a band from where it left to where it arrived. Scrolling one pane scrolls the other, and a line that wraps takes its counterpart's row down with it so the two documents never fall out of step.

- **Every part of the view is a prop with a default.** Line numbers, the `+` and `−` markers, wrapping, holding the two sides level, the connectors, the synchronised scrolling, the header, the summary, the tab width, the palette and the language — each one on its own, so the component goes from a full side-by-side down to a bare column of lines without a stylesheet being touched.

- **`view="unified"` puts what went out above what came in**, in one column, with both documents' line numbers down the side. It is the same comparison read a second way rather than a second comparison.

- **The viewer takes a comparison instead of two documents.** `result` is for an application that worked one out in a worker, on a server, or once for a list of viewers.

- **Every colour and measurement is a custom property.** An application with a palette of its own overrides `--diffine-*` on the element rather than writing rules that have to beat the package's.

- **The viewer says what it is showing to a reader who cannot see it.** Each pane is a named region, every changed line carries the word for what happened to it where a screen reader will find it and a copy will not, and the `+`, `−` and `~` markers say in shape what the colours say in colour.

- **English and Korean, and any other language an application writes itself.** `locale` picks one of the two and `strings` replaces any word in either.

- **A long comparison draws the lines a reader can see and no more.** Twenty thousand lines is twenty thousand rows in the page and forty of them are on the screen; the rest are now height and nothing else. The scrollbar is still the length of the document, the sideways scroll is still the width of its longest line, and the bands between the panes are worked out by arithmetic rather than from elements that are not there.

  It needs every line to be the same height, which only a pane that is not wrapping gives, so `wrap` turns it off. It also leaves a short document alone. `virtualize={false}` turns it off outright, which is what a page needs if the browser's own find has to reach text that is scrolled away.
