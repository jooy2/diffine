/**
 * VitePress's own theme, with two components added to it.
 *
 * `DiffineDemo` is registered globally so a page can write `<DiffineDemo />`
 * without importing anything — which is what keeps the Markdown readable next
 * to the prose around it. `DiffinePlayground` is the whole of one page rather
 * than something dropped into several, and it is registered the same way for
 * the same reason: the Markdown that opens it stays one line long.
 */
import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import DiffineDemo from './components/DiffineDemo.vue';
import DiffinePlayground from './components/DiffinePlayground.vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('DiffineDemo', DiffineDemo);
    app.component('DiffinePlayground', DiffinePlayground);
  }
} satisfies Theme;
