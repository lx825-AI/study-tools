/**
 * storage.js 测试 —— localStorage 读写
 */
import { describe, it, expect, beforeEach } from 'vitest';

const App = window.FlashcardApp;

describe('loadData', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('无数据时返回空结构', () => {
    const data = App.loadData();
    expect(data).toEqual({ decks: [], currentDeckId: null });
  });

  it('有数据时返回已存储的数据', () => {
    localStorage.setItem('flashcard-data', JSON.stringify({
      decks: [{ id: 'd1', name: 'Test', cards: [] }],
      currentDeckId: 'd1',
    }));
    const data = App.loadData();
    expect(data.decks.length).toBe(1);
    expect(data.currentDeckId).toBe('d1');
  });

  it('JSON 损坏时返回空结构', () => {
    localStorage.setItem('flashcard-data', 'not-valid-json{{{');
    const data = App.loadData();
    expect(data).toEqual({ decks: [], currentDeckId: null });
  });
});

describe('saveData', () => {
  beforeEach(() => {
    localStorage.clear();
    App.state.decks = [{ id: 'd1', name: 'SavedDeck', cards: [] }];
    App.state.currentDeckId = 'd1';
  });

  it('应将数据保存到 localStorage', () => {
    App.saveData();
    const raw = localStorage.getItem('flashcard-data');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw);
    expect(parsed.decks.length).toBe(1);
    expect(parsed.decks[0].name).toBe('SavedDeck');
    expect(parsed.currentDeckId).toBe('d1');
  });
});
