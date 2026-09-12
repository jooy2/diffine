---
title: Text diff
order: 2
---

# Text diff

`TextDiff` draws two documents and what happened between them. Every part of that drawing is <Fw react="a prop" flutter="an argument" /> with a default, so the same <Fw react="component" flutter="widget" /> covers a full side-by-side with connectors and a bare column of lines in a panel too narrow for anything else.

This page says the same things about both packages. Which one it shows is the switch above the sidebar menu.

::: fw react

Turn the switches above the demo on and off. It is the component itself, running on this page.

:::

::: fw flutter

The preview below is the real Flutter build, framed. It is the widget itself, compiled for the web and running on this page.

:::

<DiffineDemo sample="code" controls height="22rem" flutter="text/basic" />

## The two modes

`mode` decides whether the two documents are read or written. Everything else is the same in both: the comparison, the lines, the tints and the marked words, the bands between the panes, the buttons above them and the search under them.

::: fw react

```tsx
import { TextDiff } from 'diffine-react/text-diff';
import 'diffine-react/styles.css';

<TextDiff before={saved} after={draft} />;
<TextDiff mode="editor" defaultBefore={saved} defaultAfter={draft} />;
```

:::

::: fw flutter

```dart
import 'package:diffine/diffine.dart';

TextDiff(before: saved, after: draft);
TextDiff(mode: DiffineMode.editor, defaultBefore: saved, defaultAfter: draft);
```

:::

<Fw react="`viewer`" flutter="`DiffineMode.viewer`" /> is the default. <Fw react="`editor`" flutter="`DiffineMode.editor`" /> lays a field over each pane, so the comparison is worked out again as somebody types into it. Type into either side below; nothing is saved anywhere.

<DiffineDemo mode="editor" sample="code" height="22rem" flutter="text/editor" />

Three <Fw react="props are" flutter="arguments are" /> ignored in the editor: `view`, `alignLines` and `result`. Each one is explained where it comes up below.

### What is actually on the screen

In the editor each pane draws its document in two layers. Underneath are the lines you can see, tinted where a row changed, with the words that moved marked inside them. Over the top is a plain <Fw react="`<textarea>`" flutter="`EditableText`" code /> whose own text is <Fw react="invisible" flutter="see-through" /> and whose caret is not.

A text field cannot colour a word inside itself. Nothing that can colour one is also an undo stack, an input method, a selection, and a control a screen reader already knows how to read. So the field stays a field, and everything a reader looks at is drawn behind it.

::: fw react

The cost is that the two layers have to agree, exactly, on where every character sits: the same typeface, one line as tall as the next, the text starting the same distance in past the gutter. Those values are written into the stylesheet rather than measured, so they hold at any size and do not lag a frame behind a resize. If you override `--diffine-font` or `--diffine-line-height`, both layers move together.

:::

::: fw flutter

The cost is that the two layers have to agree, exactly, on where every character sits: the same typeface, one line as tall as the next, the text starting the same distance in past the gutter. That is why the layer underneath is painted rather than built out of widgets — a painter is handed the same `TextStyle` at the same width the field is laid out at, so the two break in the same places by construction. Changing `fontFamily` or `lineHeight` on the theme moves both together.

:::

The lines are hidden from a screen reader, because the field in front of them is the same document and the one that can be moved through and edited. What is read out instead is the counts under the panes and, as a reader steps through them, which change they are on.

## Passing the two documents

`before` and `after` are the two documents, as a string each or as a string with a name on it:

::: fw react

```tsx
<TextDiff
  before={{ content: saved, label: 'v1.2' }}
  after={{ content: draft, label: 'Working copy' }}
/>
```

A viewer reads its documents from the props on every render, so one handed `before={data?.text}` draws them the moment the data arrives.

An editor works as either a controlled or an uncontrolled component. Pass `defaultBefore` and `defaultAfter` and the component keeps the documents itself:

```tsx
<TextDiff mode="editor" defaultBefore={saved} defaultAfter={draft} />
```

Pass `before` and `after` and they are the application's. The fields then show what they are given and report what was typed, and the application hands the new text back:

```tsx
const [draft, setDraft] = useState(saved);

<TextDiff mode="editor" before={saved} after={draft} onAfterChange={setDraft} readOnly="before" />;
```

`onBeforeChange` and `onAfterChange` are called either way, so an application can watch a document it is not managing, to enable a save button or to keep a copy somewhere else.

:::

::: fw flutter

```dart
TextDiff(
  before: saved,
  beforeLabel: 'v1.2',
  after: draft,
  afterLabel: 'Working copy',
);
```

A viewer reads its documents from the arguments on every build, so one handed `before: data?.text ?? ''` draws them the moment the data arrives.

An editor holds its documents itself or leaves them to the application. Pass `defaultBefore` and `defaultAfter` and the widget keeps them:

```dart
TextDiff(mode: DiffineMode.editor, defaultBefore: saved, defaultAfter: draft);
```

Pass `before` and `after` and they are the application's. The fields then show what they are given and report what was typed, and the application hands the new text back:

```dart
TextDiff(
  mode: DiffineMode.editor,
  before: saved,
  after: draft,
  onAfterChanged: (String value) => setState(() => draft = value),
  readOnly: DiffineSide.before,
);
```

`onBeforeChanged` and `onAfterChanged` are called either way, so an application can watch a document it is not managing, to enable a save button or to keep a copy somewhere else.

:::

Which of the two it is, is decided on the first <Fw react="render" flutter="build" /> and does not change afterwards. A `before` that arrived later would replace a document mid-edit, and there is no way to decide what should happen to what the reader had already typed. Swapping a viewer for an editor in the same place is <Fw react="a new element with a `key`" flutter="a new widget with a `Key`" />.

### A side that cannot be typed into

`readOnly` takes the side that cannot be typed into. The common one is the version that was saved on the left and the one being written on the right:

::: fw react

```tsx
<TextDiff mode="editor" before={saved} defaultAfter={saved} readOnly="before" />
```

`true` is both of them.

:::

::: fw flutter

```dart
TextDiff(
  mode: DiffineMode.editor,
  before: saved,
  defaultAfter: saved,
  readOnly: DiffineSide.before,
);
```

:::

<DiffineDemo mode="editor" sample="prose" readOnly="before" height="18rem" flutter="text/editor" />

A read-only field can still be scrolled, selected and copied out of. Only writing is off.

### Watching the comparison

`onDiff` hands over the whole [`DiffResult`](./diff) every time it is worked out again, for a count in a heading or a button that is only worth pressing while the two documents differ.

::: fw react

```tsx
<TextDiff
  mode="editor"
  defaultBefore={saved}
  defaultAfter={draft}
  onDiff={(result) => setChanges(result.changes.length)}
/>
```

:::

::: fw flutter

```dart
TextDiff(
  mode: DiffineMode.editor,
  defaultBefore: saved,
  defaultAfter: draft,
  onDiff: (DiffResult result) => setState(() => changes = result.changes.length),
);
```

:::

## Split and unified

`view` decides whether the two documents sit side by side or one under the other.

In `split`, matching lines are held level with each other and a line with no counterpart gets a blank opposite it. In `unified`, a change is written as the lines that went out followed by the lines that came in, with both documents' numbers down the side. That is the shape a patch has.

::: fw react

```tsx
<TextDiff before={saved} after={draft} view="unified" />
```

:::

::: fw flutter

```dart
TextDiff(before: saved, after: draft, view: DiffineView.unified);
```

:::

<DiffineDemo sample="code" view="unified" height="20rem" flutter="text/unified" />

It is the same comparison drawn a second way rather than a second comparison. The words picked out inside the lines are the ones the engine already found.

An editor is always split, whatever it is given. With one column of lines from two documents, there is no way to decide which document a new line at the boundary belongs to.

## Line numbers and markers

`lineNumbers` puts each line's own number beside it. `markers` puts a `+`, `−` or `~` next to a line that changed.

::: fw react

The gutter holding both stays put while a long line is scrolled past it.

:::

::: fw flutter

The gutter holding both scrolls with a long line rather than staying against the left edge, which is the one place the two packages look different. Turning `wrap` on is the way round it.

:::

The markers are worth keeping. They tell a reader who cannot tell red from green what the colours are saying.

::: fw react

```tsx
<TextDiff before={saved} after={draft} lineNumbers={false} markers={false} />
```

:::

::: fw flutter

```dart
TextDiff(before: saved, after: draft, lineNumbers: false, markers: false);
```

:::

<DiffineDemo sample="code" :lineNumbers="false" :markers="false" height="18rem" flutter="text/plain" />

Turning both off changes nothing for a screen reader. Every changed line carries the word for what happened to it — added, removed, changed — written where a screen reader will find it and a copy of the text will not, and that does not turn off.

## Wrapping

`wrap` decides what a line too long for the pane does. Off, it runs off the side and the pane scrolls; on, it wraps.

Wrapping is the only case here where anything is actually measured. A line that wraps three times is three lines tall, its counterpart is one, and from there down the two documents would be out of step. So each pair is measured and the shorter one is given the height of the taller, whenever the panes are re-drawn or re-sized.

::: fw react

```tsx
<TextDiff before={saved} after={draft} wrap />
```

:::

::: fw flutter

```dart
TextDiff(before: saved, after: draft, wrap: true);
```

:::

<DiffineDemo sample="prose" wrap height="18rem" flutter="text/wrap" />

In an editor the field and the lines behind it have to break in the same places, which they can only do at the same width. Both layers are laid out by the same text engine at the same width, so what breaks in one breaks in the other.

<DiffineDemo mode="editor" sample="prose" wrap height="18rem" flutter="text/editor-wrap" />

## Holding the sides level

`alignLines` is on by default, and it is what puts a blank opposite a line with no counterpart. The two documents then stay in step all the way down.

Turned off, each pane is only its own lines, ending where its own document ends. The two are no longer level, and the column between them says which part of one answers which part of the other.

<DiffineDemo sample="code" :alignLines="false" height="18rem" flutter="text/unaligned" />

An editor is never level, and cannot be made level. A blank in a field is a line somebody can put the caret in, and a line somebody can put the caret in is part of their document. So each side runs at its own length, exactly as `alignLines={false}` does in a viewer.

## The column between the panes

`connectors` draws each change as a band from where it left to where it arrived. With the sides held level the bands are straight. Without, the bands bend, and they are the only thing saying where a run of lines went. Every editor is in the second case.

A band that took lines out is drawn in the delete colours and one that brought lines in is drawn in the insert colours. A band for an edit runs from one to the other across the column, because that is what an edit did: it left on one side and arrived on the other.

The geometry is read once per layout and kept, so scrolling moves shapes that were already measured rather than measuring them again a frame at a time.

`syncScroll` keeps the two panes looking at the same part of the two documents. With the rows level they share one scroll position; without, the position becomes a fraction of the way down, because the same number would put a reader at the end of one document and the middle of the other.

## Moving between changes

The two buttons in the bar above the panes step through the changes one at a time, and the count between them says where a reader is. They wrap around at the last change, and the count going from `4 / 4` to `1 / 4` is what says so.

The change they land on is marked down its left edge, and its band between the panes is drawn with a heavier line, so where a reader is stays visible after the scrolling has stopped and after they have carried on typing.

<DiffineDemo sample="code" height="18rem" flutter="text/basic" />

Which change that is can be the application's instead:

::: fw react

```tsx
const [index, setIndex] = useState(-1);

<TextDiff
  before={saved}
  after={draft}
  selected={index}
  onSelectedChange={(next, change) => setIndex(next)}
/>;
```

:::

::: fw flutter

```dart
TextDiff(
  before: saved,
  after: draft,
  selected: index,
  onSelectedChanged: (int next, DiffChange? change) => setState(() => index = next),
);
```

:::

Setting `selected` scrolls the view, exactly as pressing a button does, so an application with its own list of changes beside the comparison can drive it from there. `-1` is none of them. <Fw react="`onSelectedChange`" flutter="`onSelectedChanged`" /> is called whoever is managing the value, which is what lets an application follow a selection it is not holding.

`navigation` turns the buttons off. The bar they sit in is drawn for them even when `header` is off, so a view can have the buttons without the names.

## Taking a change across

A comparison of a saved version and a draft is usually read with one question in mind: keep this, or put the other one back. `applyChanges` grows a pair of arrows on every change, in the column between the panes. The one pointing left writes the right-hand version over the left, and the one pointing right does the opposite.

::: fw react

```tsx
<TextDiff
  mode="editor"
  before={saved}
  after={draft}
  readOnly="before"
  applyChanges
  onAfterChange={setDraft}
/>
```

:::

::: fw flutter

```dart
TextDiff(
  mode: DiffineMode.editor,
  before: saved,
  after: draft,
  readOnly: DiffineSide.before,
  applyChanges: true,
  onAfterChanged: (String value) => setState(() => draft = value),
);
```

:::

A side that is `readOnly` is never written into, so the arrangement above — the saved version on the left, the draft on the right — leaves one arrow rather than two.

The write lands on the field, so <Fw react="`onBeforeChange` or `onAfterChange`" flutter="`onBeforeChanged` or `onAfterChanged`" /> reports it exactly as a keystroke would.

It belongs to the editor, because applying a change means writing a document. The buttons sit in the column between the panes, so <Fw react="`connectors={false}`" flutter="`connectors: false`" /> takes them away with the column they are in.

## Searching and replacing

Each pane has a search of its own. The button in the bar above it opens a bar under it, and **Ctrl+F** — **Cmd+F** where that is the modifier — opens the one for the pane the keyboard is in.

One per pane rather than one per component, because a comparison is two documents: a name being chased through the version on the left is usually not the name being chased through the version on the right. The two have two queries, two counts and two bars, and closing one leaves the other where it was.

Matches are marked as the query is typed, and the pane moves to the one being read. **Enter** steps on and **Shift+Enter** steps back, both wrapping at the ends the way the change buttons do. **Escape** closes the bar and puts the focus back in the pane.

The three switches inside the box say what the query means: `Aa` tells `Title` from `title`, `ab` matches whole words only, and `.*` reads the query as a regular expression rather than as the text to look for. A half-written expression is not an error. The box says it has found nothing, and the moment the expression is finished it has matches.

In an editor, **Ctrl+H** opens the same bar with a row for replacing already on it, and the caret follows the search: what it moved to is the field's own selection, so closing the bar with **Escape** leaves the caret on the match that was being read and typing carries on from there.

**Replace** writes over the match being read and moves to the one that takes its place, so pressing it again walks down the document. **Replace all** writes over every match at once. The replacement goes in as the text it is, so `$1` is a dollar and a one, and it goes in through the browser's own editing command, so `Ctrl`/`Cmd`+`Z` takes it back along with everything else that was typed.

A side that is `readOnly` gets the search without the row for replacing. `search={false}` turns all of it off, the shortcuts with it.

## The Tab key

`indentWithTab` decides whether Tab types a tab or moves to the next control. It is **off** by default, because a control a keyboard cannot leave blocks the whole page, and an editor is rarely the only thing on a page.

Turned on, there are two ways out and both are the ones somebody would try: **Shift+Tab** always moves back a control, and **Escape** hands the next Tab to the browser. Say so somewhere a reader will see it and nobody gets stuck.

::: fw react

```tsx
<TextDiff mode="editor" defaultBefore={saved} defaultAfter={draft} indentWithTab />
```

:::

::: fw flutter

```dart
TextDiff(
  mode: DiffineMode.editor,
  defaultBefore: saved,
  defaultAfter: draft,
  indentWithTab: true,
);
```

:::

The tab goes onto the field's own undo. Nothing here keeps an undo stack of its own; using the field's is the whole of what this <Fw react="component" flutter="widget" /> does about undo.

## How closely the two are compared

`diff` is the same options object `diffText` takes. Inside a pair of lines that were edited, `inline` decides whether it is words, graphemes, or nothing at all:

::: fw react

```tsx
<TextDiff before={saved} after={draft} diff={{ inline: 'character' }} />
```

:::

::: fw flutter

```dart
TextDiff(
  before: saved,
  after: draft,
  diff: const DiffOptions(inline: DiffInlineMode.character),
);
```

:::

In an editor the comparison runs again on every keystroke rather than after a pause. It costs the size of the documents multiplied by the number of edits between them, and a keystroke barely moves that number. `maxCost` is what bounds the other case; see [the comparison](./diff).

## Folding what did not change

Two versions of a file are mostly the part nobody edited. `collapse` draws each run of unchanged lines as a band saying how many it stands for, and keeps `context` of them either side of every change so that each one still sits in the file rather than on its own.

::: fw react

```tsx
<TextDiff before={saved} after={draft} collapse context={3} />
```

:::

::: fw flutter

```dart
TextDiff(before: saved, after: draft, collapse: true, context: 3);
```

:::

Pressing a band puts its lines back, and they stay back until the comparison changes. Three lines either side is what `diff` and `git` write; nothing is kept at the top and the bottom, where there is no change on that side to surround.

Both panes fold the same runs, so a split view stays level. A band is exactly one line tall, which is what lets it live alongside a pane that only draws what is on the screen.

A search reaches the whole document rather than the part of it that is drawn, so opening one puts the folded runs back for as long as the bar is open. They come back when it closes.

A band also appears where a comparison is missing lines rather than hiding them — between one hunk of a [patch](diff#patches) and the next. That one is drawn whatever `collapse` says, and it cannot be pressed, because nobody sent the lines it stands for.

## Line endings and whitespace

Every line ending ends a line, so a file written on Windows and edited on a Mac is not a file where every line changed. The cost of that is a file whose only difference is invisible: the same lines, saved by another editor, reading as no difference at all.

So it is worked out beside the comparison. `result.format` says what each document ends its lines with, whether the last one carries an ending, and whether the document begins with a byte order mark; the bar under the panes writes it out when the two disagree.

::: fw react

```ts
diffText('a\nb\n', 'a\r\nb').format;
// {
//   before: { ending: 'lf',   finalNewline: true,  byteOrderMark: false },
//   after:  { ending: 'crlf', finalNewline: false, byteOrderMark: false }
// }
```

:::

::: fw flutter

```dart
diffText('a\nb\n', 'a\r\nb').format;
// before: ending lf,   finalNewline true,  byteOrderMark false
// after:  ending crlf, finalNewline false, byteOrderMark false
```

:::

`ending` is <Fw react="`lf`, `crlf`, `cr`" flutter="`DiffLineEnding.lf`, `.crlf`, `.cr`" />, <Fw react="`mixed`" flutter="`.mixed`" /> for a document with more than one of them, or <Fw react="`none`" flutter="`.none`" /> for one with no line ending at all. A comparison read back out of a [patch](diff#patches) has no `format`, because a patch never saw either file.

`showInvisibles` draws the whitespace inside the lines: a dot in the middle of each column a space takes, and a rule under a run of tabs.

::: fw react

```tsx
<TextDiff before={saved} after={draft} showInvisibles />
```

The characters themselves are untouched — the marks are drawn on the elements around them — so what a reader copies out is the line as it was written. `--diffine-invisible` is the colour they are drawn in.

:::

::: fw flutter

```dart
TextDiff(before: saved, after: draft, showInvisibles: true);
```

The characters themselves are untouched — the marks are painted behind the text, from the boxes the same layout gives, so they follow a line that wrapped — and what a reader copies out is the line as it was written. `DiffineTheme.invisible` is the colour they are drawn in.

:::

## Long documents

A comparison of twenty thousand lines is twenty thousand rows; forty of them are on the screen, and the rest are height and nothing else.

Nothing about the view changes. The scrollbar is the length of the document, the sideways scroll is the width of its longest line, and the bands between the panes are in the right places, because those are worked out from a table of row heights rather than read off rows that are not there.

<DiffineDemo sample="code" :lines="3000" height="18rem" flutter="text/collapse" />

::: fw react

`virtualize` is on by default and is what does it. In an editor the field holds the whole document either way; what this reduces is the lines drawn as elements behind it.

That demo is three thousand lines. Scroll it, or press the buttons above it, and count the rows in your inspector.

With `wrap` on the rows are not all the same height, and where they are is a measurement rather than arithmetic. The rows that have been drawn are measured and kept, the rest stand at the average of those, and the pane is scrolled by however much the row under its top edge moved when a measurement replaced a guess — so a wrapped document is cut as well, and the words a reader is looking at stay where they were looking at them.

Two things turn it off. `renderWidget`, because what an application draws under a line can grow at any moment for reasons nothing here would hear about, and a row standing in for one of those would be standing in the wrong place. And a wrapped editor, where the lines are drawn behind a field holding the whole document and the two have to break in the same places — a row standing in for the ones that are not drawn can only ever be close to as tall as the text behind it, and close is not the same place. It also leaves a short document alone, where the machinery would cost more than the rows it saved.

Turn it off with `virtualize={false}` for a page where the browser's own find has to reach text that is scrolled out of view. Nothing that is not drawn can be found. The search built into the panes is the other answer to that, and usually the better one: it reads the document rather than the page, so it finds a line on the nine thousandth row and scrolls to it.

:::

::: fw flutter

There is nothing to switch on. The panes are lists, so only the rows a reader can see are ever built — and there is no `virtualize` argument, because there was nothing left to turn off. In the editor the field holds the whole document either way, and the lines behind it are painted rather than built, so only the ones on the screen are laid out.

With `wrap` on the rows are not all the same height. Each row is measured on both sides and given the taller of the two, so the two panes agree without either measuring the other, and both lists are told exactly how tall every row is rather than guessing.

The search built into the panes reads the document rather than the screen, so it finds a line on the nine thousandth row and scrolls to it.

:::

## Copying and exporting

What a reader copies out of a pane is the document rather than the surface it is drawn on. The numbers and the marks down the side are left out of a selection, and so are the blanks that hold the two sides level: a document copied through them would otherwise arrive with a gap wherever the other side was longer.

Going the other way, `formatPatch` writes the comparison as a unified diff — see [the comparison](diff#patches) — which is the form a build, a review tool or an attachment on a CI run can read.

::: fw react

```ts
import { formatPatch } from 'diffine-react/patch';

const patch = formatPatch(result, { before: 'a/src/index.ts', after: 'b/src/index.ts' });
```

For two pictures, `paintDiffImage` turns the mask into a picture of its own: what changed, on a ground that is see-through.

```ts
import { diffImage, paintDiffImage } from 'diffine-react/image';

const picture = paintDiffImage(diffImage(before, after));
const canvas = new OffscreenCanvas(picture.width, picture.height);

canvas.getContext('2d')?.putImageData(new ImageData(picture.data, picture.width), 0, 0);

const png = await canvas.convertToBlob();
```

:::

::: fw flutter

```dart
final String patch = formatPatch(
  result,
  const DiffPatchOptions(before: 'a/lib/main.dart', after: 'b/lib/main.dart'),
);
```

For two pictures, `paintDiffImage` turns the mask into a picture of its own: what changed, on a ground that is see-through.

```dart
final DiffPixels picture = paintDiffImage(diffImage(before, after));

ui.decodeImageFromPixels(
  picture.data,
  picture.width,
  picture.height,
  ui.PixelFormat.rgba8888,
  (ui.Image image) async {
    final ByteData? png = await image.toByteData(format: ui.ImageByteFormat.png);
  },
);
```

:::

Writing the file is the application's, for the same reason reading one is: a screen, an isolate and a server each have their own way of doing it, and none of them is the comparison's business. Pass `changed`, `added`, `removed` or `unchanged` to paint it in your own colours.

## The frame around it

`header` names each side above it, and `summary` draws the bar underneath. Both are on by default, and both come off for a view that is a small piece of a page.

The bar sits on the header's grid, so its left half is under the left pane and its right half under the right one, which is how each side's size can be written without a word saying whose it is. It holds that size, in characters and in bytes, and at the far right the counts as a `~`, a `+` and a `−` against three numbers. Those are the same three marks the gutter puts beside a line. A screen reader is told the sentence instead, and only that sentence is live: the sizes change on every keystroke in an editor, and reading them out as somebody typed would be unusable.

::: fw react

```tsx
<TextDiff before={saved} after={draft} header={false} summary={false} />
```

:::

::: fw flutter

```dart
TextDiff(before: saved, after: draft, header: false, summary: false);
```

:::

<DiffineDemo sample="prose" :header="false" :summary="false" height="14rem" flutter="text/bare" />

When the two documents turn out to be the same, the counts become a single tick rather than three noughts.

## Colours and words

`colorScheme` is <Fw react="`system`" flutter="`DiffineColorScheme.system`" /> by default, which follows <Fw react="the reader's own setting" flutter="the brightness of the screen around it" />. <Fw react="`light` and `dark`" flutter="`.light` and `.dark`" /> are for an application that has already decided.

`locale` is the language of the <Fw react="component's" flutter="widget's" /> own words rather than of the documents: the header, the summary, the search bar, and what a screen reader hears. English and Korean are in the box, and <Fw react="`en`" flutter="`DiffineLocale.en`" /> is the default.

`strings` replaces any of those words, which is also how a language that is not in the box gets in:

::: fw react

```tsx
<TextDiff
  before={saved}
  after={draft}
  strings={{ before: 'Vorher', after: 'Nachher', identical: 'Beide sind gleich.' }}
/>
```

:::

::: fw flutter

```dart
TextDiff(
  before: saved,
  after: draft,
  strings: baseStringsFor(DiffineLocale.en).copyWith(
    before: 'Vorher',
    after: 'Nachher',
    identical: 'Beide sind gleich.',
  ),
);
```

`baseStringsFor` is where a locale's own words come from, so replacing three of them is `copyWith` rather than writing out all forty-four.

:::

## Colouring the text

`language` names what the two documents are written in, and they are coloured as it:

::: fw react

```tsx
<TextDiff before={saved} after={draft} language="typescript" />
```

:::

::: fw flutter

```dart
TextDiff(before: saved, after: draft, language: 'dart');
```

:::

It takes a highlight.js identifier, or `plain` for a document that is not code. <Fw react="`DIFFINE_LANGUAGES`" flutter="`kDiffineLanguages`" code /> is the whole list with the name to write beside each one, and the bar above the panes writes that name at its right end. <Fw react="`languageLabel` is what draws it, and it is off unless a page asks for it — the name and the menu are fetched when it is turned on rather than imported, so a page that leaves it off carries neither." flutter="`languageLabel` turns it off." />

In `editor` mode the same corner is a menu that opens the list. That is the one place the two modes draw a different control, and for the reason the modes exist: a viewer is given its documents by the application, which knows what they are, and an editor is given a document somebody pasted.

::: fw react

```tsx
<TextDiff mode="editor" defaultBefore={saved} defaultAfter={draft} defaultLanguage="python" />
```

:::

::: fw flutter

```dart
TextDiff(
  mode: DiffineMode.editor,
  defaultBefore: saved,
  defaultAfter: draft,
  defaultLanguage: 'python',
);
```

:::

`language`, `defaultLanguage` and <Fw react="`onLanguageChange`" flutter="`onLanguageChanged`" /> work the way the documents do. Pass `language` to hold the choice yourself, pass `defaultLanguage` to let the <Fw react="component" flutter="widget" /> hold it.

::: fw react

Nothing is fetched until a language other than `plain` is asked for. Both the library and each grammar sit behind an `import()`, so a page whose views are all `plain` downloads none of it, and one that asks for Python downloads Python. The first paint after the grammar arrives is the document coloured; the one before it is the document.

Running a grammar over a long document is the expensive part of a keystroke in an editor, and by a long way: on five thousand lines the tokenising costs 48ms where comparing the same document costs 0.7ms. So the colours are deferred. The keystroke is drawn against the ones the last keystroke produced, and the new ones arrive in a pass the browser can interrupt if another key is pressed.

The colours are eight custom properties — `--diffine-code-keyword`, `--diffine-code-string`, and the rest — and every class highlight.js emits is mapped onto one of them. An application with a palette of its own sets those eight.

:::

::: fw flutter

The grammars are in the package rather than fetched, because an app bundle has no network to defer to — and they are **approximate** for the same reason: a correct parser for thirty-four languages is not a thing to keep beside a diff viewer. A template literal with a brace in it, or a regular expression that reads as division, comes out slightly wrong.

What they will not do is change the document. Every run is cut out of the text it was given and the lengths add back up to the line, so being wrong here is a colour that is off rather than a line that says something else. A document over four hundred thousand characters is drawn plain, which is a perfectly good drawing of a minified bundle somebody pasted.

The colours are eight fields on `DiffineTheme.code` — `keyword`, `string`, `comment`, `number`, `title`, `type`, `variable`, `meta` — and every kind of token a grammar emits is mapped onto one of them. An application with a palette of its own sets those eight.

:::

`highlight` is the way in for an application that already has a highlighter. It is handed a whole line and returns the runs it wants drawn differently, and it replaces `language` rather than adding to it:

::: fw react

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

:::

::: fw flutter

```dart
TextDiff(
  before: saved,
  after: draft,
  highlight: (DiffLine line, DiffineSide side) => tokenize(line.text)
      .map((Token token) => DiffineToken(length: token.length, style: token.style))
      .toList(),
);
```

:::

<DiffineDemo sample="code" colour height="18rem" flutter="text/basic" />

A whole line rather than a fragment, because that is the only order that works. A grammar applied to half a string literal does not come out right, and half a string literal is exactly what a comparison produces. So the application gets the line, and the component cuts it at the boundaries of both. A changed word that is half a string is drawn as a changed word that is half a string.

`length` counts the same units <Fw react="`String.prototype.slice`" flutter="`String.substring`" code /> does, so the runs a tokeniser already returns can be used as they are. Runs are taken in order and a gap between two of them is drawn plain, so a highlighter that only marks keywords can return only keywords with plain runs between. Return `null` for a line you have nothing to say about.

<Fw react="`style` is there beside `className` for a highlighter that hands back colours rather than classes." flutter="`kind` is there beside `style` for a highlighter that would rather name what a run is and let the theme colour it." />

The function is called for each line that is drawn, which is what is on the screen rather than what is in the document.

One rule an editor adds: a run may change how the text **looks** but not how **wide** it is. Colour, weight, style and a background are all fine. In the monospace face the component ships with, a bold keyword takes exactly the room the plain one did. A font size, a different family or a letter-spacing is not, because it moves the words away from the caret that is supposed to be sitting in them.

## Drawing your own on a line

A comparison knows what changed and nothing else. Everything a review is made of — a comment, a thread, a coverage bar, a lint warning, a button for adding one — belongs to the application, and two props are where it goes.

`renderGutter` adds a column to the gutter beside each line. `renderWidget` puts a box under one. Both are called with the line and the side it is on, and both return `null` for a line that gets nothing, which is most of them.

::: fw react

```tsx
<TextDiff
  before={saved}
  after={draft}
  renderGutter={(line, side) => (side === 'after' ? <AddComment line={line.index} /> : null)}
  renderWidget={(line, side) =>
    side === 'after' && threads[line.index] ? <Thread of={threads[line.index]} /> : null
  }
/>
```

:::

::: fw flutter

```dart
TextDiff(
  before: saved,
  after: draft,
  renderGutter: (DiffLine line, DiffineSide side) =>
      side == DiffineSide.after ? AddComment(line: line.index) : null,
  renderWidget: (DiffLine line, DiffineSide side) =>
      side == DiffineSide.after && threads[line.index] != null
      ? Thread(of: threads[line.index]!)
      : null,
);
```

:::

The gutter column is the one part of a line a screen reader is meant to reach: the number and the marker beside it are the colours said again, and are hidden from one. Keep it the same width on every line, or the gutter stops lining up.

::: fw react

A widget is as tall as it is, and two things follow. `virtualize` turns itself off, because what an application draws can grow at any moment and a row standing in for one of those would be standing in the wrong place. And in a split view the line opposite is given the same height, so the two sides stay level. The measurement that does that runs whenever the function changes, so pass one that is memoised if the comparison is long.

:::

::: fw flutter

A widget is as tall as it is, so the line opposite is given the same height and the two sides stay level. It reports its own height after it has been drawn, which is the one measurement nothing here can work out on its own.

:::

Both belong to <Fw react="`viewer` mode" flutter="`DiffineMode.viewer`" />. An editor lays a field over its lines and the two have to agree line for line, so a column of unknown width beside them, or a box of unknown height under one, would put the caret in the wrong place.

<Fw react="Style them through `.diffine-slot` and `.diffine-widget`, which carry nothing but the space around what you returned." flutter="What comes back is drawn as it is, with nothing but the space around it added." />

## Styling

::: fw react

Every colour and measurement is a custom property on the `.diffine` element. An application with a palette of its own overrides the properties rather than writing rules that have to win on specificity:

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

The full list is in the [API](../api/theme#custom-properties). One of them is the editor's alone: `--diffine-selection` has to be see-through, because the words under a selection are drawn by the lines behind the field, and an opaque highlight would be a rectangle where the selected text used to be.

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

Anything left out keeps the stylesheet's value, so `{ size: 15 }` is a whole answer. A number is pixels and a string is whatever CSS makes of it.

:::

::: fw flutter

There is no cascade to declare custom properties in, so the palette arrives as a value instead: the same names and the same colours, on one object.

```dart
TextDiff(
  before: saved,
  after: draft,
  theme: DiffineTheme.light.copyWith(
    height: 640,
    fontSize: 14,
    insertLine: const Color(0xffeaffea),
    insertPiece: const Color(0xffa6f3a6),
    deleteLine: const Color(0xffffecec),
    deletePiece: const Color(0xfff8b9b9),
  ),
);
```

The full list is in the [API](../api/theme#the-palette). Passing a theme settles `colorScheme` as well: a theme is a decision about which palette this is. One field is the editor's alone — `selection` has to be see-through, because the words under a selection are painted behind the field and an opaque highlight would be a rectangle where the selected text used to be.

`font` is the same idea for the typeface alone, for an application changing the type without touching a colour:

```dart
TextDiff(
  before: saved,
  after: draft,
  font: const DiffineFont(
    family: 'Iosevka',
    size: 15,
    lineHeight: 26,
    letterSpacing: 0.1,
  ),
);
```

Anything left out keeps the theme's value, so `DiffineFont(size: 15)` is a whole answer.

:::

Two rules about what goes in it: the family has to be monospace, or the gutter and the columns stop lining up, and `lineHeight` has to be a length rather than a bare multiplier, because a row is that tall whether or not it has a line in it and the rows a long comparison does not draw are stood in for by exactly that much height.

## A comparison worked out elsewhere

`result` takes a comparison instead of two documents, for an application that worked one out in a worker, on a server, or once for a list of views:

::: fw react

```tsx
import { diffText } from 'diffine-react/diff';

const result = diffText(saved, draft);

<TextDiff result={result} />;
```

:::

::: fw flutter

```dart
final DiffResult result = diffText(saved, draft);

TextDiff(result: result);
```

:::

[The comparison](./diff) is what that value is. An editor ignores it, because a comparison worked out elsewhere is a comparison of documents nobody has typed into yet.

## What it does not do

- **No unified editor.** See [Split and unified](#split-and-unified).
- **No syntax awareness.** `highlight` colours what an application's own tokeniser found. Nothing in this package parses a language.

The [playground](./playground) has both modes on the same pair of documents, with every switch on this page above them.
