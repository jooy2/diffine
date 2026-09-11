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
 *
 * A reader on Flutter gets the same page. The controls stay where they are —
 * they are the page's rather than either package's, and drawing them twice
 * would be two rows that drift apart — and what they choose is posted into the
 * framed gallery, which draws the widget those switches describe. The pictures
 * go down as bytes with them: the four pairs are built here out of two files,
 * and one of the four is the same photograph saved again by a worse encoder,
 * which is not a thing Dart has an encoder to do.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue';
import { useData } from 'vitepress';
import { createElement } from 'react';
import { ImageDiff } from 'diffine-react/image-diff';
import { TextDiff } from 'diffine-react/text-diff';
import type { DiffInlineMode, DiffineImageView } from 'diffine-react';
import 'diffine-react/styles.css';
import { useFlutterFrame } from '../flutter';
import { useReactIsland } from '../island';
import { SAMPLES } from '../samples';
import { pairOf, type PictureName, type PicturePair } from '../pictures';

type Mode = 'editor' | 'viewer' | 'pictures';
/** A pair of documents to start from. `blank` is the one with nothing in it. */
type Pick = 'code' | 'prose' | 'config' | 'korean' | 'blank';
/** A pair of pictures, or nothing and a pane to drop your own on. */
type Shot = PictureName | 'blank';

const MODES: readonly Mode[] = ['editor', 'viewer', 'pictures'];
const PICKS: readonly Pick[] = ['code', 'prose', 'config', 'korean', 'blank'];
const SHOTS: readonly Shot[] = ['retouched', 'moved', 'saved', 'badge', 'blank'];
const VIEWS: readonly DiffineImageView[] = ['split', 'overlay', 'wipe', 'mask'];
const DETAILS: readonly DiffInlineMode[] = ['word', 'character', 'none'];

const WORDS = {
  en: {
    mode: 'What to try',
    editor: 'Editor',
    viewer: 'Viewer',
    pictures: 'Pictures',
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
    tab: 'Tab indents',
    shot: 'Pictures',
    shots: {
      retouched: 'A photo, retouched',
      moved: 'The same crop, a pixel over',
      saved: 'Saved again as a worse JPEG',
      badge: 'An icon with a badge on it',
      blank: 'Nothing — choose your own'
    },
    view: 'Show them',
    views: { split: 'Side by side', overlay: 'Faded', wipe: 'Wiped', mask: 'Only the marks' },
    tolerance: 'Tolerance',
    lineUp: 'Line them up',
    smoothing: 'Ignore smoothing',
    marks: 'Mark the pixels',
    outlines: 'Box the changes'
  },
  ko: {
    mode: '무엇을 써 볼지',
    editor: '에디터',
    viewer: '뷰어',
    pictures: '이미지',
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
    tab: 'Tab으로 들여쓰기',
    shot: '이미지',
    shots: {
      retouched: '한 곳을 고친 사진',
      moved: '1픽셀 옮긴 같은 사진',
      saved: '더 낮은 품질로 다시 저장',
      badge: '배지를 그려 넣은 아이콘',
      blank: '빈 화면 — 직접 넣기'
    },
    view: '보는 방식',
    views: { split: '나란히', overlay: '겹쳐서', wipe: '가르며', mask: '표시만' },
    tolerance: '허용 오차',
    lineUp: '위치 맞추기',
    smoothing: '경계 보정 무시',
    marks: '픽셀 표시',
    outlines: '변경 영역 표시'
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

const shot = ref<Shot>('retouched');
const pictures = ref({
  view: 'split' as DiffineImageView,
  /** Out of a hundred, because that is what a slider counts in. */
  tolerance: 5,
  align: false,
  smoothing: true,
  marks: true,
  outlines: true
});

/**
 * The two pictures, once they have been fetched and the second one drawn.
 *
 * Nothing is fetched until somebody asks for the pictures, which is what keeps
 * a page about text from downloading a photograph. See `../pictures.ts` for
 * what each pair is and how the second of it is made.
 */
const pair = ref<PicturePair | null>(null);

watch(
  [mode, shot],
  async () => {
    /*
     * Whatever is on the screen is not the pair that was just asked for, and a
     * component holding its own pictures will not take new ones — so it goes
     * back to nothing first, and comes back as a new component when the pair
     * it was asked for has been built.
     */
    pair.value = null;

    if (mode.value !== 'pictures' || shot.value === 'blank') {
      return;
    }

    const wanted = shot.value;
    const loaded = await pairOf(wanted);

    if (shot.value === wanted) {
      pair.value = loaded;
    }
  },
  { immediate: true }
);

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

/** The picture comparison, on whichever pair has arrived. */
function drawPictures() {
  const loaded = pair.value;

  return createElement(ImageDiff, {
    /*
     * A component that holds its own pictures is a component that keeps the
     * first ones it was given, so a new pair — or the first pair arriving —
     * is a new component rather than a prop it would be right to ignore.
     */
    key: `${shot.value}-${loaded ? 'ready' : 'waiting'}`,
    mode: 'editor' as const,
    defaultBefore: loaded ? { content: loaded.before, label: loaded.beforeLabel } : undefined,
    defaultAfter: loaded ? { content: loaded.after, label: loaded.afterLabel } : undefined,
    view: pictures.value.view,
    diff: {
      tolerance: pictures.value.tolerance / 100,
      align: pictures.value.align ? ('shift' as const) : ('none' as const),
      ignoreAntialiasing: pictures.value.smoothing
    },
    marks: pictures.value.marks,
    outlines: pictures.value.outlines,
    colorScheme: isDark.value ? ('dark' as const) : ('light' as const),
    locale: locale.value,
    style: { height: `${height.value}px` }
  });
}

function draw() {
  if (mode.value === 'pictures') {
    return drawPictures();
  }

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
      // at `Plain`. Asked for rather than assumed: the component leaves the
      // menu out unless a page says it wants one.
      languageLabel: true,
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
    languageLabel: true,
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
  watch: [mode, pick, generation, options, isDark, locale, height, language, shot, pictures, pair]
});

/* ---------------------------------------------------------------------------
 * The Flutter half
 * ------------------------------------------------------------------------- */

/** One pair of pictures as two files, which is what can be posted into a frame. */
interface PictureBytes {
  before: Uint8Array;
  after: Uint8Array;
  beforeLabel: string;
  afterLabel: string;
}

/** Each pair read once, however many times a reader switches back to it. */
const BYTES = new Map<Shot, PictureBytes>();

async function readPair(name: Shot, loaded: PicturePair): Promise<void> {
  const [before, after] = await Promise.all([
    loaded.before.arrayBuffer(),
    loaded.after.arrayBuffer()
  ]);

  BYTES.set(name, {
    before: new Uint8Array(before),
    after: new Uint8Array(after),
    beforeLabel: loaded.beforeLabel,
    afterLabel: loaded.afterLabel
  });

  // Read to be sent, so the sending is what finishes the job.
  tell();
}

/**
 * The pair the frame should be comparing, or null while there is not one yet.
 *
 * Reading a file is asynchronous and saying what the switches are is not, so
 * the two are not made to wait for each other: this hands back whatever has
 * been read, starts reading anything that has not, and that read says
 * everything again when it lands.
 */
function bytesFor(name: Shot): PictureBytes | null {
  if (name === 'blank') {
    return null;
  }

  const held = BYTES.get(name);

  if (held) {
    return held;
  }

  const loaded = pair.value;

  if (loaded) {
    void readPair(name, loaded);
  }

  return null;
}

/** Every switch on this page, as the gallery reads them. */
function tell(): void {
  if (!flutter.embedded.value) {
    return;
  }

  const shown = mode.value === 'pictures' ? bytesFor(shot.value) : null;

  flutter.post({
    diffine: 'playground',
    value: {
      mode: mode.value,
      // Not the switches: what says the documents below are new ones rather
      // than the reader's own, which the frame is holding and this page is not.
      generation: generation.value,
      before: documents.before,
      after: documents.after,
      beforeLabel: documents.beforeLabel ?? '',
      afterLabel: documents.afterLabel ?? '',
      language: language.value,
      detail: options.value.detail,
      unified: options.value.unified,
      wrap: options.value.wrap,
      numbers: options.value.numbers,
      align: options.value.align,
      connectors: options.value.connectors,
      tab: options.value.tab,
      view: pictures.value.view,
      tolerance: pictures.value.tolerance / 100,
      alignPictures: pictures.value.align,
      smoothing: pictures.value.smoothing,
      marks: pictures.value.marks,
      outlines: pictures.value.outlines,
      shot: shot.value,
      pictureBeforeLabel: shown?.beforeLabel ?? '',
      pictureAfterLabel: shown?.afterLabel ?? ''
    },
    pictureBefore: shown?.before,
    pictureAfter: shown?.after
  });
}

const flutter = useFlutterFrame({
  demo: () => 'playground',
  wanted: () => true,
  // The stage is the page, so it is never far enough away to be taken down —
  // and it must not be, because the two documents a reader has been typing
  // into are inside the frame rather than on this side of it.
  recycle: false,
  onReady: tell
});

// `box` and `frame` are destructured for the template refs of the same names.
const { box, frame, embedded, waiting, missing, src } = flutter;

watch([mode, generation, language, shot, options, pictures, pair, embedded], () => tell(), {
  deep: true
});

// The note about a gallery that was never built is a row above the stage, and
// it arrives one request after the page does — so the stage is measured again
// rather than left as tall as it was before there was a line over it.
watch(missing, () => void nextTick(measure));
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

    <div v-if="mode === 'pictures'" class="play-bar">
      <label class="play-field">
        <span>{{ words.shot }}</span>
        <select v-model="shot">
          <option v-for="name in SHOTS" :key="name" :value="name">{{ words.shots[name] }}</option>
        </select>
      </label>
      <label class="play-field">
        <span>{{ words.view }}</span>
        <select v-model="pictures.view">
          <option v-for="name in VIEWS" :key="name" :value="name">{{ words.views[name] }}</option>
        </select>
      </label>
      <label class="play-field">
        <span>{{ words.tolerance }}</span>
        <input type="range" min="0" max="30" v-model.number="pictures.tolerance" />
        <span class="play-value">{{ (pictures.tolerance / 100).toFixed(2) }}</span>
      </label>
      <div class="play-switches">
        <label>
          <input type="checkbox" v-model="pictures.align" />
          {{ words.lineUp }}
        </label>
        <label>
          <input type="checkbox" v-model="pictures.smoothing" />
          {{ words.smoothing }}
        </label>
        <label>
          <input type="checkbox" v-model="pictures.marks" />
          {{ words.marks }}
        </label>
        <label>
          <input type="checkbox" v-model="pictures.outlines" />
          {{ words.outlines }}
        </label>
      </div>
    </div>

    <div v-else class="play-bar">
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

    <p v-if="missing" class="play-missing">
      The Flutter playground needs the gallery built — <code>npm run flutter</code> in
      <code>docs/</code>. Showing the React one.
    </p>

    <!--
      Both halves are in the tree and one of them is shown, the same way a
      `::: fw` block is. A `v-if` on the React half would tear a whole React
      root down every time the reader flips the switch, and the frame is worse
      still — it is an engine, and the documents somebody typed into it are
      inside it.
    -->
    <div ref="stage" class="play-stage">
      <div ref="box" class="play-box">
        <iframe
          v-if="embedded"
          ref="frame"
          class="play-frame"
          :src="src"
          :style="{ height: `${height}px` }"
          title="Diffine for Flutter"
        />
        <div v-else-if="waiting" class="play-frame" :style="{ height: `${height}px` }" />
        <div v-show="!embedded && !waiting" ref="host" />
      </div>
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

.play-value {
  min-width: 2.25rem;
  font-variant-numeric: tabular-nums;
}

.play-field input[type='range'] {
  width: 6rem;
  accent-color: var(--vp-c-brand-1);
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

.play-frame {
  display: block;
  width: 100%;
  border: 0;
}

.play-missing {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--vp-c-text-2);
}
</style>
