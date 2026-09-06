---
title: The editor
order: 3
---

# The editor

`DiffineEditor` is the viewer with the two panes made editable. The same comparison, the same lines, the same bands across the column between them — and a field over each side, so the comparison is worked out again as somebody types into it.

Type into either side below. Nothing is being saved anywhere; the page is the demo.

<DiffineDemo component="editor" sample="code" height="22rem" />

## What is actually on the screen

Each pane draws its document twice. Once as the lines you can see — tinted where a row changed, with the words that moved marked inside them — and once as a plain `<textarea>` laid over the top, whose own text is invisible and whose caret is not.

That is the only arrangement that gives both halves of what an editor here has to be. A `<textarea>` cannot colour a word inside itself, and nothing that can is also an undo stack, an input method, a selection, and a control a screen reader already knows how to read. So the field stays a field, and everything a reader looks at is drawn behind it.

What it costs is that the two have to agree, exactly, on where every character sits: the same typeface, one line as tall as the next, the text starting the same distance in past the gutter. That agreement is written into the stylesheet rather than measured, so it holds at any size and does not lag a frame behind a resize. If you override `--diffine-font` or `--diffine-line-height`, both halves move together.

The lines are hidden from a screen reader, because the field in front of them is the same document and the one that can be moved through and edited. What is said out loud instead is the counts under the panes and, as a reader steps through them, which change they are on.

## Holding the two documents

The usual pair. Pass `defaultBefore` and `defaultAfter` and the editor keeps the documents itself:

```tsx
import { DiffineEditor } from 'diffine-react';
import 'diffine-react/styles.css';

<DiffineEditor defaultBefore={saved} defaultAfter={draft} />;
```

Pass `before` and `after` instead and they are the application's. The fields then show what they are given and report what was typed, and it is the application that hands the new text back:

```tsx
const [draft, setDraft] = useState(saved);

<DiffineEditor before={saved} after={draft} onAfterChange={setDraft} readOnly="before" />;
```

`onBeforeChange` and `onAfterChange` are called either way, so an application can watch a document it is not managing — to enable a save button, or to keep a copy somewhere else.

Which of the two it is, is decided on the first render and does not change afterwards. A `before` that arrives later would take a document away from the editor mid-flight, and there is no honest answer for what should happen to what the reader had already typed.

### A side that cannot be typed into

`readOnly` takes a side, or `true` for both. The common one is the version that was saved on the left and the one being written on the right:

```tsx
<DiffineEditor before={saved} defaultAfter={saved} readOnly="before" />
```

<DiffineDemo component="editor" sample="prose" readOnly="before" height="18rem" />

A read-only field can still be scrolled, selected and copied out of. It is the writing that is off, not the reading.

### Watching the comparison

`onDiff` hands over the whole [`DiffResult`](./diff) every time it is worked out again — for a count in a heading, or a button that is only worth pressing while the two documents differ.

```tsx
<DiffineEditor
  defaultBefore={saved}
  defaultAfter={draft}
  onDiff={(result) => setChanges(result.changes.length)}
/>
```

## The two sides are not held level

This is the one thing the viewer does that the editor cannot. A viewer keeps the two documents in step by putting a blank opposite a line that has no counterpart; a blank in a field is a line somebody can put the caret in, and a line somebody can put the caret in is part of their document.

So each side runs at its own length, and the column between the panes is what says which part of one answers which part of the other. It is the viewer's `alignLines={false}`, and it is not optional here.

`connectors` still turns those bands off, and `syncScroll` still keeps the two panes looking at the same part of the two documents — by the fraction of the way down rather than by the line number, because the same number would put a reader at the end of one document and the middle of the other.

## Line numbers, markers and wrapping

The same three props the viewer takes, doing the same three things. `lineNumbers` puts each line's number beside it, `markers` puts a `+`, `−` or `~` next to a line that changed, and `wrap` decides what a line too long for the pane does.

```tsx
<DiffineEditor defaultBefore={saved} defaultAfter={draft} wrap />
```

<DiffineDemo component="editor" sample="prose" wrap height="18rem" />

With wrapping on, the field and the lines behind it break in the same places, which they can only do at the same width — so the little bit of room the lines otherwise keep at the end of the longest line is not there, and a very long line is measured to the pixel. Both halves are the browser's own line breaking, so what breaks in one breaks in the other.

## Moving between changes

The buttons in the bar above the panes step through the changes one at a time, exactly as they do in the viewer, and they scroll both fields to whichever change they land on. `selected` and `onSelectedChange` make that the application's.

The change they land on is marked down its left edge and its band is drawn in the accent colour, so where a reader is stays visible after the scrolling has stopped — and after they have carried on typing.

## Tab, and getting back out

`indentWithTab` decides whether Tab types a tab or moves to the next control. It is **off** by default, because a control a keyboard cannot leave is a page a keyboard cannot leave, and an editor is rarely the only thing on a page.

Turned on, there are two ways out and both are the ones somebody would try: **Shift+Tab** always moves back a control, and **Escape** hands the next Tab to the browser. Say so somewhere a reader will see it, and the trap is not one.

```tsx
<DiffineEditor defaultBefore={saved} defaultAfter={draft} indentWithTab />
```

The tab is typed through the browser's own editing command, so `Ctrl`/`Cmd`+`Z` undoes it along with everything else. Nothing here keeps an undo stack of its own — the field's is the real one, and not taking it away is most of what this component does about undo.

## How closely the two are compared

`diff` is the same options object the viewer and `diffText` take. Inside a pair of lines that were edited, `inline` decides whether it is words, graphemes, or nothing at all:

```tsx
<DiffineEditor defaultBefore={saved} defaultAfter={draft} diff={{ inline: 'character' }} />
```

The comparison runs again on every keystroke rather than after a pause. An edit to a document that has already been compared is a small edit, and a small edit is the cheap case for the engine — it costs the size of the documents multiplied by the number of edits between them, and the number of edits is what a keystroke barely moves. `maxCost` is what bounds the other case; see [the comparison](./diff).

## Colouring the text

`language` colours both documents as whatever they are written in, and the editor draws the list of languages as a menu at the right end of the bar above the panes. That is the difference between the two components here: a viewer is given its documents by the application, which knows what they are, and an editor is given a document somebody pasted.

```tsx
<DiffineEditor defaultBefore={saved} defaultAfter={draft} defaultLanguage="python" />
```

`language`, `defaultLanguage` and `onLanguageChange` are the usual pair with the usual reporting — pass `language` to hold the choice yourself, pass `defaultLanguage` to let the editor hold it. `languagePicker` takes the menu away for a page that decides the language elsewhere.

Nothing is fetched until a language other than `plain` is chosen. See [the viewer](./viewer#colouring-the-text) for what arrives when it is, and for the eight custom properties the colours come from.

`highlight` works here for the same reason the tints do: the text a reader sees is drawn by the lines behind the field, so a highlighter can reach it. It replaces `language` rather than adding to it, so an editor that passes it usually turns `languagePicker` off as well.

```tsx
<DiffineEditor
  defaultBefore={saved}
  defaultAfter={draft}
  highlight={(line) =>
    tokenize(line.text).map((token) => ({
      length: token.content.length,
      className: `token ${token.type}`
    }))
  }
/>
```

<DiffineDemo component="editor" sample="code" colour height="18rem" />

It is called for each line as it is drawn, which with the rows virtualised is the lines on the screen rather than the document. See [the viewer](./viewer#colouring-the-text) for how the runs are cut against the comparison.

One rule the viewer does not have: a run may change how the text **looks** but not how **wide** it is. Colour, weight, style and a background are all fine — in the monospace face the component ships with, a bold keyword takes exactly the room the plain one did. A font size, a different family or a letter-spacing is not: it moves the words away from the caret that is supposed to be sitting in them.

## Long documents

`virtualize` draws the lines a reader can see and leaves the rest as height. The field itself holds the whole document either way — that part is the browser's — and this is about the lines under it, which are elements.

It needs every line to be the same height, so `wrap` turns it off, and it leaves a short document alone.

## Language, words and colours

`locale` picks English or Korean for the editor's own words, `strings` replaces any of them, and every colour and measurement is a `--diffine-*` custom property declared on the element. The editor adds one to the viewer's list: `--diffine-selection`, which has to be see-through, because the words under a selection are drawn by the lines behind the field and an opaque highlight would be a blue rectangle where the selected text used to be.

```tsx
<DiffineEditor
  defaultBefore={saved}
  defaultAfter={draft}
  locale="ko"
  strings={{ placeholder: '여기에 붙여 넣으세요.' }}
/>
```

## What it does not do

- **No unified view.** One column of lines from two documents is a thing to read, not a thing to type into: there is no answer for which document a new line at the boundary belongs to.
- **No merge arrows.** Moving a change from one side to the other is a decision about two documents rather than an edit to one, and it is not here yet.
- **No syntax awareness.** `highlight` colours what an application's own tokeniser found. Nothing in this package parses a language.

The [playground](./playground) has the editor and the viewer on the same pair of documents, with every switch on this page above them.
