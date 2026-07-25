/**
 * 5 大学科元数据：颜色/图标/章节 ID 前缀，供首页、章节列表、筛选面板共用。
 */
import type { Subject } from './types'

export interface SubjectMeta {
  id: string // 章节 ID 前缀（calc / linalg / disc / prob / num）
  name: Subject
  emoji: string
  color: string
  desc: string
}

export const SUBJECTS: SubjectMeta[] = [
  { id: 'calc', name: '高等数学', emoji: '📊', color: '#0984e3', desc: '极限 · 微积分 · 级数' },
  { id: 'linalg', name: '线性代数', emoji: '🧮', color: '#6c5ce7', desc: '矩阵 · 向量 · 特征值' },
  { id: 'disc', name: '离散数学', emoji: '🔢', color: '#00b894', desc: '逻辑 · 图论 · 组合' },
  { id: 'prob', name: '概率统计', emoji: '🎲', color: '#e17055', desc: '分布 · 检验 · 回归' },
  { id: 'num', name: '数值分析', emoji: '💻', color: '#fdcb6e', desc: '插值 · 积分 · 求根' },
]

export function subjectOfSection(sectionId: string): SubjectMeta {
  const prefix = sectionId.split('-')[0]
  return SUBJECTS.find((s) => s.id === prefix) ?? SUBJECTS[0]
}

export const LEVEL_META: Record<string, { label: string; color: string }> = {
  basic: { label: '基础', color: '#00b894' },
  important: { label: '重点', color: '#e17055' },
  advanced: { label: '进阶', color: '#6c5ce7' },
}
