import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]';

function firstFocusable(container: Element): HTMLElement | null {
  const candidates = container.querySelectorAll<HTMLElement>(FOCUSABLE);
  return Array.from(candidates).find((element) => element.tabIndex >= 0) ?? null;
}

/**
 * Keeps keyboard focus inside `root` when the focused control is removed, for
 * example when undo takes away the photo whose remove button had focus.
 * Without this, focus falls to <body> and the editor's scoped shortcuts stop
 * working. Focus moves to the first control in the closest surviving
 * container of the removed one, or to `fallback`.
 */
export function useFocusRescue(root: RefObject<HTMLElement | null>, fallback: () => HTMLElement | null): void {
  const lastFocusPath = useRef<Element[]>([]);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const remember = (event: FocusEvent) => {
      const path: Element[] = [];
      for (let node = event.target; node instanceof Element && node !== element; node = node.parentElement) {
        path.push(node);
      }
      lastFocusPath.current = path;
    };
    element.addEventListener('focusin', remember);
    return () => element.removeEventListener('focusin', remember);
  }, [root]);

  useEffect(() => {
    const [focused, ...ancestors] = lastFocusPath.current;
    if (!focused || focused.isConnected) return;
    const active = document.activeElement;
    if (active !== null && active !== document.body) return;
    const container = ancestors.find((ancestor) => ancestor.isConnected);
    (container ? firstFocusable(container) : null)?.focus();
    if (document.activeElement === document.body || document.activeElement === null) fallback()?.focus();
  });
}
