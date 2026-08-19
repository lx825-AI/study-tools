/**
 * quick-mode.js 测试 —— 快速学习模式（对齐小程序语义）
 */
import { describe, it, expect, beforeEach } from 'vitest';

const App = window.FlashcardApp;

function freshCard(overrides = {}) {
  return Object.assign({ id: 'test-id' }, overrides);
}

describe('applyQuickResult', () => {
  let card;

  beforeEach(() => {
    card = freshCard();
  });

  describe('答对 (passed = true)', () => {
    it('ebbinghausStage 应为 1（仅 0→1 推进）', () => {
      App.applyQuickResult(card, true);
      expect(card.ebbinghausStage).toBe(1);
    });

    it('ebbinghausNextReview 应为明天', () => {
      App.applyQuickResult(card, true);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(card.ebbinghausNextReview).toBe(tomorrow.toISOString().slice(0, 10));
    });

    it('repetitions 至少为 1，已有值不变', () => {
      App.applyQuickResult(card, true);
      expect(card.repetitions).toBe(1);
      card.repetitions = 5;
      App.applyQuickResult(card, true);
      expect(card.repetitions).toBe(5);
    });

    it('不写 ebbinghausHistory（不污染深度复习）', () => {
      App.applyQuickResult(card, true);
      expect(card.ebbinghausHistory).toBeUndefined();
    });
  });

  describe('答错 (passed = false)', () => {
    it('不改动卡片任何进度字段', () => {
      const before = Object.assign({}, card);
      App.applyQuickResult(card, false);
      expect(card).toEqual(before);
    });
  });
});

describe('trackQuick / loadQuickLog', () => {
  beforeEach(() => {
    localStorage.removeItem(App.QUICK_LOG_KEY);
  });

  it('按日累计独立日志（不写入 flashcard-learning-log）', () => {
    App.trackQuick(1);
    App.trackQuick(1);
    App.trackQuick(0);
    const quickLog = App.loadQuickLog();
    const today = new Date().toISOString().slice(0, 10);
    expect(quickLog[today]).toEqual({ correct: 2, wrong: 1 });
    expect(localStorage.getItem(App.LEARNING_LOG_KEY)).toBeNull();
  });

  it('存储损坏时返回空对象', () => {
    localStorage.setItem(App.QUICK_LOG_KEY, '{invalid json');
    expect(App.loadQuickLog()).toEqual({});
  });
});
