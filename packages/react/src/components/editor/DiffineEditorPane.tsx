'use client';

import * as React from 'react';
import type { DiffineHighlight, DiffineSide, DiffineStrings } from '../../types.js';
import { useIsomorphicLayoutEffect } from '../../internal/layout.js';
import type { PaneLayout } from '../../internal/rows.js';
import type { VirtualWindow } from '../../internal/virtual.js';
import { DiffineRows } from '../shared/DiffineRows.js';

/**
 * Types `text` over whatever is selected, keeping the browser's own undo stack.
 *
 * `execCommand` is on its way out of the platform and there is still nothing
 * that replaces this one use of it: writing to `value` empties the undo stack,
 * and an editor whose Ctrl+Z has stopped working is worse than one without a
 * Tab key. Where it has already gone, `false` sends the caller to its own
 * version — which is why this returns whether it worked rather than assuming.
 */
function typeInto(field: HTMLTextAreaElement, text: string): boolean {
  try {
    return document.execCommand('insertText', false, text);
  } catch {
    return false;
  }
}

export interface DiffineEditorPaneProps {
  side: DiffineSide;
  /** What this side is called, which is the field's name to a screen reader. */
  name: string;
  value: string;
  onValueChange: (value: string) => void;
  readOnly: boolean;
  spellCheck: boolean;
  /** Whether Tab types a tab instead of moving to the next control. */
  indentWithTab: boolean;
  wrap: boolean;
  layout: PaneLayout;
  /** The slice of `layout.lines` that is drawn. */
  window: VirtualWindow;
  /** The height of one line, or `0` when every line is being drawn. */
  rowHeight: number;
  /** Which change a reader has moved to, or -1. */
  current: number;
  lineNumbers: boolean;
  markers: boolean;
  strings: DiffineStrings;
  highlight?: DiffineHighlight;
  paneRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * One editable document, drawn twice: once as text somebody can type into, and
 * once as the comparison underneath it.
 *
 * The two are the same element as far as a reader is concerned, and keeping
 * them that way is the whole of what this component does. The field's own text
 * is invisible and its caret is not, so what a reader sees is the lines behind
 * it — where a changed row can be tinted, a moved word marked, and a line
 * coloured by whatever highlighter the application handed over. None of that is
 * possible inside a `<textarea>`, and everything else about one is: the undo
 * stack, the input method, the selection, the accessibility.
 *
 * Which leaves one thing to get right, and it is not negotiable. The field is
 * laid over the lines exactly, so every measurement either of them makes has to
 * come out the same — the same typeface at the same size, one line as tall as
 * the next, the text starting the same distance in past the gutter. The
 * stylesheet is where that agreement is written down; the rest of it is
 * `fieldLayout`, which draws the line after the last newline that a comparison
 * has no reason to know about.
 *
 * The lines are hidden from a screen reader. They are a second copy of a
 * document it is already being handed, and the field is the copy that can be
 * read a line at a time and edited.
 */
export function DiffineEditorPane({
  side,
  name,
  value,
  onValueChange,
  readOnly,
  spellCheck,
  indentWithTab,
  wrap,
  layout,
  window: shown,
  rowHeight,
  current,
  lineNumbers,
  markers,
  strings,
  highlight,
  paneRef
}: DiffineEditorPaneProps): React.JSX.Element {
  const field = React.useRef<HTMLTextAreaElement>(null);

  /**
   * Whether Escape has been pressed, which is how a keyboard leaves the field.
   *
   * A Tab that types a tab is a control nothing can be tabbed out of, and a
   * page with one of those on it is a page a keyboard gets stuck in. Two ways
   * out, both of them the ones a reader would try: Shift+Tab is never taken,
   * and Escape hands the next Tab back to the browser.
   */
  const escaped = React.useRef(false);

  /** Where the caret goes once React has written the new text back. */
  const caret = React.useRef<number | null>(null);

  useIsomorphicLayoutEffect(() => {
    const position = caret.current;

    if (position !== null && field.current) {
      field.current.setSelectionRange(position, position);
      caret.current = null;
    }
  });

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === 'Escape') {
      escaped.current = true;

      return;
    }

    if (event.key !== 'Tab') {
      escaped.current = false;

      return;
    }

    if (!indentWithTab || readOnly || event.shiftKey || escaped.current) {
      return;
    }

    event.preventDefault();

    const element = event.currentTarget;

    if (typeInto(element, '\t')) {
      return;
    }

    const { selectionStart, selectionEnd } = element;

    onValueChange(`${value.slice(0, selectionStart)}\t${value.slice(selectionEnd)}`);
    caret.current = selectionStart + 1;
  }

  return (
    <div
      className="diffine-pane"
      data-side={side}
      data-readonly={readOnly ? 'true' : undefined}
      ref={paneRef}
    >
      <div className="diffine-lines">
        {/*
          The comparison, under the field rather than in front of it. A screen
          reader hears this document once, from the field, which is also the
          copy it can move through and change.
        */}
        <div className="diffine-editor-backdrop" aria-hidden="true">
          <DiffineRows
            layout={layout}
            window={shown}
            rowHeight={rowHeight}
            current={current}
            lineNumbers={lineNumbers}
            markers={markers}
            strings={strings}
            highlight={highlight}
          />
        </div>
        <textarea
          className="diffine-editor-input"
          ref={field}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => {
            escaped.current = false;
          }}
          readOnly={readOnly}
          spellCheck={spellCheck}
          placeholder={readOnly ? undefined : strings.placeholder}
          aria-label={name}
          // `off` is what stops the field wrapping where the lines behind it do
          // not. The two have to break in the same places or the text and the
          // tint under it drift apart a line at a time.
          wrap={wrap ? 'soft' : 'off'}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>
    </div>
  );
}
