/**
 * 公式布局引擎：measure（递归计算 Box）→ draw（递归绘制）两阶段。
 * Box 模型：w 宽，h 基线上方高度，d 基线下方深度（总高 = h + d）。
 */
import type { Node, FontStyle } from './parser'
import type { CharMetrics } from './metrics'
import { fontString } from './metrics'

export interface Box {
  w: number
  h: number
  d: number
}

/** Canvas 2D 上下文最小接口（微信 Canvas2D 与浏览器均满足） */
export interface CtxLike {
  font: string
  fillStyle: string
  strokeStyle: string
  lineWidth: number
  measureText(text: string): { width: number }
  fillText(text: string, x: number, y: number): void
  fillRect(x: number, y: number, w: number, h: number): void
  beginPath(): void
  moveTo(x: number, y: number): void
  lineTo(x: number, y: number): void
  stroke(): void
  save(): void
  restore(): void
  translate(x: number, y: number): void
  scale(x: number, y: number): void
}

const SCRIPT = 0.7 // 上下标字号缩放
const AXIS = 0.25 // 数学轴高度（分数线位置），单位 em
const SUBSHIFT = 0.3 // 下标基线下移，单位 em
const SUPSHIFT = 0.5 // 上标基线上移，单位 em

export class LayoutEngine {
  constructor(private m: CharMetrics) {}

  // ================= measure =================

  measureNodes(nodes: Node[], size: number): Box {
    let w = 0
    let h = 0
    let d = 0
    for (const n of nodes) {
      const b = this.measureNode(n, size)
      w += b.w
      h = Math.max(h, b.h)
      d = Math.max(d, b.d)
    }
    return { w, h, d }
  }

  measureNode(node: Node, size: number): Box {
    switch (node.type) {
      case 'text':
        return { w: this.textWidth(node.value, node.style, size), h: size * 0.75, d: size * 0.25 }
      case 'op': {
        if (node.glyph.length > 1) {
          // lim 等多字符运算符：正体正常大小
          return { w: this.textWidth(node.glyph, 'upright', size), h: size * 0.75, d: size * 0.25 }
        }
        return { w: this.textWidth(node.glyph, 'upright', size * 1.2), h: size * 0.85, d: size * 0.3 }
      }
      case 'space':
        return { w: node.width * size, h: 0, d: 0 }
      case 'frac': {
        const num = this.measureNodes(node.num, size)
        const den = this.measureNodes(node.den, size)
        const lw = this.lineWidth(size)
        const gap = size * 0.2
        const axis = size * AXIS
        return {
          w: Math.max(num.w, den.w) + size * 0.3,
          h: axis + lw / 2 + gap + num.d + num.h,
          d: gap + den.h + den.d + lw / 2 - axis,
        }
      }
      case 'sqrt': {
        const c = this.measureNodes(node.content, size)
        return { w: size * 0.65 + c.w + size * 0.15, h: c.h + size * 0.15, d: c.d }
      }
      case 'subsup':
        return this.measureSubsup(node, size)
      case 'delim':
        return this.measureDelim(node.left, node.right, node.content, size)
      case 'accent': {
        const c = this.measureNodes(node.content, size)
        // 横线类装饰空间需求小；字形类（hat/vec/dot/tilde）需容纳字形上升高度
        const glyph = node.accent !== 'bar' && node.accent !== 'overline'
        return { w: c.w, h: c.h + size * (glyph ? 0.5 : 0.28), d: c.d }
      }
      case 'matrix':
        return this.measureMatrix(node, size)
      case 'xarrow': {
        const c = this.measureNodes(node.content, size * SCRIPT)
        return { w: Math.max(c.w + size * 0.5, size * 1.8), h: c.h + c.d + size * 0.3, d: size * 0.2 }
      }
      case 'binom': {
        const t = this.measureNodes(node.top, size)
        const b = this.measureNodes(node.bottom, size)
        const gap = size * 0.15
        const contentH = t.h + t.d + gap + b.h + b.d
        const delimW = this.delimWidth('(', contentH + size * 0.3, size) * 2
        return {
          w: Math.max(t.w, b.w) + delimW + size * 0.3,
          h: contentH / 2 + size * 0.15,
          d: contentH / 2 + size * 0.15,
        }
      }
    }
  }

  private measureSubsup(node: Extract<Node, { type: 'subsup' }>, size: number): Box {
    const base = this.measureNodes(node.base, size)
    const ss = size * SCRIPT
    const sup = node.sup ? this.measureNodes(node.sup, ss) : null
    const sub = node.sub ? this.measureNodes(node.sub, ss) : null
    if (node.limits) {
      return {
        w: Math.max(base.w, sup?.w ?? 0, sub?.w ?? 0) + size * 0.1,
        h: base.h + (sup ? sup.h + sup.d + size * 0.15 : 0),
        d: base.d + (sub ? sub.h + sub.d + size * 0.15 : 0),
      }
    }
    return {
      w: base.w + (sup || sub ? size * 0.08 + Math.max(sup?.w ?? 0, sub?.w ?? 0) : 0),
      h: Math.max(base.h, sup ? size * SUPSHIFT + sup.h : 0),
      d: Math.max(base.d, sub ? size * SUBSHIFT + sub.d : 0),
    }
  }

  private measureDelim(left: string, right: string, content: Node[], size: number): Box {
    const c = this.measureNodes(content, size)
    const h = c.h + size * 0.08
    const d = c.d + size * 0.08
    const total = h + d
    const wl = left ? this.delimWidth(left, total, size) + size * 0.12 : 0
    const wr = right ? this.delimWidth(right, total, size) + size * 0.12 : 0
    return { w: wl + c.w + wr, h, d }
  }

  private measureMatrix(node: Extract<Node, { type: 'matrix' }>, size: number): Box {
    const layout = this.matrixLayout(node, size)
    const delimW =
      (node.left ? this.delimWidth(node.left, layout.contentH, size) + size * 0.1 : 0) +
      (node.right ? this.delimWidth(node.right, layout.contentH, size) + size * 0.1 : 0)
    return {
      w: delimW + layout.contentW,
      h: layout.contentH / 2 + size * 0.1,
      d: layout.contentH / 2 + size * 0.1,
    }
  }

  // ================= draw =================

  drawNodes(ctx: CtxLike, nodes: Node[], x: number, baseline: number, size: number, color: string): number {
    for (const n of nodes) x = this.drawNode(ctx, n, x, baseline, size, color)
    return x
  }

  drawNode(ctx: CtxLike, node: Node, x: number, baseline: number, size: number, color: string): number {
    const box = this.measureNode(node, size)
    switch (node.type) {
      case 'text':
        this.setFont(ctx, node.style, size, color)
        ctx.fillText(node.value, x, baseline)
        break
      case 'op': {
        const multi = node.glyph.length > 1
        this.setFont(ctx, 'upright', multi ? size : size * 1.2, color)
        ctx.fillText(node.glyph, x, baseline)
        break
      }
      case 'space':
        break
      case 'frac': {
        const num = this.measureNodes(node.num, size)
        const den = this.measureNodes(node.den, size)
        const lw = this.lineWidth(size)
        const gap = size * 0.2
        const barY = baseline - size * AXIS
        ctx.fillStyle = color
        ctx.fillRect(x, barY - lw / 2, box.w, lw)
        this.drawNodes(ctx, node.num, x + (box.w - num.w) / 2, barY - lw / 2 - gap - num.d, size, color)
        this.drawNodes(ctx, node.den, x + (box.w - den.w) / 2, barY + lw / 2 + gap + den.h, size, color)
        break
      }
      case 'sqrt': {
        const c = this.measureNodes(node.content, size)
        const rw = size * 0.65
        const top = baseline - box.h
        const lw = this.lineWidth(size)
        ctx.strokeStyle = color
        ctx.lineWidth = lw
        ctx.beginPath()
        ctx.moveTo(x + rw * 0.05, baseline - box.h * 0.35)
        ctx.lineTo(x + rw * 0.35, baseline + c.d - size * 0.05)
        ctx.lineTo(x + rw * 0.6, top)
        ctx.lineTo(x + box.w, top)
        ctx.stroke()
        if (node.index) {
          this.drawNodes(ctx, node.index, x - size * 0.1, baseline - box.h * 0.45, size * SCRIPT, color)
        }
        this.drawNodes(ctx, node.content, x + rw + size * 0.08, baseline, size, color)
        break
      }
      case 'subsup':
        this.drawSubsup(ctx, node, x, baseline, size, color, box)
        break
      case 'delim': {
        const c = this.measureNodes(node.content, size)
        const total = box.h + box.d
        const centerY = baseline + (box.d - box.h) / 2
        let cx = x
        if (node.left) cx = this.drawDelimChar(ctx, node.left, cx, centerY, total, size, color)
        this.drawNodes(ctx, node.content, cx, baseline, size, color)
        cx += c.w
        if (node.right) this.drawDelimChar(ctx, node.right, cx, centerY, total, size, color)
        break
      }
      case 'accent':
        this.drawAccent(ctx, node, x, baseline, size, color)
        break
      case 'matrix':
        this.drawMatrix(ctx, node, x, baseline, size, color, box)
        break
      case 'xarrow': {
        const c = this.measureNodes(node.content, size * SCRIPT)
        const arrowY = baseline - size * 0.05
        const head = size * 0.35
        ctx.strokeStyle = color
        ctx.lineWidth = this.lineWidth(size)
        ctx.beginPath()
        ctx.moveTo(x, arrowY)
        ctx.lineTo(x + box.w, arrowY)
        ctx.moveTo(x + box.w - head, arrowY - head * 0.55)
        ctx.lineTo(x + box.w, arrowY)
        ctx.lineTo(x + box.w - head, arrowY + head * 0.55)
        ctx.stroke()
        this.drawNodes(ctx, node.content, x + (box.w - c.w) / 2, arrowY - size * 0.2 - c.d, size * SCRIPT, color)
        break
      }
      case 'binom': {
        const t = this.measureNodes(node.top, size)
        const b = this.measureNodes(node.bottom, size)
        const total = box.h + box.d
        const centerY = baseline + (box.d - box.h) / 2
        const gap = size * 0.15
        const contentW = Math.max(t.w, b.w)
        let cx = this.drawDelimChar(ctx, '(', x, centerY, total, size, color)
        cx += size * 0.06
        this.drawNodes(ctx, node.top, cx + (contentW - t.w) / 2, centerY - gap / 2 - t.d, size, color)
        this.drawNodes(ctx, node.bottom, cx + (contentW - b.w) / 2, centerY + gap / 2 + b.h, size, color)
        this.drawDelimChar(ctx, ')', cx + contentW + size * 0.06, centerY, total, size, color)
        break
      }
    }
    return x + box.w
  }

  private drawSubsup(
    ctx: CtxLike, node: Extract<Node, { type: 'subsup' }>,
    x: number, baseline: number, size: number, color: string, box: Box,
  ) {
    const base = this.measureNodes(node.base, size)
    const ss = size * SCRIPT
    const sup = node.sup ? this.measureNodes(node.sup, ss) : null
    const sub = node.sub ? this.measureNodes(node.sub, ss) : null
    if (node.limits) {
      const baseX = x + (box.w - base.w) / 2
      if (sup && node.sup) {
        this.drawNodes(ctx, node.sup, x + (box.w - sup.w) / 2, baseline - base.h - size * 0.15 - sup.d, ss, color)
      }
      this.drawNodes(ctx, node.base, baseX, baseline, size, color)
      if (sub && node.sub) {
        this.drawNodes(ctx, node.sub, x + (box.w - sub.w) / 2, baseline + base.d + size * 0.15 + sub.h, ss, color)
      }
      return
    }
    this.drawNodes(ctx, node.base, x, baseline, size, color)
    const scriptX = x + base.w + size * 0.08
    if (sup && node.sup) this.drawNodes(ctx, node.sup, scriptX, baseline - size * SUPSHIFT, ss, color)
    if (sub && node.sub) this.drawNodes(ctx, node.sub, scriptX, baseline + size * SUBSHIFT, ss, color)
  }

  private drawAccent(
    ctx: CtxLike, node: Extract<Node, { type: 'accent' }>,
    x: number, baseline: number, size: number, color: string,
  ) {
    const c = this.measureNodes(node.content, size)
    this.drawNodes(ctx, node.content, x, baseline, size, color)
    const topY = baseline - c.h
    if (node.accent === 'bar' || node.accent === 'overline') {
      ctx.fillStyle = color
      ctx.fillRect(x, topY - size * 0.18, c.w, this.lineWidth(size))
      return
    }
    const marks: Record<string, string> = { hat: '∧', vec: '→', dot: '˙', ddot: '¨', tilde: '~' }
    const mark = marks[node.accent] ?? node.accent
    const ss = size * 0.8
    const w = this.textWidth(mark, 'upright', ss)
    this.setFont(ctx, 'upright', ss, color)
    ctx.fillText(mark, x + (c.w - w) / 2, topY + size * 0.05)
  }

  // ================= matrix 辅助 =================

  private matrixLayout(node: Extract<Node, { type: 'matrix' }>, size: number) {
    const cellSize = node.env === 'substack' ? size * 0.8 : size
    const boxes = node.rows.map((row) => row.map((cell) => this.measureNodes(cell, cellSize)))
    const cols = Math.max(...node.rows.map((r) => r.length))
    const colGap = node.env === 'aligned' ? size * 0.5 : size * 0.8
    const rowGap = size * 0.35
    const colW: number[] = Array(cols).fill(0)
    const rowH: number[] = []
    const rowD: number[] = []
    boxes.forEach((row, r) => {
      let h = 0
      let d = 0
      row.forEach((b, c) => {
        colW[c] = Math.max(colW[c], b.w)
        h = Math.max(h, b.h)
        d = Math.max(d, b.d)
      })
      rowH.push(h)
      rowD.push(d)
    })
    const contentW = colW.reduce((a, b) => a + b, 0) + (cols - 1) * colGap
    const contentH =
      rowH.reduce((a, b, i) => a + b + rowD[i], 0) + (node.rows.length - 1) * rowGap + size * 0.2
    return { boxes, colW, rowH, rowD, colGap, rowGap, cellSize, contentW, contentH }
  }

  private drawMatrix(
    ctx: CtxLike, node: Extract<Node, { type: 'matrix' }>,
    x: number, baseline: number, size: number, color: string, box: Box,
  ) {
    const L = this.matrixLayout(node, size)
    const total = box.h + box.d
    const centerY = baseline + (box.d - box.h) / 2
    let cx = x
    if (node.left) cx = this.drawDelimChar(ctx, node.left, cx, centerY, total, size, color)
    let rowY = baseline - total / 2 + size * 0.1 // 第一行的顶部
    node.rows.forEach((row, r) => {
      const rowBaseline = rowY + L.rowH[r]
      let cellX = cx
      row.forEach((cell, c) => {
        const b = L.boxes[r][c]
        const alignRight = node.env === 'aligned' && c % 2 === 0
        const dx = alignRight
          ? L.colW[c] - b.w
          : node.env === 'cases' || node.env === 'aligned'
            ? 0
            : (L.colW[c] - b.w) / 2
        this.drawNodes(ctx, cell, cellX + dx, rowBaseline, L.cellSize, color)
        cellX += L.colW[c] + L.colGap
      })
      rowY += L.rowH[r] + L.rowD[r] + L.rowGap
    })
    if (node.right) {
      this.drawDelimChar(ctx, node.right, cx + L.contentW, centerY, total, size, color)
    }
  }

  // ================= 基础辅助 =================

  private textWidth(value: string, style: FontStyle, size: number): number {
    return this.m.width(value, fontString(style, size))
  }

  private setFont(ctx: CtxLike, style: FontStyle, size: number, color: string) {
    ctx.font = fontString(style, size)
    ctx.fillStyle = color
  }

  private lineWidth(size: number): number {
    return Math.max(1, size * 0.055)
  }

  /** 定界符宽度：始终用基准字号测量（纵向拉伸后宽度不变） */
  private delimWidth(_char: string, _total: number, size: number): number {
    return this.textWidth(_char, 'upright', size)
  }

  /** 绘制定界符：ctx.scale(1, ratio) 纵向拉伸替代字号放大，括号不会因内容增高而过宽 */
  private drawDelimChar(
    ctx: CtxLike, char: string, x: number, centerY: number,
    total: number, size: number, color: string,
  ): number {
    const w = this.textWidth(char, 'upright', size)
    if (total <= size * 1.1) {
      // 内容高度不大 → 正常字号绘制即可
      this.setFont(ctx, 'upright', size, color)
      ctx.fillText(char, x, centerY + size * 0.25)
    } else {
      const ratio = total / size
      ctx.save()
      ctx.translate(x, centerY + size * 0.25 * ratio)
      ctx.scale(1, ratio)
      this.setFont(ctx, 'upright', size, color)
      ctx.fillText(char, 0, 0)
      ctx.restore()
    }
    return x + w + size * 0.12
  }
}
