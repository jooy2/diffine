<script setup lang="ts">
/**
 * A real `TextDiff`, in one mode or the other, on a VitePress page.
 *
 * Nothing about it is a screenshot or a re-implementation — see `island.ts` for
 * how a React component reaches a page here and why what is drawn below is the
 * component a reader would install.
 *
 * The palette and the language follow the page rather than the component's own
 * defaults, because a demo that stayed light on a dark page, or English on a
 * Korean one, would be demonstrating the wrong thing.
 */
import { computed, ref } from 'vue';
import { useData } from 'vitepress';
import { createElement } from 'react';
import { TextDiff } from 'diffine-react';
import type {
  DiffInlineMode,
  DiffWhitespace,
  DiffineMode,
  DiffineSide,
  DiffineView
} from 'diffine-react';
import 'diffine-react/styles.css';
import { highlight } from '../highlight';
import { useReactIsland } from '../island';
import { SAMPLES, type SampleName } from '../samples';

const props = withDefaults(
  defineProps<{
    /** Which mode the demo is of. */
    mode?: DiffineMode;
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
    /** Editor mode only: which side cannot be typed into. */
    readOnly?: boolean | DiffineSide;
    /** Editor mode only: whether Tab types a tab. */
    indentWithTab?: boolean;
    /** Whether the sample is drawn through the little highlighter beside this. */
    colour?: boolean;
    /** How many lines to pad the sample out to, for showing a long document. */
    lines?: number;
    height?: string;
    /** Whether the reader gets the switches as well as the view. */
    controls?: boolean;
  }>(),
  {
    mode: 'viewer',
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
    readOnly: false,
    indentWithTab: false,
    colour: false,
    lines: 0,
    height: '20rem',
    controls: false
  }
);

const { isDark, lang } = useData();

const host = ref<HTMLDivElement>();

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

/** Whether a demo has a language to say anything about at all. */
const coloured = () => !props.colour && Boolean(SAMPLES[props.sample]?.language);

/** The sample with enough filler under it to be worth not drawing whole. */
function padded(source: string, lines: number): string {
  const filler = Array.from(
    { length: lines },
    (_, index) => `const filler${index} = 'line ${index}';`
  );

  return `${source}${filler.join('\n')}\n`;
}

function draw() {
  const sample = SAMPLES[props.sample] ?? SAMPLES.code;
  const before = {
    content: props.lines ? padded(sample.before, props.lines) : sample.before,
    label: sample.beforeLabel
  };
  const after = {
    content: props.lines ? padded(sample.after, props.lines) : sample.after,
    label: sample.afterLabel
  };

  const shared = {
    wrap: chosen.value.wrap,
    lineNumbers: chosen.value.lineNumbers,
    markers: props.markers,
    connectors: props.connectors,
    header: props.header,
    navigation: props.navigation,
    summary: props.summary,
    virtualize: props.virtualize,
    // Coloured as whatever the sample is written in, unless the demo is the one
    // showing what `highlight` is for — the two answer the same question, and
    // that page is about the second answer.
    language: props.colour ? undefined : sample.language,
    highlight: props.colour ? highlight : undefined,
    diff: {
      inline: props.inline,
      whitespace: props.whitespace,
      ignoreCase: props.ignoreCase
    },
    colorScheme: isDark.value ? ('dark' as const) : ('light' as const),
    locale: locale.value,
    style: { height: props.height }
  };

  if (props.mode === 'editor') {
    return createElement(TextDiff, {
      ...shared,
      mode: 'editor' as const,
      // An editable document is the component's own once it has it, so a new
      // sample is a new component rather than a prop it would be right to
      // ignore.
      key: props.sample,
      defaultBefore: before,
      defaultAfter: after,
      readOnly: props.readOnly,
      indentWithTab: props.indentWithTab,
      languageLabel: coloured()
    });
  }

  return createElement(TextDiff, {
    ...shared,
    before,
    after,
    view: chosen.value.view,
    alignLines: chosen.value.alignLines,
    languageLabel: coloured()
  });
}

useReactIsland(host, draw, { watch: [chosen, isDark, locale, () => props.sample] });
</script>

<template>
  <div class="diffine-demo">
    <div v-if="controls" class="diffine-demo-controls">
      <label v-if="mode === 'viewer'">
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
      <label v-if="mode === 'viewer'">
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
      render after it mounts, so the element would not exist yet when the island
      below went looking for it. An empty `<div>` is the same on a server and in
      a browser, which is all hydration asks for, and `onMounted` is already the
      thing that never runs on a server.
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
