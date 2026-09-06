/**
 * Reads the built site and fails on a link that goes nowhere.
 *
 * Run after `vitepress build`, over `docs-dist/` rather than over the Markdown,
 * because the thing a reader clicks is the built href and the thing it has to
 * match is the id VitePress generated. Those two are not the same string as
 * often as they look: a Korean heading is decomposed to NFKD while its slug is
 * built, and every anchor written against it silently resolved to nothing until
 * `slugOf` in `.vitepress/config.ts` composed the slug again. Nothing in the
 * build failed, and nothing would have.
 *
 * What is checked is everything the site serves itself: a link to another page,
 * an anchor within one, and a local image, stylesheet or script. An address on
 * another host is left alone, because reaching it would make this a test of the
 * network.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, posix, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const docsDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
/** `outDir` in `.vitepress/config.ts`, which is beside `docs/` rather than in it. */
const siteDir = resolve(docsDir, '../docs-dist');

/** Every page of the built site, as paths under `docs-dist/`. */
function pagesIn(dir) {
  const found = [];

  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);

    if (statSync(path).isDirectory()) {
      found.push(...pagesIn(path));
    } else if (path.endsWith('.html')) {
      found.push(path);
    }
  }

  return found;
}

/**
 * The ids a page offers, and the addresses it asks for.
 *
 * `<script>` goes first: a page carries its own route data as JSON, and a
 * string in there that happens to read like an attribute is not a link anybody
 * can follow.
 */
function readPage(file) {
  const html = readFileSync(file, 'utf8').replace(/<script\b[\s\S]*?<\/script>/gi, '');

  return {
    ids: new Set([...html.matchAll(/\sid="([^"]*)"/g)].map(([, id]) => id)),
    links: [...html.matchAll(/\s(?:href|src)="([^"]*)"/g)].map(([, address]) => address)
  };
}

/** Which file a page's address resolves to, or `undefined` for one we do not serve. */
function fileFor(address, fromPage) {
  if (/^(?:[a-z]+:|\/\/)/i.test(address)) {
    return undefined;
  }

  const path = address.split(/[?#]/)[0];

  if (!path) {
    return undefined;
  }

  // `cleanUrls` is on, so `/api/` is `api/index.html` and `/guide/diff` is
  // `guide/diff.html`. Anything with a suffix of its own is a file as written.
  const target = path.startsWith('/') ? join(siteDir, path) : resolve(dirname(fromPage), path);

  if (path.endsWith('/')) {
    return join(target, 'index.html');
  }

  return /\.[a-z0-9]+$/i.test(path) ? target : `${target}.html`;
}

const pages = pagesIn(siteDir);
const idsOf = new Map();
const broken = [];

for (const page of pages) {
  idsOf.set(page, readPage(page).ids);
}

for (const page of pages) {
  const { ids, links } = readPage(page);
  const seen = new Set();

  for (const address of links) {
    if (seen.has(address)) {
      continue;
    }

    seen.add(address);

    const hash = address.includes('#') ? decodeURIComponent(address.split('#')[1]) : '';
    const samePage = address.startsWith('#');
    const file = samePage ? page : fileFor(address, page);

    if (!file) {
      continue;
    }

    if (!samePage && !existsSync(file)) {
      broken.push({ page, address, why: 'no such page or file' });
      continue;
    }

    if (!hash) {
      continue;
    }

    const targets = samePage ? ids : (idsOf.get(file) ?? readPage(file).ids);

    if (!targets.has(hash)) {
      broken.push({ page, address, why: 'no element with that id' });
    }
  }
}

const where = (page) => posix.join(...relative(siteDir, page).split(/[\\/]/));

if (broken.length) {
  console.error(`${broken.length} broken link${broken.length === 1 ? '' : 's'}:\n`);

  for (const { page, address, why } of broken) {
    console.error(`  ${where(page)} → ${address}\n    ${why}`);
  }

  // The code rather than `process.exit`, so the report is flushed before the
  // process ends. There is nothing left to run after this either way.
  process.exitCode = 1;
} else {
  console.log(`${pages.length} pages checked, every link resolves.`);
}
