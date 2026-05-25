import { useState, useRef, useCallback } from 'react';
import type { UseSearchReturn } from '../hooks/useSearch';
import '../styles/search.css';

interface SearchBarProps {
  search: UseSearchReturn;
  searchHistory: string[];
}

export default function SearchBar({ search, searchHistory }: SearchBarProps) {
  const [showHistory, setShowHistory] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout>>();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      search.setQuery(e.target.value);
      if (!e.target.value.trim()) {
        setShowHistory(false);
      }
    },
    [search],
  );

  const handleFocus = useCallback(() => {
    if (!search.query.trim() && searchHistory.length > 0) {
      setShowHistory(true);
    }
  }, [search.query, searchHistory]);

  const handleBlur = useCallback(() => {
    blurTimer.current = setTimeout(() => setShowHistory(false), 200);
  }, []);

  const handleHistoryClick = useCallback(
    (q: string) => {
      search.setQuery(q);
      setShowHistory(false);
    },
    [search],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        search.setQuery('');
        setShowHistory(false);
      }
    },
    [search],
  );

  return (
    <div className="search-wrap" role="combobox" aria-expanded={showHistory} aria-haspopup="listbox">
      <span className="search-icon" aria-hidden="true">🔍</span>
      <input
        type="text"
        placeholder="搜索公式名称或关键词..."
        aria-label="搜索公式"
        autoComplete="off"
        value={search.query}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
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
