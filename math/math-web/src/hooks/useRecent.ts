import { useState, useCallback } from 'react';
import { getItem, setItem } from '../utils/storage';
import type { FavoriteEntry } from '../data/types';

const KEY = 'math-recent';
const MAX = 20;

export default function useRecent() {
  const [recent, setRecent] = useState<FavoriteEntry[]>(() =>
    getItem<FavoriteEntry[]>(KEY, []),
  );

  const add = useCallback((sectionId: string, index: number) => {
    setRecent(prev => {
      const next = prev.filter(r => !(r.sectionId === sectionId && r.formulaIndex === index));
      next.unshift({ sectionId, formulaIndex: index });
      if (next.length > MAX) next.pop();
      setItem(KEY, next);
      return next;
    });
  }, []);

  return { recent, add, count: recent.length };
}
