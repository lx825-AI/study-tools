export type Subject = '高等数学' | '线性代数' | '离散数学' | '概率统计' | '数值分析';

export type Level = 'basic' | 'important' | 'advanced';

export type ThemeMode = 'auto' | 'dark' | 'light';

export interface Formula {
  name: string;
  latex: string;
  note: string;
  detail: string;
  level?: Level;
}

export interface Section {
  id: string;
  title: string;
  subject: Subject;
  formulas: Formula[];
}

export interface FavoriteEntry {
  sectionId: string;
  formulaIndex: number;
}

export type FormulaMap = Record<string, Section>;
