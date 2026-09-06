'use client';

import * as React from 'react';
import type { DiffineStrings } from '../../types.js';
import { DIFFINE_LANGUAGES, languageName } from '../../internal/highlight/catalogue.js';
import { useIsomorphicLayoutEffect } from '../../internal/layout.js';

/**
 * What the documents are being coloured as, at the right end of the bar above
 * them.
 *
 * Two components draw this and they draw it differently, which is the whole of
 * why there are two exports here rather than one with a boolean. A viewer is
 * given its language by the application and says which one it is; an editor is
 * given a document somebody pasted and has no idea what it is, so it asks.
 *
 * Both are right-aligned against the same edge, and the control is as wide as
 * the longest name it can hold. A menu that resized itself as a reader moved
 * through it would drag the whole bar sideways with it.
 */

export interface DiffineLanguageNameProps {
  language: string | undefined;
  strings: DiffineStrings;
}

/** The name of the language, for a view an application already decided about. */
export function DiffineLanguageName({
  language,
  strings
}: DiffineLanguageNameProps): React.JSX.Element {
  return (
    <span className="diffine-syntax" title={strings.language}>
      {languageName(language)}
    </span>
  );
}

export interface DiffineLanguagePickerProps {
  language: string;
  onLanguageChange: (language: string) => void;
  strings: DiffineStrings;
}

/** How far the menu is held off the control, and off the edge of the window. */
const GAP = 4;

/** The tallest the menu is allowed to be before it scrolls inside itself. */
const TALLEST = 288;

/** How long a run of typed letters is still one word. */
const TYPING = 600;

/**
 * Scrolls the menu, and only the menu, until the active option is in it.
 *
 * `scrollIntoView` would be the obvious way and is the wrong one: it scrolls
 * whatever it has to, including the page, and a page that scrolls is a page the
 * menu has to close on — so a menu near the bottom of the window shut itself
 * the moment it opened.
 */
function reveal(menu: HTMLElement): void {
  const option = menu.querySelector<HTMLElement>('[data-active]');

  if (!option) {
    return;
  }

  const top = option.offsetTop;
  const bottom = top + option.offsetHeight;

  if (top < menu.scrollTop) {
    menu.scrollTop = top;
  } else if (bottom > menu.scrollTop + menu.clientHeight) {
    menu.scrollTop = bottom - menu.clientHeight;
  }
}

/**
 * The same name, as a menu, for a view whose documents arrive by being typed in.
 *
 * Built rather than a `<select>`, which is the one control on this component a
 * browser draws in its own style rather than in the application's — an
 * operating system's list, in an operating system's typeface, dropped into a
 * component whose whole surface is otherwise the page's.
 *
 * What a `<select>` gives away with it is everything a reader expects from one,
 * so all of it is written back: the arrow keys and Home and End move through the
 * list, Enter and Space take the one under the cursor, Escape leaves without
 * taking it, and typing a letter jumps to the language that starts with it —
 * which is how anybody actually finds one of thirty-five. Focus never leaves
 * the control, and the option a reader is on is named by `aria-activedescendant`
 * rather than by moving it, which is the shape a screen reader already knows.
 *
 * The menu is `position: fixed` and placed from the control's own box. The
 * component clips what overflows it, so a menu laid out inside the bar would be
 * cut off at the bar; taken out of the flow, it is bounded by the window
 * instead, and it opens upwards when there is more room above than below.
 */
export function DiffineLanguagePicker({
  language,
  onLanguageChange,
  strings
}: DiffineLanguagePickerProps): React.JSX.Element {
  const name = React.useId().replace(/[^\w-]/g, '');
  const trigger = React.useRef<HTMLButtonElement>(null);
  const list = React.useRef<HTMLDivElement>(null);
  const typed = React.useRef({ letters: '', at: 0 });

  const [open, setOpen] = React.useState(false);
  /** Which option the keyboard is on, which is not yet which one is chosen. */
  const [active, setActive] = React.useState(0);

  const chosen = Math.max(
    0,
    DIFFINE_LANGUAGES.findIndex((option) => option.id === language)
  );

  function show(): void {
    setActive(chosen);
    setOpen(true);
  }

  function choose(index: number): void {
    const option = DIFFINE_LANGUAGES[index];

    setOpen(false);

    if (option && option.id !== language) {
      onLanguageChange(option.id);
    }
  }

  /** Moves `by` options, stopping at either end rather than wrapping. */
  function move(by: number): void {
    setActive((held) => Math.min(DIFFINE_LANGUAGES.length - 1, Math.max(0, held + by)));
  }

  /** Jumps to the language a run of typed letters names. */
  function jump(letter: string): void {
    const now = Date.now();
    const letters = now - typed.current.at > TYPING ? letter : `${typed.current.letters}${letter}`;

    typed.current = { letters, at: now };

    const found = DIFFINE_LANGUAGES.findIndex((option) =>
      option.name.toLowerCase().startsWith(letters.toLowerCase())
    );

    if (found >= 0) {
      setActive(found);
      setOpen(true);
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>): void {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();

        if (open) {
          move(event.key === 'ArrowDown' ? 1 : -1);
        } else {
          show();
        }

        return;
      }
      case 'Home':
      case 'End': {
        if (open) {
          event.preventDefault();
          setActive(event.key === 'Home' ? 0 : DIFFINE_LANGUAGES.length - 1);
        }

        return;
      }
      case 'Enter':
      case ' ': {
        // Both of these would otherwise reach the button as a click, and open
        // the menu again on the way back out of it.
        event.preventDefault();

        if (open) {
          choose(active);
        } else {
          show();
        }

        return;
      }
      case 'Escape': {
        if (open) {
          event.preventDefault();
          setOpen(false);
        }

        return;
      }
      case 'Tab': {
        setOpen(false);

        return;
      }
      default: {
        // A letter, rather than a key with a name. Tab is above; every other
        // modifier combination belongs to the browser.
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          jump(event.key);
        }
      }
    }
  }

  /*
   * Where the menu goes, written onto the element rather than held as state.
   *
   * It is read from the control's own box, so it cannot be known until both are
   * on the page — and putting it through a render would draw the menu once in
   * the wrong place first. A layout effect lands before the browser has painted
   * either.
   */
  useIsomorphicLayoutEffect(() => {
    const button = trigger.current;
    const menu = list.current;

    if (!open || !button || !menu) {
      return;
    }

    const box = button.getBoundingClientRect();
    const below = window.innerHeight - box.bottom - GAP * 2;
    const above = box.top - GAP * 2;
    const downwards = below >= Math.min(TALLEST, above) || below >= above;

    menu.style.right = `${Math.max(GAP, window.innerWidth - box.right)}px`;
    menu.style.minWidth = `${box.width}px`;
    menu.style.maxHeight = `${Math.max(0, Math.min(TALLEST, downwards ? below : above))}px`;

    if (downwards) {
      menu.style.top = `${box.bottom + GAP}px`;
      menu.style.bottom = '';
    } else {
      menu.style.bottom = `${window.innerHeight - box.top + GAP}px`;
      menu.style.top = '';
    }

    reveal(menu);
  }, [open]);

  /** The option under the keyboard, kept in view as it moves. */
  useIsomorphicLayoutEffect(() => {
    if (open && list.current) {
      reveal(list.current);
    }
  }, [open, active]);

  /*
   * What closes the menu from outside it: a press anywhere else, and anything
   * that moves the control out from under it. The position is read once, so a
   * page that scrolls afterwards would leave the menu behind rather than with
   * it.
   */
  React.useEffect(() => {
    if (!open) {
      return;
    }

    const outside = (target: Node | null) =>
      !!target && !trigger.current?.contains(target) && !list.current?.contains(target);

    const away = (event: PointerEvent) => {
      if (outside(event.target as Node)) {
        setOpen(false);
      }
    };

    /*
     * Anything that moves the control out from under the menu closes it, since
     * where the menu goes is read once rather than followed.
     *
     * Scrolling the menu itself is not that. It scrolls whenever the option
     * under the keyboard is brought into view, which is the menu doing its job
     * — and a listener that could not tell the two apart closed the menu the
     * moment it opened on any language far enough down the list.
     */
    const leave = (event: Event) => {
      if (event.type !== 'scroll' || outside(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', away, true);
    window.addEventListener('scroll', leave, true);
    window.addEventListener('resize', leave);

    return () => {
      document.removeEventListener('pointerdown', away, true);
      window.removeEventListener('scroll', leave, true);
      window.removeEventListener('resize', leave);
    };
  }, [open]);

  return (
    <div className="diffine-syntax-field">
      <button
        type="button"
        className="diffine-syntax diffine-syntax-trigger"
        ref={trigger}
        role="combobox"
        // Only while there is one. The list is drawn when it opens, so a
        // reference to it the rest of the time points at nothing.
        aria-controls={open ? `${name}-list` : undefined}
        aria-expanded={open}
        aria-activedescendant={open ? `${name}-${active}` : undefined}
        aria-label={strings.language}
        title={strings.language}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
        onBlur={() => setOpen(false)}
      >
        <span className="diffine-syntax-current">{languageName(language)}</span>
        <svg
          className="diffine-syntax-caret"
          viewBox="0 0 16 16"
          width="11"
          height="11"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M3.5 6 8 10.5 12.5 6" />
        </svg>
      </button>
      {open ? (
        <div className="diffine-syntax-list" id={`${name}-list`} role="listbox" ref={list}>
          {DIFFINE_LANGUAGES.map((option, index) => (
            <div
              key={option.id}
              className="diffine-syntax-option"
              id={`${name}-${index}`}
              role="option"
              aria-selected={index === chosen}
              data-active={index === active ? 'true' : undefined}
              data-current={index === chosen ? 'true' : undefined}
              // The press is what chooses, and the focus stays on the control
              // it came from — so the menu is never closed by losing it before
              // the click that opened the option has landed.
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => choose(index)}
              onPointerEnter={() => setActive(index)}
            >
              {option.name}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
