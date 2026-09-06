/**
 * VitePress's own theme, with three components added to it.
 *
 * `DiffineDemo` and `DiffinePictures` are registered globally so a page can
 * write `<DiffineDemo />` without importing anything — which is what keeps the
 * Markdown readable next to the prose around it. `DiffinePlayground` is the
 * whole of one page rather than something dropped into several, and it is
 * registered the same way for the same reason: the Markdown that opens it stays
 * one line long.
 */
import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import DiffineDemo from './components/DiffineDemo.vue';
import DiffinePictures from './components/DiffinePictures.vue';
import DiffinePlayground from './components/DiffinePlayground.vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('DiffineDemo', DiffineDemo);
    app.component('DiffinePictures', DiffinePictures);
    app.component('DiffinePlayground', DiffinePlayground);
  }
} satisfies Theme;
