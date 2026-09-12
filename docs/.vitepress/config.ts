import { existsSync, readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ReactPlugin from '@vitejs/plugin-react';
import container from 'markdown-it-container';
import { withSidebar } from 'vitepress-sidebar';
import { withI18n } from 'vitepress-i18n';
import {
  defineConfig,
  type HeadConfig,
  type MarkdownRenderer,
  type TransformContext,
  type UserConfig
} from 'vitepress';
import type { VitePressI18nOptions } from 'vitepress-i18n/types';
import type { VitePressSidebarOptions } from 'vitepress-sidebar/types';
import packageJson from '../../packages/react/package.json' with { type: 'json' };
import {
  DEFAULT_FRAMEWORK,
  FRAMEWORK_HEAD_SCRIPT,
  FRAMEWORK_IDS,
  FRAMEWORKS
} from './data/frameworks';

const vitePressDir = dirname(fileURLToPath(import.meta.url));
/** `docs/`, which is where the locale folders live and what VitePress serves. */
const srcDir = resolve(vitePressDir, '..');
/** The React package's source, which the live demos render straight from. */
const reactPackageDir = resolve(srcDir, '../packages/react');

const defaultLocale = 'en';
const locales = [defaultLocale, 'ko'];

const siteUrl = packageJson.homepage.replace(/\/+$/, '');
const repoUrl = packageJson.repository.url.replace(/\.git$/, '');
const npmUrl = `https://www.npmjs.com/package/${packageJson.name}`;
/*
 * The other registry, which the navbar had no link to.
 *
 * Half the readers of this site install from pub.dev and the row above the menu
 * offered them npm — the registry for the package they did not pick. The name
 * comes off the framework list rather than being written again, since that is
 * already where each ecosystem's package name is recorded.
 */
const pubUrl = `https://pub.dev/packages/${
  FRAMEWORKS.find((framework) => framework.id === 'flutter')?.pkg ?? 'diffine'
}`;
/** The card image. A square mark, which is why the Twitter card is `summary`. */
const socialImage = `${siteUrl}/256x256.png`;

/** `/` for the default locale, `/{lang}/` for every other one. */
const baseOf = (lang: string) => (lang === defaultLocale ? '/' : `/${lang}/`);

/* ---------------------------------------------------------------------------
 * The id a heading gets, and the anchor a link is written against
 *
 * VitePress decomposes a heading to NFKD to strip accents off Latin letters,
 * and puts back only what is left. A Korean syllable decomposes into jamo that
 * are not accents, so nothing puts them back together and `커스텀 속성` becomes
 * an id spelled in jamo — which the same words typed into a link never match.
 *
 * Composing the result undoes exactly that and nothing else: a letter that
 * lost an accent has no accent to recompose, and a Hangul syllable becomes the
 * syllable it was written as.
 * ------------------------------------------------------------------------- */
const slugOf = (text: string): string =>
  text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u0000-\u001f]/g, '')
    .replace(/[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'\u201c\u201d\u2018\u2019<>,.?/]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^(\d)/, '_$1')
    .toLowerCase()
    .normalize('NFC');

/* ---------------------------------------------------------------------------
 * What each locale says
 *
 * Three things per language and no more: the sentence under the site's name,
 * the row of links in the navbar, and the two sidebar headings the folder tree
 * cannot name for itself. Everything else on this site is a page, and a page
 * carries its own title.
 * ------------------------------------------------------------------------- */

interface Words {
  description: string;
  guide: string;
  playground: string;
  api: string;
  overview: string;
  more: string;
}

const WORDS: Record<string, Words> = {
  en: {
    description:
      'Compare two versions and show what changed — a diff engine and a side-by-side viewer in one package, with syntax highlighting fetched only when a language is asked for.',
    guide: 'Guide',
    playground: 'Playground',
    api: 'API',
    overview: 'Overview',
    more: 'Discover more'
  },
  ko: {
    description:
      '두 버전을 비교해 무엇이 달라졌는지 보여줍니다. 비교 엔진과 나란히 보는 뷰어가 한 패키지에 들어 있고, 구문 강조는 언어를 고를 때만 내려받습니다.',
    guide: '가이드',
    playground: '직접 써보기',
    api: 'API',
    overview: '개요',
    more: '더 알아보기'
  }
};

/*
 * The navbar: the guide, the page to try it on, and the reference.
 *
 * The playground is in the guide's sidebar as well, and it is here because it
 * is the page somebody who has just landed on the site actually wants — a
 * component they can type into beats a page describing one, and neither the
 * sidebar nor the reading order puts it in front of them.
 */
const navFor = (lang: string) => [
  { text: WORDS[lang].guide, link: `${baseOf(lang)}guide/getting-started` },
  { text: WORDS[lang].playground, link: `${baseOf(lang)}guide/playground` },
  { text: WORDS[lang].api, link: `${baseOf(lang)}api/` }
];

const i18nOptions: VitePressI18nOptions = {
  locales,
  rootLocale: defaultLocale,
  searchProvider: 'local',
  description: Object.fromEntries(locales.map((lang) => [lang, WORDS[lang].description])) as Record<
    string,
    string
  >,
  themeConfig: Object.fromEntries(locales.map((lang) => [lang, { nav: navFor(lang) }]))
};

const commonSidebar: VitePressSidebarOptions = {
  // Every group is open, and stays open: `tidy` below takes the key off
  // afterwards so VitePress draws no caret to close one with.
  collapsed: false,
  // Off, because half the reference is named after a function and a function
  // here is `diffText`. Nothing needs it: every page carries its own `title`,
  // and the two folder headings a folder cannot name are written in `WORDS`.
  capitalizeFirst: false,
  useTitleFromFileHeading: true,
  useTitleFromFrontmatter: true,
  useFolderTitleFromIndexFile: true,
  // Without this the API group stops linking to the page that lists everything
  // in it, and the heading becomes a word that does nothing.
  useFolderLinkFromIndexFile: true,
  frontmatterOrderDefaultValue: 9,
  sortMenusByFrontmatterOrder: true
};

const sidebarOptions = locales.map((lang) => ({
  ...commonSidebar,
  // Relative to the working directory, which is this `docs/` folder —
  // `vitepress-sidebar` joins it onto `process.cwd()`.
  documentRootPath: `/${lang}`,
  resolvePath: baseOf(lang),
  ...(lang === defaultLocale ? {} : { basePath: baseOf(lang) })
}));

/* ---------------------------------------------------------------------------
 * What a search engine is told, per page
 *
 * Two things a documentation site gets wrong by default. Every page ships the
 * site's own description, because VitePress falls back to it whenever a page
 * declares none — so a dozen pages carry one sentence between them and not one
 * of them says what it is about. And nothing says the two locales are the same
 * page, so a crawler treats them as two documents competing for one query.
 *
 * Both are fixed from the page's own source: its opening paragraph becomes its
 * description, and the locales that actually have the page become its
 * alternates.
 * ------------------------------------------------------------------------- */

/** `en/guide/text-diff.md` → `/guide/text-diff`, and `en/api/index.md` → `/api/`. */
function urlPathOf(filePath: string): string {
  const [lang, ...rest] = filePath.split('/');
  const page = rest
    .join('/')
    .replace(/(^|\/)index\.md$/, '$1')
    .replace(/\.md$/, '');

  return `${baseOf(lang)}${page}`;
}

/** Everything below the locale folder — the part the two locales share. */
const pageOf = (filePath: string) => filePath.split('/').slice(1).join('/');

/**
 * `<Fw react="…" flutter="…" />` as the words it puts on the page.
 *
 * A page has one description and the tag has two halves, so the default
 * framework's is the one written — the half a reader who has chosen nothing is
 * shown. Without this the tag reaches the `<meta>` with its quotes still on it,
 * and the first of them ends the attribute in the middle of the sentence.
 */
function plainFw(tag: string): string {
  const half = new RegExp(`\\b${DEFAULT_FRAMEWORK}="([^"]*)"`).exec(tag);

  return half ? half[1].replaceAll('`', '') : '';
}

/**
 * The first block of a page that is prose rather than a title or an example.
 *
 * A single backtick is not a fence, so a paragraph opening on the name of a
 * component still counts — which is how half the pages here open.
 */
function summaryOf(filePath: string): string | undefined {
  const file = resolve(srcDir, filePath);

  if (!existsSync(file)) {
    return undefined;
  }

  const source = readFileSync(file, 'utf8')
    .replace(/^---\r?\n[\s\S]*?\r?\n---/, '')
    /*
     * An example is not prose, and the test below cannot tell that it is
     * looking at one. Blocks are split on blank lines, so the middle of a long
     * example arrives here as a block of its own — one that opens on an
     * identifier rather than on a fence, and reads like a sentence to
     * everything after this point. A page whose first words are code is half
     * this reference.
     */
    .replace(/^```[\s\S]*?^```/gm, '');

  for (const block of source.split(/\n\s*\n/)) {
    const trimmed = block.trim();

    if (!trimmed || /^(#|<|```|:::|\||>|[-*]\s|\d+\.\s)/.test(trimmed)) {
      continue;
    }

    const text = trimmed
      .replace(/<Fw\b(?:[^>"]|"[^"]*")*\/?>/g, plainFw)
      // Whatever else a sentence has a tag in the middle of is a component, and
      // a component has no words of its own to lend a description.
      .replace(/<[^>]*>/g, '')
      .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
      .replace(/[`*_]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!text) {
      continue;
    }

    if (text.length <= 160) {
      return text;
    }

    const cut = text.slice(0, 160);
    const boundary = cut.lastIndexOf(' ');

    return `${(boundary > 0 ? cut.slice(0, boundary) : cut).trimEnd()}…`;
  }

  return undefined;
}

function transformHead({ pageData, siteData, title, description }: TransformContext): HeadConfig[] {
  const { filePath } = pageData;

  // A dynamic route, or the built-in 404: no source file, so no canonical URL
  // and nothing to point an alternate at.
  if (!filePath) {
    return [];
  }

  const lang = filePath.split('/')[0];
  const url = `${siteUrl}${urlPathOf(filePath)}`;
  /** The BCP-47 tag the site declares for a locale — `ko` → `ko-KR`. */
  const tagOf = (of: string) => siteData.locales[of === defaultLocale ? 'root' : of]?.lang ?? of;
  const translated = locales.filter((of) => existsSync(resolve(srcDir, of, pageOf(filePath))));

  const head: HeadConfig[] = [
    ['link', { rel: 'canonical', href: url }],
    ['meta', { property: 'og:url', content: url }],
    ['meta', { property: 'og:title', content: title }],
    ['meta', { property: 'og:description', content: description }],
    // Open Graph writes a BCP-47 tag with an underscore in it, and nothing else.
    ['meta', { property: 'og:locale', content: tagOf(lang).replace('-', '_') }],
    ['meta', { name: 'twitter:title', content: title }],
    ['meta', { name: 'twitter:description', content: description }]
  ];

  for (const other of translated) {
    head.push([
      'link',
      {
        rel: 'alternate',
        hreflang: tagOf(other),
        href: `${siteUrl}${urlPathOf(`${other}/${pageOf(filePath)}`)}`
      }
    ]);

    if (other !== lang) {
      head.push([
        'meta',
        { property: 'og:locale:alternate', content: tagOf(other).replace('-', '_') }
      ]);
    }
  }

  // Which one a crawler serves to a reader it cannot place. The default locale
  // is the one served from `/`.
  if (translated.includes(defaultLocale)) {
    head.push([
      'link',
      {
        rel: 'alternate',
        hreflang: 'x-default',
        href: `${siteUrl}${urlPathOf(`${defaultLocale}/${pageOf(filePath)}`)}`
      }
    ]);
  }

  if (pageData.frontmatter.layout === 'home') {
    head.push([
      'script',
      { type: 'application/ld+json' },
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareSourceCode',
        name: 'Diffine',
        description,
        url,
        codeRepository: repoUrl,
        programmingLanguage: ['TypeScript', 'Dart'],
        runtimePlatform: ['React', 'Flutter'],
        license: 'https://opensource.org/licenses/MIT',
        author: { '@type': 'Organization', name: 'CDGet', url: 'https://cdget.com' },
        sameAs: [repoUrl, npmUrl, pubUrl]
      })
    ]);
  }

  return head;
}

/* ---------------------------------------------------------------------------
 * The sidebar the folder tree cannot describe
 *
 * `guide/` has no `index.md`, so its heading would be the folder's name
 * capitalised — over Korean pages as well as English ones. And a reader who has
 * not installed the package yet wants the guide before the reference, which is
 * the opposite of how the two folders sort.
 * ------------------------------------------------------------------------- */

interface SidebarItem {
  text?: string;
  link?: string;
  items?: SidebarItem[];
  collapsed?: boolean;
}

/**
 * `useFolderLinkFromIndexFile` points a folder at `api/index.md`, which
 * VitePress resolves to `/api/index` — a URL that only works because the router
 * is forgiving about it. The canonical one, and the only one a static host
 * serves directly, is `/api/`.
 *
 * `collapsed` goes at the same time: VitePress draws the expand caret for any
 * item where the key is present at all, so permanently open groups need it
 * absent rather than false.
 */
function tidy(items: SidebarItem[]): SidebarItem[] {
  return items.map((item) => {
    const cleaned: SidebarItem = {
      ...item,
      ...(item.link ? { link: item.link.replace(/(^|\/)index\.md$/, '$1') } : {}),
      ...(item.items ? { items: tidy(item.items) } : {})
    };

    delete cleaned.collapsed;

    return cleaned;
  });
}

/** The first link anywhere in a subtree — how a group is recognised below. */
const firstLink = (item: SidebarItem): string | undefined =>
  item.link ?? item.items?.map(firstLink).find(Boolean);

const under = (prefix: string) => (item: SidebarItem) =>
  firstLink(item)?.startsWith(prefix) ?? false;

/** Guide, then API, then whatever is left under a heading of its own. */
function arrange(items: SidebarItem[], lang: string): SidebarItem[] {
  const words = WORDS[lang] ?? WORDS[defaultLocale];
  const guide = items.find(under('guide/'));
  const api = items.find(under('api/'));
  const changelog = items.find(under('changelog'));

  if (guide) {
    guide.text = words.guide;
  }

  // Only once `api/` holds more than its index. Until then it is a single row,
  // and a heading over one entry is noise. The heading itself stops being a
  // link, because a page reachable only by clicking a word that does not look
  // like one is a page nobody opens.
  if (api?.items?.length) {
    const overview = api.link ? { text: words.overview, link: api.link } : undefined;

    delete api.link;
    api.items = [...(overview ? [overview] : []), ...api.items];
  }

  const loose = changelog ? [{ text: words.more, items: [changelog] }] : [];
  const placed = new Set([guide, api, changelog].filter(Boolean));

  return [
    ...([guide, api].filter(Boolean) as SidebarItem[]),
    ...loose,
    ...items.filter((item) => !placed.has(item))
  ];
}

const vitePressConfig: UserConfig = {
  title: 'Diffine',
  lastUpdated: true,
  outDir: '../docs-dist',
  cleanUrls: true,
  metaChunk: true,
  /**
   * The default locale is served from `/`, not from `/{lang}/`.
   *
   * Three things have to agree or every sidebar link 404s: `vitepress-i18n`
   * puts the root locale in `locales.root` with no prefix, `vitepress-sidebar`
   * resolves its links against `/`, and this rewrite is what actually moves the
   * files there. Changing `defaultLocale` swings all three together.
   */
  rewrites: {
    [`${defaultLocale}/:rest*`]: ':rest*'
  },
  head: [
    ['link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/logo-32.png' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/logo-16.png' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '256x256', href: '/256x256.png' }],
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/256x256.png' }],
    // Last, and without a `type`: this is the one a browser reaches for when it
    // has understood none of the above, and `favicon.ico` carries 16, 32 and 48
    // in one file for exactly that case.
    ['link', { rel: 'shortcut icon', href: '/favicon.ico' }],
    // The blue from the mark, as a literal: a `<meta>` cannot read a custom
    // property, and this is the one place on the site that has to repeat one.
    ['meta', { name: 'theme-color', content: '#0e7ffc' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'Diffine' }],
    ['meta', { property: 'og:image', content: socialImage }],
    ['meta', { property: 'og:image:width', content: '256' }],
    ['meta', { property: 'og:image:height', content: '256' }],
    ['meta', { property: 'og:image:alt', content: 'Diffine' }],
    // `summary` and not `summary_large_image`: the image is a square mark, and
    // a wide card would letterbox it into a strip of background.
    ['meta', { name: 'twitter:card', content: 'summary' }],
    ['meta', { name: 'twitter:image', content: socialImage }],
    // Which package's half of every page is displayed, applied to `<html>`
    // before the first paint. See `data/frameworks.ts`.
    ['script', {}, FRAMEWORK_HEAD_SCRIPT]
  ],
  sitemap: {
    hostname: packageJson.homepage
  },
  /**
   * `::: fw react` … `:::` — the block that only one package's readers see.
   *
   * Both halves are in the document and CSS displays one of them, which is what
   * makes the switch instant and what keeps the two from being two pages that
   * drift apart. It also means the search index carries both, so a reader
   * looking up `renderWidget` finds the text diff page whichever package they
   * had selected.
   */
  markdown: {
    // The heading ids the anchors are written against — see `slugOf`.
    anchor: { slugify: slugOf },
    headers: { slugify: slugOf },
    config(md: MarkdownRenderer) {
      md.use(container, 'fw', {
        validate: (params: string) => /^fw(\s+\S+)+$/.test(params.trim()),
        render(tokens: { nesting: number; info: string }[], index: number) {
          const token = tokens[index];

          if (token.nesting !== 1) {
            return '</div>\n';
          }

          // `::: fw flutter`, and `::: fw react flutter` for a block both of
          // them want but nobody else does.
          const wanted = token.info
            .trim()
            .split(/\s+/)
            .slice(1)
            .filter((id) => FRAMEWORK_IDS.includes(id));

          return `<div class="diffine-fw" data-fw="${wanted.join(' ')}">\n`;
        }
      });

      /*
       * `::: cards` … `:::` — a list drawn as a row of cards.
       *
       * A list and not a set of `<div>`s, because what is inside stays
       * Markdown: the bold line is the card's name, the paragraph under it is
       * what the card says, and an `<Fw>` phrase works in either. The whole of
       * the difference is in `custom.css`, so a reader with no stylesheet gets
       * the list it was written as.
       */
      md.use(container, 'cards', {
        render: (tokens: { nesting: number }[], index: number) =>
          tokens[index].nesting === 1 ? '<div class="diffine-cards">\n' : '</div>\n'
      });
    }
  },
  /* -------------------------------------------------------------------------
   * The live demos
   *
   * VitePress compiles Markdown to Vue, so a React component reaches a page
   * only as an island — `theme/components/DiffineDemo.vue` owns a `<div>` and
   * hands it to `createRoot()`.
   *
   * `diffine-react` points at `packages/react/src` rather than at its `dist/`,
   * and that is the point: an edit to the viewer is on the page when it is
   * saved, with nothing to rebuild in between. Nothing on this site reads
   * `dist/`.
   * ---------------------------------------------------------------------- */
  vite: {
    plugins: [ReactPlugin()],
    resolve: {
      alias: [
        {
          find: /^diffine-react\/styles\.css$/,
          replacement: resolve(reactPackageDir, 'src/styles.css')
        },
        // One entry apiece, because the package is published that way: the root
        // is the comparison and each view is its own import. A single alias
        // over the bare name would send `diffine-react/text-diff` to a path
        // under `index.ts` that is not there.
        ...['diff', 'image', 'patch', 'text-diff', 'image-diff', 'types'].map((entry) => ({
          find: new RegExp(`^diffine-react/${entry}$`),
          replacement: resolve(reactPackageDir, `src/${entry}.ts`)
        })),
        { find: /^diffine-react$/, replacement: resolve(reactPackageDir, 'src/index.ts') }
      ],
      /*
       * Where the aliased source resolves what it imports from.
       *
       * Without this, Node's own lookup walks up from `packages/react/src` and
       * lands in `packages/react/node_modules` — a folder this site never
       * installs and CI does not have. Two copies of React is also not a bigger
       * bundle but a null hook dispatcher the moment the second one renders.
       *
       * `highlight.js` is here for the first half of that reason rather than
       * the second. The library reaches every grammar through an `import()`,
       * and a bundler resolves one of those when it builds rather than when it
       * runs — so a copy this folder cannot see is a build that fails, not a
       * viewer that draws its documents uncoloured.
       */
      dedupe: ['react', 'react-dom', 'highlight.js']
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-dom/client']
    },
    // The library is outside `docs/`, so the dev server has to be allowed to
    // read it. Without this the alias resolves and the request is refused.
    server: {
      fs: { allow: [srcDir, reactPackageDir] }
    }
  },
  /**
   * `robots.txt`, written rather than committed.
   *
   * It exists to name the sitemap, and the sitemap's URL is already derived
   * from the package manifest. A copy of that host sitting in `public/` would
   * be one more place to forget when the site moves.
   */
  async buildEnd({ outDir }) {
    await writeFile(
      resolve(outDir, 'robots.txt'),
      `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`
    );
  },
  /**
   * A description that is about this page rather than about the library.
   *
   * Here rather than in `transformHead` because this runs in the dev server as
   * well as in the build, and because VitePress applies its own fallback chain
   * to `pageData.description` afterwards.
   */
  transformPageData(pageData) {
    if (!pageData.description && pageData.filePath) {
      pageData.description = summaryOf(pageData.filePath) ?? '';
    }
  },
  transformHead,
  themeConfig: {
    logo: { src: '/logo-32.png', width: 24, height: 24 },
    /**
     * `h2` and `h3`, nested.
     *
     * A reference page is a handful of `h2`s with the individual options as
     * `h3`s under them, and the thing a reader came for is the option they are
     * looking up. At the default depth it is never in the outline.
     */
    outline: { level: [2, 3] },
    editLink: {
      pattern: `${repoUrl}/edit/main/docs/:path`
    },
    socialLinks: [
      { icon: 'npm', link: npmUrl, ariaLabel: `${packageJson.name} on npm` },
      // pub.dev has no icon in VitePress's set, so the mark is Flutter's own —
      // the same path `FrameworkMark.vue` draws in the sidebar switch, drawn
      // here in the navbar's colour like every other social link.
      {
        icon: {
          svg: '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>pub.dev</title><path d="M14.314 0 2.3 12l3.7 3.7L21.684.013h-7.37Zm.014 11.072L7.857 17.53l6.47 6.47H21.7l-6.42-6.47 6.42-6.458h-7.372Z"/></svg>'
        },
        link: pubUrl,
        ariaLabel: 'diffine on pub.dev'
      },
      { icon: 'github', link: repoUrl }
    ],
    footer: {
      message: 'Released under the MIT License',
      copyright: '© <a href="https://cdget.com">CDGet</a>'
    }
  }
};

const config = withSidebar(withI18n(vitePressConfig, i18nOptions), sidebarOptions);

const sidebar = config.themeConfig?.sidebar as
  Record<string, { items?: SidebarItem[] } | SidebarItem[]> | undefined;

if (sidebar) {
  for (const [path, group] of Object.entries(sidebar)) {
    // `/` is the default locale and `/{lang}/` is every other one — the same
    // mapping `baseOf` makes, read back the other way.
    const lang = path === '/' ? defaultLocale : path.replaceAll('/', '');

    if (Array.isArray(group)) {
      sidebar[path] = arrange(tidy(group), lang);
    } else if (group?.items) {
      group.items = arrange(tidy(group.items), lang);
    }
  }
}

export default defineConfig(config);
