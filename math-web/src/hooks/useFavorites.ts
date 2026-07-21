import { useState, useCallback } from 'react';
import { getItem, setItem } from '../utils/storage';
import type { FavoriteEntry } from '../data/types';

const KEY = 'math-favorites';

function toKey(sectionId: string, index: number): string {
  return `${sectionId}:${index}`;
}

export default function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    const list = getItem<FavoriteEntry[]>(KEY, []);
    return new Set(list.map(f => toKey(f.sectionId, f.formulaIndex)));
  });

  const toggle = useCallback((sectionId: string, index: number) => {
    const key = toKey(sectionId, index);
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      const list: FavoriteEntry[] = [];
      next.forEach(k => {
        const [s, i] = k.split(':');
        list.push({ sectionId: s, formulaIndex: Number(i) });
      });
      setItem(KEY, list);
      return next;
    });
  }, []);

  const has = useCallback(
    (sectionId: string, index: number) => favorites.has(toKey(sectionId, index)),
    [favorites],
  );

  return { favorites, toggle, has, count: favorites.size };
}
