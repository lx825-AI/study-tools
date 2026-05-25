import katex from 'katex';

export function renderFormula(el: HTMLElement, latex: string): void {
  try {
    katex.render(latex, el, { throwOnError: false, displayMode: true });
  } catch {
    el.textContent = latex;
  }
}
