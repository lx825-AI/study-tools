/**
 * daily-quote.js 测试 —— 每日英语名言（整卡点击顺序切换，对齐小程序）
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

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

describe('getNextQuote 顺序切换', () => {
  beforeEach(() => {
    localStorage.removeItem('flashcard-quote-date');
    localStorage.removeItem('flashcard-quote-index');
  });

  it('返回库中顺序的下一句', () => {
    const first = App.pickTodayQuote();
    const firstIdx = App.QUOTES.indexOf(first);
    expect(App.getNextQuote()).toEqual(App.QUOTES[(firstIdx + 1) % App.QUOTES.length]);
  });

  it('循环 App.QUOTES.length 次回到原句（末尾回绕）', () => {
    const first = App.pickTodayQuote();
    let q = first;
    for (let i = 0; i < App.QUOTES.length; i++) q = App.getNextQuote();
    expect(q).toEqual(first);
  });

  it('切换不写 storage（仅会话内生效）', () => {
    App.pickTodayQuote();
    const storedIndex = localStorage.getItem('flashcard-quote-index');
    App.getNextQuote();
    App.getNextQuote();
    expect(localStorage.getItem('flashcard-quote-index')).toBe(storedIndex);
  });
});

describe('switchQuote 点击切换', () => {
  beforeEach(() => {
    localStorage.removeItem('flashcard-quote-date');
    localStorage.removeItem('flashcard-quote-index');
    document.body.innerHTML = '<div id="dailyQuoteCard"></div>';
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('150ms 防抖内重复点击只切换一句', () => {
    App.renderDailyQuote();
    const firstIdx = App.QUOTES.indexOf(App.pickTodayQuote());
    const el = document.getElementById('dailyQuoteCard');
    const expected = App.QUOTES[(firstIdx + 1) % App.QUOTES.length];

    App.switchQuote();
    App.switchQuote(); /* 防抖窗口内第二次点击 */
    expect(el.classList.contains('quote-switching')).toBe(true);
    vi.advanceTimersByTime(150);
    expect(el.innerHTML).toContain(expected.text); /* 只前进一句 */

    vi.advanceTimersByTime(150);
    expect(el.classList.contains('quote-switching')).toBe(false);
  });

  it('renderDailyQuote 绑定点击且重建后重置回当日句', () => {
    App.renderDailyQuote();
    const el = document.getElementById('dailyQuoteCard');
    expect(el.onclick).toBe(App.switchQuote);
    const todayText = el.innerHTML;

    App.switchQuote();
    vi.advanceTimersByTime(300);
    expect(el.innerHTML).not.toBe(todayText);

    App.renderDailyQuote(); /* 模拟 renderDeckPanel 重建（onShow 语义） */
    expect(el.innerHTML).toBe(todayText);
    expect(el.classList.contains('quote-switching')).toBe(false);
  });

  it('切换动画中重建：旧定时器被清理，文本保持当日句', () => {
    App.renderDailyQuote();
    const el = document.getElementById('dailyQuoteCard');
    const todayText = el.innerHTML;

    App.switchQuote();
    vi.advanceTimersByTime(150); /* 第一段动画结束，刚换文本 */
    expect(el.innerHTML).not.toBe(todayText);

    App.renderDailyQuote(); /* 第二段 150ms 恢复窗口内重建（如快速切 tab） */
    vi.advanceTimersByTime(150); /* 旧 _quoteTimer2 若未清会移除 class（无害），文本不应再变 */
    expect(el.innerHTML).toBe(todayText);
    expect(el.classList.contains('quote-switching')).toBe(false);
  });
});
