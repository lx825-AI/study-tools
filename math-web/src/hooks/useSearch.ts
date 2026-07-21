import { useState, useCallback, useRef, useMemo } from 'react';
import formulaData from '../data/formulas';

export interface SearchResult {
  sectionId: string;
  sectionTitle: string;
  formulaIndex: number;
}

export interface UseSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  results: SearchResult[];
  isSearching: boolean;
  sortBySection: boolean;
  toggleSort: () => void;
  subjectFilter: string;
  setSubjectFilter: (s: string) => void;
  levelFilter: string;
  setLevelFilter: (l: string) => void;
}

export default function useSearch(): UseSearchReturn {
  const [query, setQueryState] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const [sortBySection, setSortBySection] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');

  const setQuery = useCallback((q: string) => {
    setQueryState(q);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedQuery(q.trim().toLowerCase()), 300);
  }, []);

  const isSearching = debouncedQuery.length > 0;

  const results = useMemo(() => {
    if (!isSearching) return [];
    const q = debouncedQuery;
    const list: SearchResult[] = [];

    Object.entries(formulaData).forEach(([sectionId, section]) => {
      if (subjectFilter && !sectionId.startsWith(subjectFilter)) return;
      section.formulas.forEach((f, i) => {
        if (levelFilter && f.level && f.level !== levelFilter) return;
        const text = `${f.name} ${f.latex} ${f.note} ${f.detail || ''}`.toLowerCase();
        if (text.includes(q)) {
          list.push({
            sectionId,
            sectionTitle: section.title,
            formulaIndex: i,
          });
        }
      });
    });

    if (sortBySection) {
      list.sort((a, b) => a.sectionId.localeCompare(b.sectionId) || a.formulaIndex - b.formulaIndex);
    }

    return list;
  }, [debouncedQuery, isSearching, subjectFilter, levelFilter, sortBySection]);

  const toggleSort = useCallback(() => setSortBySection(prev => !prev), []);

  return {
    query,
    setQuery,
    results,
    isSearching,
    sortBySection,
    toggleSort,
    subjectFilter,
    setSubjectFilter,
    levelFilter,
    setLevelFilter,
  };
}
