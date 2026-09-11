/**
 * Where each grammar is fetched from.
 *
 * Every one of them is behind an `import()`, so an application that never sets
 * `language` downloads none of them and one that sets it to `python` downloads
 * Python. That is the whole reason this is a list of thunks rather than a list
 * of imports: written the other way, the cost of every grammar here would land
 * on every page with a viewer on it, coloured or not.
 *
 * It is also why the names live in `catalogue.ts` and not here. A bundler reads
 * the fetches below while it is still deciding what the build contains, and
 * writes a chunk for each one it finds — so a menu of language names that sat
 * beside them would drag thirty-five files into the build of a page that
 * colours nothing. Nothing reaches this module except through `engine.ts`, and
 * nothing reaches `engine.ts` except through an `import()` of its own.
 */

/** A grammar, once it has been fetched. */
export type Grammar = { default: import('highlight.js').LanguageFn };

/** Every language the components can colour, and how to fetch the grammar for it. */
export const GRAMMARS: Record<string, () => Promise<Grammar>> = {
  bash: () => import('highlight.js/lib/languages/bash'),
  c: () => import('highlight.js/lib/languages/c'),
  cpp: () => import('highlight.js/lib/languages/cpp'),
  csharp: () => import('highlight.js/lib/languages/csharp'),
  css: () => import('highlight.js/lib/languages/css'),
  dart: () => import('highlight.js/lib/languages/dart'),
  diff: () => import('highlight.js/lib/languages/diff'),
  dockerfile: () => import('highlight.js/lib/languages/dockerfile'),
  go: () => import('highlight.js/lib/languages/go'),
  graphql: () => import('highlight.js/lib/languages/graphql'),
  ini: () => import('highlight.js/lib/languages/ini'),
  java: () => import('highlight.js/lib/languages/java'),
  javascript: () => import('highlight.js/lib/languages/javascript'),
  json: () => import('highlight.js/lib/languages/json'),
  kotlin: () => import('highlight.js/lib/languages/kotlin'),
  less: () => import('highlight.js/lib/languages/less'),
  lua: () => import('highlight.js/lib/languages/lua'),
  markdown: () => import('highlight.js/lib/languages/markdown'),
  nginx: () => import('highlight.js/lib/languages/nginx'),
  objectivec: () => import('highlight.js/lib/languages/objectivec'),
  perl: () => import('highlight.js/lib/languages/perl'),
  php: () => import('highlight.js/lib/languages/php'),
  powershell: () => import('highlight.js/lib/languages/powershell'),
  python: () => import('highlight.js/lib/languages/python'),
  r: () => import('highlight.js/lib/languages/r'),
  ruby: () => import('highlight.js/lib/languages/ruby'),
  rust: () => import('highlight.js/lib/languages/rust'),
  scala: () => import('highlight.js/lib/languages/scala'),
  scss: () => import('highlight.js/lib/languages/scss'),
  sql: () => import('highlight.js/lib/languages/sql'),
  swift: () => import('highlight.js/lib/languages/swift'),
  typescript: () => import('highlight.js/lib/languages/typescript'),
  xml: () => import('highlight.js/lib/languages/xml'),
  yaml: () => import('highlight.js/lib/languages/yaml')
};
