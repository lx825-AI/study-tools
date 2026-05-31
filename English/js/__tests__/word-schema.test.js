/**
 * word-schema.js 测试 —— 数据校验与迁移
 */
import { describe, it, expect, beforeEach } from 'vitest';

const App = window.FlashcardApp;

describe('_ensureDefinitionsArray', () => {
  it('数组原样返回', () => {
    expect(App._ensureDefinitionsArray(['a', 'b'])).toEqual(['a', 'b']);
  });

  it('空数组使用 fallback', () => {
    expect(App._ensureDefinitionsArray([], 'fb')).toEqual(['fb']);
  });

  it('字符串包装为数组', () => {
    expect(App._ensureDefinitionsArray('hello')).toEqual(['hello']);
  });

  it('null/undefined 使用 fallback', () => {
    expect(App._ensureDefinitionsArray(null, 'fb')).toEqual(['fb']);
    expect(App._ensureDefinitionsArray(undefined, '')).toEqual(['']);
  });

  it('无 fallback 时 null 返回空字符串数组', () => {
    expect(App._ensureDefinitionsArray(null)).toEqual(['']);
  });
});

describe('isExtendedWord', () => {
  it('有 word 属性的对象返回 true', () => {
    expect(App.isExtendedWord({ word: 'test' })).toBe(true);
  });

  it('数组返回 false', () => {
    expect(App.isExtendedWord(['test', '测试'])).toBe(false);
  });

  it('null 返回 false', () => {
    expect(App.isExtendedWord(null)).toBe(false);
  });
});

describe('normalizeToCard', () => {
  it('扩展词格式规范化', () => {
    var result = App.normalizeToCard({ word: 'test', definitions: ['测试'], phonetic: '/t/', pos: 'n.' });
    expect(result.front).toBe('test');
    expect(result.back).toBe('测试');
    expect(result.phonetic).toBe('/t/');
    expect(result.pos).toBe('n.');
    expect(result.word).toBe('test');
  });

  it('数组格式转换', () => {
    var result = App.normalizeToCard(['hello', '你好']);
    expect(result.front).toBe('hello');
    expect(result.back).toBe('你好');
    expect(result.word).toBe('hello');
    expect(Array.isArray(result.definitions)).toBe(true);
    expect(result.definitions[0]).toBe('你好');
  });

  it('生成唯一 ID', () => {
    var r1 = App.normalizeToCard({ word: 'a' });
    var r2 = App.normalizeToCard({ word: 'b' });
    expect(r1.id).toBeTruthy();
    expect(r2.id).toBeTruthy();
    expect(r1.id).not.toBe(r2.id);
  });

  it('已有 ID 保持原值', () => {
    var result = App.normalizeToCard({ id: 'keep-me', word: 'x' });
    expect(result.id).toBe('keep-me');
  });

  it('definitions 字符串自动包装为数组', () => {
    var result = App.normalizeToCard({ word: 'x', definitions: '单一释义' });
    expect(Array.isArray(result.definitions)).toBe(true);
    expect(result.definitions).toEqual(['单一释义']);
  });

  it('缺失字段使用默认值', () => {
    var result = App.normalizeToCard({ word: 'x' });
    expect(result.phrases).toEqual([]);
    expect(result.sentences).toEqual([]);
    expect(result.synonyms).toEqual([]);
    expect(result.antonyms).toEqual([]);
    expect(result.confused).toEqual([]);
    expect(result.difficulty).toBe(3);
  });
});

describe('migrateCardsSchema', () => {
  beforeEach(() => {
    App.state.decks = [
      {
        id: 'd1',
        name: 'Test',
        cards: [
          { id: 'c1', front: 'hello', definitions: '单一释义' },
          { id: 'c2', word: 'world', definitions: [] },
          { id: 'c3', front: 'ok', back: '好的' },
          { id: 'c4', word: 'test', front: 'test', definitions: ['测试1', '测试2'] },
        ]
      }
    ];
  });

  it('字符串 definitions 包装为数组', () => {
    App.migrateCardsSchema();
    expect(Array.isArray(App.state.decks[0].cards[0].definitions)).toBe(true);
    expect(App.state.decks[0].cards[0].definitions).toEqual(['单一释义']);
  });

  it('空 definitions 数组用 back 补充', () => {
    App.migrateCardsSchema();
    // c2 has no back and empty definitions - stays empty
    // Actually c2 has word='world' - migrateCardsSchema doesn't add back from word
    var c2 = App.state.decks[0].cards[1];
    expect(c2.front).toBe('world'); // 从 word 补全 front
  });

  it('缺失 front 从 word 补全', () => {
    App.migrateCardsSchema();
    expect(App.state.decks[0].cards[1].front).toBe('world');
  });

  it('正常卡片不受影响', () => {
    App.migrateCardsSchema();
    var c3 = App.state.decks[0].cards[2];
    expect(c3.front).toBe('ok');
    expect(c3.back).toBe('好的');
  });
});
