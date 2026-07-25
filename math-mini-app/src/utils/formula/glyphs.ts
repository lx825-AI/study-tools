/**
 * LaTeX 命令 → Unicode 字形映射表，以及函数名/大型运算符集合。
 * 覆盖 177 条大学公式实际用到的全部命令（见 data/formulas-university.ts 统计）。
 */

/** 命令 → Unicode 字符 */
export const GLYPHS: Record<string, string> = {
  // 希腊字母（小写）
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ϵ', varepsilon: 'ε',
  zeta: 'ζ', eta: 'η', theta: 'θ', vartheta: 'ϑ', iota: 'ι', kappa: 'κ',
  lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π', rho: 'ρ', sigma: 'σ',
  tau: 'τ', upsilon: 'υ', phi: 'φ', varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω',
  ell: 'ℓ',
  // 希腊字母（大写）
  Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π',
  Sigma: 'Σ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω',
  // 大型运算符
  sum: '∑', prod: '∏', int: '∫', iint: '∬', iiint: '∭', oint: '∮', oiint: '∯',
  bigcup: '⋃', bigcap: '⋂',
  // 关系符
  le: '≤', leq: '≤', ge: '≥', geq: '≥', ne: '≠', neq: '≠', equiv: '≡',
  approx: '≈', sim: '∼', simeq: '≃', cong: '≅', propto: '∝', ll: '≪', gg: '≫',
  // 二元运算符
  pm: '±', mp: '∓', times: '×', div: '÷', cdot: '·', ast: '∗', circ: '∘',
  oplus: '⊕', ominus: '⊖', otimes: '⊗', bullet: '∙',
  // 集合
  in: '∈', notin: '∉', ni: '∋', subset: '⊂', supset: '⊃', subseteq: '⊆',
  supseteq: '⊇', cup: '∪', cap: '∩', emptyset: '∅', varnothing: '∅', setminus: '∖',
  // 箭头
  to: '→', rightarrow: '→', leftarrow: '←', Rightarrow: '⇒', Leftarrow: '⇐',
  Leftrightarrow: '⇔', leftrightarrow: '↔', mapsto: '↦', iff: '⇔', gets: '←',
  // 逻辑
  forall: '∀', exists: '∃', lnot: '¬', neg: '¬', land: '∧', wedge: '∧',
  lor: '∨', vee: '∨', top: '⊤', bot: '⊥',
  // 省略号
  dots: '…', ldots: '…', cdots: '⋯', vdots: '⋮', ddots: '⋱',
  // 其他符号
  infty: '∞', partial: '∂', nabla: '∇', angle: '∠', degree: '°', prime: '′',
  mid: '∣', parallel: '∥', perp: '⊥', therefore: '∴', because: '∵',
  lfloor: '⌊', rfloor: '⌋', lceil: '⌈', rceil: '⌉', langle: '⟨', rangle: '⟩',
  // 单字符命令（\{ \} \% \_ \\| 等）
  '{': '{', '}': '}', '%': '%', '#': '#', '_': '_', '|': '‖', '$': '$',
}

/** 正体函数名（\sin \cos 等，渲染为正体） */
export const FUNC_NAMES = new Set([
  'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
  'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh',
  'ln', 'log', 'lg', 'exp', 'lim', 'max', 'min', 'sup', 'inf',
  'deg', 'dim', 'ker', 'det', 'gcd', 'arg',
])

/** 上下限放在正上方/正下方的大型运算符（int 族放右下/右上） */
export const LIMIT_OPS = new Set(['sum', 'prod', 'bigcup', 'bigcap', 'lim'])

/** 定界符命令名 → 字符（\left. 表示空定界符） */
export const DELIMITERS: Record<string, string> = {
  '(': '(', ')': ')', '[': '[', ']': ']', '{': '{', '}': '}',
  '|': '|', '.': '', '<': '⟨', '>': '⟩',
}
