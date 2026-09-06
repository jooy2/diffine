/**
 * Writing into a field without taking the browser's undo stack with it.
 *
 * A `<textarea>` whose value is assigned from JavaScript forgets everything a
 * reader typed before that assignment, and an editor whose Ctrl+Z has stopped
 * working is worse than an editor with no Tab key and no replace button. What
 * is left is one editing command that goes through the browser's own machinery,
 * so the change lands on the undo stack the way a keystroke does.
 */

/**
 * Types `text` over whatever is selected, keeping the undo stack.
 *
 * `execCommand` is on its way out of the platform and there is still nothing
 * that replaces this one use of it. Where it has already gone, `false` sends
 * the caller to its own version — which is why this returns whether it worked
 * rather than assuming that it did.
 */
export function typeInto(field: HTMLTextAreaElement, text: string): boolean {
  try {
    return document.execCommand('insertText', false, text);
  } catch {
    return false;
  }
}

/**
 * Types `text` over one range of a field, and leaves the focus where it was.
 *
 * The command above works on the selection of the focused element, so a replace
 * driven from a button in the search bar has to move the focus into the field
 * to make the edit. Putting it back afterwards is what lets somebody press
 * Replace twice without their cursor leaving the box they are typing into.
 */
export function typeOver(
  field: HTMLTextAreaElement,
  start: number,
  end: number,
  text: string
): boolean {
  const focused = document.activeElement;

  field.focus();
  field.setSelectionRange(start, end);

  const written = typeInto(field, text);

  if (focused instanceof HTMLElement && focused !== field) {
    focused.focus();
  }

  return written;
}
