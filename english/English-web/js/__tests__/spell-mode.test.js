/**
 * spell-mode.test.js —— 拼写模式槽位式盲拼 + 纯练习
 * （槽位逐格输入、输满自动判定、错误高亮后清空重拼、不参与学习进度）
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

/* 向槽位输入字母并派发 input 事件（委托 handler 依赖 bubbles） */
function typeSlot(slot, ch) {
  slot.value = ch;
  slot.dispatchEvent(new window.Event('input', { bubbles: true }));
}

/* 逐槽填满单词（最后一槽触发自动判定） */
function fillWord(slots, word) {
  for (let i = 0; i < word.length; i++) {
    typeSlot(slots[i], word[i]);
  }
}

/* 槽位渲染：把 HTML 放进容器解析（jsdom 无独立 DOM 解析钩子） */
function parseSlots(html) {
  const host = document.createElement('div');
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

describe('buildSpellSlotHtml 槽位生成', () => {
  it("单字母 'a'：1 个槽、data-idx=0、无 gap/fixed", () => {
    const host = parseSlots(App.buildSpellSlotHtml({ front: 'a' }));
    const slots = host.querySelectorAll('input.spell-slot');
    expect(slots.length).toBe(1);
    expect(slots[0].getAttribute('data-idx')).toBe('0');
    expect(host.querySelectorAll('.spell-slot-gap').length).toBe(0);
    expect(host.querySelectorAll('.spell-slot-fixed').length).toBe(0);
    host.remove();
  });

  it("'abandon'：7 个槽、data-idx 0-6、输入属性齐全", () => {
    const host = parseSlots(App.buildSpellSlotHtml({ front: 'abandon' }));
    const slots = host.querySelectorAll('input.spell-slot');
    expect(slots.length).toBe(7);
    [0, 1, 2, 3, 4, 5, 6].forEach((i) => expect(slots[i].getAttribute('data-idx')).toBe(String(i)));
    expect(slots[0].getAttribute('maxlength')).toBe('1');
    expect(slots[0].getAttribute('autocomplete')).toBe('off');
    expect(slots[0].getAttribute('autocapitalize')).toBe('none');
    expect(slots[0].getAttribute('autocorrect')).toBe('off');
    expect(slots[0].getAttribute('spellcheck')).toBe('false');
    host.remove();
  });

  it("'give up'：1 个 gap + 6 个槽、idx 连续 0-5（仅字母槽编号）", () => {
    const host = parseSlots(App.buildSpellSlotHtml({ front: 'give up' }));
    expect(host.querySelectorAll('.spell-slot-gap').length).toBe(1);
    const slots = host.querySelectorAll('input.spell-slot');
    expect(slots.length).toBe(6);
    [0, 1, 2, 3, 4, 5].forEach((i) => expect(slots[i].getAttribute('data-idx')).toBe(String(i)));
    host.remove();
  });

  it("'don\\'t'：4 个槽 + 撇号固定展示", () => {
    const host = parseSlots(App.buildSpellSlotHtml({ front: "don't" }));
    expect(host.querySelectorAll('input.spell-slot').length).toBe(4);
    const fixed = host.querySelectorAll('.spell-slot-fixed');
    expect(fixed.length).toBe(1);
    expect(fixed[0].textContent).toBe("'");
    host.remove();
  });

  it("'e-mail'：连字符固定展示；空卡返回空串", () => {
    const host = parseSlots(App.buildSpellSlotHtml({ front: 'e-mail' }));
    expect(host.querySelectorAll('input.spell-slot').length).toBe(5);
    expect(host.querySelector('.spell-slot-fixed').textContent).toBe('-');
    host.remove();
    expect(App.buildSpellSlotHtml({})).toBe('');
  });
});

describe('槽位交互（document 委托）', () => {
  beforeEach(() => {
    window.mountStudyDOM();
    App.speak = vi.fn();
    sessionStorage.removeItem('flashcard-study-progress');
  });

  afterEach(() => {
    vi.useRealTimers();
    if (App._speakTimer) { clearTimeout(App._speakTimer); App._speakTimer = null; }
    if (App._spellWrongTimer) { clearTimeout(App._spellWrongTimer); App._spellWrongTimer = null; }
    App.state.currentDeckId = null;
    App.state.decks = [];
    document.body.innerHTML = '';
  });

  function setupStudy(front = 'abandon') {
    const card = freshCard({ id: 'a', front, phonetic: '/əˈbændən/' });
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
    App.spellMode = true;
    App.renderStudyPanel();
    return card;
  }

  function getSlots() {
    return document.querySelectorAll('.spell-slots .spell-slot');
  }

  it('输入字母后自动跳到下一槽', () => {
    setupStudy();
    const slots = getSlots();
    slots[0].focus();
    typeSlot(slots[0], 'a');
    expect(document.activeElement).toBe(slots[1]);
  });

  it('输入过滤非字母且只保留末字符', () => {
    setupStudy();
    const slots = getSlots();
    typeSlot(slots[0], 'a2');
    expect(slots[0].value).toBe('a');
    typeSlot(slots[0], '12b');
    expect(slots[0].value).toBe('b');
  });

  it('末槽且全槽填满自动判定 ✅', () => {
    const card = setupStudy();
    const slots = getSlots();
    fillWord(slots, 'abandon');
    expect(document.getElementById('spellFeedback').textContent).toContain('✅');
    expect(App.speak).toHaveBeenCalledWith('abandon');
    /* 判定后槽位清空可重拼 */
    expect(slots[0].value).toBe('');
    expect(slots[6].value).toBe('');
    /* 纯练习：完全不推进 */
    expect(App.studyIndex).toBe(0);
    expect(App.studyQueue.length).toBe(1);
    expect(App.studyPassed).toBe(0);
    expect(App.studyResults.length).toBe(0);
    expect(card.ebbinghausStage).toBe(0);
  });

  it('仅末槽有值时输入不触发判定（乱序填充防护）', () => {
    setupStudy();
    const slots = getSlots();
    typeSlot(slots[6], 'n');
    expect(document.getElementById('spellFeedback').textContent).toBe('');
  });

  it('空槽按 Backspace 回退上一槽并清空其值', () => {
    setupStudy();
    const slots = getSlots();
    typeSlot(slots[0], 'a');
    slots[1].focus();
    slots[1].dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
    expect(slots[0].value).toBe('');
    expect(document.activeElement).toBe(slots[0]);
  });

  it('非拼写模式下输入不触发判定', () => {
    setupStudy();
    App.spellMode = false;
    const slots = getSlots();
    typeSlot(slots[6], 'n');
    expect(document.getElementById('spellFeedback').textContent).toBe('');
  });
});

describe('checkSpelling 语义（纯练习）', () => {
  beforeEach(() => {
    window.mountStudyDOM();
    App.speak = vi.fn();
    sessionStorage.removeItem('flashcard-study-progress');
  });

  afterEach(() => {
    vi.useRealTimers();
    if (App._speakTimer) { clearTimeout(App._speakTimer); App._speakTimer = null; }
    if (App._spellWrongTimer) { clearTimeout(App._spellWrongTimer); App._spellWrongTimer = null; }
    App.state.currentDeckId = null;
    App.state.decks = [];
    document.body.innerHTML = '';
  });

  function setupStudy(front = 'abandon') {
    const card = freshCard({ id: 'a', front, phonetic: '/əˈbændən/' });
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
    App.spellMode = true;
    App.renderStudyPanel();
    return card;
  }

  function getSlots() {
    return document.querySelectorAll('.spell-slots .spell-slot');
  }

  it('拼写错误：❌ + 正确答案 + 槽位红框禁入，600ms 后清空重拼', () => {
    vi.useFakeTimers();
    const card = setupStudy();
    card.ebbinghausStage = 2;
    card.wrongCount = 0;
    const slots = getSlots();
    fillWord(slots, 'abanxxx');

    const feedback = document.getElementById('spellFeedback');
    expect(feedback.innerHTML).toContain('abandon');
    expect(slots[0].classList.contains('spell-slot-wrong')).toBe(true);
    expect(slots[0].disabled).toBe(true);
    expect(slots[0].value).toBe('a'); /* 错误值暂留展示 */

    vi.advanceTimersByTime(App.SPELL_WRONG_DELAY);
    expect(slots[0].value).toBe('');
    expect(slots[0].disabled).toBe(false);
    expect(slots[0].classList.contains('spell-slot-wrong')).toBe(false);
    expect(document.activeElement).toBe(slots[0]);
    /* 纯练习：不翻卡不推进不碰调度 */
    expect(App.studyIndex).toBe(0);
    expect(App.studyFailed).toBe(0);
    expect(App.studyResults.length).toBe(0);
    expect(card.ebbinghausStage).toBe(2);
    expect(card.wrongCount).toBe(0);
    expect(document.getElementById('flashcard').classList.contains('flipped')).toBe(false);
  });

  it('空输入直接返回，无反馈无朗读', () => {
    setupStudy();
    App.checkSpelling();
    expect(document.getElementById('spellFeedback').textContent).toBe('');
    expect(App.speak).not.toHaveBeenCalled();
  });

  it('非拼写模式调用 checkSpelling 直接返回', () => {
    const card = setupStudy();
    App.spellMode = false;
    App.checkSpelling();
    expect(document.getElementById('spellFeedback').textContent).toBe('');
    expect(App.speak).not.toHaveBeenCalled();
    expect(card.ebbinghausStage).toBe(0);
  });

  it("归一化：'don\\'t' 只填 4 字母槽 'dont' 判对（撇号为固定展示不可输入）", () => {
    setupStudy("don't");
    const slots = getSlots();
    fillWord(slots, 'dont');
    expect(document.getElementById('spellFeedback').textContent).toContain('✅');
  });

  it("'give up' 填 6 槽判对（词间 gap 不占槽）", () => {
    setupStudy('give up');
    const slots = getSlots();
    fillWord(slots, 'giveup');
    expect(document.getElementById('spellFeedback').textContent).toContain('✅');
  });
});

describe('toggleSpellMode 槽位渲染', () => {
  beforeEach(() => {
    window.mountStudyDOM();
    App.speak = vi.fn();
    sessionStorage.removeItem('flashcard-study-progress');
  });

  afterEach(() => {
    vi.useRealTimers();
    if (App._speakTimer) { clearTimeout(App._speakTimer); App._speakTimer = null; }
    if (App._spellWrongTimer) { clearTimeout(App._spellWrongTimer); App._spellWrongTimer = null; }
    App.state.currentDeckId = null;
    App.state.decks = [];
    document.body.innerHTML = '';
  });

  function setupStudy(front = 'abandon') {
    const card = freshCard({ id: 'a', front, phonetic: '/əˈbændən/' });
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
    App.spellMode = false;
    return card;
  }

  it('开启拼写模式：隐藏会了/不会、正面为槽位盲拼、聚焦首槽；退出后恢复', () => {
    setupStudy();
    App.toggleSpellMode();

    expect(document.getElementById('btnPass').style.display).toBe('none');
    expect(document.getElementById('btnFail').style.display).toBe('none');
    expect(document.getElementById('btnToggleSpell').classList.contains('spell-active')).toBe(true);
    const frontHtml = document.getElementById('cardFrontText').innerHTML;
    expect(document.querySelectorAll('.spell-slots .spell-slot').length).toBe(7);
    expect(frontHtml).toContain('听发音拼写');
    expect(frontHtml).not.toContain('abandon');
    expect(frontHtml).not.toContain('phonetic');
    expect(document.querySelector('#flashcard .card-hint').textContent).toContain('听发音');
    expect(document.activeElement).toBe(document.querySelector('.spell-slots .spell-slot'));

    App.toggleSpellMode();
    expect(document.getElementById('btnPass').style.display).toBe('');
    expect(document.getElementById('btnFail').style.display).toBe('');
    expect(document.getElementById('btnToggleSpell').classList.contains('spell-active')).toBe(false);
    expect(document.getElementById('cardFrontText').innerHTML).toContain('abandon');
  });

  it('回看态禁止切换拼写模式（与 checkSpelling 守卫一致）', () => {
    setupStudy();
    App.isReviewing = true;
    App.toggleSpellMode();
    expect(App.spellMode).toBe(false);
  });
});
