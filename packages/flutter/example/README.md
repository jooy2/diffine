# diffine_example

Diffine, running. A gallery of comparisons on any platform, and the renderer behind every Flutter preview on the documentation site.

```bash
flutter run
```

A list of demos down the side and the widget filling the rest: two documents side by side, one column with both, wrapped prose, a long file folded away, a comparison read out of a patch, an editor with the arrows for taking a change across, a note drawn under one line, and three ways of looking at two pictures.

## The framed half

The same build is what the documentation site puts in an `<iframe>`, one demo per frame:

```
index.html?demo=text/basic&locale=en
```

`demo` is the id from the list in `lib/main.dart` and `locale` is `en` or `ko`. Both are fixed for the life of the frame — which demo it is showing and which language the page around it is written in do not change without the page navigating anyway.

The palette is not fixed, and it does not ride in the query string: a new `src` would be a Flutter engine loaded again from nothing to change one colour. The frame says `{diffine: 'ready'}` when it is listening and the page answers with `{diffine: 'colorScheme', value: 'light' | 'dark'}`. See `lib/host.dart`.

## The playground

`demo=playground` is the one demo that is not in the list, because it is worth nothing on its own. It is the site's playground page, whose controls are drawn in HTML above the frame so that the reader on React and the reader on Flutter are given the same row of them, and every one of them arrives here as `{diffine: 'playground', value: {…}}` — the mode, the two documents, the language, and each switch. The pictures come with it as bytes, because the site builds those four pairs out of two files and one of the four is the same photograph saved again by a worse encoder, which Dart has no encoder to do.

`lib/settings.dart` is what that message becomes and `lib/playground.dart` is what draws it. The documents are held there rather than read again on every message: typing into the editor, moving to the viewer and finding what you wrote is the thing the page is for.

Building it for the site is `npm run flutter` in `docs/`, which writes into `docs/public/flutter`.
