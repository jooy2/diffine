<script setup lang="ts">
/**
 * A real `ImageDiff`, on one of the sample pairs, on a VitePress page.
 *
 * The same island the text demos use — see `island.ts` — with one difference
 * worth knowing about: the pictures are fetched and the second of each pair is
 * drawn in the browser, so there is a moment on every one of these where the
 * component is a pane inviting a picture. That is the component's own empty
 * state and not a placeholder for it.
 */
import { computed, onMounted, ref, watch } from 'vue';
import { useData } from 'vitepress';
import { createElement } from 'react';
import { ImageDiff } from 'diffine-react/image-diff';
import type { DiffineImageView } from 'diffine-react';
import 'diffine-react/styles.css';
import { useReactIsland } from '../island';
import { pairOf, type PictureName, type PicturePair } from '../pictures';

const props = withDefaults(
  defineProps<{
    sample?: PictureName;
    view?: DiffineImageView;
    /** How much of a difference counts, from 0 to 1. */
    tolerance?: number;
    /** Whether an offset between the two is looked for first. */
    align?: boolean;
    /** Whether an edge drawn smooth a second way is left out. */
    smoothing?: boolean;
    marks?: boolean;
    outlines?: boolean;
    navigation?: boolean;
    summary?: boolean;
    height?: string;
    /** Whether the reader gets the two switches worth turning here. */
    controls?: boolean;
  }>(),
  {
    sample: 'retouched',
    view: 'split',
    tolerance: 0.05,
    align: false,
    smoothing: true,
    marks: true,
    outlines: true,
    navigation: true,
    summary: true,
    height: '22rem',
    controls: false
  }
);

const { isDark, lang } = useData();
const locale = computed(() => (lang.value.startsWith('ko') ? 'ko' : 'en'));
const labels = computed(() =>
  locale.value === 'ko'
    ? { align: '위치 맞추기', smoothing: '경계 보정 무시' }
    : { align: 'Line them up', smoothing: 'Ignore smoothing' }
);

/** What the reader has turned on, starting from what the page asked for. */
const chosen = ref({ align: props.align, smoothing: props.smoothing });

const host = ref<HTMLDivElement>();
const pair = ref<PicturePair | null>(null);

/**
 * The pair, fetched and built in the browser and nowhere else.
 *
 * `onMounted` rather than an immediate watcher, because this page is rendered
 * on a server first and there is no picture to fetch there — only a relative
 * URL that means nothing to a machine with no page open.
 */
async function load(wanted: PictureName): Promise<void> {
  pair.value = null;
  pair.value = await pairOf(wanted);
}

watch(() => props.sample, load);
onMounted(() => load(props.sample));

function draw() {
  const loaded = pair.value;

  return createElement(ImageDiff, {
    // The pictures arrive after the first render, and a component that holds
    // its own will not take a second pair — so their arrival is a new one.
    key: loaded ? 'ready' : 'waiting',
    before: loaded ? { content: loaded.before, label: loaded.beforeLabel } : undefined,
    after: loaded ? { content: loaded.after, label: loaded.afterLabel } : undefined,
    view: props.view,
    diff: {
      tolerance: props.tolerance,
      align: chosen.value.align ? ('shift' as const) : ('none' as const),
      ignoreAntialiasing: chosen.value.smoothing
    },
    marks: props.marks,
    outlines: props.outlines,
    navigation: props.navigation,
    summary: props.summary,
    colorScheme: isDark.value ? ('dark' as const) : ('light' as const),
    locale: locale.value,
    style: { height: props.height }
  });
}

useReactIsland(host, draw, { watch: [pair, chosen, isDark, locale, () => props.view] });
</script>

<template>
  <div class="diffine-demo">
    <div v-if="controls" class="diffine-demo-controls">
      <label>
        <input type="checkbox" v-model="chosen.align" />
        {{ labels.align }}
      </label>
      <label>
        <input type="checkbox" v-model="chosen.smoothing" />
        {{ labels.smoothing }}
      </label>
    </div>
    <div ref="host" />
  </div>
</template>

<style scoped>
.diffine-demo {
  margin: 1.25rem 0;
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
