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

- **The bar under the panes says what each document weighs and what happened between them.** It sits on the header's grid, so the left half is under the left pane and the right half under the right one, and each side carries its own character count and its size in bytes. The counts go at the far right as a `~`, a `+` and a `−` against three numbers — the same three marks the gutter puts beside a line — and a screen reader is told the sentence instead. `documentSize` is the string that sentence is written from.

- **Every colour and measurement is a custom property.** An application with a palette of its own overrides `--diffine-*` on the element rather than writing rules that have to beat the package's.

- **The viewer says what it is showing to a reader who cannot see it.** Each pane is a named region, every changed line carries the word for what happened to it where a screen reader will find it and a copy will not, and the `+`, `−` and `~` markers say in shape what the colours say in colour.

- **English and Korean, and any other language an application writes itself.** `locale` picks one of the two and `strings` replaces any word in either.

- **Two buttons for reading a comparison one change at a time.** They sit in the bar above the panes, with the count beside them, and they wrap — a reader working down a file wants the next change rather than a button that stops at the bottom. The change they land on is marked down its left edge and its band between the panes is drawn in the accent colour, so where a reader is stays visible after the scrolling has stopped.

  `selected` and `onSelectedChange` make that an application's to hold, in the usual React pair, and setting `selected` scrolls the view the same way pressing a button does. `navigation` turns the buttons off; the bar they sit in is drawn for them even when `header` is not.

- **A long comparison draws the lines a reader can see and no more.** Twenty thousand lines is twenty thousand rows in the page and forty of them are on the screen; the rest are now height and nothing else. The scrollbar is still the length of the document, the sideways scroll is still the width of its longest line, and the bands between the panes are worked out by arithmetic rather than from elements that are not there.

  It needs every line to be the same height, which only a pane that is not wrapping gives, so `wrap` turns it off. It also leaves a short document alone. `virtualize={false}` turns it off outright, which is what a page needs if the browser's own find has to reach text that is scrolled away.

- **`highlight` lets an application colour the text inside a line**, which is where a syntax highlighter goes. It is handed the whole line — a grammar applied to a fragment does not come out right, and fragments are what a comparison produces — and hands back the runs it wants drawn differently. The line is then cut at the boundaries of both, so a changed word that is half a string literal is drawn as exactly that. With the rows virtualised it is called for the lines on the screen rather than for the document.

- **`DiffineEditor` is the viewer with the two panes made editable.** The same comparison, the same lines, the same bands across the column between them, and the same buttons for stepping through the changes — with a field over each side, so the comparison is worked out again as somebody types into it. `before`/`after` or `defaultBefore`/`defaultAfter` decide whether the documents are the application's or the component's, `onBeforeChange` and `onAfterChange` report either way, and `readOnly` takes a side for the common arrangement of a saved version on the left and a draft on the right.

- **The field is laid over the lines rather than replacing them.** A `<textarea>` cannot colour a word inside itself, and nothing that can is also an undo stack, an input method, a selection and a control a screen reader already knows how to read. So the field's own text is invisible, its caret is not, and everything on the screen is drawn behind it — tints, marked words and `highlight` included. What the two have to agree on is written into the stylesheet rather than measured, so the alignment holds at any size and does not lag a frame behind a resize.

  The two sides are never held level. A blank line put in to keep them in step would be a line somebody could put the caret in, so each document runs at its own length and the column between the panes says which part of one answers which part of the other.

- **`indentWithTab` types a tab, and is off by default.** A control a keyboard cannot leave is a page a keyboard cannot leave. Turned on there are two ways out, both of them the ones somebody would try: Shift+Tab moves back a control, and Escape hands the next Tab to the browser. The tab itself goes in through the browser's own editing command, so undo still undoes it.

- **`--diffine-selection` and `strings.placeholder` join the theming interface.** The selection colour has to be see-through, because the words under a selection are drawn behind the field; the placeholder is what an empty field says before anybody has typed into it.
