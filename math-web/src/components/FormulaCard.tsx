import { useState, memo, useCallback, useMemo, useRef } from 'react';
import type { Formula, Level } from '../data/types';
import formulaData from '../data/formulas';
import KatexDisplay from './KatexDisplay';
import { highlightText } from '../utils/highlight';
import { useFormulaNotes } from '../hooks/useFormulaNotes';
import { exportFormulaImage } from '../utils/formulaImage';
import { useToast } from './Toast';
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

/** 根据 sectionId 前缀返回学科色类名 */
function subjectColorClass(sectionId: string): string {
  if (sectionId.startsWith('calc-')) return 'subject-calc';
  if (sectionId.startsWith('linalg-')) return 'subject-linalg';
  if (sectionId.startsWith('disc-')) return 'subject-disc';
  if (sectionId.startsWith('prob-')) return 'subject-prob';
  if (sectionId.startsWith('num-')) return 'subject-num';
  return '';
}

function FormulaCardInner({
  formula,
  sectionId,
  index,
  isExpanded,
  onToggle,
  isFavorited,
  onToggleFavorite,
  highlightQuery,
}: FormulaCardProps) {
  const [copied, setCopied] = useState(false);
  const [copyMode, setCopyMode] = useState<'latex' | 'markdown' | 'link'>('latex');
  const { getNote, setNote, hasNote } = useFormulaNotes();
  const toast = useToast();
  const [isEditingNote, setIsEditingNote] = useState(false);
  const noteText = getNote(sectionId, index);
  const noteExists = hasNote(sectionId, index);
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleNoteSave = useCallback(
    (text: string) => {
      setNote(sectionId, index, text);
      setIsEditingNote(false);
    },
    [sectionId, index, setNote],
  );

  const copyLabels: Record<string, string> = {
    latex: 'LaTeX 已复制到剪贴板',
    markdown: 'Markdown 已复制到剪贴板',
    link: '链接已复制到剪贴板',
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    let text = formula.latex;
    if (copyMode === 'markdown') {
      text = `$$${formula.latex}$$`;
    } else if (copyMode === 'link') {
      text = `${window.location.origin}${window.location.pathname}#${sectionId}&f=${index}`;
    }
    navigator.clipboard.writeText(text).then(() => {
      toast.show(copyLabels[copyMode] || '已复制');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {
      toast.show('复制失败，请手动选择');
    });
  };

  const cycleCopyMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    const modes: Array<'latex' | 'markdown' | 'link'> = ['latex', 'markdown', 'link'];
    const idx = modes.indexOf(copyMode);
    setCopyMode(modes[(idx + 1) % modes.length]);
  };

  const [exporting, setExporting] = useState(false);
  const handleExportImage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setExporting(true);
    try {
      const section = formulaData[sectionId];
      await exportFormulaImage({
        name: formula.name,
        latex: formula.latex,
        note: formula.note,
        subject: section?.subject,
      });
    } catch {
      toast.show('导出图片失败，请重试');
    } finally {
      setExporting(false);
    }
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

  const relatedFormulas = useMemo(() => {
    const section = formulaData[sectionId];
    if (!section) return { prev: null, next: null };
    const formulas = section.formulas;
    return {
      prev: index > 0 ? formulas[index - 1] : null,
      next: index < formulas.length - 1 ? formulas[index + 1] : null,
    };
  }, [sectionId, index]);

  const query = highlightQuery?.trim();
  const subjClass = subjectColorClass(sectionId);

  return (
    <div
      className={`formula-card ${subjClass}${isExpanded ? ' expanded' : ''}`}
      tabIndex={0}
      role="button"
      aria-expanded={isExpanded}
      aria-label={`${formula.name}${formula.level ? ` - ${LEVEL_LABELS[formula.level]}` : ''}`}
      data-section={sectionId}
      data-index={index}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
    >
      <div className="copy-btn-group">
        <button
          className="copy-btn"
          title={`复制${copyMode === 'latex' ? ' LaTeX' : copyMode === 'markdown' ? ' Markdown' : ' 链接'}（右键切换格式）`}
          aria-label={`复制${copyMode === 'latex' ? ' LaTeX' : copyMode === 'markdown' ? ' Markdown' : ' 链接'}`}
          data-action="copy"
          onClick={handleCopy}
        >
          <span aria-hidden="true">{copied ? '✓' : copyMode === 'latex' ? '📋' : copyMode === 'markdown' ? '📝' : '🔗'}</span>
        </button>
        <button
          className="copy-mode-toggle"
          title="切换复制格式"
          aria-label="切换复制格式"
          data-action="copy-mode"
          onClick={cycleCopyMode}
        >
          <span aria-hidden="true">⇄</span>
        </button>
      </div>
      <button
        className={`favorite-btn${isFavorited ? ' favorited' : ''}`}
        title="收藏"
        aria-label={isFavorited ? '取消收藏' : '收藏'}
        data-action="fav"
        onClick={handleFav}
      >
        <span aria-hidden="true">{isFavorited ? '★' : '☆'}</span>
      </button>
      <button
        className="export-btn"
        title="导出为图片"
        aria-label="导出公式为图片"
        data-action="export"
        onClick={handleExportImage}
        disabled={exporting}
      >
        <span aria-hidden="true">{exporting ? '⏳' : '🖼'}</span>
      </button>

      <div
        className="formula-name"
        dangerouslySetInnerHTML={{
          __html: highlightText(formula.name, query ?? '') + levelBadge,
        }}
      />

      <KatexDisplay
        latex={formula.latex}
        className="formula-latex"
      />

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

      {/* 关联公式 */}
      {(relatedFormulas.prev || relatedFormulas.next) && isExpanded && (
        <div className="formula-related">
          {relatedFormulas.prev && (
            <span className="formula-related-item">
              <span className="formula-related-label">← 上一条</span>
              <span className="formula-related-name">{relatedFormulas.prev.name}</span>
            </span>
          )}
          {relatedFormulas.next && (
            <span className="formula-related-item">
              <span className="formula-related-label">下一条 →</span>
              <span className="formula-related-name">{relatedFormulas.next.name}</span>
            </span>
          )}
        </div>
      )}

      {/* 笔记区域 */}
      <div className="formula-note-section">
        {!isEditingNote && (
          <button
            className="formula-note-trigger"
            onClick={e => { e.stopPropagation(); setIsEditingNote(true); }}
            aria-label="添加笔记"
          >
            {noteExists ? '📝 编辑笔记' : '📝 添加笔记'}
          </button>
        )}
        {isEditingNote && (
          <div className="formula-note-editor" onClick={e => e.stopPropagation()}>
            <textarea
              ref={noteTextareaRef}
              className="formula-note-textarea"
              defaultValue={noteText}
              placeholder="在这里写下你的理解、记忆技巧或任何备注..."
              rows={3}
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Escape') {
                  handleNoteSave((e.target as HTMLTextAreaElement).value);
                }
              }}
            />
            <div className="formula-note-actions">
              <button
                className="btn btn-sm btn-primary"
                onClick={() => {
                  handleNoteSave(noteTextareaRef.current?.value ?? '');
                }}
              >
                保存
              </button>
              <button
                className="btn btn-sm btn-outline"
                onClick={() => setIsEditingNote(false)}
              >
                取消
              </button>
            </div>
          </div>
        )}
        {!isEditingNote && noteExists && (
          <div className="formula-note-preview">{noteText}</div>
        )}
      </div>

      <div className="formula-expand-hint">
        <span aria-hidden="true">{isExpanded ? '▼' : '▶'}</span>{' '}
        {isExpanded ? '收起详解' : '点击展开详解'}
      </div>
    </div>
  );
}

export const FormulaCard = memo(FormulaCardInner);
export default FormulaCard;
