/**
 * LaTeX 递归下降语法分析器：Token[] → AST。
 * 容错原则：任何未知命令/结构都不抛异常，降级为文本节点，保证 177 条公式 100% 可渲染。
 */
import type { Token } from './tokenizer'
import { tokenize } from './tokenizer'
import { GLYPHS, FUNC_NAMES, LIMIT_OPS, DELIMITERS } from './glyphs'

export type FontStyle = 'italic' | 'upright' | 'bold' | 'cal'

export type Node =
  | { type: 'text'; value: string; style: FontStyle }
  | { type: 'op'; glyph: string; name: string } // 大型运算符（∑∫∏…）
  | { type: 'frac'; num: Node[]; den: Node[] }
  | { type: 'sqrt'; content: Node[]; index: Node[] | null }
  | { type: 'subsup'; base: Node[]; sub: Node[] | null; sup: Node[] | null; limits: boolean }
  | { type: 'delim'; left: string; right: string; content: Node[] }
  | { type: 'accent'; accent: string; content: Node[] } // bar overline hat vec dot tilde
  | { type: 'matrix'; env: string; rows: Node[][][]; left: string; right: string }
  | { type: 'xarrow'; content: Node[] } // \xrightarrow{...}
  | { type: 'binom'; top: Node[]; bottom: Node[] }
  | { type: 'space'; width: number } // 单位 em

interface State {
  tokens: Token[]
  pos: number
}

const SPACES: Record<string, number> = {
  ',': 0.167, ';': 0.278, ':': 0.222, ' ': 0.5, '!': -0.167,
  quad: 1, qquad: 2, enspace: 0.5, thinspace: 0.167,
}

const ACCENTS = new Set(['bar', 'overline', 'hat', 'widehat', 'vec', 'dot', 'ddot', 'tilde'])

/** 大型运算符命令（需单独成节点以判断上下限位置） */
const OP_COMMANDS = new Set([
  'sum', 'prod', 'int', 'iint', 'iiint', 'oint', 'oiint', 'bigcup', 'bigcap',
])

const ENV_DELIMS: Record<string, [string, string]> = {
  pmatrix: ['(', ')'], bmatrix: ['[', ']'], vmatrix: ['|', '|'],
  Bmatrix: ['{', '}'], cases: ['{', ''], aligned: ['', ''], matrix: ['', ''],
  substack: ['', ''],
}

const peek = (st: State): Token | undefined => st.tokens[st.pos]
const next = (st: State): Token | undefined => st.tokens[st.pos++]

/** 读取 {name} 形式的参数（环境名等），返回小写名称 */
function readBraceName(st: State): string {
  if (peek(st)?.type !== 'lbrace') return ''
  next(st)
  let name = ''
  while (peek(st) && peek(st)!.type !== 'rbrace') {
    const t = next(st)!
    if (t.type === 'char') name += t.value
    else if (t.type === 'command') name += t.name
  }
  next(st) // 吃掉 rbrace
  return name.toLowerCase()
}

export function parseLatex(latex: string): Node[] {
  const st: State = { tokens: tokenize(latex), pos: 0 }
  return parseNodes(st, null)
}

/** 主循环：解析到 stopToken（如 'right'/']'）或 rbrace/amp/break 或结尾 */
function parseNodes(st: State, stopToken: string | null): Node[] {
  const nodes: Node[] = []
  while (st.pos < st.tokens.length) {
    const t = peek(st)!
    if (t.type === 'rbrace' || t.type === 'amp' || t.type === 'break') break
    if (stopToken) {
      if (t.type === 'command' && t.name === stopToken) break
      if (t.type === 'char' && t.value === stopToken) break
    }
    if (t.type === 'command' && t.name === 'end') break // 容错：环境外 \end 直接停
    next(st)
    if (t.type === 'sub' || t.type === 'sup') {
      attachScript(st, nodes, t.type)
      continue
    }
    nodes.push(...parseAtom(st, t))
  }
  return nodes
}

/** 处理 _ / ^：挂到前一个节点上（op 且属 LIMIT_OPS 时 limits=true） */
function attachScript(st: State, nodes: Node[], kind: 'sub' | 'sup') {
  const script = parseGroup(st)
  const last = nodes[nodes.length - 1]
  // 已有 subsup 且对应槽位为空 → 合并（x_i^2 场景）
  if (last?.type === 'subsup' && !last[kind]) {
    last[kind] = script
    return
  }
  if (last) nodes.pop()
  const base = last ? [last] : []
  const limits = last?.type === 'op' && LIMIT_OPS.has(last.name)
  nodes.push({
    type: 'subsup',
    base,
    sub: kind === 'sub' ? script : null,
    sup: kind === 'sup' ? script : null,
    limits,
  })
}

/** 解析一个"组"：{...} 或单个 token（x^2 的 2） */
function parseGroup(st: State): Node[] {
  const t = peek(st)
  if (!t) return []
  if (t.type === 'lbrace') {
    next(st)
    const inner = parseNodes(st, null)
    if (peek(st)?.type === 'rbrace') next(st)
    return inner
  }
  next(st)
  return parseAtom(st, t)
}

/** 单个 token → 节点（命令在此分派） */
function parseAtom(st: State, t: Token): Node[] {
  if (t.type === 'char') return [charNode(t.value)]
  if (t.type === 'lbrace') {
    const inner = parseNodes(st, null)
    if (peek(st)?.type === 'rbrace') next(st)
    return inner
  }
  if (t.type === 'break' || t.type === 'amp' || t.type === 'rbrace') return []
  if (t.type === 'sub' || t.type === 'sup') {
    // 游离的 _ ^（前面没有 base）
    const nodes: Node[] = []
    attachScript(st, nodes, t.type)
    return nodes
  }
  return parseCommand(st, t.name)
}

function charNode(value: string): Node {
  const v = value === "'" ? '′' : value
  const style: FontStyle = /^[a-zA-Z]$/.test(v) ? 'italic' : 'upright'
  return { type: 'text', value: v, style }
}

function parseCommand(st: State, name: string): Node[] {
  if (name in SPACES) return [{ type: 'space', width: SPACES[name] }]
  // \lim 作为大型运算符处理（上下限放正上/正下方）
  if (name === 'lim') return [{ type: 'op', glyph: 'lim', name }]
  if (name in GLYPHS) {
    // 大型运算符单独成节点，便于 sub/sup 判定 limits
    if (OP_COMMANDS.has(name)) return [{ type: 'op', glyph: GLYPHS[name], name }]
    return [{ type: 'text', value: GLYPHS[name], style: 'upright' }]
  }
  if (FUNC_NAMES.has(name)) return [{ type: 'text', value: name, style: 'upright' }]
  if (ACCENTS.has(name)) {
    return [{ type: 'accent', accent: name === 'widehat' ? 'hat' : name, content: parseGroup(st) }]
  }
  switch (name) {
    case 'frac':
    case 'dfrac':
    case 'tfrac':
      return [{ type: 'frac', num: parseGroup(st), den: parseGroup(st) }]
    case 'sqrt': {
      // 可选 [index]
      let index: Node[] | null = null
      if (peek(st)?.type === 'char' && (peek(st) as { value: string }).value === '[') {
        next(st)
        index = parseNodes(st, ']')
        if (peek(st)?.type === 'char') next(st) // 吃掉 ]
      }
      return [{ type: 'sqrt', content: parseGroup(st), index }]
    }
    case 'binom':
    case 'choose':
      return [{ type: 'binom', top: parseGroup(st), bottom: parseGroup(st) }]
    case 'xrightarrow':
    case 'xleftarrow':
      return [{ type: 'xarrow', content: parseGroup(st) }]
    case 'left':
      return parseDelimited(st)
    case 'begin':
      return parseEnvironment(st)
    case 'text':
    case 'textbf':
    case 'mathrm':
    case 'operatorname':
    case 'mathbf':
    case 'mathcal':
    case 'mathbb': {
      const style: FontStyle =
        name === 'mathbf' || name === 'textbf' ? 'bold' : name === 'mathcal' ? 'cal' : 'upright'
      return applyStyle(parseGroup(st), style)
    }
    case 'displaystyle':
    case 'limits':
    case 'nolimits':
      return [] // 渲染模式提示，忽略
    case 'substack': {
      // \substack{a \\ b}：按 break 拆成多行居中堆叠
      const rows: Node[][][] = []
      if (peek(st)?.type === 'lbrace') {
        next(st)
        while (st.pos < st.tokens.length && peek(st)!.type !== 'rbrace') {
          rows.push([parseNodes(st, null)])
          if (peek(st)?.type === 'break') next(st)
        }
        if (peek(st)?.type === 'rbrace') next(st)
      }
      return [{ type: 'matrix', env: 'substack', rows, left: '', right: '' }]
    }
    default:
      // 未知命令降级为文本（正体显示命令名），保证不崩
      return [{ type: 'text', value: name, style: 'upright' }]
  }
}

/** \left X ... \right Y */
function parseDelimited(st: State): Node[] {
  const left = readDelimiter(st)
  const content = parseNodes(st, 'right')
  if (peek(st)?.type === 'command') next(st) // 吃掉 \right
  const right = readDelimiter(st)
  return [{ type: 'delim', left, right, content }]
}

function readDelimiter(st: State): string {
  const t = next(st)
  if (!t) return ''
  if (t.type === 'char') return DELIMITERS[t.value] ?? t.value
  if (t.type === 'command') return DELIMITERS[t.name] ?? GLYPHS[t.name] ?? ''
  return ''
}

/** \begin{env} ... \end{env}：按 amp 分列、break 分行 */
function parseEnvironment(st: State): Node[] {
  const env = readBraceName(st)
  const rows: Node[][][] = []
  let row: Node[][] = []
  let cell: Node[] = []
  while (st.pos < st.tokens.length) {
    const t = peek(st)!
    if (t.type === 'command' && t.name === 'end') {
      next(st)
      readBraceName(st) // 吃掉 {env}
      break
    }
    if (t.type === 'amp') {
      next(st)
      row.push(cell)
      cell = []
      continue
    }
    if (t.type === 'break') {
      next(st)
      row.push(cell)
      rows.push(row)
      row = []
      cell = []
      continue
    }
    const token = next(st)!
    if (token.type === 'sub' || token.type === 'sup') {
      attachScript(st, cell, token.type)
      continue
    }
    cell.push(...parseAtom(st, token))
  }
  row.push(cell)
  rows.push(row)
  const [left, right] = ENV_DELIMS[env] ?? ['', '']
  return [{ type: 'matrix', env, rows, left, right }]
}

/** 给子树中所有 text 节点覆盖字体样式（\mathbf{A} 等） */
function applyStyle(nodes: Node[], style: FontStyle): Node[] {
  for (const n of nodes) {
    if (n.type === 'text') n.style = style
    else if (n.type === 'subsup') {
      applyStyle(n.base, style)
      if (n.sub) applyStyle(n.sub, style)
      if (n.sup) applyStyle(n.sup, style)
    }
  }
  return nodes
}
