/**
 * study-tab.test.js —— 切离学习 tab 弃置会话，重新进入回到模式选择
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const App = window.FlashcardApp;

/** 挂载完整 tab DOM：学习面板桩 + 顶部导航 + 其余 4 个面板 */
function mountTabDOM() {
  window.mountStudyDOM();
  document.body.insertAdjacentHTML('beforeend',
    '<nav class="top-nav">' +
      '<button data-tab="decks" class="active">牌组</button>' +
      '<button data-tab="study">学习</button>' +
      '<button data-tab="preview">预览</button>' +
      '<button data-tab="cards">卡片</button>' +
      '<button data-tab="stats">统计</button>' +
    '</nav>' +
    '<div id="panelDecks" class="panel"></div>' +
    '<div id="panelPreview" class="panel"></div>' +
    '<div id="panelCards" class="panel"></div>' +
    '<div id="panelStats" class="panel"></div>');
}

function setupDecks() {
  App.state.decks = [{
    id: 'd1', name: '测试牌组',
    cards: [{ id: 'c1', front: 'apple', back: '苹果', phonetic: '/ˈæpl/', definitions: ['苹果'], easeFactor: 2.5, repetitions: 1 }],
  }];
  App.state.currentDeckId = 'd1';
}

/** 模拟学习中状态（队列非空、部分作答） */
function setMidStudyState() {
  App.studyMode = 'new';
  App.studyQueue = [{ id: 'c1', front: 'apple', back: '苹果', easeFactor: 2.5, repetitions: 1 }];
  App.studyIndex = 0;
  App.studyPassed = 1;
  App.studyFailed = 0;
  App.studyCompletedWords = 0;
  App.studyInitialQueueLength = 3;
  App.studyResults = [{ cardId: 'c1', passed: true }];
  App.studyStartTime = Date.now();
  App.isReviewMode = false;
  App.isFlipped = false;
  App.spellMode = false;
}

describe('切离学习 tab 弃置会话', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    mountTabDOM();
    setupDecks();
    /* app.js 未加载：打桩未加载面板的渲染函数（preview/cards 面板模块不在 setup.js 列表） */
    App.renderPreviewPanel = vi.fn();
    App.renderCardsPanel = vi.fn();
    App.renderStatsPanel = vi.fn();
    App.showToast = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('学习中切到统计 tab：队列清空 + sessionStorage 快照删除', () => {
    setMidStudyState();
    App.saveStudyProgress();
    expect(sessionStorage.getItem('flashcard-study-progress')).not.toBeNull();

    App.switchTab('stats');

    expect(App.studyQueue.length).toBe(0);
    expect(App.studyIndex).toBe(0);
    expect(sessionStorage.getItem('flashcard-study-progress')).toBeNull();
  });

  it('切走后再切回学习 tab：显示「选择学习模式」引导', () => {
    setMidStudyState();
    App.switchTab('stats');
    App.switchTab('study');

    const guide = document.getElementById('studyModeGuide');
    expect(guide).not.toBeNull();
    expect(guide.innerHTML).toContain('选择学习模式');
  });

  it('完成态切走再切回：回到引导，且已完成会话日志不被覆盖', () => {
    /* 模拟已完成会话并落库 */
    setMidStudyState();
    App.studyQueue = [];
    App.studyIndex = 0;
    App.studyCompletedWords = 3;
    App.studyInitialQueueLength = 3;
    App.finalizeStudyLog();
    const today = new Date().toISOString().slice(0, 10);
    const logged = App.loadLearningLog()[today];
    expect(logged.completedGoal).toBe(true);

    App.switchTab('stats');
    App.switchTab('study');

    expect(document.getElementById('studyModeGuide')).not.toBeNull();
    expect(App.loadLearningLog()[today].completedGoal).toBe(true);
  });

  it('早退切走：写入 completedGoal=false 的早退日志', () => {
    setMidStudyState(); /* completedWords 0 < initialQueueLength 3，已作答 1 卡 */

    App.switchTab('stats');

    const today = new Date().toISOString().slice(0, 10);
    const logged = App.loadLearningLog()[today];
    expect(logged).toBeDefined();
    expect(logged.completedGoal).toBe(false);
    expect(logged.cardsStudied).toBe(1);
  });

  it('学习 tab 内重复 switchTab("study")：会话不被清除', () => {
    setMidStudyState();
    App.switchTab('study');

    expect(App.studyQueue.length).toBe(1);
    expect(App.studyIndex).toBe(0);
  });

  it('其他面板持有快照时切回学习 tab：仍走快照恢复（刷新恢复语义保留）', () => {
    setMidStudyState();
    App.saveStudyProgress();
    /* 模拟刷新：内存会话丢失、只留 sessionStorage 快照 */
    App.clearStudySessionState();
    document.getElementById('panelStudy').classList.remove('visible');
    document.getElementById('panelPreview').classList.add('visible');

    App.switchTab('study');

    expect(App.studyQueue.length).toBe(1);
    expect(App.showToast).toHaveBeenCalled();
  });

  it('非学习面板间切换不触发会话清理', () => {
    const spy = vi.spyOn(App, 'returnToModeSelect');
    document.getElementById('panelStudy').classList.remove('visible');
    document.getElementById('panelStats').classList.add('visible');

    App.switchTab('preview');

    expect(spy).not.toHaveBeenCalled();
  });

  it('未知 tab 不触发会话清理（防御）', () => {
    setMidStudyState();
    const spy = vi.spyOn(App, 'returnToModeSelect');

    App.switchTab('nonexistent');

    expect(spy).not.toHaveBeenCalled();
    expect(App.studyQueue.length).toBe(1); /* 会话保留 */
  });

  it('当日已完成会话不被后续早退切走覆盖（统计不回退）', () => {
    const today = new Date().toISOString().slice(0, 10);
    /* 上午完成会话落库 */
    setMidStudyState();
    App.studyQueue = [];
    App.studyIndex = 0;
    App.studyCompletedWords = 3;
    App.studyInitialQueueLength = 3;
    App.finalizeStudyLog();
    expect(App.loadLearningLog()[today].completedGoal).toBe(true);

    /* 下午新会话答 1 题后切走 */
    setMidStudyState();
    App.switchTab('stats');

    expect(App.loadLearningLog()[today].completedGoal).toBe(true);
    expect(App.loadLearningLog()[today].cardsStudied).toBe(1);
  });
});
