---
title: The list of languages
order: 15
description: 'Every language the syntax highlighting accepts, and when a grammar is fetched.'
---

# The list of languages

::: fw react

```ts
interface DiffineLanguageOption {
  id: string;
  name: string;
}

const DIFFINE_LANGUAGES: readonly DiffineLanguageOption[];
```

Every language `language` accepts, `plain` first and then thirty-four highlight.js identifiers in alphabetical order. `id` is what `language` takes and `name` is what the bar writes beside the panes — English in every locale, because `TypeScript` is `TypeScript` in all of them. It is names and nothing else: the grammars sit behind an `import()` apiece, so a menu built from this list costs a list.

The editor's own menu is built from this list, and an application building a menu somewhere else should build it from the same one rather than from a copy that goes stale.

`highlight.js` and each grammar sit behind an `import()`. Nothing is fetched until a language other than `plain` is asked for, and what is fetched then is that one grammar. The first paint after it arrives is the document coloured; the one before it is the document.

:::

::: fw flutter

```dart
class DiffineLanguageOption {
  final String id;
  final String name;
}

const List<DiffineLanguageOption> kDiffineLanguages;

DiffineHighlight? diffineHighlighterFor(String? language, List<String> before, List<String> after);
```

Every language `language` accepts, `plain` first and then thirty-four identifiers in alphabetical order — the same identifiers the React package takes, so a service that stores one alongside a document stores the same string for both. `id` is what `language` takes and `name` is what the bar writes beside the panes, in English in every locale.

The editor's own menu is built from this list, and an application building a menu somewhere else should build it from the same one rather than from a copy that goes stale.

The grammars are in the package rather than fetched, because an app bundle has no network to defer to. They are approximate for the same reason: a correct parser for thirty-four languages is not a thing to keep beside a diff viewer. `diffineHighlighterFor` is the one behind `language`, exposed for an application that wants to colour something else with the same rules.

:::
