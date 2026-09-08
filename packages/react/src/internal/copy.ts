/**
 * What a reader gets when they copy out of a pane.
 *
 * A pane is not the document it is showing. It has numbers down the side, a
 * mark for what happened to each line, a word for a screen reader in front of
 * changed ones, bands standing in for the lines that are folded away, and — in
 * a view holding two documents level — a blank opposite every line the other
 * side does not have. None of that is in the file.
 *
 * The columns are already left out of a selection by the stylesheet, which is
 * what `user-select` is for. The blanks are not: they are real empty lines in
 * the page, and a document copied out through them arrives with a gap wherever
 * the other side was longer. So the text is built from the lines the pane is
 * drawing rather than read back off the page.
 */

import type { PaneLayout } from './rows.js';

/**
 * The lines between two points of a pane, as the document reads them.
 *
 * `from` and `to` are inside the first and last lines. Everything between them
 * is whole, and anything that is not a line of the document — a blank, a band —
 * contributes nothing rather than an empty line.
 */
export function joinLines(
  layout: PaneLayout,
  first: number,
  last: number,
  from: number,
  to: number
): string | null {
  const parts: string[] = [];

  for (let row = first; row <= last; row += 1) {
    const line = layout.lines[row]?.line;

    if (!line) {
      continue;
    }

    const start = row === first ? from : 0;
    const end = row === last ? to : line.text.length;

    parts.push(line.text.slice(start, end));
  }

  return parts.length === 0 ? null : parts.join('\n');
}

/** Which line of the pane a point of the page is in, or `null` for none of them. */
function lineOf(pane: HTMLElement, node: Node): number | null {
  const element = node instanceof Element ? node : node.parentElement;
  const line = element?.closest<HTMLElement>('[data-row]');

  if (!line || !pane.contains(line) || line.dataset.row === undefined) {
    return null;
  }

  return Number(line.dataset.row);
}

/**
 * How far into a line one point of the page is, counted in the line's own
 * characters.
 *
 * Measured by cloning the text in front of the point rather than by walking the
 * nodes, because a line is cut into as many pieces as the comparison, the
 * highlighting and the search between them asked for. The word a screen reader
 * hears is taken back out of the clone: it is in front of every changed line
 * and it is in none of them.
 */
function offsetIn(pane: HTMLElement, row: number, node: Node, offset: number): number {
  const text = pane.querySelector<HTMLElement>(`[data-row="${row}"] .diffine-text`);

  if (!text) {
    return 0;
  }

  const range = document.createRange();

  try {
    range.setStart(text, 0);
    range.setEnd(node, offset);
  } catch {
    return 0;
  }

  const fragment = range.cloneContents();

  for (const said of fragment.querySelectorAll('.diffine-said')) {
    said.remove();
  }

  return fragment.textContent?.length ?? 0;
}

/**
 * What is selected inside one pane, as the document rather than as the page.
 *
 * `null` where there is nothing to improve on — an empty selection, or one that
 * reaches outside the lines — and the browser is left to do what it would have
 * done.
 */
export function selectedText(pane: HTMLElement, layout: PaneLayout): string | null {
  const selection = pane.ownerDocument.defaultView?.getSelection();

  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const first = lineOf(pane, range.startContainer);
  const last = lineOf(pane, range.endContainer);

  if (first === null || last === null || last < first) {
    return null;
  }

  return joinLines(
    layout,
    first,
    last,
    offsetIn(pane, first, range.startContainer, range.startOffset),
    offsetIn(pane, last, range.endContainer, range.endOffset)
  );
}
