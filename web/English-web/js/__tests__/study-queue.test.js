/**
 * study-queue.test.js —— 复习队列：紧急度排序与软上限（对齐小程序）
 */
import { describe, it, expect, beforeEach } from 'vitest';

const App = window.FlashcardApp;

function freshCard(overrides = {}) {
  return Object.assign({
    id: 'test-id',
    ebbinghausStage: 1,
    ebbinghausNextReview: '',
    ebbinghausHistory: [],
    easeFactor: 2.5,
    repetitions: 1,
    wrongCount: 0,
  }, overrides);
}

function daysAgoDate(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function makeDeck(cards) {
  return { id: 'd1', name: '测试', cards };
}

describe('calcUrgencyScore 权重', () => {
  it('今日到期得基础 10 分 + 阶段权重', () => {
    const c = freshCard({ ebbinghausStage: 1, ebbinghausNextReview: daysAgoDate(0) });
    /* 逾期 0 → 10；stage≤2 → 15；EF 2.5 → 5；wrongCount 0 → 0 = 30 */
    expect(App.calcUrgencyScore(c)).toBe(30);
  });

  it('严重逾期 >7 天加权 50', () => {
    const c = freshCard({ ebbinghausStage: 1, ebbinghausNextReview: daysAgoDate(10) });
    /* 50 + 15 + 5 + 0 = 70 */
    expect(App.calcUrgencyScore(c)).toBe(70);
  });

  it('低 EF（难词）加权 15', () => {
    const c = freshCard({ ebbinghausStage: 1, ebbinghausNextReview: daysAgoDate(0), easeFactor: 1.5 });
    /* 10 + 15 + 15 = 40 */
    expect(App.calcUrgencyScore(c)).toBe(40);
  });

  it('历史错词加权（>3 次得 10）', () => {
    const c = freshCard({ ebbinghausStage: 1, ebbinghausNextReview: daysAgoDate(0), wrongCount: 5 });
    /* 10 + 15 + 5 + 10 = 40 */
    expect(App.calcUrgencyScore(c)).toBe(40);
  });
});

describe('buildStudyQueue - review 分支', () => {
  beforeEach(() => {
    localStorage.removeItem('flashcard-daily-goal');
    App.studyMode = 'review';
  });

  it('严重逾期优先于轻度逾期', () => {
    const deck = makeDeck([
      freshCard({ id: 'mild', ebbinghausStage: 2, ebbinghausNextReview: daysAgoDate(1) }),
      freshCard({ id: 'severe', ebbinghausStage: 2, ebbinghausNextReview: daysAgoDate(10) }),
    ]);
    const queue = App.buildStudyQueue(deck);
    expect(queue[0].id).toBe('severe');
  });

  it('队列卡片附带 _urgencyScore 且降序', () => {
    const deck = makeDeck([
      freshCard({ id: 'a', ebbinghausStage: 2, ebbinghausNextReview: daysAgoDate(1) }),
      freshCard({ id: 'b', ebbinghausStage: 2, ebbinghausNextReview: daysAgoDate(5) }),
    ]);
    const queue = App.buildStudyQueue(deck);
    expect(typeof queue[0]._urgencyScore).toBe('number');
    expect(queue[0]._urgencyScore).toBeGreaterThanOrEqual(queue[1]._urgencyScore);
  });

  it('软上限 50：超过 50 张到期卡只取前 50', () => {
    const cards = [];
    for (let i = 0; i < 61; i++) {
      cards.push(freshCard({ id: 'c' + i, ebbinghausStage: 2, ebbinghausNextReview: daysAgoDate(1) }));
    }
    const queue = App.buildStudyQueue(makeDeck(cards));
    expect(queue.length).toBe(50);
  });

  it('max(goal, min(50, len))：goal=20 时 40 张全取、80 张取 50', () => {
    localStorage.setItem('flashcard-daily-goal', '20');
    const cards40 = [];
    for (let i = 0; i < 40; i++) cards40.push(freshCard({ id: 'a' + i, ebbinghausStage: 2, ebbinghausNextReview: daysAgoDate(1) }));
    expect(App.buildStudyQueue(makeDeck(cards40)).length).toBe(40);

    const cards80 = [];
    for (let i = 0; i < 80; i++) cards80.push(freshCard({ id: 'b' + i, ebbinghausStage: 2, ebbinghausNextReview: daysAgoDate(1) }));
    expect(App.buildStudyQueue(makeDeck(cards80)).length).toBe(50);
  });

  it('未到期卡不入队', () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    const deck = makeDeck([
      freshCard({ id: 'due', ebbinghausStage: 2, ebbinghausNextReview: daysAgoDate(1) }),
      freshCard({ id: 'future', ebbinghausStage: 2, ebbinghausNextReview: future.toISOString().slice(0, 10) }),
      freshCard({ id: 'new', ebbinghausStage: 0 }),
    ]);
    const queue = App.buildStudyQueue(deck);
    expect(queue.map((c) => c.id)).toEqual(['due']);
  });

  it('localStorage 目标值损坏时回退默认 10，队列不空（B8）', () => {
    localStorage.setItem('flashcard-daily-goal', 'abc');
    App.studyMode = 'quick';
    const cards = [];
    for (let i = 0; i < 15; i++) cards.push(freshCard({ id: 'c' + i, ebbinghausStage: 0 }));
    const queue = App.buildStudyQueue(makeDeck(cards));
    expect(queue.length).toBe(10);
    localStorage.removeItem('flashcard-daily-goal');
  });
});

describe('buildStudyQueue - new 分支（每轮新词数跟随每日目标，对齐小程序 slice(0, goal)）', () => {
  beforeEach(() => {
    localStorage.removeItem('flashcard-daily-goal');
    App.studyMode = 'new';
  });

  it('截断到 dailyGoal 且保持词书原序', () => {
    localStorage.setItem('flashcard-daily-goal', '3');
    const deck = makeDeck([
      freshCard({ id: 'a', ebbinghausStage: 0 }),
      freshCard({ id: 'b', ebbinghausStage: 0 }),
      freshCard({ id: 'c', ebbinghausStage: 0 }),
      freshCard({ id: 'd', ebbinghausStage: 0 }),
      freshCard({ id: 'e', ebbinghausStage: 0 }),
    ]);
    const queue = App.buildStudyQueue(deck);
    expect(queue.map((c) => c.id)).toEqual(['a', 'b', 'c']);
  });

  it('默认目标 10 且只含新词', () => {
    const cards = [];
    for (let i = 0; i < 12; i++) cards.push(freshCard({ id: 'n' + i, ebbinghausStage: 0 }));
    cards.push(freshCard({ id: 'old', ebbinghausStage: 2 }));
    const queue = App.buildStudyQueue(makeDeck(cards));
    expect(queue.length).toBe(10);
    expect(queue.every((c) => c.ebbinghausStage === 0)).toBe(true);
  });
});
