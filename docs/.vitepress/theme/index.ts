/**
 * VitePress's own theme, with this site's palette over it, the framework switch
 * in the sidebar, and four components registered globally.
 *
 * `DiffineDemo` and `DiffinePictures` are registered so a page can write
 * `<DiffineDemo />` without importing anything — which is what keeps the
 * Markdown readable next to the prose around it. `DiffinePlayground` is the
 * whole of one page rather than something dropped into several, and it is
 * registered the same way for the same reason: the Markdown that opens it stays
 * one line long. `Fw` is how a sentence says two things at once, one for each
 * package.
 */
import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import DiffineDemo from './components/DiffineDemo.vue';
import DiffinePictures from './components/DiffinePictures.vue';
import DiffinePlayground from './components/DiffinePlayground.vue';
import Fw from './components/Fw.vue';
import Layout from './components/Layout.vue';
import { syncFramework } from '../data/framework';
import './custom.css';
import './framework.css';

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('DiffineDemo', DiffineDemo);
    app.component('DiffinePictures', DiffinePictures);
    app.component('DiffinePlayground', DiffinePlayground);
    app.component('Fw', Fw);

    // Reads the stored choice into the reactive copy the components use, and
    // writes it back onto `<html>`. No-op during SSR.
    syncFramework();
  }
} satisfies Theme;
