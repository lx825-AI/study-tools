/**
 * 公式渲染器公共入口：LaTeX → measure → Canvas 绘制。
 * LRU 缓存 200 条布局结果，重复渲染同一公式时跳过 measure 阶段。
 */
import { LRUCache } from '../cache'
import { parseLatex, type Node } from './parser'
import { CharMetrics, type MeasureFn } from './metrics'
import { LayoutEngine, type Box, type CtxLike } from './layout'

export interface CanvasLike {
  width: number
  height: number
  getContext(type: '2d'): CtxLike
}

export interface RenderOptions {
  fontSize?: number // 基础字号（逻辑 px），默认 18
  color?: string // 公式颜色，默认深灰
  dpr?: number // 设备像素比，默认 1
  padding?: number // 四周留白（逻辑 px），默认 4
}

export interface RenderResult {
  width: number
  height: number
}

interface LayoutEntry {
  nodes: Node[]
  box: Box
}

function makeMeasurer(ctx: CtxLike): MeasureFn {
  return (text, font) => {
    ctx.font = font
    return ctx.measureText(text).width
  }
}

export class FormulaRenderer {
  private cache = new LRUCache<string, LayoutEntry>(200)

  private layout(latex: string, ctx: CtxLike, fontSize: number): LayoutEntry {
    const key = `${fontSize}|${latex}`
    let entry = this.cache.get(key)
    if (!entry) {
      const nodes = parseLatex(latex)
      const engine = new LayoutEngine(new CharMetrics(makeMeasurer(ctx)))
      entry = { nodes, box: engine.measureNodes(nodes, fontSize) }
      this.cache.set(key, entry)
    }
    return entry
  }

  /** 测量公式渲染后的逻辑尺寸（含 padding） */
  measure(latex: string, ctx: CtxLike, fontSize = 18, padding = 4): RenderResult {
    const { box } = this.layout(latex, ctx, fontSize)
    return {
      width: Math.ceil(box.w) + padding * 2,
      height: Math.ceil(box.h + box.d) + padding * 2,
    }
  }

  /** 在 ctx 上绘制公式（假定画布尺寸已按 measure 结果设置并做过 dpr 缩放） */
  draw(latex: string, ctx: CtxLike, opts: RenderOptions = {}): void {
    const { fontSize = 18, color = '#2d3436', padding = 4 } = opts
    const { nodes, box } = this.layout(latex, ctx, fontSize)
    const engine = new LayoutEngine(new CharMetrics(makeMeasurer(ctx)))
    engine.drawNodes(ctx, nodes, padding, padding + box.h, fontSize, color)
  }

  /** 一站式渲染：测量 → 按 dpr 设置画布尺寸 → 绘制，返回逻辑尺寸 */
  render(latex: string, canvas: CanvasLike, opts: RenderOptions = {}): RenderResult {
    const dpr = opts.dpr ?? 1
    const ctx = canvas.getContext('2d')
    const size = this.measure(latex, ctx, opts.fontSize, opts.padding)
    canvas.width = size.width * dpr
    canvas.height = size.height * dpr
    // 设置画布尺寸会重置 ctx 状态，需重新缩放
    const scalable = ctx as CtxLike & { scale?: (x: number, y: number) => void }
    if (dpr !== 1 && typeof scalable.scale === 'function') {
      scalable.scale(dpr, dpr)
    }
    this.draw(latex, ctx, opts)
    return size
  }
}

/** 共享单例（LRU 缓存跨组件复用） */
export const formulaRenderer = new FormulaRenderer()
