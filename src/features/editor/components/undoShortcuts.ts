import type { KeyboardEvent } from 'react';

interface UndoRedo {
  undo: () => void;
  redo: () => void;
}

function isTextEntry(target: EventTarget): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
    return true;
  }
  return target instanceof HTMLInputElement && !['button', 'checkbox', 'radio', 'file'].includes(target.type);
}

/**
 * Keydown handler for the editor's root element, so the shortcuts only apply
 * while focus is inside the editor. Ctrl works everywhere and Cmd on macOS.
 * Fields keep their own native undo while someone is typing.
 */
export function handleUndoShortcut(event: KeyboardEvent<HTMLElement>, { undo, redo }: UndoRedo): void {
  if (!(event.ctrlKey || event.metaKey) || event.altKey || isTextEntry(event.target)) return;
  const key = event.key.toLowerCase();
  if (key === 'z') {
    event.preventDefault();
    if (event.shiftKey) redo();
    else undo();
  } else if (key === 'y' && !event.shiftKey) {
    event.preventDefault();
    redo();
  }
}
