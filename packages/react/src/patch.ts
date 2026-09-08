/**
 * A comparison written out as a patch, and a patch read back as a comparison.
 *
 * The point of it is that neither side has to hold both documents. A server, a
 * build or a hook already has `git diff` in its hands, and sending that instead
 * of two files is the difference between a few kilobytes and a few megabytes —
 * so `parsePatch` turns what arrives into exactly what {@link diffText} would
 * have returned, and the viewer cannot tell the two apart. `formatPatch` is the
 * way back out: the comparison a page is looking at, in the format every other
 * tool already reads.
 *
 * The format is the unified diff, which is what `diff -u`, `git diff` and every
 * code host write. What it does not carry, this does not invent: a patch has no
 * idea what the lines it left out say, and it says nothing about the line
 * endings of the file it came from.
 */

import type {
  DiffChange,
  DiffOptions,
  DiffPatchFile,
  DiffPatchOptions,
  DiffResult,
  DiffRow,
  DiffStats
} from './types.js';
import { follows } from './internal/diff/gap.js';
import { changeRows, countRows, settleOptions } from './internal/diff/text.js';

export type {
  DiffChange,
  DiffOptions,
  DiffPatchFile,
  DiffPatchOptions,
  DiffResult,
  DiffRow
} from './types.js';

/** What `context` falls back to, which is what `diff` and `git` write. */
const CONTEXT = 3;

/** The `@@ -1,4 +1,5 @@` that opens a hunk, with the count left off where it is one. */
const HUNK = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;

/** A run of rows one hunk covers, as a half-open interval. */
interface Hunk {
  start: number;
  end: number;
}

/**
 * Which rows each hunk covers: every changed row, and `context` unchanged rows
 * either side of it.
 *
 * Two changes close enough for their context to touch become one hunk rather
 * than two, which is what keeps a patch from repeating the same lines twice.
 */
function hunksOf(rows: readonly DiffRow[], context: number): Hunk[] {
  const hunks: Hunk[] = [];
  let index = 0;

  while (index < rows.length) {
    if (rows[index].kind === 'equal') {
      index += 1;
      continue;
    }

    let end = index + 1;

    while (end < rows.length && rows[end].kind !== 'equal') {
      end += 1;
    }

    let start = index;

    for (let taken = 0; taken < context && start > 0 && follows(rows[start - 1], rows[start]);) {
      start -= 1;
      taken += 1;
    }

    for (
      let taken = 0;
      taken < context && end < rows.length && follows(rows[end - 1], rows[end]);
    ) {
      end += 1;
      taken += 1;
    }

    const last = hunks[hunks.length - 1];
    // Touching at the seam is not the same as running on through it: a
    // comparison read back out of a patch has hunks that end where the next one
    // begins in the list and forty lines apart in the document.
    const joins =
      last && start <= last.end && (start === 0 || follows(rows[start - 1], rows[start]));

    if (joins) {
      last.end = Math.max(last.end, end);
    } else {
      hunks.push({ start, end });
    }

    index = end;
  }

  return hunks;
}

/** Where one side of a hunk starts in its own document, and how many lines it holds. */
function sideOf(
  rows: readonly DiffRow[],
  hunk: Hunk,
  side: 'before' | 'after'
): { start: number; count: number } {
  let start = -1;
  let count = 0;

  for (let index = hunk.start; index < hunk.end; index += 1) {
    const line = rows[index][side];

    if (line) {
      count += 1;

      if (start < 0) {
        start = line.index;
      }
    }
  }

  if (start >= 0) {
    return { start, count };
  }

  // A hunk that holds nothing of this side at all — a run of lines that were
  // only inserted, read from the other document's side. The number a patch
  // writes there is how many lines of this one come before it.
  for (let index = hunk.start - 1; index >= 0; index -= 1) {
    const line = rows[index][side];

    if (line) {
      return { start: line.index + 1, count: 0 };
    }
  }

  return { start: 0, count: 0 };
}

/** One side of a hunk header: `4,7`, or `4` where it is a single line. */
function range(start: number, count: number): string {
  if (count === 0) {
    return `${start},0`;
  }

  return count === 1 ? `${start + 1}` : `${start + 1},${count}`;
}

/**
 * A comparison as a unified diff.
 *
 * ```ts
 * const patch = formatPatch(diffText(saved, draft), {
 *   before: 'a/src/index.ts',
 *   after: 'b/src/index.ts'
 * });
 * ```
 *
 * Two documents that turned out to be the same give an empty string rather than
 * a header with nothing under it, so the value itself says whether there was
 * anything to write.
 *
 * The lines are written as they were compared, which is where whitespace that
 * was being ignored comes back: a comparison run with `whitespace: 'all'` still
 * writes out the line a change actually touched. A patch produced from a
 * comparison that gave up — {@link DiffResult.complete} being `false` — is a
 * patch that replaces the range wholesale, because that is what the comparison
 * found.
 */
export function formatPatch(result: DiffResult, options?: DiffPatchOptions): string {
  const context = Math.max(0, Math.trunc(options?.context ?? CONTEXT));
  const hunks = hunksOf(result.rows, context);

  if (hunks.length === 0) {
    return '';
  }

  const out: string[] = [`--- ${options?.before ?? 'before'}`, `+++ ${options?.after ?? 'after'}`];

  for (const hunk of hunks) {
    const before = sideOf(result.rows, hunk, 'before');
    const after = sideOf(result.rows, hunk, 'after');

    out.push(`@@ -${range(before.start, before.count)} +${range(after.start, after.count)} @@`);

    for (let index = hunk.start; index < hunk.end;) {
      const row = result.rows[index];

      if (row.kind === 'equal') {
        out.push(` ${(row.before ?? row.after)?.text ?? ''}`);
        index += 1;
        continue;
      }

      // Everything that went out, and then everything that came in. A patch has
      // no pairs in it, which is the one place the two shapes disagree: the
      // rows hold a changed line opposite the line it replaced, and a reader of
      // a patch expects the removals above the additions.
      let end = index;

      while (end < hunk.end && result.rows[end].kind !== 'equal') {
        end += 1;
      }

      for (let row = index; row < end; row += 1) {
        const line = result.rows[row].before;

        if (line) {
          out.push(`-${line.text}`);
        }
      }

      for (let row = index; row < end; row += 1) {
        const line = result.rows[row].after;

        if (line) {
          out.push(`+${line.text}`);
        }
      }

      index = end;
    }
  }

  return `${out.join('\n')}\n`;
}

/** The path off a `---` or `+++` line, with the timestamp some tools append taken off. */
function pathOf(line: string): string {
  return line.slice(4).split('\t')[0].trim();
}

/** One file's worth of a patch, filled in as its hunks are read. */
interface Building {
  before: string;
  after: string;
  beforeLines: string[];
  afterLines: string[];
  rows: DiffRow[];
  changes: DiffChange[];
  stats: DiffStats;
}

function building(before: string, after: string): Building {
  return {
    before,
    after,
    beforeLines: [],
    afterLines: [],
    rows: [],
    changes: [],
    stats: { unchanged: 0, changed: 0, inserted: 0, deleted: 0 }
  };
}

function finished(file: Building): DiffPatchFile {
  return {
    before: file.before,
    after: file.after,
    result: {
      before: file.beforeLines,
      after: file.afterLines,
      rows: file.rows,
      changes: file.changes,
      stats: file.stats,
      // A patch is what it says it is. There was no search to give up on.
      complete: true
    }
  };
}

/**
 * A unified diff, read back as one comparison per file it covers.
 *
 * ```ts
 * const [file] = parsePatch(await response.text());
 *
 * <TextDiff result={file.result} before={file.before} after={file.after} />;
 * ```
 *
 * What comes back is the same value {@link diffText} returns, worked out the
 * same way down to the words marked inside a pair of changed lines — the second
 * argument is the same set of options, so a page that reads patches and a page
 * that compares documents can be told to mark the same things.
 *
 * It covers less, and that is the format rather than the reader: a patch holds
 * the changed lines and a few either side of each of them, so the line numbers
 * jump where one hunk ends and the next begins. `result.before` holds the lines
 * the patch carried rather than the whole document, while each line's `index`
 * is still its own number in the file it came from.
 *
 * Anything the format puts around the hunks is skipped rather than read: the
 * `diff --git` line, the mode and index lines, a mail header, and the
 * `\ No newline at end of file` marker, which a comparison has nowhere to put.
 */
export function parsePatch(patch: string, options?: DiffOptions): DiffPatchFile[] {
  const settled = settleOptions(options);
  const lines = patch.split(/\r\n|\r|\n/);

  // The newline that ends a patch is the end of its last line rather than the
  // start of an empty one, and an empty line inside a hunk is a line of the
  // file. Leaving it on would put it in whichever hunk ran to the end.
  if (lines[lines.length - 1] === '') {
    lines.pop();
  }

  const files: DiffPatchFile[] = [];

  let file: Building | null = null;
  // Where the hunk being read has got to in each document, and how much of it
  // its header said is left. Both counts at zero is "not inside a hunk".
  let beforeLine = 0;
  let afterLine = 0;
  let beforeLeft = 0;
  let afterLeft = 0;
  let removed: string[] = [];
  let added: string[] = [];
  let removedStart = 0;
  let addedStart = 0;

  /** The run of removed and added lines that has just ended, as a change. */
  function flush(): void {
    if (!file || (removed.length === 0 && added.length === 0)) {
      return;
    }

    const rowStart = file.rows.length;
    const built = changeRows(removed, added, removedStart, addedStart, settled);

    file.rows.push(...built.rows);
    countRows(built.rows, file.stats);
    file.changes.push({
      kind: built.kind,
      beforeStart: removedStart,
      beforeEnd: removedStart + removed.length,
      afterStart: addedStart,
      afterEnd: addedStart + added.length,
      rowStart,
      rowEnd: file.rows.length
    });

    removed = [];
    added = [];
  }

  function close(): void {
    flush();
    beforeLeft = 0;
    afterLeft = 0;
  }

  /** Closes whatever file was being read and starts the next one. */
  function opened(before: string, after: string): Building {
    close();

    if (file) {
      files.push(finished(file));
    }

    return building(before, after);
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (beforeLeft > 0 || afterLeft > 0) {
      const marker = line.charAt(0);
      const text = line.slice(1);

      if (marker === '\\') {
        // `\ No newline at end of file`. It describes the line above rather
        // than being one, and a comparison has nowhere to keep it.
        continue;
      }

      if (marker === '-') {
        if (removed.length === 0 && added.length === 0) {
          removedStart = beforeLine;
          addedStart = afterLine;
        }

        removed.push(text);
        file?.beforeLines.push(text);
        beforeLine += 1;
        beforeLeft -= 1;
        continue;
      }

      if (marker === '+') {
        if (removed.length === 0 && added.length === 0) {
          removedStart = beforeLine;
          addedStart = afterLine;
        }

        added.push(text);
        file?.afterLines.push(text);
        afterLine += 1;
        afterLeft -= 1;
        continue;
      }

      // A context line, which is also what an empty line is: a tool that
      // trimmed the trailing whitespace off the patch left the leading space
      // off a line that had nothing after it.
      if (marker === ' ' || line === '') {
        flush();

        if (file) {
          file.rows.push({
            kind: 'equal',
            before: { index: beforeLine, text, segments: [] },
            after: { index: afterLine, text, segments: [] }
          });
          file.stats.unchanged += 1;
          file.beforeLines.push(text);
          file.afterLines.push(text);
        }

        beforeLine += 1;
        afterLine += 1;
        beforeLeft -= 1;
        afterLeft -= 1;
        continue;
      }

      // Anything else ends the hunk early, whatever its header claimed. The
      // line is read again as one of the lines that sit around a hunk.
      close();
      index -= 1;
      continue;
    }

    if (line.startsWith('--- ') && lines[index + 1]?.startsWith('+++ ')) {
      file = opened(pathOf(line), pathOf(lines[index + 1]));
      index += 1;
      continue;
    }

    const header = HUNK.exec(line);

    if (!header) {
      continue;
    }

    // A patch that is nothing but hunks is a patch about a file nobody named.
    if (!file) {
      file = opened('', '');
    }

    close();

    const beforeCount = header[2] === undefined ? 1 : Number(header[2]);
    const afterCount = header[4] === undefined ? 1 : Number(header[4]);

    // A side with no lines in it writes the number of lines that come before
    // it, and a side with lines writes the first of them, counted from one.
    beforeLine = beforeCount === 0 ? Number(header[1]) : Number(header[1]) - 1;
    afterLine = afterCount === 0 ? Number(header[3]) : Number(header[3]) - 1;
    beforeLeft = beforeCount;
    afterLeft = afterCount;
  }

  close();

  if (file) {
    files.push(finished(file));
  }

  return files;
}
