/**
 * wordbook-categories.test.js —— 词书两级分类（级别 × 大纲/核心，对齐小程序）
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

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

  it('渲染返回按钮 + 大纲/核心两个 section 各两本（🔀乱序版/🔤正序版 短标签 + 导入 pill）', () => {
    setupModal();
    const spyLoad = vi.spyOn(App, 'loadWordbookScript').mockResolvedValue({});
    App.renderImportLevelBooks('cet4');
    const list = document.getElementById('importBookList');
    expect(list.querySelector('#btnImportBack')).not.toBeNull();
    expect(list.innerHTML).toContain('大纲词汇');
    expect(list.innerHTML).toContain('核心词汇');
    const bookBtns = list.querySelectorAll('button[data-book]');
    expect(bookBtns.length).toBe(4);
    const keys = Array.from(bookBtns).map((b) => b.getAttribute('data-book')).sort();
    expect(keys).toEqual(['cet4-core', 'cet4-core-sorted', 'cet4-sorted', 'cet4-syllabus-enriched']);
    /* 短标签 + 词数 + 导入 pill */
    const labels = list.querySelectorAll('.wb-option-name');
    expect(Array.from(labels).map((l) => l.textContent)).toEqual(['乱序版', '正序版', '乱序版', '正序版']);
    expect(list.querySelectorAll('.wb-option-icon').length).toBe(4);
    expect(list.innerHTML).toContain('4542 词');
    expect(list.innerHTML).toContain('1161 词');
    expect(list.querySelectorAll('.wb-option-import').length).toBe(4);
    /* 进入第二屏即预取该级别 4 本词书（提速导入） */
    expect(spyLoad).toHaveBeenCalledTimes(4);
    spyLoad.mockRestore();
  });

  it('已导入的词书 disabled + 「✓ 已导入」，不再显示导入 pill', () => {
    setupModal();
    const spyLoad = vi.spyOn(App, 'loadWordbookScript').mockResolvedValue({});
    App.state.decks = [{ id: 'd1', name: '四级核心词汇', cards: [], source: 'cet4-core' }];
    App.renderImportLevelBooks('cet4');
    const list = document.getElementById('importBookList');
    const importedBtn = list.querySelector('button[data-book="cet4-core"]');
    expect(importedBtn.disabled).toBe(true);
    expect(importedBtn.classList.contains('selected')).toBe(true);
    expect(importedBtn.innerHTML).toContain('✓ 已导入');
    const otherBtn = list.querySelector('button[data-book="cet4-core-sorted"]');
    expect(otherBtn.disabled).toBe(false);
    expect(otherBtn.innerHTML).toContain('导入');
    expect(list.querySelectorAll('.wb-option-import').length).toBe(3);
    App.state.decks = [];
    spyLoad.mockRestore();
  });

  it('未知级别不渲染词书按钮', () => {
    setupModal();
    App.renderImportLevelBooks('unknown-level');
    const list = document.getElementById('importBookList');
    expect(list.querySelectorAll('button[data-book]').length).toBe(0);
  });
});

describe('isWordbookImported source 优先判定 + 导入写 source（对齐小程序）', () => {
  it('deck.source === key：registry 未加载也可判定已导入', () => {
    App.state.decks = [{ id: 'd1', name: '某词书', cards: [], source: 'cet4-core' }];
    expect(App.isWordbookImported({ key: 'cet4-core' })).toBe(true);
    App.state.decks = [];
  });

  it('旧牌组无 source：回退按 name 匹配（registry 已加载）', () => {
    App.state.decks = [{ id: 'd1', name: '四级核心词汇', cards: [] }];
    window.__VOCAB_REGISTRY__['cet4-core'] = { name: '四级核心词汇', description: '', words: [] };
    expect(App.isWordbookImported({ key: 'cet4-core' })).toBe(true);
    delete window.__VOCAB_REGISTRY__['cet4-core'];
    App.state.decks = [];
  });

  it('importWordbookFromRegistry 新建牌组写 source', () => {
    const origSave = App.saveData;
    const origRenderAll = App.renderAll;
    const origClose = App.closeImportModal;
    const origToast = App.showToast;
    App.saveData = vi.fn();
    App.renderAll = vi.fn();
    App.closeImportModal = vi.fn();
    App.showToast = vi.fn();
    App.state.decks = [];
    window.__VOCAB_REGISTRY__['cet4-core'] = {
      name: '四级核心词汇', description: '',
      words: [{ word: 'abandon', phonetic: '', pos: '', definitions: ['放弃'] }],
    };
    App.importWordbookFromRegistry('cet4-core');
    expect(App.state.decks).toHaveLength(1);
    expect(App.state.decks[0].source).toBe('cet4-core');
    expect(App.state.decks[0].cards).toHaveLength(1);
    delete window.__VOCAB_REGISTRY__['cet4-core'];
    App.saveData = origSave;
    App.renderAll = origRenderAll;
    App.closeImportModal = origClose;
    App.showToast = origToast;
    App.state.decks = [];
  });
});
