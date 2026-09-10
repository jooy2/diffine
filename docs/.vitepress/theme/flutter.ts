/**
 * Framing the Flutter gallery, for the two components that do it.
 *
 * A Flutter web app is a canvas and an event loop, and it cannot share a
 * document with anything else — so the Flutter half of a demo is an `<iframe>`
 * around the real build of `packages/flutter/example` rather than anything this
 * site draws. Which is also what makes it worth doing: the preview is the
 * package running, not a picture of it.
 *
 * Everything awkward about that lives here, because two components need all of
 * it and neither should hold a second copy:
 *
 * - **Whether there is a gallery at all.** It is not committed and not
 *   everybody has a Flutter SDK, so one request settles it for the session.
 * - **How many of them are running.** A frame is an engine, and a page of
 *   prose can have a dozen demos in it. See `near` below.
 * - **The handshake.** The engine arrives over the network and the frame loads
 *   lazily, so there is no moment a page can work out on its own. The frame
 *   says `ready` and the page answers with wherever its switches are by then.
 * - **The palette.** It rides in a message rather than in the URL: `src`
 *   changing is the engine loading again from nothing, which is a second of
 *   blank rectangle to change one colour.
 *
 * What each demo has to say beyond that is its own, and `post` is where it says
 * it.
 */

import { computed, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue';
import { useData, withBase } from 'vitepress';
import { framework } from '../data/framework';

/** Whether the gallery has been built into `public/flutter`, asked once. */
const built = ref<boolean | null>(null);
let probe: Promise<boolean> | null = null;

function galleryBuilt(url: string): Promise<boolean> {
  probe ??= fetch(url, { method: 'HEAD' })
    .then((response) => response.ok)
    .catch(() => false);

  return probe;
}

/*
 * How close a demo has to come before its engine is started, and how far it has
 * to go before it is stopped again.
 *
 * `loading="lazy"` is not enough on its own. It is a hint about fetching a
 * document rather than a rule about running one, and a browser reads it
 * generously: scrolling once through the text diff page left twelve engines
 * running and a hundred and thirty megabytes of heap behind, on a page whose
 * reader can see one demo at a time.
 *
 * Two distances rather than one, because a single boundary at the edge of the
 * screen is a frame that is torn down and rebuilt every time somebody nudges
 * the wheel. Between the two, whatever is running stays running.
 */
const ARRIVING = '600px';
const LEAVING = '2000px';

export interface FlutterFrame {
  /** Put this on whatever holds the demo, so its distance can be watched. */
  box: Ref<HTMLElement | undefined>;
  /** Put this on the `<iframe>`. */
  frame: Ref<HTMLIFrameElement | undefined>;
  /** Whether the frame is the half being shown. */
  embedded: Ref<boolean>;
  /** Whether Flutter is what the reader wants and the frame is not up yet. */
  waiting: Ref<boolean>;
  /** Whether the reader asked for Flutter and there is no gallery to show. */
  missing: Ref<boolean>;
  /** What to load in the frame. */
  src: Ref<string>;
  /** Says something to the gallery, if there is one listening. */
  post: (message: Record<string, unknown>) => void;
}

export function useFlutterFrame(options: {
  /** Which demo of the gallery answers this one. */
  demo: () => string;
  /** Whether the reader's choice applies here at all. */
  wanted: () => boolean;
  /**
   * Whether a frame that has gone a long way off the screen is taken down.
   *
   * On for a demo, which is a fixed thing that comes back the same as it went.
   * Off where the frame is holding something a reader put there — the
   * playground, whose two documents are inside it.
   */
  recycle?: boolean;
  /** Anything else to say once the gallery is listening. */
  onReady?: () => void;
}): FlutterFrame {
  const { isDark, lang } = useData();
  const box = ref<HTMLElement>();
  const frame = ref<HTMLIFrameElement>();
  const near = ref(false);

  const locale = computed(() => (lang.value.startsWith('ko') ? 'ko' : 'en'));
  const galleryUrl = withBase('/flutter/');
  const chosen = computed(() => options.wanted() && framework.value === 'flutter');
  const embedded = computed(() => chosen.value && built.value === true && near.value);
  const waiting = computed(() => chosen.value && built.value !== false && !near.value);
  const missing = computed(() => chosen.value && built.value === false);

  /*
   * `index.html` is named rather than left to the directory.
   *
   * A built site is served by something that resolves `/flutter/` to the index
   * inside it; the dev server is Vite's static middleware, which does not — and
   * a request it cannot answer falls through to VitePress's router and comes
   * back as the site's own 404 page inside the frame. Naming the file works in
   * both.
   */
  const src = computed(
    () => `${galleryUrl}index.html?demo=${options.demo()}&locale=${locale.value}`
  );

  function post(message: Record<string, unknown>): void {
    frame.value?.contentWindow?.postMessage(message, window.location.origin);
  }

  function tellPalette(): void {
    post({ diffine: 'colorScheme', value: isDark.value ? 'dark' : 'light' });
  }

  function onMessage(event: MessageEvent): void {
    const message: unknown = event.data;

    if (
      event.origin === window.location.origin &&
      event.source === frame.value?.contentWindow &&
      typeof message === 'object' &&
      message !== null &&
      (message as { diffine?: unknown }).diffine === 'ready'
    ) {
      tellPalette();
      options.onReady?.();
    }
  }

  let arriving: IntersectionObserver | null = null;
  let leaving: IntersectionObserver | null = null;

  function watchDistance(): void {
    const element = box.value;

    if (!element || typeof IntersectionObserver === 'undefined') {
      // Nothing to measure with, so everything is near. A preview that never
      // starts is worse than one that starts early.
      near.value = true;

      return;
    }

    arriving = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          near.value = true;
        }
      },
      { rootMargin: ARRIVING }
    );

    arriving.observe(element);

    if (options.recycle !== false) {
      leaving = new IntersectionObserver(
        (entries) => {
          if (entries.every((entry) => !entry.isIntersecting)) {
            near.value = false;
          }
        },
        { rootMargin: LEAVING }
      );

      leaving.observe(element);
    }
  }

  onMounted(() => {
    window.addEventListener('message', onMessage);

    // Neither asked where the answer would decide nothing — the home page,
    // whose demos are the React package to every reader because the framework
    // switch lives in the sidebar and the home page has no sidebar.
    if (!options.wanted()) {
      return;
    }

    watchDistance();

    void galleryBuilt(`${galleryUrl}version.json`).then((ok) => {
      built.value = ok;
    });
  });

  // The frame's half of the site's own dark switch. A no-op until there is a
  // window to tell.
  watch(isDark, tellPalette);

  onBeforeUnmount(() => {
    window.removeEventListener('message', onMessage);
    arriving?.disconnect();
    leaving?.disconnect();
  });

  return { box, frame, embedded, waiting, missing, src, post };
}
