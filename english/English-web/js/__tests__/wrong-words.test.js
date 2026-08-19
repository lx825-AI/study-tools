/**
 * wrong-words.js 测试 —— 错词本面板
 */
import { describe, it, expect, beforeEach } from 'vitest';

const App = window.FlashcardApp;

function setupPanel() {
  const panel = document.createElement('div');
  panel.id = 'panelWrong';
  document.body.appendChild(panel);
  return panel;
}

describe('resetFailedCard', () => {
  it('将指定卡片 EF 重置为 2.5，其他卡片不受影响', () => {
    App.state.decks = [{
      id: 'd1', name: '测试牌组',
      cards: [
        { id: 'c1', front: 'bad', easeFactor: 1.5, repetitions: 3 },
        { id: 'c2', front: 'good', easeFactor: 1.4, repetitions: 5 },
      ],
    }];
    App.resetFailedCard('c1');
    expect(App.state.decks[0].cards[0].easeFactor).toBe(2.5);
    expect(App.state.decks[0].cards[1].easeFactor).toBe(1.4);
  });
});

describe('getWeekWrongCount', () => {
  it('聚合近 7 天学习日志中的 wrong 总数', () => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const log = {};
    log[today] = { correct: 5, wrong: 3 };
    log[yesterday] = { correct: 2, wrong: 1 };
    localStorage.setItem(App.LEARNING_LOG_KEY, JSON.stringify(log));
    expect(App.getWeekWrongCount()).toBe(4);
  });

  it('日志为空时返回 0', () => {
    localStorage.removeItem(App.LEARNING_LOG_KEY);
    expect(App.getWeekWrongCount()).toBe(0);
  });
});

describe('renderWrongWordsPanel', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('渲染统计卡、操作按钮与错词列表', () => {
    setupPanel();
    App.state.decks = [{
      id: 'd1', name: '四级',
      cards: [{ id: 'c1', word: 'abandon', phonetic: '/əˈbændən/', definitions: ['放弃'], easeFactor: 1.5, repetitions: 3 }],
    }];
    App.renderWrongWordsPanel();
    const panel = document.getElementById('panelWrong');
    expect(panel.innerHTML).toContain('待强化词汇');
    expect(panel.querySelector('#btnWrongPractice')).not.toBeNull();
    expect(panel.innerHTML).toContain('abandon');
    expect(panel.innerHTML).toContain('四级');
    expect(panel.querySelectorAll('[data-remove-card]').length).toBe(1);
  });

  it('无错词时显示空状态且操作按钮禁用', () => {
    setupPanel();
    App.state.decks = [{
      id: 'd1', name: '四级',
      cards: [{ id: 'c1', word: 'abandon', easeFactor: 2.5, repetitions: 0 }],
    }];
    App.renderWrongWordsPanel();
    const panel = document.getElementById('panelWrong');
    expect(panel.innerHTML).toContain('暂无错词');
    expect(panel.querySelector('#btnWrongPractice').disabled).toBe(true);
  });
});
