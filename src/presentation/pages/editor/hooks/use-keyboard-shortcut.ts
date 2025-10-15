import { useEffect } from 'react';

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: { metaKey?: boolean; ctrlKey?: boolean } = {}
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifierKey = isMac ? e.metaKey : e.ctrlKey;

      const matchesModifier =
        options.metaKey || options.ctrlKey ? modifierKey : true;
      const matchesKey = e.key.toLowerCase() === key.toLowerCase();

      if (matchesKey && matchesModifier) {
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [key, callback, options.metaKey, options.ctrlKey]);
}
