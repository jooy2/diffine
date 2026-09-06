/**
 * The languages the components can colour, and how each one is fetched.
 *
 * A grammar is a module of its own, and every one of them is behind an
 * `import()` — so an application that never sets `language` downloads none of
 * them, and one that sets it to `python` downloads Python. That is the whole
 * reason this file is a list of thunks rather than a list of imports: written
 * the other way, the cost of every grammar here would land on every page with a
 * viewer on it, highlighted or not.
 *
 * The names are English and are not translated. They are what the language
 * calls itself, and `TypeScript` is `TypeScript` in every locale.
 */

import type { DiffineLanguageOption } from '../../types.js';

/** One language: what to call it, and how to fetch the grammar for it. */
export interface LanguageEntry {
  name: string;
  load: () => Promise<{ default: import('highlight.js').LanguageFn }>;
}

/** What `language` is when nothing is being coloured. */
export const PLAIN = 'plain';

export const LANGUAGES: Record<string, LanguageEntry> = {
  bash: { name: 'Bash', load: () => import('highlight.js/lib/languages/bash') },
  c: { name: 'C', load: () => import('highlight.js/lib/languages/c') },
  cpp: { name: 'C++', load: () => import('highlight.js/lib/languages/cpp') },
  csharp: { name: 'C#', load: () => import('highlight.js/lib/languages/csharp') },
  css: { name: 'CSS', load: () => import('highlight.js/lib/languages/css') },
  dart: { name: 'Dart', load: () => import('highlight.js/lib/languages/dart') },
  diff: { name: 'Diff', load: () => import('highlight.js/lib/languages/diff') },
  dockerfile: { name: 'Dockerfile', load: () => import('highlight.js/lib/languages/dockerfile') },
  go: { name: 'Go', load: () => import('highlight.js/lib/languages/go') },
  graphql: { name: 'GraphQL', load: () => import('highlight.js/lib/languages/graphql') },
  ini: { name: 'INI and TOML', load: () => import('highlight.js/lib/languages/ini') },
  java: { name: 'Java', load: () => import('highlight.js/lib/languages/java') },
  javascript: { name: 'JavaScript', load: () => import('highlight.js/lib/languages/javascript') },
  json: { name: 'JSON', load: () => import('highlight.js/lib/languages/json') },
  kotlin: { name: 'Kotlin', load: () => import('highlight.js/lib/languages/kotlin') },
  less: { name: 'Less', load: () => import('highlight.js/lib/languages/less') },
  lua: { name: 'Lua', load: () => import('highlight.js/lib/languages/lua') },
  markdown: { name: 'Markdown', load: () => import('highlight.js/lib/languages/markdown') },
  nginx: { name: 'Nginx', load: () => import('highlight.js/lib/languages/nginx') },
  objectivec: { name: 'Objective-C', load: () => import('highlight.js/lib/languages/objectivec') },
  perl: { name: 'Perl', load: () => import('highlight.js/lib/languages/perl') },
  php: { name: 'PHP', load: () => import('highlight.js/lib/languages/php') },
  powershell: { name: 'PowerShell', load: () => import('highlight.js/lib/languages/powershell') },
  python: { name: 'Python', load: () => import('highlight.js/lib/languages/python') },
  r: { name: 'R', load: () => import('highlight.js/lib/languages/r') },
  ruby: { name: 'Ruby', load: () => import('highlight.js/lib/languages/ruby') },
  rust: { name: 'Rust', load: () => import('highlight.js/lib/languages/rust') },
  scala: { name: 'Scala', load: () => import('highlight.js/lib/languages/scala') },
  scss: { name: 'SCSS', load: () => import('highlight.js/lib/languages/scss') },
  sql: { name: 'SQL', load: () => import('highlight.js/lib/languages/sql') },
  swift: { name: 'Swift', load: () => import('highlight.js/lib/languages/swift') },
  typescript: { name: 'TypeScript', load: () => import('highlight.js/lib/languages/typescript') },
  xml: { name: 'HTML and XML', load: () => import('highlight.js/lib/languages/xml') },
  yaml: { name: 'YAML', load: () => import('highlight.js/lib/languages/yaml') }
};

/**
 * Every language the components know, with `plain` at the front.
 *
 * This is what the editor's menu is built from, and it is exported so that an
 * application building a menu of its own — in its own place, in its own
 * language — is building it from the same list rather than from a copy that
 * goes stale.
 */
export const DIFFINE_LANGUAGES: readonly DiffineLanguageOption[] = [
  { id: PLAIN, name: 'Plain' },
  ...Object.entries(LANGUAGES).map(([id, entry]) => ({ id, name: entry.name }))
];

/** What to call a language, which for one nobody knows is what it was called. */
export function languageName(language: string | undefined): string {
  if (!language || language === PLAIN) {
    return 'Plain';
  }

  return LANGUAGES[language]?.name ?? language;
}
