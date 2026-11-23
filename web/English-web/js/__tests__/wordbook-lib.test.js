/**
 * wordbook-lib.test.js —— 词书生成库测试
 * 使用小型 fixture 数据（不读取真实 12MB 词书源文件）
 */
import { describe, it, expect } from 'vitest';
import { BOOK_CONFIG, compactWords, buildRegistrySource } from '../../scripts/wordbook-lib.js';

const FIXTURE_WORDS = [
  { word: 'pretty', phonetic: '/ˈpɹɪti/', pos: 'adj.', definitions: ['漂亮的'] },
  { word: 'industry', phonetic: '/ˈɪndəstɹi/', pos: 'n.', definitions: ['工业'], phrases: [{ en: 'heavy industry', zh: '重工业' }] },
];

describe('compactWords', () => {
  it('每词输出单行紧凑 JSON（不含换行）', () => {
    const result = compactWords(FIXTURE_WORDS);
    expect(result).toHaveLength(2);
    result.forEach((line) => {
      expect(line).not.toContain('\n');
    });
    expect(JSON.parse(result[0]).word).toBe('pretty');
  });

  it('保留词组等嵌套字段', () => {
    const result = compactWords(FIXTURE_WORDS);
    const parsed = JSON.parse(result[1]);
    expect(parsed.phrases).toEqual([{ en: 'heavy industry', zh: '重工业' }]);
  });
});

describe('buildRegistrySource', () => {
  it('产出可执行 JS，挂载词书到 window.__VOCAB_REGISTRY__', () => {
    const source = buildRegistrySource(
      { key: 'test-book', name: '测试词书', description: '测试用' },
      FIXTURE_WORDS
    );
    // 词书 JS 通过 <script> 加载，在全局作用域执行
    (0, eval)(source);
    const registry = window.__VOCAB_REGISTRY__;
    expect(registry['test-book']).toBeDefined();
    expect(registry['test-book'].name).toBe('测试词书');
    expect(registry['test-book'].words).toHaveLength(2);
    expect(registry['test-book'].words[0].phonetic).toBe('/ˈpɹɪti/');
  });

  it('词序与输入一致（透传不重排）', () => {
    const source = buildRegistrySource({ key: 't2', name: 'n', description: 'd' }, FIXTURE_WORDS);
    (0, eval)(source);
    const words = window.__VOCAB_REGISTRY__['t2'].words;
    expect(words.map((w) => w.word)).toEqual(['pretty', 'industry']);
  });
});

describe('BOOK_CONFIG', () => {
  it('共 20 本（乱序 10 + 正序 10），key 与 sourceFile 均唯一', () => {
    expect(BOOK_CONFIG).toHaveLength(20);
    const keys = BOOK_CONFIG.map((b) => b.key);
    const files = BOOK_CONFIG.map((b) => b.sourceFile);
    expect(new Set(keys).size).toBe(20);
    expect(new Set(files).size).toBe(20);
  });

  it('前 10 本为乱序组（前 5 替换书沿用旧 key + 5 本新增），后 10 本为正序组', () => {
    const replaceKeys = ['senior-high-enriched', 'cet4-syllabus-enriched', 'cet6-core-enriched', 'cet6-syllabus-enriched', 'kaoyan-enriched'];
    expect(BOOK_CONFIG.slice(0, 5).map((b) => b.key)).toEqual(replaceKeys);
    expect(BOOK_CONFIG.slice(5, 10).map((b) => b.key)).toEqual(['junior-high', 'junior-high-core', 'senior-high-core', 'cet4-core', 'kaoyan-core']);
    const sortedKeys = ['junior-high-sorted', 'junior-high-core-sorted', 'senior-high-sorted', 'senior-high-core-sorted', 'cet4-sorted', 'cet4-core-sorted', 'cet6-sorted', 'cet6-core-sorted', 'kaoyan-sorted', 'kaoyan-core-sorted'];
    expect(BOOK_CONFIG.slice(10).map((b) => b.key)).toEqual(sortedKeys);
  });

  it('每本都有 name/description/sourceFile', () => {
    BOOK_CONFIG.forEach((b) => {
      expect(b.name).toBeTruthy();
      expect(b.description).toBeTruthy();
      expect(b.sourceFile).toMatch(/\.json$/);
    });
  });
});
