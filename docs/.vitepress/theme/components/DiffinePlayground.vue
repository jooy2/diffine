<script setup lang="ts">
/**
 * The playground: one component at a time, filling the window.
 *
 * Every other page on this site is prose with demos in it, and this one is the
 * other way round. There is no reading to do and no second demo under the
 * first — a page that showed the editor and the viewer at once would show two
 * half-height boxes, and half a height is what makes both of them look like
 * illustrations. So: a switch, and whichever one is chosen gets the whole of
 * what is left below the navbar.
 *
 * The two share their documents. Type into the editor, move to the viewer, and
 * what is being read is what was just written — which is the comparison worth
 * making between the two components, and it is only worth anything if it is the
 * same pair of documents. The samples are there because the viewer has no way
 * of taking a document from a reader, and one of them is empty, because the
 * other thing somebody wants from a page like this is somewhere to paste their
 * own two versions.
 */
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue';
import { useData } from 'vitepress';
import { createElement } from 'react';
import { TextDiff } from 'diffine-react';
import type { DiffInlineMode } from 'diffine-react';
import 'diffine-react/styles.css';
import { useReactIsland } from '../island';
import { SAMPLES } from '../samples';

type Mode = 'editor' | 'viewer';
/** A pair of documents to start from. `blank` is the one with nothing in it. */
type Pick = 'code' | 'prose' | 'config' | 'korean' | 'blank';

const MODES: readonly Mode[] = ['editor', 'viewer'];
const PICKS: readonly Pick[] = ['code', 'prose', 'config', 'korean', 'blank'];
const DETAILS: readonly DiffInlineMode[] = ['word', 'character', 'none'];

const WORDS = {
  en: {
    mode: 'What to try',
    editor: 'Editor',
    viewer: 'Viewer',
    sample: 'Documents',
    detail: 'Compare by',
    reset: 'Start over',
    resetTitle: 'Put the chosen documents back as they were',
    picks: {
      code: 'Two versions of a file',
      prose: 'A page of prose, edited',
      config: 'A workflow, changed',
      korean: 'A notice, rewritten',
      blank: 'Nothing — paste your own'
    },
    details: { word: 'Words', character: 'Characters', none: 'Whole lines' },
    unified: 'Unified',
    wrap: 'Wrap',
    numbers: 'Numbers',
    align: 'Align',
    connectors: 'Connectors',
    tab: 'Tab indents'
  },
  ko: {
    mode: '무엇을 써 볼지',
    editor: '에디터',
    viewer: '뷰어',
    sample: '문서',
    detail: '비교 단위',
    reset: '처음으로',
    resetTitle: '고른 문서를 원래대로 되돌립니다',
    picks: {
      code: '한 파일의 두 판본',
      prose: '고쳐 쓴 글 한 쪽',
      config: '바뀐 워크플로 설정',
      korean: '다시 쓴 안내문',
      blank: '빈 문서 — 직접 붙여 넣기'
    },
    details: { word: '단어', character: '글자', none: '줄만' },
    unified: '한 줄로 보기',
    wrap: '줄 바꿈',
    numbers: '줄 번호',
    align: '줄 맞추기',
    connectors: '연결선',
    tab: 'Tab으로 들여쓰기'
  }
};

const { isDark, lang, page } = useData();
const locale = computed(() => (lang.value.startsWith('ko') ? 'ko' : 'en'));
const words = computed(() => WORDS[locale.value]);

/**
 * The page's own name, drawn here rather than by the Markdown above.
 *
 * The switch belongs beside the title and not under it — the stage is what this
 * page is, and every row above it is a row of component nobody can see. Two
 * siblings cannot be put on one line by CSS, so the heading comes into the
 * component and the frontmatter goes on being where its text is written.
 */
const title = computed(() => page.value.title);

const mode = ref<Mode>('editor');
const pick = ref<Pick>('code');
const options = ref({
  unified: false,
  wrap: false,
  numbers: true,
  align: true,
  connectors: true,
  tab: false,
  detail: 'word' as DiffInlineMode
});

/** How many times the documents have been put back, so the editor is rebuilt. */
const generation = ref(0);

/** What each sample is written in, so that choosing one sets the menu with it. */
const LANGUAGES: Record<Pick, string> = {
  code: 'javascript',
  prose: 'plain',
  config: 'yaml',
  korean: 'plain',
  blank: 'plain'
};

/**
 * What the documents are being coloured as, shared by the two components.
 *
 * The editor's own menu is what changes it, and the viewer is given it — which
 * is the difference between the two worth seeing on a page that shows both.
 */
const language = ref(LANGUAGES.code);

/** What each side holds, and the name over it. */
function pairFor(chosen: Pick) {
  if (chosen === 'blank') {
    return { before: '', after: '', beforeLabel: undefined, afterLabel: undefined };
  }

  const sample = SAMPLES[chosen];

  return {
    before: sample.before,
    after: sample.after,
    beforeLabel: sample.beforeLabel,
    afterLabel: sample.afterLabel
  };
}

/**
 * The two documents as they stand, kept outside Vue's reactivity on purpose.
 *
 * The editor holds them itself and reports every keystroke; nothing on this
 * page has to be drawn again when one arrives, and making this a `ref` would
 * redraw a React tree on every character for the sake of a value only the other
 * component reads. It is read when that component is put on the screen.
 */
let documents = pairFor('code');

function restart(chosen: Pick): void {
  documents = pairFor(chosen);
  language.value = LANGUAGES[chosen];
  generation.value += 1;
}

watch(pick, restart);

const host = ref<HTMLDivElement>();

function draw() {
  const shared = {
    wrap: options.value.wrap,
    lineNumbers: options.value.numbers,
    connectors: options.value.connectors,
    diff: { inline: options.value.detail },
    colorScheme: isDark.value ? ('dark' as const) : ('light' as const),
    locale: locale.value,
    style: { height: `${height.value}px` }
  };

  const before = documents.beforeLabel
    ? { content: documents.before, label: documents.beforeLabel }
    : documents.before;
  const after = documents.afterLabel
    ? { content: documents.after, label: documents.afterLabel }
    : documents.after;

  if (mode.value === 'editor') {
    return createElement(TextDiff, {
      ...shared,
      mode: 'editor' as const,
      // A different pair of documents is a different editor. The component
      // keeps them once it has them, which is what makes it an editor, so
      // handing it new ones means building it again.
      key: `${pick.value}-${generation.value}`,
      defaultBefore: before,
      defaultAfter: after,
      indentWithTab: options.value.tab,
      onBeforeChange: (value: string) => {
        documents = { ...documents, before: value };
      },
      onAfterChange: (value: string) => {
        documents = { ...documents, after: value };
      },
      // The menu is the editor's, and what it lands on is the page's — so the
      // viewer opens on the language the editor was left on rather than back
      // at `Plain`.
      language: language.value,
      onLanguageChange: (chosen: string) => {
        language.value = chosen;
      }
    });
  }

  return createElement(TextDiff, {
    ...shared,
    before,
    after,
    view: options.value.unified ? 'unified' : 'split',
    alignLines: options.value.align,
    language: language.value
  });
}

/**
 * How tall the stage is, so that the page ends exactly where the window does.
 *
 * Measured rather than written as a `calc()`, because what is above it is the
 * navbar, the page's own padding, a heading and a row of switches — four
 * numbers that are different on every breakpoint and none of which this
 * component should know. The offset is taken from the document rather than from
 * the viewport, so a resize while scrolled measures the same thing as a resize
 * at the top.
 */
const stage = useTemplateRef<HTMLDivElement>('stage');
const height = ref(520);

function measure(): void {
  const element = stage.value;

  if (!element) {
    return;
  }

  const top = element.getBoundingClientRect().top + window.scrollY;

  height.value = Math.max(320, Math.round(window.innerHeight - top - 24));
}

onMounted(() => {
  measure();
  window.addEventListener('resize', measure);
});

onBeforeUnmount(() => window.removeEventListener('resize', measure));

useReactIsland(host, draw, {
  watch: [mode, pick, generation, options, isDark, locale, height, language]
});
</script>

<template>
  <div class="play">
    <div class="play-head">
      <h1>{{ title }}</h1>
      <div class="play-track" role="radiogroup" :aria-label="words.mode">
        <label
          v-for="option in MODES"
          :key="option"
          class="play-option"
          :data-on="mode === option ? '' : undefined"
        >
          <input
            type="radio"
            name="diffine-play-mode"
            :value="option"
            :checked="mode === option"
            @change="mode = option"
          />
          <span>{{ words[option] }}</span>
        </label>
      </div>
    </div>

    <div class="play-bar">
      <label class="play-field">
        <span>{{ words.sample }}</span>
        <select v-model="pick">
          <option v-for="name in PICKS" :key="name" :value="name">{{ words.picks[name] }}</option>
        </select>
      </label>
      <label class="play-field">
        <span>{{ words.detail }}</span>
        <select v-model="options.detail">
          <option v-for="name in DETAILS" :key="name" :value="name">
            {{ words.details[name] }}
          </option>
        </select>
      </label>
      <button type="button" class="play-reset" :title="words.resetTitle" @click="restart(pick)">
        {{ words.reset }}
      </button>
      <div class="play-switches">
        <label v-if="mode === 'viewer'">
          <input type="checkbox" v-model="options.unified" />
          {{ words.unified }}
        </label>
        <label>
          <input type="checkbox" v-model="options.wrap" />
          {{ words.wrap }}
        </label>
        <label>
          <input type="checkbox" v-model="options.numbers" />
          {{ words.numbers }}
        </label>
        <label v-if="mode === 'viewer'">
          <input type="checkbox" v-model="options.align" />
          {{ words.align }}
        </label>
        <label>
          <input type="checkbox" v-model="options.connectors" />
          {{ words.connectors }}
        </label>
        <label v-if="mode === 'editor'">
          <input type="checkbox" v-model="options.tab" />
          {{ words.tab }}
        </label>
      </div>
    </div>

    <div ref="stage" class="play-stage">
      <div ref="host" />
    </div>
  </div>
</template>

<style scoped>
.play {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/*
 * The title and the switch on one line, with the switch against the right edge.
 * Two rows above the stage is two rows of component nobody can see, and this is
 * the one page here whose whole point is how much of it is on the screen.
 */
.play-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px 16px;
}

.play-track {
  display: inline-grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(88px, auto);
  gap: 3px;
  flex: none;
  margin-inline-start: auto;
  width: fit-content;
  padding: 3px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background-color: var(--vp-c-bg-alt);
}

.play-option {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 30px;
  padding: 0 14px;
  border-radius: 7px;
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition:
    color 0.16s,
    background-color 0.16s,
    box-shadow 0.16s;
}

/* Present to a screen reader and to the arrow keys, and not drawn: the label
   around it is the control as far as the eye is concerned. */
.play-option input {
  position: absolute;
  overflow: hidden;
  width: 1px;
  height: 1px;
  clip-path: inset(50%);
  white-space: nowrap;
}

.play-option:hover {
  color: var(--vp-c-text-1);
}

.play-option[data-on] {
  background-color: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  box-shadow:
    0 0 0 1px var(--vp-c-divider),
    0 1px 2px rgb(0 0 0 / 0.06);
}

.play-option:has(input:focus-visible) {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

.play-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.play-field {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.play-field select {
  height: 28px;
  padding: 0 6px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background-color: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 13px;
  cursor: pointer;
}

.play-reset {
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background-color: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.play-reset:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.play-switches {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 14px;
  margin-inline-start: auto;
}

.play-switches label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.play-stage {
  min-height: 0;
}
</style>
