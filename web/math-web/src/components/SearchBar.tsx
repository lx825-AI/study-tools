import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { UseSearchReturn } from '../hooks/useSearch';
import formulaData from '../data/formulas';
import '../styles/search.css';

interface SearchBarProps {
  search: UseSearchReturn;
  searchHistory: string[];
}

/** 从所有公式中提取名称作为搜索建议 */
function getSuggestions(query: string, limit = 8): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const names = new Set<string>();
  for (const section of Object.values(formulaData)) {
    for (const f of section.formulas) {
      if (f.name.toLowerCase().includes(q)) {
        names.add(f.name);
      }
      if (names.size >= limit) break;
    }
    if (names.size >= limit) break;
  }
  return Array.from(names).slice(0, limit);
}

export default function SearchBar({ search, searchHistory }: SearchBarProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => clearTimeout(blurTimer.current);
  }, []);

  const suggestions = useMemo(
    () => getSuggestions(search.query),
    [search.query],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      search.setQuery(e.target.value);
      if (!e.target.value.trim()) {
        setShowHistory(false);
        setShowSuggestions(false);
      } else {
        setShowSuggestions(true);
        setShowHistory(false);
      }
    },
    [search],
  );

  const handleFocus = useCallback(() => {
    if (search.query.trim()) {
      setShowSuggestions(true);
    } else if (searchHistory.length > 0) {
      setShowHistory(true);
    }
  }, [search.query, searchHistory]);

  const handleBlur = useCallback(() => {
    blurTimer.current = setTimeout(() => {
      setShowHistory(false);
      setShowSuggestions(false);
    }, 200);
  }, []);

  const handleHistoryClick = useCallback(
    (q: string) => {
      search.setQuery(q);
      setShowHistory(false);
    },
    [search],
  );

  const handleSuggestionClick = useCallback(
    (name: string) => {
      search.setQuery(name);
      setShowSuggestions(false);
    },
    [search],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        search.setQuery('');
        setShowHistory(false);
        setShowSuggestions(false);
      }
    },
    [search],
  );

  return (
    <div
      className="search-wrap"
      role="combobox"
      aria-expanded={showHistory || showSuggestions}
      aria-haspopup="listbox"
    >
      <span className="search-icon" aria-hidden="true">🔍</span>
      <input
        className="search-input"
        type="search"
        placeholder="搜索公式名称或关键词..."
        aria-label="搜索公式"
        autoComplete="off"
        inputMode="search"
        value={search.query}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />

      {/* 搜索建议（输入时） */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="search-suggestions" role="listbox">
          {suggestions.map(name => (
            <div
              key={name}
              className="search-suggestion-item"
              role="option"
              onClick={() => handleSuggestionClick(name)}
            >
              {name}
            </div>
          ))}
        </div>
      )}

      {/* 搜索历史（无输入时） */}
      {showHistory && searchHistory.length > 0 && (
        <div className="search-history" role="listbox">
          {searchHistory.map(q => (
            <div
              key={q}
              className="search-history-item"
              role="option"
              onClick={() => handleHistoryClick(q)}
            >
              {q}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
