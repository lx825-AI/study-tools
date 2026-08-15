/**
 * 字符宽度度量：基于 ctx.measureText 的模块级缓存，避免运行时重复测量。
 */
import type { FontStyle } from './parser'

export type MeasureFn = (text: string, font: string) => number

/** 跨实例共享的宽度缓存（key = font|text） */
const widthCache = new Map<string, number>()

const FONT_FAMILY = '"Times New Roman", "Songti SC", "SimSun", serif'

export function fontString(style: FontStyle, size: number): string {
  switch (style) {
    case 'italic':
      return `italic ${size}px ${FONT_FAMILY}`
    case 'bold':
      return `bold ${size}px ${FONT_FAMILY}`
    case 'cal':
      return `italic ${size}px ${FONT_FAMILY}` // 无花体字体，用斜体近似
    default:
      return `${size}px ${FONT_FAMILY}`
  }
}

export class CharMetrics {
  constructor(private measure: MeasureFn) {}

  width(text: string, font: string): number {
    const key = `${font}|${text}`
    let w = widthCache.get(key)
    if (w === undefined) {
      w = this.measure(text, font)
      widthCache.set(key, w)
    }
    return w
  }
}
