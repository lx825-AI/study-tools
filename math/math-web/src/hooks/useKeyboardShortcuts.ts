import { useEffect } from 'react';

interface ShortcutActions {
  focusSearch: () => void;
  showFavorites: () => void;
  toggleGridView: () => void;
  cycleTheme: () => void;
  randomFormula: () => void;
}

export default function useKeyboardShortcuts(actions: ShortcutActions) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key === 'k') {
        e.preventDefault();
        actions.focusSearch();
        return;
      }

      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'f':
            e.preventDefault();
            actions.showFavorites();
            break;
          case 'g':
            e.preventDefault();
            actions.toggleGridView();
            break;
          case 't':
            e.preventDefault();
            actions.cycleTheme();
            break;
          case 'r':
            e.preventDefault();
            actions.randomFormula();
            break;
        }
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [actions]);
}
