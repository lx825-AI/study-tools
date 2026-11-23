import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormulaCard } from '../components/FormulaCard';

// Mock katex render
vi.mock('../utils/katex', () => ({
  renderFormula: () => {},
}));

const baseProps = {
  formula: {
    name: '极限定义',
    latex: '\\lim_{x \\to a} f(x) = L',
    note: '函数在 x→a 时的极限',
    detail: '当 x 趋近于 a 时，f(x) 趋近于 L',
    level: 'important' as const,
  },
  sectionId: 'calc-limit',
  index: 0,
  isExpanded: false,
  onToggle: vi.fn(),
  isFavorited: false,
  onToggleFavorite: vi.fn(),
  onCopy: vi.fn(),
};

describe('FormulaCard', () => {
  it('渲染公式名称', () => {
    render(<FormulaCard {...baseProps} />);
    expect(screen.getByText(/极限定义/)).toBeDefined();
  });

  it('渲染公式 note', () => {
    render(<FormulaCard {...baseProps} />);
    expect(screen.getByText(/函数在 x→a 时的极限/)).toBeDefined();
  });

  it('有正确的 aria-expanded 状态', () => {
    const { container } = render(<FormulaCard {...baseProps} />);
    const card = container.querySelector('.formula-card')!;
    expect(card.getAttribute('aria-expanded')).toBe('false');
  });

  it('展开后 aria-expanded 为 true', () => {
    const { container } = render(
      <FormulaCard {...baseProps} isExpanded={true} />,
    );
    const card = container.querySelector('.formula-card')!;
    expect(card.getAttribute('aria-expanded')).toBe('true');
    expect(card.classList.contains('expanded')).toBe(true);
  });

  it('点击卡片触发 onToggle', () => {
    const onToggle = vi.fn();
    const { container } = render(
      <FormulaCard {...baseProps} onToggle={onToggle} />,
    );
    fireEvent.click(container.querySelector('.formula-card')!);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('按下 Enter 键触发 onToggle', () => {
    const onToggle = vi.fn();
    const { container } = render(
      <FormulaCard {...baseProps} onToggle={onToggle} />,
    );
    fireEvent.keyDown(container.querySelector('.formula-card')!, { key: 'Enter' });
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('收藏按钮显示 ☆ 未收藏状态', () => {
    render(<FormulaCard {...baseProps} isFavorited={false} />);
    const btn = screen.getByLabelText('收藏');
    expect(btn).toBeDefined();
  });

  it('收藏按钮显示 ★ 已收藏状态', () => {
    render(<FormulaCard {...baseProps} isFavorited={true} />);
    const btn = screen.getByLabelText('取消收藏');
    expect(btn).toBeDefined();
  });

  it('点击收藏按钮触发 onToggleFavorite', () => {
    const onToggleFavorite = vi.fn();
    render(
      <FormulaCard {...baseProps} onToggleFavorite={onToggleFavorite} />,
    );
    fireEvent.click(screen.getByLabelText('收藏'));
    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
  });

  it('渲染复制按钮', () => {
    render(<FormulaCard {...baseProps} />);
    expect(screen.getByLabelText('复制 LaTeX')).toBeDefined();
  });

  it('有 tabIndex=0 使卡片可聚焦', () => {
    const { container } = render(<FormulaCard {...baseProps} />);
    const card = container.querySelector('.formula-card')!;
    expect(card.getAttribute('tabindex')).toBe('0');
  });
});
