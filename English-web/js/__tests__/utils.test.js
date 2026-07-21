/**
 * utils.js 测试 —— HTML转义、CSV解析、编辑距离、模糊匹配
 */
import { describe, it, expect } from 'vitest';

const App = window.FlashcardApp;

describe('escHtml', () => {
  it('应转义 HTML 特殊字符', () => {
    expect(App.escHtml('<div class="test">')).toBe('&lt;div class=&quot;test&quot;&gt;');
    expect(App.escHtml("it's")).toBe('it&#39;s');
    expect(App.escHtml('a & b')).toBe('a &amp; b');
  });

  it('普通字符串原样返回', () => {
    expect(App.escHtml('hello world')).toBe('hello world');
    expect(App.escHtml('中文测试')).toBe('中文测试');
  });

  it('非字符串返回空字符串', () => {
    expect(App.escHtml(null)).toBe('');
    expect(App.escHtml(undefined)).toBe('');
    expect(App.escHtml(123)).toBe('');
  });
});

describe('parseCSVLine', () => {
  it('无引号的简单 CSV', () => {
    expect(App.parseCSVLine('a,b,c')).toEqual(['a', 'b', 'c']);
  });

  it('带引号的字段', () => {
    expect(App.parseCSVLine('"hello, world",b')).toEqual(['hello, world', 'b']);
  });

  it('空字段', () => {
    expect(App.parseCSVLine(',b,')).toEqual(['', 'b', '']);
  });

  it('单字段', () => {
    expect(App.parseCSVLine('only')).toEqual(['only']);
  });

  it('字段内含引号（切换 inQuotes 状态）', () => {
    expect(App.parseCSVLine('a"b,c')).toEqual(['ab,c']);
  });
});

describe('levenshtein', () => {
  it('相同字符串距离为 0', () => {
    expect(App.levenshtein('hello', 'hello')).toBe(0);
  });

  it('一个字符差异', () => {
    expect(App.levenshtein('cat', 'cut')).toBe(1);
  });

  it('两个字符差异', () => {
    expect(App.levenshtein('test', 'tent')).toBe(1);
    expect(App.levenshtein('book', 'back')).toBe(2);
  });

  it('完全不同的字符串', () => {
    expect(App.levenshtein('abc', 'xyz')).toBe(3);
  });

  it('空字符串', () => {
    expect(App.levenshtein('', 'abc')).toBe(3);
    expect(App.levenshtein('abc', '')).toBe(3);
  });
});

describe('fuzzyMatch', () => {
  it('子串匹配（大小写不敏感）', () => {
    expect(App.fuzzyMatch('ab', 'abandon')).toBe(true);
    expect(App.fuzzyMatch('AB', 'abandon')).toBe(true);
    expect(App.fuzzyMatch('don', 'abandon')).toBe(true);
  });

  it('编辑距离 ≤ 2 匹配', () => {
    expect(App.fuzzyMatch('abndon', 'abandon')).toBe(true);
    expect(App.fuzzyMatch('abundon', 'abandon')).toBe(true);
  });

  it('编辑距离 > 2 不匹配', () => {
    expect(App.fuzzyMatch('xyz', 'abandon')).toBe(false);
  });

  it('短输入(< 3 字符)不做模糊匹配', () => {
    expect(App.fuzzyMatch('ab', 'xyz')).toBe(false);
  });
});
