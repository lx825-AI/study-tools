/**
 * wrong-words.js 测试 —— 错词列表模块（学习模式引导页「错题强化」折叠区）
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const App = window.FlashcardApp;

/** 挂载引导页折叠区桩：真实渲染 HTML + 绑定事件 + 错题强化卡片计数 */
function mountGuideSection() {
  document.body.innerHTML = App.renderModeFailedSectionHtml() +
    '<div id="modeCardFailed"><div class="mode-card-count">1 个待强化</div></div>';
  App.bindModeFailedSection();
}

function setFailedDeck() {
  App.state.decks = [{
    id: 'd1', name: '四级',
    cards: [{ id: 'c1', word: 'abandon', phonetic: '/əˈbændən/', definitions: ['放弃'], easeFactor: 1.5, repetitions: 3 }],
  }];
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

  it('引导页未挂载时不抛错（refresh 守卫）', () => {
    document.body.innerHTML = '';
    setFailedDeck();
    expect(function () { App.resetFailedCard('c1'); }).not.toThrow();
  });
});

describe('renderModeFailedSectionHtml', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('有错词时渲染折叠按钮、计数与错词列表条目', () => {
    setFailedDeck();
    const html = App.renderModeFailedSectionHtml();
    expect(html).toContain('id="btnToggleFailedList"');
    expect(html).toContain('id="modeFailedCount"');
    expect(html).toContain('abandon');
    expect(html).toContain('/əˈbændən/');
    expect(html).toContain('放弃');
    expect(html).toContain('EF: 1.5');
    expect(html).toContain('四级');
    expect(html).toContain('data-remove-card="c1"');
  });

  it('无错词时显示空状态', () => {
    App.state.decks = [{
      id: 'd1', name: '四级',
      cards: [{ id: 'c1', word: 'abandon', easeFactor: 2.5, repetitions: 0 }],
    }];
    const html = App.renderModeFailedSectionHtml();
    expect(html).toContain('暂无错词');
    expect(html).not.toContain('data-remove-card');
  });
});

describe('折叠区交互', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    setFailedDeck();
  });

  it('点击 toggle 展开/收起列表', () => {
    mountGuideSection();
    const toggle = document.getElementById('btnToggleFailedList');
    const list = document.getElementById('modeFailedList');
    const section = document.getElementById('modeFailedSection');

    toggle.click();
    expect(section.classList.contains('open')).toBe(true);
    expect(list.style.display).toBe('');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    toggle.click();
    expect(section.classList.contains('open')).toBe(false);
    expect(list.style.display).toBe('none');
  });

  it('点击移出：EF 重置、列表与计数原位刷新、展开态保持', () => {
    mountGuideSection();
    document.getElementById('btnToggleFailedList').click(); /* 先展开 */
    document.querySelector('[data-remove-card]').click();

    expect(App.state.decks[0].cards[0].easeFactor).toBe(2.5);
    const list = document.getElementById('modeFailedList');
    expect(list.innerHTML).toContain('暂无错词');
    expect(list.innerHTML).not.toContain('abandon');
    expect(list.style.display).toBe(''); /* 展开态保持 */
    expect(document.getElementById('modeFailedCount').textContent).toBe('0');
    const cardCount = document.querySelector('#modeCardFailed .mode-card-count');
    expect(cardCount.textContent).toBe('暂无错词');
    expect(cardCount.classList.contains('count-empty')).toBe(true);
  });

  it('引导页连续重建后移出只触发一次（监听不累积）', () => {
    window.mountStudyDOM();
    setFailedDeck();
    App.state.currentDeckId = 'd1';
    const deck = App.getCurrentDeck();
    App._renderModeGuide(deck);
    App._renderModeGuide(deck); /* 模拟 renderAll/切回导致的引导重建 */

    const spy = vi.spyOn(App, 'resetFailedCard');
    document.querySelector('#modeFailedList [data-remove-card]').click();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(App.state.decks[0].cards[0].easeFactor).toBe(2.5);

    spy.mockRestore();
    App.state.currentDeckId = null;
    document.body.innerHTML = '';
  });
});
