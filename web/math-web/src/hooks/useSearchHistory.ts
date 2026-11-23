import { useState, useCallback } from 'react';
import { getItem, setItem } from '../utils/storage';

const KEY = 'math-search-history';
const MAX = 10;

export default function useSearchHistory() {
  const [history, setHistory] = useState<string[]>(() => getItem<string[]>(KEY, []));

  const addHistory = useCallback((query: string) => {
    if (!query.trim()) return;
    setHistory(prev => {
      const next = prev.filter(h => h !== query);
      next.unshift(query);
      if (next.length > MAX) next.pop();
      setItem(KEY, next);
      return next;
    });
  }, []);

  return { history, addHistory };
}
