/**
 * study-panel.js 测试 —— SM-2 间隔重复算法
 */
import { describe, it, expect, beforeEach } from 'vitest';

const App = window.FlashcardApp;

function freshCard(overrides = {}) {
  return Object.assign({ id: 'test-id' }, overrides);
}

describe('applySM2', () => {
  let card;

  beforeEach(() => {
    card = freshCard();
  });

  describe('首次通过 (passed = true, repetitions = 0)', () => {
    it('interval 应为 1 天', () => {
      App.applySM2(card, true);
      expect(card.interval).toBe(1);
    });

    it('repetitions 应为 1', () => {
      App.applySM2(card, true);
      expect(card.repetitions).toBe(1);
    });

    it('EF 应保持 2.5', () => {
      App.applySM2(card, true);
      expect(card.easeFactor).toBe(2.5);
    });

    it('nextReview 应为明天', () => {
      App.applySM2(card, true);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(card.nextReview).toBe(tomorrow.toISOString().slice(0, 10));
    });
  });

  describe('第二次通过 (repetitions = 1)', () => {
    it('interval 应为 6 天', () => {
      card.repetitions = 1;
      card.interval = 1;
      App.applySM2(card, true);
      expect(card.interval).toBe(6);
    });
  });

  describe('第三次及以上通过', () => {
    it('interval 应为 interval * EF 取整', () => {
      card.repetitions = 2;
      card.interval = 6;
      card.easeFactor = 2.5;
      App.applySM2(card, true);
      expect(card.interval).toBe(15); // Math.round(6 * 2.5) = 15
    });
  });

  describe('失败 (passed = false)', () => {
    it('repetitions 重置为 0', () => {
      card.repetitions = 5;
      App.applySM2(card, false);
      expect(card.repetitions).toBe(0);
    });

    it('interval 重置为 1', () => {
      card.interval = 30;
      App.applySM2(card, false);
      expect(card.interval).toBe(1);
    });

    it('EF 应减少 0.2', () => {
      card.easeFactor = 2.5;
      App.applySM2(card, false);
      expect(card.easeFactor).toBe(2.3);
    });

    it('EF 最低不低于 1.3', () => {
      card.easeFactor = 1.3;
      App.applySM2(card, false);
      expect(card.easeFactor).toBe(1.3);
    });
  });

  describe('难度同步', () => {
    it('EF 1.3 → difficulty 5', () => {
      card.easeFactor = 1.3;
      App.applySM2(card, true);
      expect(card.difficulty).toBe(5);
    });

    it('EF 2.5 → difficulty 2', () => {
      card.easeFactor = 2.5;
      App.applySM2(card, true);
      expect(card.difficulty).toBe(2);
    });

    it('EF 3.0+ → difficulty 0', () => {
      card.easeFactor = 3.1;
      App.applySM2(card, true);
      expect(card.difficulty).toBe(0);
    });
  });

  describe('未初始化卡片', () => {
    it('缺少字段时使用默认值', () => {
      const blank = { id: 'blank' };
      App.applySM2(blank, true);
      expect(blank.repetitions).toBe(1);
      expect(blank.interval).toBe(1);
      expect(blank.easeFactor).toBe(2.5);
    });
  });
});
