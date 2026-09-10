/**
 * Puts every package's `CHANGELOG.md` on the docs site, as one page.
 *
 * A package keeps its changelog beside its manifest, where a registry and
 * anyone browsing that package expect to find it. A second copy under `docs/`
 * would be two files that say the same thing until the day one of them does
 * not, so the docs' copy is generated instead — written before VitePress starts
 * and ignored by git.
 *
 * The two packages version independently, so their entries cannot be merged
 * into one list. They do not have to be two pages either: the site already
 * asks a reader which package they are here for, and each changelog goes into a
 * `::: fw` block of its own, so the page shows the history of the package the
 * rest of the site is being read for.
 *
 * What is added is the frontmatter and the heading. The sidebar reads `title`
 * for the label and `order` for where it sits, and neither can live in the
 * source file without npm and GitHub rendering it as a stray table at the top.
 * The heading and the line under it are the same in both files, so they are
 * written once, above the switch, rather than twice inside it.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const docsDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(docsDir, '..');

/** One entry per locale the site serves. Keep in step with `locales`. */
const titles = {
  en: 'Changelog',
  ko: '변경 기록'
};

/** Which package's changelog goes under which framework. Keep in step with `FRAMEWORKS`. */
const packages = [
  { framework: 'react', source: 'packages/react/CHANGELOG.md' },
  { framework: 'flutter', source: 'packages/flutter/CHANGELOG.md' }
];

/** The heading and the line under it, and everything from the first release on. */
function split(changelog) {
  const start = changelog.search(/^## /m);

  if (start < 0) {
    throw new Error('a changelog with no releases in it');
  }

  return { head: changelog.slice(0, start).trim(), body: changelog.slice(start).trim() };
}

const parts = packages.map(({ framework, source }) => ({
  framework,
  ...split(readFileSync(resolve(repoRoot, source), 'utf8'))
}));

const heads = new Set(parts.map((part) => part.head));

if (heads.size !== 1) {
  throw new Error('the changelogs no longer open the same way; the shared heading has to go');
}

const page = [
  [...heads][0],
  ...parts.map((part) => `::: fw ${part.framework}\n\n${part.body}\n\n:::`)
].join('\n\n');

for (const [locale, title] of Object.entries(titles)) {
  const target = resolve(docsDir, locale, 'changelog.md');

  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(
    target,
    `---\ntitle: ${title}\norder: 1\neditLink: false\n---\n\n${page}\n`,
    'utf8'
  );
}
