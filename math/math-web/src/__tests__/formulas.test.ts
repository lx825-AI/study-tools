import { describe, it, expect } from 'vitest';
import formulaData, { SECTION_ORDER, getSectionTitle } from '../data/formulas';
// 类型通过 formulaData 推断，无需显式导入

const SUBJECT_PREFIX_MAP: Record<string, string> = {
  'calc-': '高等数学',
  'linalg-': '线性代数',
  'disc-': '离散数学',
  'prob-': '概率统计',
};

describe('formulaData', () => {
  it('每个 section 有有效的 id、title、subject 和 formulas', () => {
    for (const [sectionId, section] of Object.entries(formulaData)) {
      expect(section.id).toBe(sectionId);
      expect(section.title).toBeTruthy();
      expect(section.subject).toBeTruthy();
      expect(Array.isArray(section.formulas)).toBe(true);
      expect(section.formulas.length).toBeGreaterThan(0);
    }
  });

  it('sectionId 前缀对应正确的学科', () => {
    for (const [sectionId, section] of Object.entries(formulaData)) {
      const prefix = Object.keys(SUBJECT_PREFIX_MAP).find(p => sectionId.startsWith(p));
      if (prefix) {
        expect(section.subject).toBe(SUBJECT_PREFIX_MAP[prefix]);
      }
    }
  });

  it('每条公式有非空的 name、latex、note', () => {
    for (const [, section] of Object.entries(formulaData)) {
      for (const f of section.formulas) {
        expect(f.name).toBeTruthy();
        expect(f.latex).toBeTruthy();
        expect(f.note).toBeTruthy();
      }
    }
  });

  it('同一 section 内公式 name 不重复', () => {
    for (const [, section] of Object.entries(formulaData)) {
      const names = section.formulas.map(f => f.name);
      const unique = new Set(names);
      expect(unique.size).toBe(names.length);
    }
  });

  it('level 值（如有）必须是 valid 值', () => {
    const validLevels = ['basic', 'important', 'advanced'];
    for (const [, section] of Object.entries(formulaData)) {
      for (const f of section.formulas) {
        if (f.level) {
          expect(validLevels).toContain(f.level);
        }
      }
    }
  });

  it('SECTION_ORDER 与 formulaData 的 keys 一致', () => {
    const dataKeys = Object.keys(formulaData);
    expect(SECTION_ORDER).toEqual(dataKeys);
  });

  it('getSectionTitle 对已知 id 返回正确标题', () => {
    expect(getSectionTitle('calc-limit')).toBe('函数与极限');
  });

  it('getSectionTitle 对未知 id 返回空字符串', () => {
    expect(getSectionTitle('nonexistent')).toBe('');
  });
});
