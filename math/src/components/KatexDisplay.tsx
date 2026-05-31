import katex from 'katex';

interface KatexDisplayProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
}

/**
 * 声明式 KaTeX 渲染组件，替代 useRef + useEffect 命令式模式。
 * 缓存相同 latex 的渲染结果，避免重复调用 katex.render。
 */
const renderCache = new Map<string, string>();

function renderToString(latex: string, displayMode: boolean): string {
  const cacheKey = `${displayMode ? 'd' : 'i'}:${latex}`;
  const cached = renderCache.get(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const html = katex.renderToString(latex, {
      throwOnError: false,
      displayMode,
    });
    renderCache.set(cacheKey, html);
    return html;
  } catch {
    return latex;
  }
}

export default function KatexDisplay({
  latex,
  displayMode = true,
  className = '',
}: KatexDisplayProps) {
  const html = renderToString(latex, displayMode);

  return (
    <div
      className={className}
      aria-label={`数学公式: ${latex}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * 命令式版本，用于需要直接操作 DOM 的场景（如动态内容更新）。
 * 保留以兼容现有代码，逐步迁移到声明式。
 */
export function renderFormula(el: HTMLElement, latex: string): void {
  try {
    katex.render(latex, el, { throwOnError: false, displayMode: true });
  } catch {
    el.textContent = latex;
  }
}

/** 行内公式渲染（displayMode: false） */
export function KatexInline({ latex }: { latex: string }) {
  return <KatexDisplay latex={latex} displayMode={false} />;
}
