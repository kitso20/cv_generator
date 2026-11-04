import { useEffect, useRef, RefObject } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], area[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, object, embed, [contenteditable], [tabindex]:not([tabindex="-1"])';

/**
 * Shared modal behaviour:
 *  - Escape closes
 *  - body scroll is locked while open
 *  - focus is moved into the panel on open and restored to the previously
 *    focused element on close
 *  - Tab / Shift+Tab cycle focus within the panel (focus trap)
 *
 * Pass the panel element via `panelRef` to enable the focus trap.
 */
export function useModalDismiss<T extends HTMLElement = HTMLDivElement>(
  isOpen: boolean,
  onClose: () => void,
  panelRef?: RefObject<T | null>
) {
  const onCloseRef = useRef(onClose);

  // Keep the ref current without assigning during render (breaks under StrictMode).
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef?.current ?? null;

    // Move focus into the dialog: first focusable control, else the panel itself.
    if (panel) {
      const focusable = panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable) {
        focusable.focus({ preventScroll: true });
      } else {
        panel.setAttribute('tabindex', '-1');
        panel.focus({ preventScroll: true });
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key === 'Tab' && panel) {
        const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
          (el) => el.offsetParent !== null || el === document.activeElement
        );
        if (focusable.length === 0) {
          event.preventDefault();
          panel.focus({ preventScroll: true });
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;
        if (event.shiftKey) {
          if (active === first || !panel.contains(active)) {
            event.preventDefault();
            last.focus({ preventScroll: true });
          }
        } else {
          if (active === last || !panel.contains(active)) {
            event.preventDefault();
            first.focus({ preventScroll: true });
          }
        }
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Capture phase so we win over app-level Escape handlers (menus, dropdowns).
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown, true);
      previouslyFocused?.focus({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
}
