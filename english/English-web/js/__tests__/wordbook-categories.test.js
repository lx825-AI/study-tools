/**
 * wordbook-categories.test.js —— 词书两级分类（级别 × 大纲/核心，对齐小程序）
 */
import { describe, it, expect, beforeEach } from 'vitest';

const App = window.FlashcardApp;

function setupModal() {
  const list = document.createElement('div');
  list.id = 'importBookList';
  document.body.appendChild(list);
  const status = document.createElement('p');
  status.id = 'importStatus';
  document.body.appendChild(status);
  return list;
}

describe('WORDBOOK_LEVELS 与 BUILTIN_WORDBOOKS 分类完整性', () => {
  it('共 5 个级别，id 唯一', () => {
    expect(App.WORDBOOK_LEVELS).toHaveLength(5);
    const ids = App.WORDBOOK_LEVELS.map((l) => l.id);
    expect(new Set(ids).size).toBe(5);
  });

  it('每个级别恰好有 2 本大纲 + 2 本核心（乱序/正序各一），无孤儿词书', () => {
    App.WORDBOOK_LEVELS.forEach((level) => {
      const books = App.BUILTIN_WORDBOOKS.filter((b) => b.level === level.id);
      expect(books).toHaveLength(4);
      expect(books.filter((b) => b.type === 'syllabus')).toHaveLength(2);
      expect(books.filter((b) => b.type === 'core')).toHaveLength(2);
    });
  });

  it('全部 20 本词书都归属某个级别', () => {
    const levelIds = new Set(App.WORDBOOK_LEVELS.map((l) => l.id));
    App.BUILTIN_WORDBOOKS.forEach((b) => {
      expect(levelIds.has(b.level)).toBe(true);
    });
  });
});

describe('renderImportModal（第一屏：级别列表）', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('渲染 5 张级别卡与词书来源声明', () => {
    setupModal();
    App.renderImportModal();
    const list = document.getElementById('importBookList');
    expect(list.querySelectorAll('.level-item').length).toBe(5);
    expect(list.innerHTML).toContain('初中');
    expect(list.innerHTML).toContain('考研');
    expect(list.innerHTML).toContain('词书来源');
    expect(list.querySelectorAll('button[data-book]').length).toBe(0);
  });
});

describe('renderImportLevelBooks（第二屏：大纲/核心词书）', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('渲染返回按钮 + 大纲/核心两个 section 各两本（乱序 + 正序）', () => {
    setupModal();
    App.renderImportLevelBooks('cet4');
    const list = document.getElementById('importBookList');
    expect(list.querySelector('#btnImportBack')).not.toBeNull();
    expect(list.innerHTML).toContain('大纲词汇');
    expect(list.innerHTML).toContain('核心词汇');
    expect(list.innerHTML).toContain('正序');
    const bookBtns = list.querySelectorAll('button[data-book]');
    expect(bookBtns.length).toBe(4);
    const keys = Array.from(bookBtns).map((b) => b.getAttribute('data-book')).sort();
    expect(keys).toEqual(['cet4-core', 'cet4-core-sorted', 'cet4-sorted', 'cet4-syllabus-enriched']);
  });

  it('未知级别不渲染词书按钮', () => {
    setupModal();
    App.renderImportLevelBooks('unknown-level');
    const list = document.getElementById('importBookList');
    expect(list.querySelectorAll('button[data-book]').length).toBe(0);
  });
});
