import { useEffect, useRef, useState, memo } from 'react';
import type { Formula, Level } from '../data/types';
import { renderFormula } from '../utils/katex';
import { highlightText } from '../utils/highlight';
import '../styles/formula-card.css';

interface FormulaCardProps {
  formula: Formula;
  sectionId: string;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  onCopy: () => void;
  highlightQuery?: string;
}

const LEVEL_LABELS: Record<Level, string> = {
  basic: '基础',
  important: '必考',
  advanced: '进阶',
};

function FormulaCardInner({
  formula,
  sectionId,
  index,
  isExpanded,
  onToggle,
  isFavorited,
  onToggleFavorite,
  onCopy,
  highlightQuery,
}: FormulaCardProps) {
  const latexRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (latexRef.current) {
      renderFormula(latexRef.current, formula.latex);
    }
  }, [formula.latex]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if ((e.target as HTMLElement).closest('[data-action]')) return;
      e.preventDefault();
      onToggle();
    }
  };

  const levelBadge = formula.level
    ? `<span class="level-badge ${formula.level}">${LEVEL_LABELS[formula.level]}</span>`
    : '';

  const query = highlightQuery?.trim();

  return (
    <div
      className={`formula-card${isExpanded ? ' expanded' : ''}`}
      tabIndex={0}
      role="button"
      aria-expanded={isExpanded}
      data-section={sectionId}
      data-index={index}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
    >
      <button
        className="copy-btn"
        title="复制 LaTeX"
        aria-label="复制 LaTeX"
        data-action="copy"
        onClick={handleCopy}
      >
        <span aria-hidden="true">{copied ? '✓' : '📋'}</span>
      </button>
      <button
        className={`favorite-btn${isFavorited ? ' favorited' : ''}`}
        title="收藏"
        aria-label={isFavorited ? '取消收藏' : '收藏'}
        data-action="fav"
        onClick={handleFav}
      >
        <span aria-hidden="true">{isFavorited ? '★' : '☆'}</span>
      </button>
      <div
        className="formula-name"
        dangerouslySetInnerHTML={{
          __html: highlightText(formula.name, query ?? '') + levelBadge,
        }}
      />
      <div className="formula-latex" ref={latexRef} />
      <div
        className="formula-note"
        dangerouslySetInnerHTML={{
          __html: highlightText(formula.note, query ?? ''),
        }}
      />
      <div
        className="formula-detail"
        dangerouslySetInnerHTML={{
          __html: highlightText(formula.detail || '', query ?? ''),
        }}
      />
      <div className="formula-expand-hint">
        <span aria-hidden="true">{isExpanded ? '▼' : '▶'}</span>{' '}
        {isExpanded ? '收起详解' : '点击展开详解'}
      </div>
    </div>
  );
}

export const FormulaCard = memo(FormulaCardInner);

export default FormulaCard;
