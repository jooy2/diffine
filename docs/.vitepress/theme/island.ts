/**
 * A React component on a page VitePress compiled out of Markdown.
 *
 * VitePress renders Vue, so there is no way to write a React component into a
 * page here — which leaves one option, and this is it: Vue owns a `<div>` and
 * hands it to `createRoot()`. Everything inside is React's, everything outside
 * is Vue's, and the boundary is one element.
 *
 * The demos on this site are the real components rather than pictures of them.
 * The alias in `.vitepress/config.ts` points `diffine-react` at
 * `packages/react/src`, so an edit to the viewer is on the page as soon as it is
 * saved and nothing has to be built in between.
 */

import { onBeforeUnmount, onMounted, watch, type Ref, type WatchSource } from 'vue';
import { createRoot, type Root } from 'react-dom/client';
import type { ReactNode } from 'react';

export interface IslandOptions {
  /**
   * When to draw again.
   *
   * Whatever `draw` reads and can change: the page's palette, its language, the
   * switches above the demo. Not what somebody types into a demo — the
   * components hold their own documents, and re-drawing a React tree from a Vue
   * watcher on every character would be a keystroke going the long way round.
   */
  watch: WatchSource[];
}

/** Mounts `draw()` into `host`, and draws it again whenever it has to. */
export function useReactIsland(
  host: Readonly<Ref<HTMLElement | null | undefined>>,
  draw: () => ReactNode,
  options: IslandOptions
): void {
  let root: Root | undefined;

  const paint = () => root?.render(draw());

  onMounted(() => {
    root = createRoot(host.value!);
    paint();
  });

  watch(options.watch, paint, { deep: true });

  onBeforeUnmount(() => {
    // On the next tick, because React refuses to tear a root down from inside
    // the render that is unmounting it and says so in the console.
    const going = root;

    root = undefined;
    queueMicrotask(() => going?.unmount());
  });
}
