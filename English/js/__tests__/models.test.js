/**
 * models.js 测试 —— ID生成、难度计算、词规范化
 */
import { describe, it, expect } from 'vitest';

const App = window.FlashcardApp;

describe('genId', () => {
  it('应生成非空字符串', () => {
    expect(typeof App.genId()).toBe('string');
    expect(App.genId().length).toBeGreaterThan(0);
  });

  it('连续生成应不重复', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) ids.add(App.genId());
    expect(ids.size).toBe(100);
  });
});

describe('avgDifficulty', () => {
  it('空牌组返回 0', () => {
    expect(App.avgDifficulty({ cards: [] })).toBe(0);
  });

  it('单卡牌组返回该卡难度', () => {
    expect(App.avgDifficulty({ cards: [{ difficulty: 3 }] })).toBe(3);
  });

  it('多卡牌组返回平均值', () => {
    expect(App.avgDifficulty({ cards: [
      { difficulty: 1 }, { difficulty: 5 }, { difficulty: 3 }
    ]})).toBe(3);
  });

  it('缺少 difficulty 字段的卡片计为 0', () => {
    expect(App.avgDifficulty({ cards: [
      { difficulty: 4 }, {}
    ]})).toBe(2);
  });
});

describe('normalizeWord', () => {
  it('数组格式转换为扩展格式', () => {
    const result = App.normalizeWord(['book', '书']);
    expect(result.word).toBe('book');
    expect(result.definitions).toEqual(['书']);
    expect(result.phonetic).toBe('');
    expect(result.pos).toBe('');
  });

  it('对象格式原样返回', () => {
    const input = { word: 'book', definitions: ['书'], phonetic: '/bʊk/' };
    expect(App.normalizeWord(input)).toBe(input);
  });
});
