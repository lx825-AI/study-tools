/**
 * spell-mode.test.js —— 拼写模式单隐藏输入框 + 下划线展示位 + 纯练习
 * （对齐小程序 SpellInput 最新方案：键盘只弹一次、错位红显+答案行揭示 2000ms、光标闪烁）
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

/* 单隐藏输入框：一次赋值 + 一次 input 事件（handler 全量重建） */
function fillHidden(word) {
  const hi = document.getElementById('spellHiddenInput');
  hi.value = word;
  hi.dispatchEvent(new window.Event('input', { bubbles: true }));
}

function getChars() {
  return document.querySelectorAll('#spellSlots .slot-char');
}

function getFeedback() {
  return document.getElementById('spellFeedback');
}

describe('单隐藏输入框交互（对齐小程序 handleHiddenInput）', () => {
  beforeEach(() => {
    window.mountStudyDOM();
    App.speak = vi.fn();
    sessionStorage.removeItem('flashcard-study-progress');
  });

  afterEach(() => {
    vi.useRealTimers();
    if (App._speakTimer) { clearTimeout(App._speakTimer); App._speakTimer = null; }
    if (App._spellWrongTimer) { clearTimeout(App._spellWrongTimer); App._spellWrongTimer = null; }
    if (App._spellSubmitTimer) { clearTimeout(App._spellSubmitTimer); App._spellSubmitTimer = null; }
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

  it('输入字母后下划线格显示字母', () => {
    setupStudy();
    fillHidden('ab');
    const chars = getChars();
    expect(chars[0].textContent).toBe('a');
    expect(chars[1].textContent).toBe('b');
    expect(chars[2].textContent).toBe('_');
  });

  it('中文/标点/数字被过滤（中文 commit 不误删）', () => {
    setupStudy();
    fillHidden('a你b。c');
    const chars = getChars();
    expect(chars[0].textContent).toBe('a');
    expect(chars[1].textContent).toBe('b');
    expect(chars[2].textContent).toBe('c');
    expect(chars[3].textContent).toBe('_');
  });

  it('满词 150ms 后自动判定 ✅（字母保留 + 绿色下划线 + 不推进）', () => {
    vi.useFakeTimers();
    const card = setupStudy();
    fillHidden('abandon');
    expect(getFeedback().textContent).toBe(''); /* 150ms 内未判定 */
    vi.advanceTimersByTime(150);
    expect(getFeedback().textContent).toContain('✅');
    expect(App.speak).toHaveBeenCalledWith('abandon');
    /* 字母保留槽位 + 绿色下划线 */
    const chars = getChars();
    expect(chars[0].textContent).toBe('a');
    expect(chars[0].classList.contains('slot-correct')).toBe(true);
    expect(chars[6].classList.contains('slot-correct')).toBe(true);
    /* 纯练习：完全不推进 */
    expect(App.studyIndex).toBe(0);
    expect(App.studyQueue.length).toBe(1);
    expect(App.studyPassed).toBe(0);
    expect(App.studyResults.length).toBe(0);
    expect(card.ebbinghausStage).toBe(0);
  });

  it('正确后退格改字母：回输入态 + 清除陈旧 ✅', () => {
    vi.useFakeTimers();
    setupStudy();
    fillHidden('abandon');
    vi.advanceTimersByTime(150);
    expect(getFeedback().textContent).toContain('✅');

    fillHidden('abando'); /* 退格：值变短 */
    expect(App._spellCheckState).toBe('idle');
    expect(getFeedback().textContent).toBe('');
    const chars = getChars();
    expect(chars[6].classList.contains('slot-correct')).toBe(false);
  });

  it('正确后同值重复事件：不二次判定不重复朗读', () => {
    vi.useFakeTimers();
    setupStudy();
    vi.advanceTimersByTime(400); /* 消化 300ms 自动播放，避免计入 speak 次数 */
    fillHidden('abandon');
    vi.advanceTimersByTime(150);
    const speakCalls = App.speak.mock.calls.length;

    fillHidden('abandon'); /* 同值重复 input（Android 偶发） */
    vi.advanceTimersByTime(150);
    expect(App.speak.mock.calls.length).toBe(speakCalls);
    expect(App._spellCheckState).toBe('correct');
  });

  it('揭示期（wrong）输入被忽略', () => {
    vi.useFakeTimers();
    setupStudy();
    fillHidden('abanxxx');
    vi.advanceTimersByTime(150);
    expect(App._spellCheckState).toBe('wrong');

    fillHidden('abandon');
    expect(App._spellCheckState).toBe('wrong'); /* 仍揭示期 */
    expect(App._spellLetters.join('')).toBe('abanxxx'); /* 字母未被覆盖 */
  });

  it('非拼写模式下输入忽略', () => {
    setupStudy();
    App.spellMode = false;
    fillHidden('abandon');
    vi.useFakeTimers();
    vi.advanceTimersByTime(150);
    expect(App.speak).not.toHaveBeenCalled();
    expect(getFeedback().textContent).toBe('');
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
    if (App._spellSubmitTimer) { clearTimeout(App._spellSubmitTimer); App._spellSubmitTimer = null; }
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

  it('拼写错误：❌ 不含答案 + 错位红显指错 + 答案行完整揭示 + 2000ms 后清空重试', () => {
    vi.useFakeTimers();
    const card = setupStudy();
    card.ebbinghausStage = 2;
    fillHidden('abanxxx');
    vi.advanceTimersByTime(150);

    /* feedback 不含答案文字（防照着拼写） */
    expect(getFeedback().textContent).toBe('❌ 拼写错误');
    expect(getFeedback().textContent).not.toContain('abandon');
    /* 错位红显：前 4 位对位保持，后 3 位错位红 */
    const chars = getChars();
    expect(chars[0].classList.contains('slot-filled')).toBe(true);
    expect(chars[4].classList.contains('slot-wrong-char')).toBe(true);
    expect(chars[6].classList.contains('slot-wrong-char')).toBe(true);
    /* 答案行完整展示正确词 */
    const answerRow = document.querySelector('#spellSlots .answer-row');
    expect(answerRow).not.toBeNull();
    expect(answerRow.textContent.replace(/\s/g, '')).toBe('abandon');
    /* 收键盘 */
    expect(document.activeElement).not.toBe(document.getElementById('spellHiddenInput'));
    /* 不翻卡不推进不碰调度 */
    expect(App.studyIndex).toBe(0);
    expect(App.studyFailed).toBe(0);
    expect(App.studyResults.length).toBe(0);
    expect(card.ebbinghausStage).toBe(2);
    expect(document.getElementById('flashcard').classList.contains('flipped')).toBe(false);

    /* 2000ms 后清空盲拼重试 */
    vi.advanceTimersByTime(App.SPELL_WRONG_DELAY);
    expect(App._spellCheckState).toBe('idle');
    expect(App._spellLetters.join('')).toBe('');
    expect(getFeedback().textContent).toBe('');
    expect(document.querySelector('#spellSlots .answer-row')).toBeNull();
    expect(document.getElementById('spellHiddenInput').value).toBe('');
    expect(document.activeElement).toBe(document.getElementById('spellHiddenInput'));
  });

  it('空输入直接返回，无反馈无朗读', () => {
    setupStudy();
    App.checkSpelling();
    expect(getFeedback().textContent).toBe('');
    expect(App.speak).not.toHaveBeenCalled();
  });

  it('非拼写模式调用 checkSpelling 直接返回', () => {
    const card = setupStudy();
    App.spellMode = false;
    App.checkSpelling();
    expect(getFeedback().textContent).toBe('');
    expect(App.speak).not.toHaveBeenCalled();
    expect(card.ebbinghausStage).toBe(0);
  });

  it("归一化：'don\\'t' 填 4 字母 'dont' 判对（撇号为固定展示不可输入）", () => {
    vi.useFakeTimers();
    setupStudy("don't");
    fillHidden('dont');
    vi.advanceTimersByTime(150);
    expect(getFeedback().textContent).toContain('✅');
  });

  it("'give up' 填 6 字母判对（词间分组不占字母）", () => {
    vi.useFakeTimers();
    setupStudy('give up');
    fillHidden('giveup');
    vi.advanceTimersByTime(150);
    expect(getFeedback().textContent).toContain('✅');
  });
});

describe('toggleSpellMode 与渲染', () => {
  beforeEach(() => {
    window.mountStudyDOM();
    App.speak = vi.fn();
    sessionStorage.removeItem('flashcard-study-progress');
  });

  afterEach(() => {
    vi.useRealTimers();
    if (App._speakTimer) { clearTimeout(App._speakTimer); App._speakTimer = null; }
    if (App._spellWrongTimer) { clearTimeout(App._spellWrongTimer); App._spellWrongTimer = null; }
    if (App._spellSubmitTimer) { clearTimeout(App._spellSubmitTimer); App._spellSubmitTimer = null; }
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

  it('开启拼写模式：隐藏会了/不会、下划线格 + 隐藏输入框、聚焦输入框；退出后恢复', () => {
    setupStudy();
    App.toggleSpellMode();

    expect(document.getElementById('btnPass').style.display).toBe('none');
    expect(document.getElementById('btnFail').style.display).toBe('none');
    expect(document.getElementById('btnToggleSpell').classList.contains('spell-active')).toBe(true);
    const frontHtml = document.getElementById('cardFrontText').innerHTML;
    expect(getChars().length).toBe(7);
    expect(frontHtml).toContain('id="spellHiddenInput"');
    expect(frontHtml).toContain('听发音拼写');
    expect(frontHtml).not.toContain('abandon');
    expect(frontHtml).not.toContain('phonetic');
    expect(document.querySelector('#flashcard .card-hint').textContent).toContain('听发音');
    expect(document.activeElement).toBe(document.getElementById('spellHiddenInput'));

    App.toggleSpellMode();
    expect(document.getElementById('btnPass').style.display).toBe('');
    expect(document.getElementById('btnFail').style.display).toBe('');
    expect(document.getElementById('cardFrontText').innerHTML).toContain('abandon');
  });

  it('判定反馈位于卡片内部拼写格子下方', () => {
    setupStudy();
    App.toggleSpellMode();
    const front = document.getElementById('cardFrontText');
    const fb = front.querySelector('#spellFeedback');
    expect(fb).not.toBeNull();
    expect(document.getElementById('spellModeSection').querySelector('#spellFeedback')).toBeNull();
    expect(front.querySelector('#spellSlots').nextElementSibling).toBe(fb);
  });

  it('回看态禁止切换拼写模式（与 checkSpelling 守卫一致）', () => {
    setupStudy();
    App.isReviewing = true;
    App.toggleSpellMode();
    expect(App.spellMode).toBe(false);
  });
});

describe('_renderSpellSlots 下划线渲染', () => {
  beforeEach(() => {
    window.mountStudyDOM();
    App.speak = vi.fn();
    sessionStorage.removeItem('flashcard-study-progress');
  });

  afterEach(() => {
    vi.useRealTimers();
    if (App._speakTimer) { clearTimeout(App._speakTimer); App._speakTimer = null; }
    if (App._spellWrongTimer) { clearTimeout(App._spellWrongTimer); App._spellWrongTimer = null; }
    if (App._spellSubmitTimer) { clearTimeout(App._spellSubmitTimer); App._spellSubmitTimer = null; }
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
    App.spellMode = true;
    App.renderStudyPanel();
    return card;
  }

  it('空槽显示下划线占位', () => {
    setupStudy();
    const chars = getChars();
    expect(chars.length).toBe(7);
    expect(chars[0].textContent).toBe('_');
    expect(chars[6].textContent).toBe('_');
  });

  it("don't：撇号 static 固定展示", () => {
    setupStudy("don't");
    const statics = document.querySelectorAll('#spellSlots .slot-static');
    expect(statics.length).toBe(1);
    expect(statics[0].textContent).toBe("'");
    expect(getChars().length).toBe(4);
  });

  it('give up：两组下划线', () => {
    setupStudy('give up');
    expect(document.querySelectorAll('#spellSlots .slot-group').length).toBe(2);
    expect(getChars().length).toBe(6);
  });

  it('聚焦时当前输入位显示闪烁光标，输入后右移', () => {
    setupStudy();
    App._spellInputFocused = true;
    App._renderSpellSlots();
    let carets = document.querySelectorAll('#spellSlots .slot-caret');
    expect(carets.length).toBe(1);
    expect(carets[0].parentElement.textContent).toBe('_');
    expect(getChars()[0].classList.contains('slot-cursor')).toBe(true);

    fillHidden('ab');
    App._spellInputFocused = true;
    App._renderSpellSlots();
    carets = document.querySelectorAll('#spellSlots .slot-caret');
    expect(carets.length).toBe(1);
    expect(carets[0].parentElement.textContent).toBe('_'); /* 光标位于第 3 格（空） */
    expect(getChars()[2].classList.contains('slot-cursor')).toBe(true);
  });

  it('满词与失焦时无光标', () => {
    setupStudy();
    fillHidden('abandon');
    App._spellInputFocused = true;
    App._renderSpellSlots();
    expect(document.querySelectorAll('#spellSlots .slot-caret').length).toBe(0);

    fillHidden('ab');
    App._spellInputFocused = false;
    App._renderSpellSlots();
    expect(document.querySelectorAll('#spellSlots .slot-caret').length).toBe(0);
  });

  it('wrong 期答案行与错位红显类', () => {
    setupStudy();
    fillHidden('abanxxx');
    App._spellCheckState = 'wrong';
    App._renderSpellSlots();
    expect(document.querySelector('#spellSlots .answer-row')).not.toBeNull();
    expect(document.querySelectorAll('#spellSlots .slot-wrong-char').length).toBe(3);
  });
});
