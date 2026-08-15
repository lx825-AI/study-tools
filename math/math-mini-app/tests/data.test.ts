import { describe, it, expect } from 'vitest'
import formulaData, { SECTION_ORDER, getSectionTitle } from '@/data/formulas-university'
import type { Subject } from '@/data/types'

const SUBJECTS: Subject[] = ['高等数学', '线性代数', '离散数学', '概率统计', '数值分析']

describe('公式数据完整性', () => {
  const sectionIds = Object.keys(formulaData)
  const allFormulas = sectionIds.flatMap((id) => formulaData[id].formulas)

  it('覆盖 5 大学科', () => {
    const subjects = new Set(sectionIds.map((id) => formulaData[id].subject))
    expect(subjects.size).toBe(5)
    for (const s of SUBJECTS) expect(subjects.has(s)).toBe(true)
  })

  it('包含 34 个章节、177 条公式', () => {
    expect(sectionIds.length).toBe(34)
    expect(allFormulas.length).toBe(177)
  })

  it('每个 section 的 key 与 id 一致，且属于合法学科', () => {
    for (const id of sectionIds) {
      expect(formulaData[id].id).toBe(id)
      expect(SUBJECTS).toContain(formulaData[id].subject)
      expect(formulaData[id].title.length).toBeGreaterThan(0)
      expect(formulaData[id].formulas.length).toBeGreaterThan(0)
    }
  })

  it('每条公式 name/latex/note 非空，level 合法', () => {
    for (const f of allFormulas) {
      expect(f.name.trim().length).toBeGreaterThan(0)
      expect(f.latex.trim().length).toBeGreaterThan(0)
      expect(f.note.trim().length).toBeGreaterThan(0)
      if (f.level) expect(['basic', 'important', 'advanced']).toContain(f.level)
    }
  })

  it('SECTION_ORDER 与数据 key 一致，getSectionTitle 可用', () => {
    expect(SECTION_ORDER.length).toBe(sectionIds.length)
    expect(getSectionTitle('calc-limit')).toBe(formulaData['calc-limit'].title)
    expect(getSectionTitle('不存在的id')).toBe('')
  })
})
