/**
 * Where a comparison is missing lines it never had.
 *
 * A comparison worked out from two documents holds every line of both, so one
 * row always carries on from the row above it. A comparison read out of a patch
 * does not: a patch is the changed lines and a few either side of each of them,
 * so between one hunk and the next there is a run of lines nobody sent. The
 * rows are still next to each other in the list, and the lines they hold are
 * forty apart in the file.
 *
 * Two places need to know that. A patch has to start a new hunk there rather
 * than writing lines it does not have, and the viewer has to say so rather than
 * drawing line 7 above line 40 as though nothing were between them.
 */

import type { DiffLine, DiffRow } from '../../types.js';

/** How many lines of one side sit between two lines and are in neither row. */
function between(previous: DiffLine | null, next: DiffLine | null): number {
  if (!previous || !next) {
    return 0;
  }

  return Math.max(0, next.index - previous.index - 1);
}

/**
 * How many lines are missing between two rows that sit next to each other.
 *
 * The larger of the two sides, because a run left out of a patch is the same
 * run of unchanged lines on both of them, and one side of a row can be empty.
 */
export function gapBetween(previous: DiffRow, next: DiffRow): number {
  return Math.max(between(previous.before, next.before), between(previous.after, next.after));
}

/** Whether a row carries straight on from the one before it, with nothing missing. */
export function follows(previous: DiffRow, next: DiffRow): boolean {
  return gapBetween(previous, next) === 0;
}
