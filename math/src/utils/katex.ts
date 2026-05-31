// 数学公式渲染工具函数
// 声明式组件请使用 components/KatexDisplay.tsx
// 命令式 DOM 操作使用此文件中的 renderFormula
import katex from 'katex';

export function renderFormula(el: HTMLElement, latex: string): void {
  try {
    katex.render(latex, el, { throwOnError: false, displayMode: true });
  } catch {
    el.textContent = latex;
  }
}
