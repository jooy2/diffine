/**
 * The languages the components know, and what each one is called.
 *
 * Names, and nothing but names. Every grammar is a module of its own fetched
 * when it is asked for, and the fetches are in `grammars.ts` rather than here,
 * because a bundler reads them while it is still deciding what a build
 * contains: a list of names that sat beside thirty-four `import()` calls would
 * write thirty-five grammar files into the build of a page that colours
 * nothing. Split in two, a menu costs a menu and a grammar costs a grammar.
 *
 * The names are English and are not translated. They are what the language
 * calls itself, and `TypeScript` is `TypeScript` in every locale.
 */

import type { DiffineLanguageOption } from '../../types.js';

/** What `language` is when nothing is being coloured. */
export const PLAIN = 'plain';

/** What each language the components can colour is called. */
const NAMES: Record<string, string> = {
  bash: 'Bash',
  c: 'C',
  cpp: 'C++',
  csharp: 'C#',
  css: 'CSS',
  dart: 'Dart',
  diff: 'Diff',
  dockerfile: 'Dockerfile',
  go: 'Go',
  graphql: 'GraphQL',
  ini: 'INI / TOML',
  java: 'Java',
  javascript: 'JavaScript',
  json: 'JSON',
  kotlin: 'Kotlin',
  less: 'Less',
  lua: 'Lua',
  markdown: 'Markdown',
  nginx: 'Nginx',
  objectivec: 'Objective-C',
  perl: 'Perl',
  php: 'PHP',
  powershell: 'PowerShell',
  python: 'Python',
  r: 'R',
  ruby: 'Ruby',
  rust: 'Rust',
  scala: 'Scala',
  scss: 'SCSS',
  sql: 'SQL',
  swift: 'Swift',
  typescript: 'TypeScript',
  xml: 'HTML / XML',
  yaml: 'YAML'
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
  ...Object.entries(NAMES).map(([id, name]) => ({ id, name }))
];

/** What to call a language, which for one nobody knows is what it was called. */
export function languageName(language: string | undefined): string {
  if (!language || language === PLAIN) {
    return 'Plain';
  }

  return NAMES[language] ?? language;
}
