<!--
Thank you for this. It will be read and tested before it is merged, which can
take a little while.

The list below is what a reviewer will be looking for. Reading CONTRIBUTING.md
first will save you a round trip.
-->

## Before you mark it ready

- [ ] `npm run lint`, `npm run typecheck` and `npm test` pass in `packages/react`.
- [ ] `npm run lint`, `npm run typecheck` and `npm run build` pass in `docs`, if the site was touched.
- [ ] The documentation is updated, in **both English and Korean**. Write the second in your own words rather than translating it; if you cannot write one of them, say so below and it will be filled in.
- [ ] `packages/react/CHANGELOG.md` has an entry, if a user of the package would notice this.
- [ ] Tests cover the change, where it earns them — a new feature, a rewrite, or a bug that deserves a regression test. The existing ones still pass.
- [ ] The commit messages read `[scope] tag: message`, and close their issue with `(fixes #1)` where there is one.
- [ ] Anything answered by measuring an element — a wrapped row's height, the band between two panes, the field lying over the lines — was looked at in a browser, because the tests cannot see it.

Keep the pull request in draft until it is ready, and close it with a word about why if it stops being worth merging.

<!--
The rest is a shape to fill in, not a requirement. Delete whatever does not
apply.
-->

### What changed

### Why it is needed

### How it works

### What you looked at to be sure
