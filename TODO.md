# TODO

Work that is planned but not started. An item leaves this list when it ships, and what it ships as goes in `packages/react/CHANGELOG.md`. Anything already released is not here; the changelog is the record of that.

## Three-way merge

`applyChanges` puts a pair of arrows on every change and writes one side's version over the other's, which answers "keep this, or put the other one back". It does not answer the question a merge asks: two people edited the same file from the same starting point, and which of the three versions wins.

What it would take:

- A `base` prop, and a comparison of three documents rather than two. A run where only one side moved is that side's; a run where both moved is a conflict.
- Somewhere in `DiffRow` for a conflict to live, or a result shape of its own. The current row holds two sides and a conflict has three.
- A view for it: three panes, or two with the base between them, and a way to take either side or to write something else.
- What `formatPatch` does with a conflict, which is probably nothing — a patch has no way of saying it.

It is a feature in its own right rather than a larger `applyChanges`, and the row model is the part to settle first.

## More than two pictures

`ImageDiff` and `diffImage` compare a pair, and a pair is not always the question. Three renderings of the same screen from three machines, four exports of the same asset, a baseline against the last five runs: what a reader wants there is one view saying where any of them disagree, and what a build wants is one number a threshold can be put on.

What it would take:

- A comparison of a list rather than of two. With a baseline named, each of the others is a comparison against it and the masks can be laid over one frame. With none, the question is "where do these disagree at all", which is a different mask: a pixel counts when any two of the list differ there.
- A result shape for it. `DiffImageResult` holds one `before` and one `after`, and a list holds none — either a result per pair against the baseline, or one frame with a mask whose bytes say how many of them disagree.
- `imageSimilarity` the same way. Three pictures have three pairwise numbers and one overall, and which of those a caller wants is the thing to settle first.
- A view. Three panes side by side is the easy part; what is not is the wipe, the fade and the loupe, each of which is written for two.

The result shape is the part to settle first, because everything else reads it. Raised alongside the work that added `unchanged`, `loupe` and `imageSimilarity`, and deliberately left out of it.

## Demos for the newer props

The guide pages draw a real `TextDiff` through `<DiffineDemo>` for most of what they describe, and the props added since do not have one: `collapse`, `showInvisibles`, `applyChanges`, `renderGutter`, `renderWidget`, and `diff.ignore`.

Each needs the demo component to pass the prop through, and two of them need a sample to show it on — a log with timestamps in it for `ignore`, and something with tabs and trailing spaces for `showInvisibles`. `docs/.vitepress/theme/components/DiffineDemo.vue` is where the props are declared and `docs/.vitepress/theme/samples.ts` is where the documents are.
