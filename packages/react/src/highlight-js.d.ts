/**
 * The two entries of highlight.js that ship without types.
 *
 * The package's `exports` map names types for its root and for nothing else, so
 * `lib/core` and every grammar under `lib/languages/` resolve to a module
 * TypeScript has never heard of. Both are described here from the types the
 * root does ship, which is where `HLJSApi` and `LanguageFn` come from.
 *
 * This file is ambient and is not part of the published declarations. Nothing
 * in the package's public API names a type from either module.
 */

declare module 'highlight.js/lib/core' {
  const hljs: import('highlight.js').HLJSApi;
  export default hljs;
}

declare module 'highlight.js/lib/languages/*' {
  const language: import('highlight.js').LanguageFn;
  export default language;
}
