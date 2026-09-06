---
title: Text diff
order: 2
---

# Text diff

`TextDiff` draws two documents and what happened between them. Every part of that drawing is a prop with a default, so the same component covers a full side-by-side with connectors and a bare column of lines in a panel too narrow for anything else.

Turn the switches above the demo on and off — it is the component, not a picture of it.

<DiffineDemo sample="code" controls height="22rem" />

## The two modes

`mode` decides whether the two documents are read or written, and it is the only prop the two answers really differ by. The comparison is the same, the lines are the same, the tints and the marked words are the same, and so are the bands between the panes, the buttons above them and the search under them.

```tsx
import { TextDiff } from 'diffine-react';
import 'diffine-react/styles.css';

<TextDiff before={saved} after={draft} />;
<TextDiff mode="editor" defaultBefore={saved} defaultAfter={draft} />;
```

`viewer` is the default. `editor` lays a field over each pane, so the comparison is worked out again as somebody types into it. Type into either side below — nothing is being saved anywhere; the page is the demo.

<DiffineDemo mode="editor" sample="code" height="22rem" />

Three props belong to one mode and are ignored in the other, because there is no honest answer for them anywhere else: `view` and `alignLines` in the editor, and `result` in the editor. Each one is explained where it comes up below.

### What is actually on the screen

In `editor` mode each pane draws its document twice. Once as the lines you can see — tinted where a row changed, with the words that moved marked inside them — and once as a plain `<textarea>` laid over the top, whose own text is invisible and whose caret is not.

That is the only arrangement that gives both halves of what an editor here has to be. A `<textarea>` cannot colour a word inside itself, and nothing that can is also an undo stack, an input method, a selection, and a control a screen reader already knows how to read. So the field stays a field, and everything a reader looks at is drawn behind it.

What it costs is that the two have to agree, exactly, on where every character sits: the same typeface, one line as tall as the next, the text starting the same distance in past the gutter. That agreement is written into the stylesheet rather than measured, so it holds at any size and does not lag a frame behind a resize. If you override `--diffine-font` or `--diffine-line-height`, both halves move together.

The lines are hidden from a screen reader, because the field in front of them is the same document and the one that can be moved through and edited. What is said out loud instead is the counts under the panes and, as a reader steps through them, which change they are on.

## Holding the two documents

`before` and `after` are the two documents, as a string each or as a string with a name on it:

```tsx
<TextDiff
  before={{ content: saved, label: 'v1.2' }}
  after={{ content: draft, label: 'Working copy' }}
/>
```

A document nobody can type into is read from the props on every render, so a viewer handed `before={data?.text}` draws it the moment the data arrives.

An editable document is the usual React pair instead. Pass `defaultBefore` and `defaultAfter` and the component keeps the documents itself:

```tsx
<TextDiff mode="editor" defaultBefore={saved} defaultAfter={draft} />
```

Pass `before` and `after` and they are the application's. The fields then show what they are given and report what was typed, and it is the application that hands the new text back:

```tsx
const [draft, setDraft] = useState(saved);

<TextDiff mode="editor" before={saved} after={draft} onAfterChange={setDraft} readOnly="before" />;
```

`onBeforeChange` and `onAfterChange` are called either way, so an application can watch a document it is not managing — to enable a save button, or to keep a copy somewhere else.

Which of the two it is, is decided on the first render and does not change afterwards. A `before` that arrives later would take a document away from the editor mid-flight, and there is no honest answer for what should happen to what the reader had already typed.

### A side that cannot be typed into

`readOnly` takes a side, or `true` for both. The common one is the version that was saved on the left and the one being written on the right:

```tsx
<TextDiff mode="editor" before={saved} defaultAfter={saved} readOnly="before" />
```

<DiffineDemo mode="editor" sample="prose" readOnly="before" height="18rem" />

A read-only field can still be scrolled, selected and copied out of. It is the writing that is off, not the reading.

### Watching the comparison

`onDiff` hands over the whole [`DiffResult`](./diff) every time it is worked out again — for a count in a heading, or a button that is only worth pressing while the two documents differ.

```tsx
<TextDiff
  mode="editor"
  defaultBefore={saved}
  defaultAfter={draft}
  onDiff={(result) => setChanges(result.changes.length)}
/>
```

## Split and unified

`view` decides whether the two documents sit side by side or one under the other.

In `split`, matching lines are held level with each other and a line with no counterpart gets a blank opposite it. In `unified`, a change is written as the lines that went out followed by the lines that came in, with both documents' numbers down the side — the shape a patch has.

```tsx
<TextDiff before={saved} after={draft} view="unified" />
```

<DiffineDemo sample="code" view="unified" height="20rem" />

It is the same comparison read a second way rather than a second comparison. The words picked out inside the lines are the ones the engine already found.

An editor is always split, whatever it is given. One column of lines from two documents is a thing to read, not a thing to type into: there is no answer for which document a new line at the boundary belongs to.

## Line numbers and markers

`lineNumbers` puts each line's own number beside it, in a gutter that stays put while a long line is scrolled past it. `markers` puts a `+`, `−` or `~` next to a line that changed.

The markers are worth keeping. The colours say the same thing, and this is what says it to a reader who cannot tell red from green.

```tsx
<TextDiff before={saved} after={draft} lineNumbers={false} markers={false} />
```

<DiffineDemo sample="code" :lineNumbers="false" :markers="false" height="18rem" />

Neither of these is what a screen reader hears. Every changed line carries the word for what happened to it — added, removed, changed — written where a screen reader will find it and a copy of the text will not, and that does not turn off.

## Wrapping

`wrap` decides what a line too long for the pane does. Off, it runs off the side and the pane scrolls; on, it wraps.

Wrapping is the harder of the two to draw, and it is the reason anything here is measured at all: a line that wraps three times is three lines tall, its counterpart is one, and from there down the two documents would be out of step. So each pair is measured and the shorter one is given the height of the taller, whenever the panes are re-drawn or re-sized.

```tsx
<TextDiff before={saved} after={draft} wrap />
```

<DiffineDemo sample="prose" wrap height="18rem" />

In an editor the field and the lines behind it have to break in the same places, which they can only do at the same width — so the little bit of room the lines otherwise keep at the end of the longest line is not there, and a very long line is measured to the pixel. Both halves are the browser's own line breaking, so what breaks in one breaks in the other.

<DiffineDemo mode="editor" sample="prose" wrap height="18rem" />

## Holding the sides level

`alignLines` is on by default, and it is what puts a blank opposite a line with no counterpart. The two documents then stay in step all the way down, whatever they do to each other in between.

Turned off, each pane is only its own lines, ending where its own document ends. The two are no longer level, and the column between them is what says which part of one answers which part of the other.

<DiffineDemo sample="code" :alignLines="false" height="18rem" />

An editor is never level, and that is the one thing a mode takes away rather than adds. A blank in a field is a line somebody can put the caret in, and a line somebody can put the caret in is part of their document. So each side runs at its own length, exactly as `alignLines={false}` does here, and it is not optional there.

## The column between the panes

`connectors` draws each change as a band from where it left to where it arrived. With the sides held level the bands are straight, which is a quiet way of confirming what the alignment already did. With them not held level — every editor, and a viewer that asked for it — the bands bend, and they are the only thing saying where a run of lines went.

A band that took lines out is drawn in the delete colours and one that brought lines in is drawn in the insert colours. A band for an edit runs from one to the other across the column, because that is what an edit did: it left on one side and arrived on the other.

The geometry is read once per layout and kept, so scrolling moves shapes that were already measured rather than measuring them again a frame at a time.

`syncScroll` is what keeps the two panes looking at the same part of the two documents. With the rows level they share one scroll position; without, the position becomes a fraction of the way down, because the same number would put a reader at the end of one document and the middle of the other.

## Moving between changes

The two buttons in the bar above the panes step through the changes one at a time, and the count between them says where a reader is. They wrap: a reader working down a file wants the next change rather than a button that stops at the bottom, and going from `4 / 4` to `1 / 4` says what happened.

The change they land on is marked down its left edge, and its band between the panes is drawn with a heavier line — so where a reader is stays visible after the scrolling has stopped, and after they have carried on typing.

<DiffineDemo sample="code" height="18rem" />

Which change that is can be the application's instead:

```tsx
const [index, setIndex] = useState(-1);

<TextDiff
  before={saved}
  after={draft}
  selected={index}
  onSelectedChange={(next, change) => setIndex(next)}
/>;
```

Setting `selected` scrolls the view, exactly as pressing a button does, so an application with its own list of changes beside the component can drive it from there. `-1` is none of them. `onSelectedChange` is called either way, which is what lets an application follow a selection it is not holding.

`navigation` turns the buttons off. The bar they sit in is drawn for them even when `header` is off, so a view can have the buttons without the names.

## Searching and replacing

Each pane has a search of its own. The button in the bar above it opens a bar under it, and **Ctrl+F** — **Cmd+F** where that is the modifier — opens the one for the pane the keyboard is in.

One per pane rather than one per component, because a comparison is two documents: a name being chased through the version on the left is not a name being chased through the version on the right. The two have two queries, two counts and two bars, and closing one leaves the other where it was.

Matches are marked as the query is typed, and the pane moves to the one being read. **Enter** steps on and **Shift+Enter** steps back, both wrapping at the ends the way the change buttons do. **Escape** closes the bar and puts the focus back in the pane.

The three switches inside the box are what the query means: `Aa` tells `Title` from `title`, `ab` matches whole words only, and `.*` reads the query as a regular expression rather than as the text to look for. A half-written expression is not an error — the box says it has found nothing, and the moment the expression is finished it has matches.

In an editor, **Ctrl+H** opens the same bar with a row for replacing already on it, and the caret follows the search: what it moved to is the field's own selection, so closing the bar with **Escape** leaves the caret on the match that was being read and typing carries on from there.

**Replace** writes over the match being read and moves to the one that takes its place, so pressing it again walks down the document. **Replace all** writes over every match at once. The replacement goes in as the text it is — `$1` is a dollar and a one — and it goes in through the browser's own editing command, so `Ctrl`/`Cmd`+`Z` takes it back along with everything else that was typed.

A side that is `readOnly` gets the search without the row for replacing. `search={false}` turns all of it off, the shortcuts with it.

## Tab, and getting back out

`indentWithTab` decides whether Tab types a tab or moves to the next control. It is **off** by default, because a control a keyboard cannot leave is a page a keyboard cannot leave, and an editor is rarely the only thing on a page.

Turned on, there are two ways out and both are the ones somebody would try: **Shift+Tab** always moves back a control, and **Escape** hands the next Tab to the browser. Say so somewhere a reader will see it, and the trap is not one.

```tsx
<TextDiff mode="editor" defaultBefore={saved} defaultAfter={draft} indentWithTab />
```

The tab is typed through the browser's own editing command, so `Ctrl`/`Cmd`+`Z` undoes it along with everything else. Nothing here keeps an undo stack of its own — the field's is the real one, and not taking it away is most of what this component does about undo.

## How closely the two are compared

`diff` is the same options object `diffText` takes. Inside a pair of lines that were edited, `inline` decides whether it is words, graphemes, or nothing at all:

```tsx
<TextDiff before={saved} after={draft} diff={{ inline: 'character' }} />
```

In an editor the comparison runs again on every keystroke rather than after a pause. An edit to a document that has already been compared is a small edit, and a small edit is the cheap case for the engine — it costs the size of the documents multiplied by the number of edits between them, and the number of edits is what a keystroke barely moves. `maxCost` is what bounds the other case; see [the comparison](./diff).

## Long documents

`virtualize` is on by default, and it is why a comparison of twenty thousand lines opens at all. Twenty thousand lines is twenty thousand rows in the page; forty of them are on the screen. The rest are height and nothing else.

Nothing about the view changes: the scrollbar is the length of the document, the sideways scroll is the width of its longest line, and the bands between the panes are in the right places — those are worked out by arithmetic rather than read off elements that are not there. In an editor the field holds the whole document either way, because that part is the browser's; this is about the lines behind it, which are elements.

<DiffineDemo sample="code" :lines="3000" height="18rem" />

That demo is three thousand lines. Scroll it, or press the buttons above it, and count the rows in your inspector.

It needs every line to be the same height, which is true of a pane that is not wrapping and of nothing else — a line that wraps three times is three lines tall and there is no knowing that without drawing it. So `wrap` turns this off and the whole document is drawn. It also leaves a short document alone, where the machinery would cost more than the rows it saved.

Turn it off with `virtualize={false}` for a page where the browser's own find has to reach text that is scrolled out of view. Nothing that is not drawn can be found. The search built into the panes is the other answer to that, and the usual one: it reads the document rather than the page, so it finds a line on the nine thousandth row and scrolls to it.

## The frame around it

`header` names each side above it, and `summary` draws the bar underneath. Both are on by default, and both come off for a view that is a piece of a page rather than the page.

The bar sits on the header's grid, so its left half is under the left pane and its right half under the right one — which is how each side's size can be written without a word saying whose it is. What it holds is that size, in characters and in bytes, and at the far right the counts as a `~`, a `+` and a `−` against three numbers. Those are the same three marks the gutter puts beside a line. A screen reader is told the sentence instead, and only that sentence is live: the sizes change on every keystroke in an editor, and reading them out as somebody typed would be unusable.

```tsx
<TextDiff before={saved} after={draft} header={false} summary={false} />
```

<DiffineDemo sample="prose" :header="false" :summary="false" height="14rem" />

When the two documents turn out to be the same, the counts become a single tick rather than three noughts.

## Colours and words

`colorScheme` is `system` by default, which follows the reader's own setting. `light` and `dark` are for an application that has already decided for them.

`locale` is the language of the component's own words rather than of the documents — the header, the summary, the search bar, and what a screen reader hears. English and Korean are in the box; `strings` replaces any of the words in either, which is also how a third language gets in:

```tsx
<TextDiff
  before={saved}
  after={draft}
  strings={{ before: 'Vorher', after: 'Nachher', identical: 'Beide sind gleich.' }}
/>
```

## Colouring the text

`language` names what the two documents are written in, and they are coloured as it:

```tsx
<TextDiff before={saved} after={draft} language="typescript" />
```

It takes a highlight.js identifier, or `plain` for a document that is not code. `DIFFINE_LANGUAGES` is the whole list with the name to write beside each one, and the bar above the panes writes that name at its right end — `languageLabel` turns it off.

In `editor` mode the same corner is the list itself, as a menu. That is the one place the two modes draw a different control, and for the reason the modes exist: a viewer is given its documents by the application, which knows what they are, and an editor is given a document somebody pasted.

```tsx
<TextDiff mode="editor" defaultBefore={saved} defaultAfter={draft} defaultLanguage="python" />
```

`language`, `defaultLanguage` and `onLanguageChange` are the usual pair with the usual reporting — pass `language` to hold the choice yourself, pass `defaultLanguage` to let the component hold it.

Nothing is fetched until a language other than `plain` is asked for. Both the library and each grammar sit behind an `import()`, so a page whose views are all `plain` downloads none of it, and one that asks for Python downloads Python. The first paint after the grammar arrives is the document coloured; the one before it is the document.

Running a grammar over a long document is the expensive part of a keystroke in an editor, and by a long way — tens of milliseconds where comparing the same document costs one. So the colours are deferred: the keystroke is drawn against the ones the last keystroke produced, and the new ones arrive in a pass the browser can interrupt if another key is pressed.

The colours are eight custom properties — `--diffine-code-keyword`, `--diffine-code-string`, and the rest — and every class highlight.js emits is mapped onto one of them. An application with a palette of its own sets those eight.

`highlight` is the way in for an application that already has a highlighter. It is handed a whole line and returns the runs it wants drawn differently, and it replaces `language` rather than adding to it:

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

<DiffineDemo sample="code" colour height="18rem" />

A whole line rather than a fragment, because that is the only order that works: a grammar applied to half a string literal does not come out right, and half a string literal is exactly what a comparison produces. So the application gets the line, and the component cuts it at the boundaries of both — a changed word that is half a string is drawn as a changed word that is half a string.

`length` counts the same units `String.prototype.slice` does, so the runs a tokeniser already returns can be used as they are. Runs are taken in order and a gap between two of them is drawn plain, so a highlighter that only marks keywords can return only keywords with plain runs between. Return `null` for a line you have nothing to say about.

`style` is there beside `className` for a highlighter that hands back colours rather than classes.

The function is called for each line that is drawn — which, with the rows virtualised, is what is on the screen rather than what is in the document.

One rule an editor adds: a run may change how the text **looks** but not how **wide** it is. Colour, weight, style and a background are all fine — in the monospace face the component ships with, a bold keyword takes exactly the room the plain one did. A font size, a different family or a letter-spacing is not: it moves the words away from the caret that is supposed to be sitting in them.

## Styling

Every colour and measurement is a custom property on the `.diffine` element. An application with a palette of its own overrides the properties rather than writing rules that have to beat the package's:

```css
.diffine {
  --diffine-height: 40rem;
  --diffine-font-size: 0.875rem;
  --diffine-insert-line: #eaffea;
  --diffine-insert-piece: #a6f3a6;
  --diffine-delete-line: #ffecec;
  --diffine-delete-piece: #f8b9b9;
}
```

The full list is in the [API](../api/#custom-properties). One of them is the editor's alone: `--diffine-selection` has to be see-through, because the words under a selection are drawn by the lines behind the field and an opaque highlight would be a blue rectangle where the selected text used to be.

Anything the component is given beyond its own props goes straight to the element, so `id`, `className`, `style` and the `aria-*` attributes behave as they would on a `<div>`.

`font` is the way in for an application that holds the typeface in its own state rather than in its own CSS. It writes the same four properties:

```tsx
<TextDiff
  before={saved}
  after={draft}
  font={{
    family: "'Iosevka', monospace",
    size: 15,
    lineHeight: '1.65rem',
    letterSpacing: '0.01em'
  }}
/>
```

Anything left out keeps the stylesheet's value, so `{ size: 15 }` is a whole answer. A number is pixels and a string is whatever CSS makes of it. Two rules about what goes in it: the family has to be monospace, or the gutter and the columns stop lining up, and `lineHeight` has to be a length rather than a bare multiplier — a row is that tall whether or not it has a line in it, and the rows a long comparison does not draw are stood in for by exactly that much height.

## A comparison worked out elsewhere

`result` takes a comparison instead of two documents, for an application that worked one out in a worker, on a server, or once for a list of views:

```tsx
import { diffText } from 'diffine-react/diff';

const result = diffText(saved, draft);

<TextDiff result={result} />;
```

[The comparison](./diff) is what that value is. An editor ignores it: a comparison worked out elsewhere is a comparison of documents nobody has typed into yet.

## What it does not do

- **No unified editor.** See [Split and unified](#split-and-unified).
- **No merge arrows.** Moving a change from one side to the other is a decision about two documents rather than an edit to one, and it is not here yet.
- **No syntax awareness.** `highlight` colours what an application's own tokeniser found. Nothing in this package parses a language.

The [playground](./playground) has both modes on the same pair of documents, with every switch on this page above them.
