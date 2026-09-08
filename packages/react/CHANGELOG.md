# Changelog

> This package's history. Each language Diffine ships for keeps its own changelog beside its own manifest, because they version independently.

## vNext (2026--)

### Added

- **What a reader copies out of a pane is the document, not the page.** The blanks that hold the two sides level are real empty lines in the page and are in neither file, so a document copied through them arrived with a gap wherever the other side was longer. The text is now built from the lines the pane is drawing: blanks and folded bands contribute nothing, the first and last lines are cut where the selection cuts them, and a selection that reaches outside the lines is left to the browser.

- **`paintDiffImage` turns the mask into a picture of its own.** What changed, on a ground that is see-through, the size of the frame — which is the step between a comparison nobody can look at and a file attached to a build. It takes four bytes a colour rather than a CSS string, and writing the file stays the application's, exactly as reading one is. Together with `formatPatch`, a comparison of either kind can now leave the page in the form the rest of a toolchain reads.

- **`diff.ignore` takes patterns whose matches do not count.** A snapshot with a timestamp in it, a log with a request id, a build with a hash in its filename: one line that is different every time, and a comparison that says the whole file changed. Each pattern is looked for in both lines and what it finds is set aside, so two lines that differ only inside a match are the same line — and what is set aside is still drawn, exactly as with `whitespace`.

  A match is set aside rather than removed, so a line with a timestamp and a line with the timestamp missing are still two different lines. It decides which lines are equal, at the level of a line: inside a pair that was edited the words are compared as they were written, because a pattern written for a line is not a pattern about one word of it.

- **`result.format` says how each document is written, and the bar under the panes says so when the two differ.** Every line ending ends a line, so a file written on one platform and edited on another is not a file where every line changed — and the cost of that was a file whose only difference was invisible reading as no difference at all. `format` carries the line ending each document uses, whether its last line has one, and whether it begins with a byte order mark. It is worked out beside the comparison rather than inside it, so nothing about which lines are equal has changed, and it is left out of a comparison read back out of a patch, which never saw either file.

- **`showInvisibles` draws the whitespace inside the lines.** A dot in the middle of each column a space takes, and a rule under a run of tabs. The characters themselves are untouched and the marks are drawn on the elements around them, so what a reader copies out is the line as it was written. `--diffine-invisible` is the colour, and `strings.format`, `strings.mixedEndings` and `strings.noFinalNewline` are the words the bar uses.

- **`applyChanges` puts a pair of arrows on every change, for taking it across.** A comparison of a saved version and a draft is read with one question in mind, and this is the answer to it: the arrow pointing left writes the right-hand version over the left, the one pointing right does the opposite, and a `readOnly` side is never written into — so the usual arrangement leaves one arrow rather than two. The write goes in through the browser's own editing command, so Ctrl+Z takes it back and `onBeforeChange` or `onAfterChange` reports it exactly as a keystroke would.

  It is the editor's, because applying a change means writing a document, and the buttons sit in the column between the panes, so `connectors={false}` takes them away with it. `strings.applyChange` is what they are named with.

- **`renderGutter` and `renderWidget` are where the application draws its own.** A comparison knows what changed and nothing else, and a review is made of everything else: a comment, a thread, a coverage bar, a lint warning, a button for adding one. The first adds a column to the gutter beside each line and the second puts a box under one. Both are called with the line and the side it is on, for the lines a pane draws rather than for the whole document, and both return `null` for a line that gets nothing.

  A widget is as tall as it is, so `virtualize` turns itself off while one is being drawn and a split view gives the line opposite the same height to keep the two sides level. Both props belong to `viewer` mode: an editor lays a field over its lines, and a column of unknown width or a box of unknown height between them would put the caret in the wrong place. `.diffine-slot` and `.diffine-widget` are what they are styled through.

- **`collapse` folds away the runs of unchanged lines nobody is reading.** Two versions of a file are mostly the part nobody edited, and a reader who opened a comparison to see what changed scrolls past all of it. On, each run is drawn as a band saying how many lines it stands for, with `context` lines kept either side of every change — three by default, which is what `diff` and `git` write. Pressing a band puts its lines back. Both panes fold the same runs so a split view stays level, and a band is exactly one line tall, so `virtualize` carries on unchanged behind it.

  A search reaches the whole document rather than the part of it that is drawn, so opening one puts the folded runs back until the bar is closed. A band is also drawn where a comparison is missing lines rather than hiding them — between one hunk of a patch and the next — whatever `collapse` says, and that one cannot be pressed, because nobody sent the lines it stands for. `strings.folded` and `strings.expand` are the two words it is written with.

- **`parsePatch` reads a unified diff, and `formatPatch` writes one.** A service that already holds the comparison — a server, a build, a hook with `git diff` in its hands — can now send the patch instead of both documents, and what comes back is the same value `diffText` returns, down to the words marked inside a pair of changed lines. `parsePatch` gives one entry per file the patch covers, each with the names off the `---` and `+++` lines; `formatPatch` takes a comparison and a `context` and writes the format `git apply` and `patch` read.

  What the format does not carry, the reader does not invent. The lines between one hunk and the next are not in a patch, so the numbers jump there: a line's `index` is still its own number in the file it came from, and `result.before` holds the lines that arrived rather than the whole document. Both functions are also their own entry, `diffine-react/patch`, so nothing of the component reaches a bundle that only wanted them.

## v0.1.0 (2026-09-06)

The viewer became a component that is also an editor, the text gained colour and a search of its own, and two pictures can now be compared where before only two documents could.

### Breaking changes

- **`DiffineViewer` is now `TextDiff`.** Rename the import and the element; every prop it already took means the same thing, and `DiffineViewerProps` is `TextDiffProps`. The name says what the component compares rather than how it is read, because a picture is a different kind of diff rather than a different kind of viewer — and the same component now writes as well as reads, which `mode` decides.

### Added

- **`mode="editor"` is the same view with the two panes made editable.** The same comparison, the same lines, the same bands across the column between them, and the same buttons for stepping through the changes — with a field over each side, so the comparison is worked out again as somebody types into it. One component rather than two, because reading a comparison and writing one were never two things: `mode` is what decides which of its parts are on the screen, and every other prop means the same in both. `before`/`after` or `defaultBefore`/`defaultAfter` decide whether the documents are the application's or the component's, `onBeforeChange` and `onAfterChange` report either way, and `readOnly` takes a side for the common arrangement of a saved version on the left and a draft on the right.

- **The field is laid over the lines rather than replacing them.** A `<textarea>` cannot colour a word inside itself, and nothing that can is also an undo stack, an input method, a selection and a control a screen reader already knows how to read. So the field's own text is invisible, its caret is not, and everything on the screen is drawn behind it — tints, marked words and `highlight` included. What the two have to agree on is written into the stylesheet rather than measured, so the alignment holds at any size and does not lag a frame behind a resize.

  The two sides are never held level. A blank line put in to keep them in step would be a line somebody could put the caret in, so each document runs at its own length and the column between the panes says which part of one answers which part of the other.

- **`indentWithTab` types a tab, and is off by default.** A control a keyboard cannot leave is a page a keyboard cannot leave. Turned on there are two ways out, both of them the ones somebody would try: Shift+Tab moves back a control, and Escape hands the next Tab to the browser. The tab itself goes in through the browser's own editing command, so undo still undoes it. `spellCheck` hands the fields to the browser's own dictionary, and is off for the same reason a code editor's is.

- **`onDiff` hands over the comparison every time it is worked out again**, for everything an application wants to say about the two documents outside the box they are in: a count in a heading, or a button that is only worth pressing while the two differ.

- **Each pane carries a search of its own.** A button in the bar above it opens a bar under it, and Ctrl+F opens the one for the pane the keyboard is in — two panes, two queries, two counts, opened and closed one at a time, because a name being chased through the version on the left is not a name being chased through the version on the right. Matches are marked as the query is typed, the pane moves to the one being read, and Enter and Shift+Enter step through the rest. Three switches inside the box read the query as a case-sensitive one, as whole words only, or as a regular expression.

  It reads the document rather than the page, so it reaches the lines `virtualize` left undrawn and the browser's own find cannot. `search={false}` turns the button and the shortcut off together, and `--diffine-search` and `--diffine-search-current` are the two colours it marks with.

- **Ctrl+H opens that bar with a row for replacing on it.** The editor's alone, and not for a side that is `readOnly`. Replace writes over the match being read and moves to the one that takes its place, so pressing it again walks down the document, and Replace All writes over every one of them. Both go in through the browser's own editing command, so Ctrl+Z takes them back — and the caret follows the search, which means closing the bar leaves it on the match that was being read.

- **`--diffine-selection` and `strings.placeholder` join the theming interface.** The selection colour has to be see-through, because the words under a selection are drawn behind the field; the placeholder is what an empty field says before anybody has typed into it.

- **`language` colours the two documents as whatever they are written in.** A highlight.js identifier, or `plain` for a document that is not code, with `DIFFINE_LANGUAGES` as the whole list and the name written at the right end of the bar above the panes. An editor draws that list as a menu instead, because a document somebody pasted is a document nobody knew the language of — `defaultLanguage` and `onLanguageChange` are the usual pair for holding the choice, and `languageLabel` turns the name and the menu off together. The menu is built rather than a `<select>`, so it is drawn in the component's own style, and it keeps everything a `<select>` gives a reader: the arrow keys, Home and End, Enter, Escape, and typing a letter to jump to a language.

  The library and each grammar sit behind an `import()`, so a component left on `plain` fetches none of it and one asking for Python fetches Python. The colours are eight custom properties, `--diffine-code-keyword` and the rest, that every class highlight.js emits is mapped onto.

  The colouring is deferred, so it is never what a keystroke waits on: an editor draws the new text against the colours the last keystroke produced, and the new ones arrive in a pass that yields to the next key. On five thousand lines the tokenising costs 48ms where the comparison costs 0.7ms, which is the whole of the difference.

  `highlight` still takes an application's own highlighter, and replaces `language` rather than adding to it.

- **The bar under the panes says what each document weighs and what happened between them.** It sits on the header's grid, so the left half is under the left pane and the right half under the right one, and each side carries its own character count and its size in bytes. The counts go at the far right as a `~`, a `+` and a `−` against three numbers — the same three marks the gutter puts beside a line — and a screen reader is told the sentence instead. `documentSize` is the string that sentence is written from.

- **`font` sets the typeface, its size, its line height and its letter spacing from props.** The same four custom properties, for an application that holds them in its own state rather than in its own CSS; anything left out keeps the stylesheet's value. `--diffine-letter-spacing` is new, and is the fourth of them.

- **`diffImage` compares two pictures pixel by pixel.** A byte a pixel saying what happened to it, the changes grouped into rectangles, where each picture sits in the frame the two were compared in, and the counts — the same bargain `diffText` makes, made again for pixels, and worth more here: comparing two photographs is a few million pieces of arithmetic, and `diffine-react/image` is how that happens in a worker. Both sides are `ImageData`, or anything shaped like it, and neither has to be the size of the other. Opening a file is not part of it.

- **`tolerance` decides how much of a difference counts.** Two pictures saved by the same encoder twice are not the same file twice, and at nought a comparison of them lights up nearly everywhere. What the number is measured against is the distance between two colours, weighted the way an eye weights them, with a fully transparent pixel reading as the white it would be drawn on.

- **`ignoreAntialiasing` drops the pixels a renderer's own smoothing left behind.** The same page drawn by two browsers differs along every letter and every curve while showing the same thing. A pixel is left out when it is a blend of what surrounds it rather than a colour of its own, and the change is no larger than the step in brightness it is sitting on — so an edge redrawn a fraction of a pixel over is quiet, and a mark that arrived in the middle of a white field is not.

- **`align` finds the offset between two pictures that are not lined up.** A screenshot taken again a pixel to the left is, to a comparison that starts both at the corner, a picture where everything changed. The search is coarse first — the pictures are halved until they are thumbnails, the offset is found there, and each step back up refines it by a pixel — and `alignRadius` is how far it goes. What only one of the two covers afterwards comes back as `added` or `removed`, which is the answer a line with nothing opposite it gets.

- **`ImageDiff` draws all of that.** The changed pixels tinted over both sides, a box round each change, buttons that step from one to the next, and one zoom and one position shared by both panes — so two pictures are never looking at different parts of themselves. Drag to move, Ctrl with the wheel to zoom about the pointer, and the arrows and `+` and `−` for a reader who is not holding one. Above its own size the picture is drawn crisp rather than smooth, because a reader at four hundred per cent is counting pixels.

- **Four views rather than one.** `split` puts one picture either side, `overlay` fades between them, `wipe` draws the line where one stops and the other starts, and `mask` drops both and leaves what changed. No single one of them answers "did this move, or did it change colour": a wipe does, an overlay does not, and the mask says where to point the other three.

- **`mode="editor"` takes a picture from the reader.** An empty pane invites one, a full one takes one dropped on it, and each side has a button in the bar for somebody who is not dragging anything. `before`/`after` or `defaultBefore`/`defaultAfter` decide whether the pictures are the application's or the component's, exactly as they do for text.

- **A picture is decoded at four million pixels at most, and `maxPixels` moves that.** Two photographs out of a modern camera, held as bitmaps and as buffers, are most of a gigabyte before anything has been compared. Past the cap a picture is decoded smaller, which costs a little sharpness at a high zoom and is the difference between a page that answers and a page that stops.

- **Seven custom properties for what a picture comparison paints.** `--diffine-image-changed`, `--diffine-image-added` and `--diffine-image-removed` are the marks, `--diffine-image-outline` and `--diffine-image-marker` are the box round a change and the one being looked at, and `--diffine-image-ground` and `--diffine-image-chequer` are the pane behind them. They are read off the element and painted into the pixels, because a canvas cannot be styled — which is why the mask is painted again when the palette under it changes.

### Changed

- **`highlight.js` is the package's one dependency**, where there were none. It is never loaded until a `language` other than `plain` is asked for, so a page that does not colour its documents downloads nothing it did not before. `react` and `react-dom` remain peer dependencies.

- **A band between the panes runs from the colour it left as to the colour it arrived as.** An edit went out on one side and came in on the other, and the band for one used to be a delete-coloured fill with an insert-coloured outline — two statements that contradicted each other. It is one gradient across the column now. The band is drawn as a fill with its two curves stroked separately, so the curves that carry the meaning are not thinned by the two vertical edges that carry none, and the column takes the surface colour rather than the gutter's so that a pale tint on it reads the way the same tint does inside a pane.

- **The change a reader is on is marked with a heavier line rather than in the accent colour**, so which change it is stays a matter of weight and the colours are left to say what happened.

### Fixed

- The bar above the panes is given as many columns as the view under it. With `connectors={false}` the two halves of the header were still laid out around a column that was not there, so each label sat over the wrong document.

- The line-number gutter runs to the bottom of a pane the document does not fill. It was drawn by each line, so it stopped where the document did, and it now stays still while a long line scrolls past it.

- A page's own paragraph margin no longer opens a gap under the panes. The summary bar and the empty message were `<p>` elements, and a documentation theme's `.vp-doc p` beat the reset that takes their margin off.

- Two panes that are not held level follow each other on the scale each one has. A pane with eighty pixels of travel answers in one part in eighty, which read back against seventy thousand pixels on the other side turned one pixel of rounding into nine hundred — so a change button or a search that scrolled the long side to a line was answered with a jump of half a screen.

- Switching between the split and unified views no longer warns in the console. `useVirtualRows` spread the panes' line counts into its dependency lists, and a split view has two panes where a unified view has one.

- A view handed `result` on its own draws the comparison rather than the empty message. Emptiness was read off the two document props, which such a view leaves unset.

## v0.0.1 (2026-09-05)

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

- **Two buttons for reading a comparison one change at a time.** They sit in the bar above the panes, with the count beside them, and they wrap — a reader working down a file wants the next change rather than a button that stops at the bottom. The change they land on is marked down its left edge and its band between the panes is drawn in the accent colour, so where a reader is stays visible after the scrolling has stopped.

  `selected` and `onSelectedChange` make that an application's to hold, in the usual React pair, and setting `selected` scrolls the view the same way pressing a button does. `navigation` turns the buttons off; the bar they sit in is drawn for them even when `header` is not.

- **A long comparison draws the lines a reader can see and no more.** Twenty thousand lines is twenty thousand rows in the page and forty of them are on the screen; the rest are now height and nothing else. The scrollbar is still the length of the document, the sideways scroll is still the width of its longest line, and the bands between the panes are worked out by arithmetic rather than from elements that are not there.

  It needs every line to be the same height, which only a pane that is not wrapping gives, so `wrap` turns it off. It also leaves a short document alone. `virtualize={false}` turns it off outright, which is what a page needs if the browser's own find has to reach text that is scrolled away.

- **`highlight` lets an application colour the text inside a line**, which is where a syntax highlighter goes. It is handed the whole line — a grammar applied to a fragment does not come out right, and fragments are what a comparison produces — and hands back the runs it wants drawn differently. The line is then cut at the boundaries of both, so a changed word that is half a string literal is drawn as exactly that. With the rows virtualised it is called for the lines on the screen rather than for the document.
