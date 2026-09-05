/// <reference types="vite/client" />

/**
 * A `.vue` file, to TypeScript.
 *
 * The theme imports one component and registers it, and that is the whole of
 * what this has to describe. Vue's own `shims-vue.d.ts` says the same thing at
 * greater length for a project that has more of them.
 */
declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;

  export default component;
}

/** A stylesheet imported for its effect and nothing else. */
declare module '*.css';
