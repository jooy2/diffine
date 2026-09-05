/**
 * VitePress's own theme, with one component added to it.
 *
 * `DiffineDemo` is registered globally so a page can write `<DiffineDemo />`
 * without importing anything — which is what keeps the Markdown readable next
 * to the prose around it.
 */
import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import DiffineDemo from './components/DiffineDemo.vue';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('DiffineDemo', DiffineDemo);
  }
} satisfies Theme;
