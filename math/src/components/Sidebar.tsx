import { useCallback } from 'react';
import formulaData, { SECTION_ORDER } from '../data/formulas';
import type { Subject } from '../data/types';

interface SidebarProps {
  currentSection: string;
  onNavigate: (sectionId: string) => void;
  favoritesCount: number;
  recentCount: number;
  progress: Record<string, number[]>;
  isGridView: boolean;
  onToggleGrid: () => void;
  onRandom: () => void;
  onPrint: () => void;
  onResetProgress: () => void;
}

const SUBJECTS: { subject: Subject; prefix: string }[] = [
  { subject: '高等数学', prefix: 'calc-' },
  { subject: '线性代数', prefix: 'linalg-' },
  { subject: '离散数学', prefix: 'disc-' },
  { subject: '概率统计', prefix: 'prob-' },
];

export default function Sidebar({
  currentSection,
  onNavigate,
  favoritesCount,
  recentCount,
  progress,
  isGridView,
  onToggleGrid,
  onRandom,
  onPrint,
  onResetProgress,
}: SidebarProps) {
  const handleClick = useCallback(
    (sectionId: string) => {
      onNavigate(sectionId);
      // 在移动端收起侧边栏
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) sidebar.classList.add('mobile-collapsed');
    },
    [onNavigate],
  );

  const isActive = (id: string) => currentSection === id;

  return (
    <aside className="sidebar">
      <div className="sidebar-title">
        <span aria-hidden="true">📐</span> 数学公式速查
      </div>

      <div className="sidebar-tools">
        <button onClick={() => onNavigate('__favorites__')} title="我的收藏 (Alt+F)">
          ⭐ 收藏
        </button>
        <button
          className={isGridView ? 'active' : ''}
          onClick={onToggleGrid}
          title="切换网格视图 (Alt+G)"
        >
          📋 {isGridView ? '列表' : '网格'}
        </button>
        <button onClick={onRandom} title="随机一条公式 (Alt+R)">
          🎲 随机
        </button>
        <button onClick={onResetProgress} title="重置复习进度" style={{ flex: 0.5, fontSize: 11 }}>
          ↺
        </button>
        <button onClick={onPrint} title="打印当前章节" style={{ flex: 0.5, fontSize: 11 }}>
          🖨
        </button>
      </div>

      {favoritesCount > 0 && (
        <button
          className={`sub${isActive('__favorites__') ? ' active' : ''}`}
          onClick={() => handleClick('__favorites__')}
          aria-current={isActive('__favorites__') ? 'true' : undefined}
        >
          ⭐ 我的收藏 ({favoritesCount})
        </button>
      )}
      {recentCount > 0 && (
        <button
          className={`sub${isActive('__recent__') ? ' active' : ''}`}
          onClick={() => handleClick('__recent__')}
          aria-current={isActive('__recent__') ? 'true' : undefined}
        >
          🕐 最近浏览 ({recentCount})
        </button>
      )}

      {SUBJECTS.map(({ subject, prefix }) => (
        <div key={subject}>
          <div className="category">{subject}</div>
          {SECTION_ORDER.filter(id => id.startsWith(prefix)).map(sid => {
            const section = formulaData[sid];
            if (!section) return null;
            const total = section.formulas.length;
            const viewed = (progress[sid] || []).length;
            return (
              <button
                key={sid}
                className={`sub${isActive(sid) ? ' active' : ''}`}
                onClick={() => handleClick(sid)}
                aria-current={isActive(sid) ? 'true' : undefined}
              >
                {section.title}
                {viewed > 0 && (
                  <span className="progress-badge">
                    {viewed}/{total}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
