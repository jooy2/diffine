<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { FRAMEWORKS } from '../../data/frameworks';

/**
 * The inline half of `::: fw` — a few words that differ, in the middle of a
 * sentence that does not.
 *
 * `<Fw react="onBeforeChange" flutter="onBeforeChanged" code />`
 *
 * A container cannot do this: `:::` is a block, and splitting a sentence into
 * two blocks to swap one identifier inside it would leave two paragraphs where
 * there was one. Anything longer than a phrase belongs in the block form.
 *
 * Each framework's text arrives as an attribute named after its id, read off
 * `$attrs` rather than declared, so adding a framework stays one entry in
 * `data/frameworks.ts`. One with nothing given for it renders nothing, which is
 * how a clause only one of them has gets written.
 *
 * An attribute is a string rather than Markdown, and VitePress has no chance to
 * make it anything else — so the one piece of Markdown a sentence about an API
 * cannot do without is read here: a name between backticks is a `<code>`. Every
 * page names props in these, and without this they arrive with the backticks
 * still on them.
 */
defineOptions({ inheritAttrs: false });

defineProps({
  /** Renders each variant as `<code>`, for a prop or an identifier. */
  code: { type: Boolean, default: false }
});

const attrs = useAttrs();

/** One framework's text, cut into the plain runs and the names inside it. */
function runsOf(text: string): { code: boolean; text: string }[] {
  return text
    .split(/(`[^`]+`)/g)
    .filter((piece) => piece !== '')
    .map((piece) =>
      piece.length > 2 && piece.startsWith('`') && piece.endsWith('`')
        ? { code: true, text: piece.slice(1, -1) }
        : { code: false, text: piece }
    );
}

const variants = computed(() =>
  FRAMEWORKS.filter((item) => attrs[item.id]).map((item) => ({
    id: item.id,
    runs: runsOf(String(attrs[item.id]))
  }))
);
</script>

<template>
  <template v-for="variant in variants" :key="variant.id">
    <code v-if="code" class="diffine-fw" :data-fw="variant.id">
      <template v-for="(run, at) in variant.runs" :key="at">{{ run.text }}</template>
    </code>
    <span v-else class="diffine-fw" :data-fw="variant.id"
      ><template v-for="(run, at) in variant.runs" :key="at"
        ><code v-if="run.code">{{ run.text }}</code
        ><template v-else>{{ run.text }}</template></template
      ></span
    >
  </template>
</template>
