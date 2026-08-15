import { useState, useCallback } from 'react';
import { getItem, setItem } from '../utils/storage';

const KEY = 'math-progress';

export default function useProgress() {
  const [progress, setProgress] = useState<Record<string, number[]>>(() =>
    getItem<Record<string, number[]>>(KEY, {}),
  );

  const markViewed = useCallback((sectionId: string, index: number) => {
    setProgress(prev => {
      const next = { ...prev };
      if (!next[sectionId]) next[sectionId] = [];
      if (!next[sectionId].includes(index)) {
        next[sectionId] = [...next[sectionId], index];
      }
      setItem(KEY, next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setProgress({});
    setItem(KEY, {});
  }, []);

  return { progress, markViewed, reset };
}
