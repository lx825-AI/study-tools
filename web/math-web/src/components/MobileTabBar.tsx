interface MobileTabBarProps {
  currentSection: string;
  onNavigate: (sectionId: string) => void;
  favoritesCount: number;
  onOpenDrawer: () => void;
}

interface Tab {
  id: string;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: 'calc-limit', label: '公式', icon: '📚' },
  { id: '__search__', label: '搜索', icon: '🔍' },
  { id: '__favorites__', label: '收藏', icon: '⭐' },
  { id: '__practice__', label: '测验', icon: '✏️' },
];

export default function MobileTabBar({
  currentSection,
  onNavigate,
  favoritesCount,
  onOpenDrawer,
}: MobileTabBarProps) {
  const isActive = (id: string) => {
    if (id === '__favorites__') return currentSection === '__favorites__';
    if (id === '__practice__') return currentSection === '__practice__';
    if (id === '__search__') return false; // search tab triggers focus, not a section
    // Default "公式" tab active when on any formula section
    return !['__favorites__', '__recent__', '__practice__'].includes(currentSection);
  };

  const handleTab = (tab: Tab) => {
    if (tab.id === '__search__') {
      const searchInput = document.querySelector<HTMLInputElement>('.search-input');
      searchInput?.focus();
      return;
    }
    if (tab.id === 'calc-limit') {
      // Open the navigation drawer instead of just navigating
      onOpenDrawer();
      return;
    }
    onNavigate(tab.id);
  };

  return (
    <nav className="mobile-tab-bar" role="navigation" aria-label="移动端导航">
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`mobile-tab${isActive(tab.id) ? ' active' : ''}`}
          onClick={() => handleTab(tab)}
          aria-current={isActive(tab.id) ? 'page' : undefined}
          aria-label={tab.label}
        >
          <span className="mobile-tab-icon" aria-hidden="true">{tab.icon}</span>
          <span className="mobile-tab-label">
            {tab.label}
            {tab.id === '__favorites__' && favoritesCount > 0
              ? ` (${favoritesCount})`
              : ''}
          </span>
        </button>
      ))}
      <button
        className="mobile-tab"
        onClick={onOpenDrawer}
        aria-label="更多"
      >
        <span className="mobile-tab-icon" aria-hidden="true">👤</span>
        <span className="mobile-tab-label">我的</span>
      </button>
    </nav>
  );
}
