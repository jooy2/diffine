/**
 * What each entry costs a page that imports it, checked against a budget.
 *
 * Tree shaking is a property of the build rather than of the source, and it is
 * lost quietly: one plain import where an `import()` used to be, one module
 * pulled into a graph it had been kept out of, and a page that colours nothing
 * is carrying a syntax highlighter again. Nothing about the code looks wrong
 * afterwards, which is why this is measured rather than reviewed.
 *
 * What is measured is what a page downloads before it draws anything — the
 * entry plus everything reachable from it through a plain import, gzipped,
 * because that is the number that leaves the server. A chunk behind an
 * `import()` is not in it, since a page that never asks for one never fetches
 * it, and a grammar that stopped being behind one would show up here as several
 * kilobytes that were not there yesterday.
 *
 * Run it against `dist/`, which means after a build. `npm run size`.
 */
import { build } from 'esbuild';
import { gzipSync } from 'node:zlib';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * What each way of using the package is allowed to cost, gzipped, in bytes.
 *
 * The numbers are what it costs today with a little room over each, so that
 * ordinary work does not fail a build and a module landing in a graph it was
 * kept out of does.
 */
const BUDGETS = [
  { entry: 'diffine-react', take: '{ diffText }', gzip: 3000 },
  { entry: 'diffine-react/diff', take: '*', gzip: 3100 },
  { entry: 'diffine-react/image', take: '*', gzip: 2800 },
  { entry: 'diffine-react/patch', take: '*', gzip: 3600 },
  { entry: 'diffine-react/text-diff', take: '{ TextDiff }', gzip: 18500 },
  { entry: 'diffine-react/image-diff', take: '{ ImageDiff }', gzip: 11300 }
];

/** The package's own entries, resolved to what a build of it produced. */
const ENTRIES = {
  'diffine-react': 'index',
  'diffine-react/diff': 'diff',
  'diffine-react/image': 'image',
  'diffine-react/patch': 'patch',
  'diffine-react/text-diff': 'text-diff',
  'diffine-react/image-diff': 'image-diff'
};

/** What the file each measurement is bundled from is called. */
const ENTRY_NAME = 'entry.js';

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} kB`;

/**
 * Everything one output reaches through a plain import, the output itself
 * included. What is behind an `import()` is left out, which is the whole point,
 * and so is React — it is the page's already and not something this ships.
 */
function eagerly(outputs, from) {
  const seen = new Set([from]);
  const queue = [from];

  while (queue.length > 0) {
    for (const edge of outputs[queue.pop()].imports) {
      if (edge.kind === 'import-statement' && !edge.external && !seen.has(edge.path)) {
        seen.add(edge.path);
        queue.push(edge.path);
      }
    }
  }

  return [...seen];
}

const work = mkdtempSync(join(tmpdir(), 'diffine-size-'));
const failures = [];
const rows = [];

try {
  for (const budget of BUDGETS) {
    const source = join(work, ENTRY_NAME);
    const taken = budget.take === '*' ? '* as everything' : budget.take;

    writeFileSync(source, `export ${taken} from '${budget.entry}';\n`);

    const built = await build({
      entryPoints: [source],
      outdir: join(work, 'out'),
      bundle: true,
      minify: true,
      splitting: true,
      format: 'esm',
      target: 'es2022',
      metafile: true,
      logLevel: 'silent',
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      alias: Object.fromEntries(
        Object.entries(ENTRIES).map(([name, file]) => [
          name,
          resolve(packageDir, `dist/${file}.js`)
        ])
      )
    });

    const outputs = built.metafile.outputs;
    // Every chunk behind an `import()` carries an `entryPoint` of its own, so
    // the one that matters is named rather than found: the chunk built from the
    // file written above.
    const entryFile = Object.keys(outputs).find((file) =>
      outputs[file].entryPoint?.endsWith(ENTRY_NAME)
    );
    const files = eagerly(outputs, entryFile);
    const gzip = files.reduce(
      (total, file) => total + gzipSync(readFileSync(resolve(process.cwd(), file))).length,
      0
    );

    rows.push({
      import: `${budget.take} from '${budget.entry}'`,
      'before it draws': kb(gzip),
      budget: kb(budget.gzip),
      'on demand': Object.keys(outputs).length - files.length
    });

    if (gzip > budget.gzip) {
      failures.push(`${budget.entry} is ${kb(gzip)} before it draws, over its ${kb(budget.gzip)}`);
    }
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

console.table(rows);

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`  ${failure}`);
  }

  process.exitCode = 1;
}
