import type { UseSearchReturn } from '../hooks/useSearch';
import '../styles/search.css';

interface SearchFiltersProps {
  search: UseSearchReturn;
  visible: boolean;
}

export default function SearchFilters({ search, visible }: SearchFiltersProps) {
  if (!visible) return null;

  return (
    <div id="searchFilters" style={{ display: 'flex' }}>
      <select
        value={search.subjectFilter}
        onChange={e => search.setSubjectFilter(e.target.value)}
        title="按科目筛选"
      >
        <option value="">全部科目</option>
        <option value="calc-">高等数学</option>
        <option value="linalg-">线性代数</option>
        <option value="disc-">离散数学</option>
        <option value="prob-">概率统计</option>
      </select>
      <select
        value={search.levelFilter}
        onChange={e => search.setLevelFilter(e.target.value)}
        title="按难度筛选"
      >
        <option value="">全部难度</option>
        <option value="basic">基础</option>
        <option value="important">必考</option>
        <option value="advanced">进阶</option>
      </select>
    </div>
  );
}
