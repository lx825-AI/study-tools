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

describe('lettersOnly', () => {
  it('剥除撇号/连字符/空格/数字/中文/标点', () => {
    expect(App.lettersOnly("don't")).toBe('dont');
    expect(App.lettersOnly('well-known')).toBe('wellknown');
    expect(App.lettersOnly('give up')).toBe('giveup');
    expect(App.lettersOnly('a你b1c!')).toBe('abc');
    expect(App.lettersOnly('')).toBe('');
    expect(App.lettersOnly(null)).toBe('');
    expect(App.lettersOnly(undefined)).toBe('');
  });
});

describe('parseWordSlots', () => {
  it('单词：连续 letterIndex', () => {
    const { groups, letterCount } = App.parseWordSlots('abandon');
    expect(letterCount).toBe(7);
    expect(groups.length).toBe(1);
    expect(groups[0].map((s) => s.letterIndex)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(groups[0].every((s) => s.kind === 'letter')).toBe(true);
  });

  it("撇号 → static 槽（don't）", () => {
    const { groups, letterCount } = App.parseWordSlots("don't");
    expect(letterCount).toBe(4);
    expect(groups[0].find((s) => s.kind === 'static').char).toBe("'");
    expect(groups[0].filter((s) => s.kind === 'letter').length).toBe(4);
  });

  it('连字符 → static 槽（well-known）', () => {
    const { groups, letterCount } = App.parseWordSlots('well-known');
    expect(letterCount).toBe(9);
    expect(groups[0].filter((s) => s.kind === 'static').map((s) => s.char)).toEqual(['-']);
  });

  it('词组：空格分组，letterIndex 跨组连续', () => {
    const { groups, letterCount } = App.parseWordSlots('give up');
    expect(letterCount).toBe(6);
    expect(groups.length).toBe(2);
    expect(groups[0].map((s) => s.letterIndex)).toEqual([0, 1, 2, 3]);
    expect(groups[1].map((s) => s.letterIndex)).toEqual([4, 5]);
  });

  it('连续空格容错', () => {
    const { groups, letterCount } = App.parseWordSlots('a  b');
    expect(groups.length).toBe(2);
    expect(letterCount).toBe(2);
  });

  it('空值返回空结构', () => {
    const { groups, letterCount } = App.parseWordSlots('');
    expect(groups).toEqual([]);
    expect(letterCount).toBe(0);
    expect(App.parseWordSlots(null).letterCount).toBe(0);
  });
});

describe('rebuildSlotLetters', () => {
  it('空值：全空数组', () => {
    expect(App.rebuildSlotLetters('', 3)).toEqual({ letters: ['', '', ''], filled: false });
  });

  it('部分填充', () => {
    const r = App.rebuildSlotLetters('ab', 4);
    expect(r.letters).toEqual(['a', 'b', '', '']);
    expect(r.filled).toBe(false);
  });

  it('满词：filled = true', () => {
    const r = App.rebuildSlotLetters('abcd', 4);
    expect(r.letters).toEqual(['a', 'b', 'c', 'd']);
    expect(r.filled).toBe(true);
  });

  it('超长截断到 letterCount', () => {
    const r = App.rebuildSlotLetters('abcdef', 4);
    expect(r.letters).toEqual(['a', 'b', 'c', 'd']);
    expect(r.filled).toBe(true);
  });

  it('中文/标点/数字被过滤（中文 commit 不误删）', () => {
    const r = App.rebuildSlotLetters('a你b。c', 3);
    expect(r.letters).toEqual(['a', 'b', 'c']);
  });

  it('退格撤回：值变短重建', () => {
    const full = App.rebuildSlotLetters('abcd', 4);
    expect(full.filled).toBe(true);
    const afterBackspace = App.rebuildSlotLetters('abc', 4);
    expect(afterBackspace.letters).toEqual(['a', 'b', 'c', '']);
    expect(afterBackspace.filled).toBe(false);
  });

  it('大小写保留', () => {
    const r = App.rebuildSlotLetters('AbC', 3);
    expect(r.letters).toEqual(['A', 'b', 'C']);
  });
});

describe('firstEmptySlotIndex', () => {
  it('全空 → 0', () => {
    expect(App.firstEmptySlotIndex(['', '', ''])).toBe(0);
  });

  it('首个空位索引', () => {
    expect(App.firstEmptySlotIndex(['a', 'b', '', 'd'])).toBe(2);
  });

  it('全满 → -1', () => {
    expect(App.firstEmptySlotIndex(['a', 'b', 'c'])).toBe(-1);
  });
});

describe('cardStageCategory / filterCardsByStage', () => {
  it('三分类边界：0/undefined→new、1/6→learning、7+→mastered', () => {
    expect(App.cardStageCategory({ ebbinghausStage: 0 })).toBe('new');
    expect(App.cardStageCategory({})).toBe('new');
    expect(App.cardStageCategory({ ebbinghausStage: 1 })).toBe('learning');
    expect(App.cardStageCategory({ ebbinghausStage: 6 })).toBe('learning');
    expect(App.cardStageCategory({ ebbinghausStage: 7 })).toBe('mastered');
    expect(App.cardStageCategory({ ebbinghausStage: 10 })).toBe('mastered');
  });

  it("filterCardsByStage 'all' 保序且含原下标", () => {
    const cards = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const out = App.filterCardsByStage(cards, 'all');
    expect(out.map(f => f.card.id)).toEqual(['a', 'b', 'c']);
    expect(out.map(f => f.index)).toEqual([0, 1, 2]);
  });

  it("filterCardsByStage 'new' 仅新词且 index 为原下标", () => {
    const cards = [
      { id: 'a', ebbinghausStage: 0 },
      { id: 'b', ebbinghausStage: 3 },
      { id: 'c' }, /* 无 stage = 新词 */
      { id: 'd', ebbinghausStage: 7 },
    ];
    const out = App.filterCardsByStage(cards, 'new');
    expect(out.map(f => f.card.id)).toEqual(['a', 'c']);
    expect(out.map(f => f.index)).toEqual([0, 2]);
  });
});
