/**
 * LaTeX 词法分析器：将 LaTeX 字符串拆解为 Token 序列。
 * 设计为表驱动：命令不分类（希腊字母/运算符统一为 command），由 parser 查表解释。
 */
export type Token =
  | { type: 'lbrace' } // {
  | { type: 'rbrace' } // }
  | { type: 'sub' } // _
  | { type: 'sup' } // ^
  | { type: 'amp' } // &（矩阵/对齐列分隔）
  | { type: 'break' } // \\（行分隔）
  | { type: 'command'; name: string } // \frac、\alpha、\,（单字符命令 name 为该字符）
  | { type: 'char'; value: string } // 普通字符

const SINGLE_CHAR_TOKENS: Record<string, Token['type']> = {
  '{': 'lbrace',
  '}': 'rbrace',
  '_': 'sub',
  '^': 'sup',
  '&': 'amp',
}

const isLetter = (c: string) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')

export function tokenize(latex: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  while (i < latex.length) {
    const c = latex[i]
    // LaTeX 源码中的空白无意义，直接跳过（显式空格由 \  \quad \, 等命令表达）
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
      i++
      continue
    }
    if (c === '\\') {
      const next = latex[i + 1]
      if (next === '\\') {
        tokens.push({ type: 'break' })
        i += 2
        continue
      }
      if (next !== undefined && isLetter(next)) {
        let j = i + 1
        while (j < latex.length && isLetter(latex[j])) j++
        tokens.push({ type: 'command', name: latex.slice(i + 1, j) })
        i = j
        continue
      }
      // 单字符命令：\, \; \! \{ \} \% \ 等
      tokens.push({ type: 'command', name: next ?? '' })
      i += 2
      continue
    }
    const simple = SINGLE_CHAR_TOKENS[c]
    if (simple) {
      tokens.push({ type: simple } as Token)
      i++
      continue
    }
    tokens.push({ type: 'char', value: c })
    i++
  }
  return tokens
}
