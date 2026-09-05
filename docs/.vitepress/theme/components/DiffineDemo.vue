<script setup lang="ts">
/**
 * A real `DiffineViewer`, on a VitePress page.
 *
 * VitePress compiles Markdown to Vue, so a React component reaches a page only
 * as an island: this owns one `<div>` and hands it to `createRoot()`. Nothing
 * about it is a screenshot or a re-implementation — the alias in
 * `.vitepress/config.ts` points `diffine-react` at the package's source, so
 * what is drawn below is the component the reader would install.
 *
 * The palette and the language follow the page rather than the component's own
 * defaults, because a demo that stayed light on a dark page, or English on a
 * Korean one, would be demonstrating the wrong thing.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useData } from 'vitepress';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { DiffineViewer } from 'diffine-react';
import type { DiffInlineMode, DiffWhitespace, DiffineView } from 'diffine-react';
import 'diffine-react/styles.css';
import { highlight } from '../highlight';
import { SAMPLES, type SampleName } from '../samples';

const props = withDefaults(
  defineProps<{
    sample?: SampleName;
    view?: DiffineView;
    lineNumbers?: boolean;
    markers?: boolean;
    wrap?: boolean;
    alignLines?: boolean;
    connectors?: boolean;
    header?: boolean;
    summary?: boolean;
    inline?: DiffInlineMode;
    whitespace?: DiffWhitespace;
    ignoreCase?: boolean;
    navigation?: boolean;
    virtualize?: boolean;
    /** Whether the sample is drawn through the little highlighter beside this. */
    colour?: boolean;
    /** How many lines to pad the sample out to, for showing a long document. */
    lines?: number;
    height?: string;
    /** Whether the reader gets the switches as well as the view. */
    controls?: boolean;
  }>(),
  {
    sample: 'code',
    view: 'split',
    lineNumbers: true,
    markers: true,
    wrap: false,
    alignLines: true,
    connectors: true,
    header: true,
    summary: true,
    inline: 'word',
    whitespace: 'exact',
    ignoreCase: false,
    navigation: true,
    virtualize: true,
    colour: false,
    lines: 0,
    height: '20rem',
    controls: false
  }
);

const { isDark, lang } = useData();

const host = ref<HTMLDivElement>();
let root: Root | undefined;

/** What the reader has turned on, starting from what the page asked for. */
const chosen = ref({
  view: props.view,
  wrap: props.wrap,
  alignLines: props.alignLines,
  lineNumbers: props.lineNumbers
});

const locale = computed(() => (lang.value.startsWith('ko') ? 'ko' : 'en'));

const labels = computed(() =>
  locale.value === 'ko'
    ? { view: '한 줄로 보기', wrap: '줄 바꿈', align: '줄 맞추기', numbers: '줄 번호' }
    : { view: 'Unified', wrap: 'Wrap', align: 'Align', numbers: 'Numbers' }
);

/** The sample with enough filler under it to be worth not drawing whole. */
function padded(source: string, lines: number): string {
  const filler = Array.from(
    { length: lines },
    (_, index) => `const filler${index} = 'line ${index}';`
  );

  return `${source}${filler.join('\n')}\n`;
}

function draw() {
  if (!root) {
    return;
  }

  const sample = SAMPLES[props.sample] ?? SAMPLES.code;
  const before = props.lines ? padded(sample.before, props.lines) : sample.before;
  const after = props.lines ? padded(sample.after, props.lines) : sample.after;

  root.render(
    createElement(DiffineViewer, {
      before: { content: before, label: sample.beforeLabel },
      after: { content: after, label: sample.afterLabel },
      view: chosen.value.view,
      wrap: chosen.value.wrap,
      alignLines: chosen.value.alignLines,
      lineNumbers: chosen.value.lineNumbers,
      markers: props.markers,
      connectors: props.connectors,
      header: props.header,
      navigation: props.navigation,
      summary: props.summary,
      virtualize: props.virtualize,
      highlight: props.colour ? highlight : undefined,
      diff: {
        inline: props.inline,
        whitespace: props.whitespace,
        ignoreCase: props.ignoreCase
      },
      colorScheme: isDark.value ? 'dark' : 'light',
      locale: locale.value,
      style: { height: props.height }
    })
  );
}

onMounted(() => {
  root = createRoot(host.value!);
  draw();
});

watch([chosen, isDark, locale, () => props.sample], draw, { deep: true });

onBeforeUnmount(() => {
  // On the next tick, because React refuses to tear a root down from inside the
  // render that is unmounting it and says so in the console.
  const going = root;

  root = undefined;
  queueMicrotask(() => going?.unmount());
});
</script>

<template>
  <div class="diffine-demo">
    <div v-if="controls" class="diffine-demo-controls">
      <label>
        <input
          type="checkbox"
          :checked="chosen.view === 'unified'"
          @change="chosen.view = ($event.target as HTMLInputElement).checked ? 'unified' : 'split'"
        />
        {{ labels.view }}
      </label>
      <label>
        <input type="checkbox" v-model="chosen.wrap" />
        {{ labels.wrap }}
      </label>
      <label>
        <input type="checkbox" v-model="chosen.alignLines" />
        {{ labels.align }}
      </label>
      <label>
        <input type="checkbox" v-model="chosen.lineNumbers" />
        {{ labels.numbers }}
      </label>
    </div>
    <!--
      Not wrapped in `<ClientOnly>`. That component renders its slot on the
      render after it mounts, so the element would not exist yet when
      `onMounted` below went looking for it. An empty `<div>` is the same on a
      server and in a browser, which is all hydration asks for, and `onMounted`
      is already the thing that never runs on a server.
    -->
    <div ref="host" />
  </div>
</template>

<style scoped>
.diffine-demo {
  margin: 1.25rem 0;
}

/*
 * The classes the little highlighter beside this hands back. Not scoped to the
 * component, because the elements carrying them are drawn by React inside a
 * root this file only owns the container of — Vue's scoping attribute never
 * reaches them.
 */
.diffine-demo :deep(.dx-keyword) {
  color: var(--vp-c-purple-1);
  font-weight: 600;
}

.diffine-demo :deep(.dx-string) {
  color: var(--vp-c-green-1);
}

.diffine-demo :deep(.dx-comment) {
  color: var(--vp-c-text-3);
  font-style: italic;
}

.diffine-demo-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.diffine-demo-controls label {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  cursor: pointer;
}
</style>
