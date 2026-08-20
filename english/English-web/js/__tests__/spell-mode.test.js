/**
 * spell-mode.test.js —— 拼写模式纯练习 + 盲拼
 * （用户需求：拼写不参与学习进度；盲拼仅发音提示，不显示词形/音标/释义）
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const App = window.FlashcardApp;

function freshCard(overrides = {}) {
  return Object.assign({
    id: 'test-id',
    ebbinghausStage: 0,
    ebbinghausNextReview: '',
    ebbinghausHistory: [],
    easeFactor: 2.5,
    repetitions: 0,
  }, overrides);
}

describe('拼写模式（纯练习 + 盲拼）', () => {
  beforeEach(() => {
    window.mountStudyDOM();
    App.speak = vi.fn();
    sessionStorage.removeItem('flashcard-study-progress');
  });

  afterEach(() => {
    vi.useRealTimers();
    if (App._speakTimer) { clearTimeout(App._speakTimer); App._speakTimer = null; }
    App.state.currentDeckId = null;
    App.state.decks = [];
    document.body.innerHTML = '';
  });

  function setupStudy() {
    const card = freshCard({ id: 'a', front: 'abandon', phonetic: '/əˈbændən/' });
    App.state.decks = [{ id: 'd1', name: '测试', cards: [card] }];
    App.state.currentDeckId = 'd1';
    App.studyMode = 'new';
    App.studyQueue = [card];
    App.studyIndex = 0;
    App.isReviewing = false;
    App.isReviewMode = false;
    App.studyPassed = 0;
    App.studyFailed = 0;
    App.studyCompletedWords = 0;
    App.studyInitialQueueLength = 1;
    App.studyResults = [];
    return card;
  }

  it('拼写正确：✅ 反馈 + 朗读 + 输入清空可重拼，不翻卡不推进不碰调度', () => {
    const card = setupStudy();
    App.spellMode = true;
    const input = document.getElementById('spellInput');
    input.value = 'abandon';

    App.checkSpelling();

    expect(document.getElementById('spellFeedback').textContent).toContain('✅');
    expect(App.speak).toHaveBeenCalledWith('abandon');
    expect(input.value).toBe('');
    expect(input.disabled).toBe(false);
    expect(document.getElementById('flashcard').classList.contains('flipped')).toBe(false);
    /* 核心：完全不推进学习进度 */
    expect(App.studyIndex).toBe(0);
    expect(App.studyQueue.length).toBe(1);
    expect(App.studyPassed).toBe(0);
    expect(App.studyCompletedWords).toBe(0);
    expect(App.studyResults.length).toBe(0);
    expect(card.ebbinghausStage).toBe(0);
  });

  it('拼写错误：❌ 反馈含正确答案，可重试，不翻卡不推进，deck 卡零变更', () => {
    const card = setupStudy();
    card.ebbinghausStage = 2;
    card.wrongCount = 0;
    App.spellMode = true;
    const input = document.getElementById('spellInput');
    input.value = 'aban';

    App.checkSpelling();

    expect(document.getElementById('spellFeedback').innerHTML).toContain('abandon');
    expect(input.value).toBe('');
    expect(input.disabled).toBe(false);
    expect(document.getElementById('flashcard').classList.contains('flipped')).toBe(false);
    expect(App.studyIndex).toBe(0);
    expect(App.studyQueue.length).toBe(1);
    expect(App.studyFailed).toBe(0);
    expect(App.studyResults.length).toBe(0);
    expect(card.ebbinghausStage).toBe(2);
    expect(card.wrongCount).toBe(0);
  });

  it('空输入直接返回，无反馈无朗读', () => {
    setupStudy();
    App.spellMode = true;
    document.getElementById('spellInput').value = '   ';

    App.checkSpelling();

    expect(document.getElementById('spellFeedback').textContent).toBe('');
    expect(App.speak).not.toHaveBeenCalled();
  });

  it('非拼写模式调用 checkSpelling 直接返回', () => {
    const card = setupStudy();
    App.spellMode = false;
    document.getElementById('spellInput').value = 'abandon';

    App.checkSpelling();

    expect(document.getElementById('spellFeedback').textContent).toBe('');
    expect(App.speak).not.toHaveBeenCalled();
    expect(card.ebbinghausStage).toBe(0);
  });

  it('开启拼写模式：隐藏会了/不会按钮、正面盲拼占位不含词形/音标/计数点；退出后恢复', () => {
    setupStudy();
    App.spellMode = false;

    App.toggleSpellMode();
    expect(document.getElementById('btnPass').style.display).toBe('none');
    expect(document.getElementById('btnFail').style.display).toBe('none');
    expect(document.getElementById('spellInputArea').style.display).toBe('block');
    expect(document.getElementById('btnToggleSpell').classList.contains('spell-active')).toBe(true);
    const frontHtml = document.getElementById('cardFrontText').innerHTML;
    /* 盲拼下划线：abandon 7 字母 → 7 个下划线（带间隔），保留辅助文字 */
    expect((frontHtml.match(/_/g) || []).length).toBe(7);
    expect(frontHtml).toContain('听发音拼写');
    expect(frontHtml).not.toContain('abandon');
    expect(frontHtml).not.toContain('phonetic');
    expect(frontHtml).not.toContain('●');
    expect(document.querySelector('#flashcard .card-hint').textContent).toContain('听发音');

    App.toggleSpellMode();
    expect(document.getElementById('btnPass').style.display).toBe('');
    expect(document.getElementById('btnFail').style.display).toBe('');
    expect(document.getElementById('spellInputArea').style.display).toBe('none');
    expect(document.getElementById('btnToggleSpell').classList.contains('spell-active')).toBe(false);
    expect(document.getElementById('cardFrontText').innerHTML).toContain('abandon');
  });

  it('拼写模式进入时输入框聚焦', () => {
    setupStudy();
    const input = document.getElementById('spellInput');
    const spyFocus = vi.spyOn(input, 'focus');
    App.toggleSpellMode();
    expect(spyFocus).toHaveBeenCalled();
    spyFocus.mockRestore();
  });
});

describe('buildSpellBlindMask 盲拼下划线遮罩', () => {
  it('单字母词：一个下划线', () => {
    expect(App.buildSpellBlindMask({ front: 'a' })).toBe('_');
  });

  it('多字母词：带间隔下划线数量等于字母数', () => {
    const mask = App.buildSpellBlindMask({ front: 'abandon' });
    expect((mask.match(/_/g) || []).length).toBe(7);
    expect(mask).toBe('_ _ _ _ _ _ _');
  });

  it('多词短语：按空白分组，词间保留双空格', () => {
    expect(App.buildSpellBlindMask({ front: 'give up' })).toBe('_ _ _ _  _ _');
  });

  it('带撇号：撇号原样保留', () => {
    expect(App.buildSpellBlindMask({ front: "don't" })).toBe("_ _ _ ' _");
  });

  it('空卡返回空串', () => {
    expect(App.buildSpellBlindMask({})).toBe('');
  });
});
