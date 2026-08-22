/**
 * cards-panel.js 测试 —— 卡片列表阶段分类筛选（全部/新词/学习中/已掌握）
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

const App = window.FlashcardApp;

function setupDeck() {
  App.state.decks = [{
    id: 'd1', name: '四级',
    cards: [
      { id: 'a', front: 'abandon', ebbinghausStage: 0 },   /* 新词 */
      { id: 'b', front: 'balance', ebbinghausStage: 3 },   /* 学习中 */
      { id: 'c', front: 'capture', ebbinghausStage: 6 },   /* 学习中 */
      { id: 'd', front: 'depart' },                        /* 无 stage = 新词 */
      { id: 'e', front: 'escape', ebbinghausStage: 7 },    /* 已掌握 */
    ],
  }];
  App.state.currentDeckId = 'd1';
}

describe('卡片分类筛选', () => {
  beforeEach(() => {
    window.mountCardsDOM();
    App._cardFilter = 'all';
    App._cardListFiltered = [];
    setupDeck();
  });

  afterEach(() => {
    App.state.currentDeckId = null;
    App.state.decks = [];
    document.body.innerHTML = '';
  });

  it('渲染 4 个分类 pill 且计数正确', () => {
    App.renderCardsPanel();
    const pills = Array.from(document.querySelectorAll('#cardsFilter .filter-pill'));
    expect(pills.length).toBe(4);
    const texts = pills.map(p => p.textContent);
    expect(texts[0]).toBe('全部 (5)');
    expect(texts[1]).toBe('新词 (2)');
    expect(texts[2]).toBe('学习中 (2)');
    expect(texts[3]).toBe('已掌握 (1)');
    expect(pills[0].classList.contains('active')).toBe(true);
  });

  it('默认 all 渲染全部卡片', () => {
    App.renderCardsPanel();
    const items = document.querySelectorAll('#cardList .edit-card-item');
    expect(items.length).toBe(5);
  });

  it('切换「新词」后列表仅新词且 data-index 为原下标', () => {
    App.renderCardsPanel();
    const newPill = document.querySelector('#cardsFilter .filter-pill[data-filter="new"]');
    newPill.click();

    const items = document.querySelectorAll('#cardList .edit-card-item');
    expect(items.length).toBe(2);
    const indexes = Array.from(document.querySelectorAll('#cardList [data-action="deleteCard"]'))
      .map(b => b.dataset.index);
    expect(indexes).toEqual(['0', '3']); /* 原下标 */
    expect(document.querySelector('#cardsFilter .filter-pill[data-filter="new"]').classList.contains('active')).toBe(true);
    expect(App._cardFilter).toBe('new');
  });

  it('分类空态显示「该分类暂无单词」', () => {
    App.state.decks[0].cards = [{ id: 'a', front: 'abandon', ebbinghausStage: 0 }];
    App.renderCardsPanel();
    document.querySelector('#cardsFilter .filter-pill[data-filter="mastered"]').click();
    expect(document.getElementById('cardList').innerHTML).toContain('该分类暂无单词');
  });

  it('切换筛选后 _cardFilter 会话保持（renderAll 不重置）', () => {
    App.renderCardsPanel();
    document.querySelector('#cardsFilter .filter-pill[data-filter="mastered"]').click();
    expect(App._cardFilter).toBe('mastered');
    App.renderCardsPanel(); /* 模拟 renderAll 重渲染 */
    expect(App._cardFilter).toBe('mastered');
    expect(document.querySelector('#cardsFilter .filter-pill[data-filter="mastered"]').classList.contains('active')).toBe(true);
  });
});
