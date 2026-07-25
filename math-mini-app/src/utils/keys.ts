/**
 * 公式定位 key：格式 {grade}:{sectionId}:{index}（V2 多学段预埋，V1 grade 恒为 university）
 */

export const GRADE = 'university'

export function formulaKey(sectionId: string, index: number): string {
  return `${GRADE}:${sectionId}:${index}`
}

export function parseFormulaKey(key: string): { sectionId: string; formulaIndex: number } {
  const parts = key.split(':')
  return {
    sectionId: parts.slice(1, -1).join(':'),
    formulaIndex: Number(parts[parts.length - 1]),
  }
}

/** 云端业务 key（云函数会拼接 openid 前缀组成文档 _id） */
export function cloudKey(sectionId: string, index: number): string {
  return `${GRADE}_${sectionId}_${index}`
}
