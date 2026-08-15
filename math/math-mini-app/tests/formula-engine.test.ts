import { describe, it, expect } from 'vitest'
import { tokenize } from '@/utils/formula/tokenizer'
import { parseLatex, type Node } from '@/utils/formula/parser'
import { FormulaRenderer } from '@/utils/formula/renderer'
import type { CtxLike } from '@/utils/formula/layout'
import formulaData from '@/data/formulas-university'

const ALL_FORMULAS = Object.values(formulaData).flatMap((s) => s.formulas)

/** 模拟 Canvas 2D 上下文：宽度按字号 × 0.5em/字符估算 */
function createMockCtx(): CtxLike & { fillTextCalls: string[] } {
  const fillTextCalls: string[] = []
  return {
    font: '',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    fillTextCalls,
    measureText(text: string) {
      const m = /(\d+(?:\.\d+)?)px/.exec(this.font)
      const size = m ? parseFloat(m[1]) : 18
      return { width: text.length * size * 0.5 }
    },
    fillText(text: string) {
      fillTextCalls.push(text)
    },
    fillRect() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    stroke() {},
    save() {},
    restore() {},
    translate() {},
    scale() {},
  }
}

describe('tokenizer', () => {
  it('拆解结构符号与命令', () => {
    expect(tokenize('\\frac{1}{2}')).toEqual([
      { type: 'command', name: 'frac' },
      { type: 'lbrace' },
      { type: 'char', value: '1' },
      { type: 'rbrace' },
      { type: 'lbrace' },
      { type: 'char', value: '2' },
      { type: 'rbrace' },
    ])
  })

  it('识别 _ ^ & \\\\ 与单字符命令', () => {
    const tokens = tokenize('x_i^2 & a \\\\ b \\, \\{')
    const types = tokens.map((t) => t.type)
    expect(types).toContain('sub')
    expect(types).toContain('sup')
    expect(types).toContain('amp')
    expect(types).toContain('break')
    expect(tokens).toContainEqual({ type: 'command', name: ',' })
    expect(tokens).toContainEqual({ type: 'command', name: '{' })
  })

  it('177 条公式全部可 tokenize', () => {
    for (const f of ALL_FORMULAS) {
      expect(() => tokenize(f.latex), `tokenize 失败: ${f.name}`).not.toThrow()
    }
  })
})

describe('parser', () => {
  const first = (latex: string): Node => parseLatex(latex)[0]

  it('分数 → frac 节点', () => {
    const n = first('\\frac{1}{2}')
    expect(n.type).toBe('frac')
  })

  it('上下标 → subsup 节点', () => {
    const n = first('x_i^2')
    expect(n).toMatchObject({ type: 'subsup' })
    if (n.type === 'subsup') {
      expect(n.sub).not.toBeNull()
      expect(n.sup).not.toBeNull()
      expect(n.limits).toBe(false)
    }
  })

  it('\\sum 上下限 → limits=true', () => {
    const n = first('\\sum_{i=1}^{n}')
    if (n.type !== 'subsup') throw new Error('应为 subsup')
    expect(n.limits).toBe(true)
    expect(n.base[0]).toMatchObject({ type: 'op', name: 'sum' })
  })

  it('\\lim 上下限 → limits=true 且正体', () => {
    const n = first('\\lim_{x \\to 0}')
    if (n.type !== 'subsup') throw new Error('应为 subsup')
    expect(n.limits).toBe(true)
    expect(n.base[0]).toMatchObject({ type: 'op', glyph: 'lim' })
  })

  it('\\int 上下限放侧面 → limits=false', () => {
    const n = first('\\int_0^1')
    if (n.type !== 'subsup') throw new Error('应为 subsup')
    expect(n.limits).toBe(false)
  })

  it('根号（含次数）→ sqrt 节点', () => {
    const n = first('\\sqrt[3]{x}')
    if (n.type !== 'sqrt') throw new Error('应为 sqrt')
    expect(n.index).not.toBeNull()
  })

  it('\\left \\right → delim 节点', () => {
    const n = first('\\left( x \\right)')
    expect(n).toMatchObject({ type: 'delim', left: '(', right: ')' })
  })

  it('pmatrix 环境 → 2×2 矩阵带括号', () => {
    const n = first('\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}')
    if (n.type !== 'matrix') throw new Error('应为 matrix')
    expect(n.rows.length).toBe(2)
    expect(n.rows[0].length).toBe(2)
    expect(n.left).toBe('(')
    expect(n.right).toBe(')')
  })

  it('aligned 环境按 & 分列、\\\\ 分行', () => {
    const n = first('\\begin{aligned} a &= b \\\\ c &= d \\end{aligned}')
    if (n.type !== 'matrix') throw new Error('应为 matrix')
    expect(n.rows.length).toBe(2)
    expect(n.env).toBe('aligned')
  })

  it('希腊字母映射为 Unicode', () => {
    const nodes = parseLatex('\\alpha + \\beta')
    expect(nodes[0]).toMatchObject({ type: 'text', value: 'α' })
    expect(nodes[2]).toMatchObject({ type: 'text', value: 'β' })
  })

  it('未知命令降级为文本节点，不抛异常', () => {
    expect(() => parseLatex('\\foobar{x}')).not.toThrow()
    expect(first('\\foobar')).toMatchObject({ type: 'text', value: 'foobar' })
  })

  it('177 条公式全部可解析', () => {
    for (const f of ALL_FORMULAS) {
      const nodes = parseLatex(f.latex)
      expect(nodes.length, `解析结果为空: ${f.name} ${f.latex}`).toBeGreaterThan(0)
    }
  })
})

describe('renderer', () => {
  it('简单公式 measure 尺寸合理', () => {
    const r = new FormulaRenderer()
    const ctx = createMockCtx()
    const size = r.measure('x^2 + y^2', ctx, 18)
    expect(size.width).toBeGreaterThan(0)
    expect(size.height).toBeGreaterThan(10)
  })

  it('分数比单行文本更高', () => {
    const r = new FormulaRenderer()
    const ctx = createMockCtx()
    const plain = r.measure('abc', ctx, 18)
    const frac = r.measure('\\frac{a+b}{c}', ctx, 18)
    expect(frac.height).toBeGreaterThan(plain.height * 1.5)
  })

  it('draw 产生 fillText 调用', () => {
    const r = new FormulaRenderer()
    const ctx = createMockCtx()
    r.draw('\\frac{\\sin x}{x}', ctx, { fontSize: 18 })
    expect(ctx.fillTextCalls.length).toBeGreaterThan(0)
  })

  it('LRU 缓存命中（重复 measure 不报错且结果一致）', () => {
    const r = new FormulaRenderer()
    const ctx = createMockCtx()
    const a = r.measure('e^{i\\pi} + 1 = 0', ctx, 18)
    const b = r.measure('e^{i\\pi} + 1 = 0', ctx, 18)
    expect(a).toEqual(b)
  })

  it('177 条公式全部可渲染（M1 门槛：measure + draw 无异常、尺寸为正）', () => {
    const r = new FormulaRenderer()
    const ctx = createMockCtx()
    const failures: string[] = []
    for (const f of ALL_FORMULAS) {
      try {
        const size = r.measure(f.latex, ctx, 18)
        if (size.width <= 0 || size.height <= 0) failures.push(`${f.name}: 尺寸非法`)
        r.draw(f.latex, ctx, { fontSize: 18 })
      } catch (e) {
        failures.push(`${f.name}: ${String(e)}`)
      }
    }
    expect(failures, failures.join('\n')).toEqual([])
  })
})
