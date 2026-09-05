---
title: The viewer
order: 2
---

# The viewer

`DiffineViewer` draws two documents and what happened between them. Every part of that drawing is a prop with a default, so the same component covers a full side-by-side with connectors and a bare column of lines in a panel too narrow for anything else.

Turn the switches above the demo on and off — it is the component, not a picture of it.

<DiffineDemo sample="code" controls height="22rem" />

## Split and unified

`view` decides whether the two documents sit side by side or one under the other.

In `split`, matching lines are held level with each other and a line with no counterpart gets a blank opposite it. In `unified`, a change is written as the lines that went out followed by the lines that came in, with both documents' numbers down the side — the shape a patch has.

```tsx
<DiffineViewer before={saved} after={draft} view="unified" />
```

<DiffineDemo sample="code" view="unified" height="20rem" />

It is the same comparison read a second way rather than a second comparison. The words picked out inside the lines are the ones the engine already found.

## Line numbers and markers

`lineNumbers` puts each line's own number beside it, in a gutter that stays put while a long line is scrolled past it. `markers` puts a `+`, `−` or `~` next to a line that changed.

The markers are worth keeping. The colours say the same thing, and this is what says it to a reader who cannot tell red from green.

```tsx
<DiffineViewer before={saved} after={draft} lineNumbers={false} markers={false} />
```

<DiffineDemo sample="code" :lineNumbers="false" :markers="false" height="18rem" />

Neither of these is what a screen reader hears. Every changed line carries the word for what happened to it — added, removed, changed — written where a screen reader will find it and a copy of the text will not, and that does not turn off.

## Wrapping

`wrap` decides what a line too long for the pane does. Off, it runs off the side and the pane scrolls; on, it wraps.

Wrapping is the harder of the two to draw, and it is the reason the viewer measures anything at all: a line that wraps three times is three lines tall, its counterpart is one, and from there down the two documents would be out of step. So each pair is measured and the shorter one is given the height of the taller, whenever the panes are re-drawn or re-sized.

```tsx
<DiffineViewer before={saved} after={draft} wrap />
```

<DiffineDemo sample="prose" wrap height="18rem" />

## Holding the sides level

`alignLines` is on by default, and it is what puts a blank opposite a line with no counterpart. The two documents then stay in step all the way down, whatever they do to each other in between.

Turned off, each pane is only its own lines, ending where its own document ends. The two are no longer level, and the column between them is what says which part of one answers which part of the other.

<DiffineDemo sample="code" :alignLines="false" height="18rem" />

## The column between the panes

`connectors` draws each change as a band from where it left to where it arrived. With the sides held level the bands are straight, which is a quiet way of confirming what the alignment already did. With them not held level the bands bend, and they are the only thing saying where a run of lines went.

The geometry is read once per layout and kept, so scrolling moves shapes that were already measured rather than measuring them again a frame at a time.

`syncScroll` is what keeps the two panes looking at the same part of the two documents. With the rows level they share one scroll position; without, the position becomes a fraction of the way down, because the same number would put a reader at the end of one document and the middle of the other.

## The frame around it

`header` names each side above it, and `summary` writes the counts underneath. Both are on by default, and both come off for a viewer that is a piece of a page rather than the page.

```tsx
<DiffineViewer before={saved} after={draft} header={false} summary={false} />
```

<DiffineDemo sample="prose" :header="false" :summary="false" height="14rem" />

When the two documents turn out to be the same, the summary says so rather than reporting nought of everything.

## Colours and words

`colorScheme` is `system` by default, which follows the reader's own setting. `light` and `dark` are for an application that has already decided for them.

`locale` is the language of the viewer's own words rather than of the documents — the header, the summary, and what a screen reader hears. English and Korean are in the box; `strings` replaces any of the words in either, which is also how a third language gets in:

```tsx
<DiffineViewer
  before={saved}
  after={draft}
  strings={{ before: 'Vorher', after: 'Nachher', identical: 'Beide sind gleich.' }}
/>
```

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

The full list is in the [API](../api/#custom-properties). Anything the component is given beyond its own props goes straight to the element, so `id`, `className`, `style` and the `aria-*` attributes behave as they would on a `<div>`.

## A comparison worked out elsewhere

`result` takes a comparison instead of two documents, for an application that worked one out in a worker, on a server, or once for a list of viewers:

```tsx
import { diffText } from 'diffine-react/diff';

const result = diffText(saved, draft);

<DiffineViewer result={result} />;
```

[The comparison](./diff) is what that value is.
