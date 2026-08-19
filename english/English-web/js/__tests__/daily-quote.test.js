/**
 * daily-quote.js 测试 —— 每日英语名言
 */
import { describe, it, expect, beforeEach } from 'vitest';

const App = window.FlashcardApp;

describe('QUOTES 名言库', () => {
  it('数组完整且每项含 text/zh/author', () => {
    expect(App.QUOTES.length).toBeGreaterThan(30);
    App.QUOTES.forEach((q) => {
      expect(q.text).toBeTruthy();
      expect(q.zh).toBeTruthy();
      expect(q.author).toBeTruthy();
    });
  });
});

describe('pickTodayQuote', () => {
  beforeEach(() => {
    localStorage.removeItem('flashcard-quote-date');
    localStorage.removeItem('flashcard-quote-index');
  });

  it('同日同句：两次调用返回同一句', () => {
    const first = App.pickTodayQuote();
    const second = App.pickTodayQuote();
    expect(second).toEqual(first);
  });

  it('返回的名言在库中', () => {
    const quote = App.pickTodayQuote();
    expect(App.QUOTES).toContainEqual(quote);
  });
});
