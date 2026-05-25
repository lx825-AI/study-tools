import { useState, useCallback, useMemo, useRef } from 'react';
import formulaData, { SECTION_ORDER } from '../data/formulas';
import type { Section } from '../data/types';
import useHashRoute from '../hooks/useHashRoute';
import useSearch from '../hooks/useSearch';
import useSearchHistory from '../hooks/useSearchHistory';
import useFavorites from '../hooks/useFavorites';
import useRecent from '../hooks/useRecent';
import useTheme from '../hooks/useTheme';
import useProgress from '../hooks/useProgress';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import Sidebar from './Sidebar';
import SearchBar from './SearchBar';
import SearchFilters from './SearchFilters';
import FormulaGrid from './FormulaGrid';
import FormulaCard from './FormulaCard';
import ThemeToggle from './ThemeToggle';
import BackToTop from './BackToTop';
import OfflineBanner from './OfflineBanner';
import MobileSidebarToggle from './MobileSidebarToggle';
import { ToastProvider, useToast } from './Toast';
import '../styles/sidebar.css';
import '../styles/search.css';
import '../styles/responsive.css';

const VALID_SECTIONS = new Set(SECTION_ORDER);

function AppInner() {
  const { currentSection, navigate } = useHashRoute(VALID_SECTIONS);
  const search = useSearch();
  const { history: searchHistory, addHistory } = useSearchHistory();
  const { favorites, toggle: toggleFavorite } = useFavorites();
  const { recent, add: addRecent } = useRecent();
  const { theme, cycleTheme } = useTheme();
  const { progress, markViewed, reset: resetProgress } = useProgress();
  const toast = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [searchExpandedCards, setSearchExpandedCards] = useState<Set<string>>(new Set());
  const [isGridView, setIsGridView] = useState(false);

  const handleToggleCard = useCallback((sectionId: string, index: number) => {
    const isExpanding = !expandedCards.has(index);
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
    if (isExpanding) {
      addRecent(sectionId, index);
      markViewed(sectionId, index);
    }
  }, [expandedCards, addRecent, markViewed]);

  const handleSearchToggleCard = useCallback((sectionId: string, index: number) => {
    const key = `${sectionId}:${index}`;
    const isExpanding = !searchExpandedCards.has(key);
    setSearchExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    if (isExpanding) {
      addRecent(sectionId, index);
      markViewed(sectionId, index);
    }
  }, [searchExpandedCards, addRecent, markViewed]);

  const handleFav = useCallback(
    (sectionId: string, index: number) => {
      const key = `${sectionId}:${index}`;
      const wasFav = favorites.has(key);
      toggleFavorite(sectionId, index);
      toast.show(wasFav ? '已取消收藏' : '⭐ 已收藏');
    },
    [toggleFavorite, favorites, toast],
  );

  const handleCopy = useCallback(
    async (sectionId: string, index: number) => {
      const section = formulaData[sectionId];
      if (!section) return;
      const f = section.formulas[index];
      if (!f) return;
      try {
        await navigator.clipboard.writeText(f.latex);
        toast.show('LaTeX 已复制到剪贴板');
      } catch {
        toast.show('复制失败，请手动选择');
      }
    },
    [toast],
  );

  const handleNavigate = useCallback(
    (sectionId: string) => {
      setExpandedCards(new Set());
      setSearchExpandedCards(new Set());
      search.setQuery('');
      navigate(sectionId);
    },
    [navigate, search],
  );

  const handleSearch = useCallback(
    (q: string) => {
      search.setQuery(q);
      if (q.trim()) addHistory(q.trim());
    },
    [search, addHistory],
  );

  const handleRandom = useCallback(() => {
    const sections = Object.keys(formulaData);
    const sid = sections[Math.floor(Math.random() * sections.length)];
    const formulas = formulaData[sid].formulas;
    const idx = Math.floor(Math.random() * formulas.length);
    handleNavigate(sid);
    addRecent(sid, idx);
    markViewed(sid, idx);
  }, [handleNavigate, addRecent, markViewed]);

  const handlePrint = useCallback(() => {
    // 展开所有卡片再打印
    document.querySelectorAll('.formula-card').forEach(c => c.classList.add('expanded'));
    setTimeout(() => window.print(), 200);
  }, []);

  const handleResetProgress = useCallback(() => {
    if (confirm('确定要重置所有章节的复习进度吗？')) {
      resetProgress();
      toast.show('进度已重置');
    }
  }, [resetProgress, toast]);

  useKeyboardShortcuts({
    focusSearch: () => searchInputRef.current?.focus(),
    showFavorites: () => handleNavigate('__favorites__'),
    toggleGridView: () => setIsGridView(prev => !prev),
    cycleTheme: () => {
      const next = cycleTheme();
      toast.show({ auto: '切换为自动模式', dark: '已切换暗色模式', light: '已切换亮色模式' }[next]);
    },
    randomFormula: handleRandom,
  });

  const displaySection = useMemo(() => {
    if (search.isSearching) return null;
    if (currentSection === '__favorites__' || currentSection === '__recent__')
      return null;
    return formulaData[currentSection] || null;
  }, [currentSection, search.isSearching]);

  const specialList = useMemo(() => {
    if (search.isSearching) return [] as { sectionId: string; formulaIndex: number }[];
    if (currentSection === '__favorites__') {
      return Array.from(favorites).map(k => {
        const [s, i] = k.split(':');
        return { sectionId: s, formulaIndex: Number(i) };
      });
    }
    if (currentSection === '__recent__') return recent;
    return [];
  }, [currentSection, search.isSearching, favorites, recent]);

  const searchSections = useMemo(() => {
    if (!search.isSearching) return [] as Section[];
    const grouped: Map<string, Section> = new Map();
    search.results.forEach(r => {
      if (!grouped.has(r.sectionId)) {
        const orig = formulaData[r.sectionId];
        grouped.set(r.sectionId, {
          id: orig.id,
          title: orig.title,
          subject: orig.subject,
          formulas: [],
        });
      }
      grouped.get(r.sectionId)!.formulas.push(
        formulaData[r.sectionId].formulas[r.formulaIndex],
      );
    });
    return Array.from(grouped.values());
  }, [search.results, search.isSearching]);

  return (
    <>
      <OfflineBanner />
      <Sidebar
        currentSection={currentSection}
        onNavigate={handleNavigate}
        favoritesCount={favorites.size}
        recentCount={recent.length}
        progress={progress}
        isGridView={isGridView}
        onToggleGrid={() => setIsGridView(prev => !prev)}
        onRandom={handleRandom}
        onPrint={handlePrint}
        onResetProgress={handleResetProgress}
      />
      <MobileSidebarToggle />
      <main className="main">
        <div className="main-header">
          <h1>AI 数学公式速查表</h1>
          <ThemeToggle theme={theme} onToggle={() => cycleTheme()} />
        </div>
        <SearchBar
          search={{ ...search, setQuery: handleSearch }}
          searchHistory={searchHistory}
        />
        <SearchFilters search={search} visible={search.isSearching} />

        {search.isSearching && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <button className="sort-btn" onClick={search.toggleSort}>
              {search.sortBySection ? '🔤 按章节排序' : '🔢 按匹配排序'}
            </button>
          </div>
        )}

        <div id="formulaContainer">
          {search.isSearching ? (
            <div aria-live="polite">
              {search.results.length === 0 ? (
                <div className="no-result" style={{ display: 'block' }}>
                  没有找到匹配的公式
                </div>
              ) : (
                searchSections.map(sec => {
                const secExpanded = new Set<number>();
                searchExpandedCards.forEach(key => {
                  const [s, i] = key.split(':');
                  if (s === sec.id) secExpanded.add(Number(i));
                });
                return (
                  <FormulaGrid
                    key={sec.id}
                    section={sec}
                    expandedCards={secExpanded}
                    onToggleCard={handleSearchToggleCard}
                    favorites={favorites}
                    onToggleFavorite={handleFav}
                    onCopy={handleCopy}
                    highlightQuery={search.query}
                    isGridView={isGridView}
                  />
                );
              })
              )}
            </div>
          ) : displaySection ? (
            <FormulaGrid
              section={displaySection}
              expandedCards={expandedCards}
              onToggleCard={handleToggleCard}
              favorites={favorites}
              onToggleFavorite={handleFav}
              onCopy={handleCopy}
              isGridView={isGridView}
            />
          ) : specialList.length === 0 ? (
            <div className="no-result" style={{ display: 'block' }}>
              {currentSection === '__favorites__'
                ? '⭐ 还没有收藏任何公式，点击卡片上的 ☆ 即可收藏'
                : '🕐 还没有浏览记录，点击卡片展开即可记录'}
            </div>
          ) : (
            <div>
              <h2 className="section-title">
                {currentSection === '__favorites__'
                  ? `⭐ 我的收藏（${specialList.length} 条）`
                  : `🕐 最近浏览（${specialList.length} 条）`}
              </h2>
              <div className={`formula-grid${isGridView ? ' grid-view' : ''}`}>
                {specialList.map(item => {
                  const section = formulaData[item.sectionId];
                  if (!section) return null;
                  const formula = section.formulas[item.formulaIndex];
                  if (!formula) return null;
                  const key = `${item.sectionId}:${item.formulaIndex}`;
                  return (
                    <FormulaCard
                      key={key}
                      formula={formula}
                      sectionId={item.sectionId}
                      index={item.formulaIndex}
                      isExpanded={false}
                      onToggle={() => {}}
                      isFavorited={favorites.has(key)}
                      onToggleFavorite={() => handleFav(item.sectionId, item.formulaIndex)}
                      onCopy={() => handleCopy(item.sectionId, item.formulaIndex)}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
      <BackToTop />
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
