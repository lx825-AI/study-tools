/* app.js —— 事件绑定与初始化 */
var FlashcardApp = window.FlashcardApp || {};
(function (App) {
  'use strict';

  /* ========== 演示数据（富格式：展���卡背各数据段） ========== */
  App.seedDemoData = function () {
    if (App.state.decks.length > 0) return;
    let cet4Words = [
      { front: 'abandon', back: '丢弃；放弃，抛弃', word: 'abandon', phonetic: '/əˈbændən/', pos: 'v.',
        definitions: ['丢弃；放弃，抛弃', '沉溺于，放纵'],
        phrases: [{ en: 'abandon oneself to', zh: '沉溺于，纵情于' }, { en: 'abandon hope', zh: '放弃希望' }],
        sentences: [{ en: 'They had to abandon the sinking ship.', zh: '他们不得不放弃正在下沉的船。' }],
        synonyms: ['desert', 'forsake', 'give up'], antonyms: ['keep', 'retain', 'maintain'],
        confused: ['abundant'] },
      { front: 'ability', back: '能力；才能', word: 'ability', phonetic: '/əˈbɪləti/', pos: 'n.',
        definitions: ['能力；本领', '才能，才智'],
        phrases: [{ en: 'to the best of ones ability', zh: '尽某人最大努力' }, { en: 'ability test', zh: '能力测试' }],
        sentences: [{ en: 'She has the ability to learn languages quickly.', zh: '她有快速学习语言的能力。' }],
        synonyms: ['capability', 'capacity', 'talent'], antonyms: ['inability', 'incapacity'],
        confused: [] },
      { front: 'absorb', back: '吸收；吸引……的注意', word: 'absorb', phonetic: '/əbˈzɔːrb/', pos: 'v.',
        definitions: ['吸收（液体、气体等）', '吸引……的注意，使全神贯注'],
        phrases: [{ en: 'be absorbed in', zh: '全神贯注于，专心于' }],
        sentences: [{ en: 'Plants absorb carbon dioxide from the air.', zh: '植物从空气中吸收二氧化碳。' }, { en: 'He was completely absorbed in his book.', zh: '他完全沉浸在书中。' }],
        synonyms: ['soak up', 'take in', 'engage'], antonyms: ['emit', 'release'],
        confused: ['absolute'] },
      { front: 'accomplish', back: '完成；实现', word: 'accomplish', phonetic: '/əˈkɑːmplɪʃ/', pos: 'v.',
        definitions: ['完成（任务、目标）', '实现，达成'],
        phrases: [{ en: 'accomplish a task', zh: '完成任务' }, { en: 'mission accomplished', zh: '使命达成' }],
        sentences: [{ en: 'We accomplished our goal ahead of schedule.', zh: '我们提前完成了目标。' }],
        synonyms: ['achieve', 'fulfill', 'complete'], antonyms: ['fail'],
        confused: ['achieve'] },
      { front: 'acquire', back: '获得；习得', word: 'acquire', phonetic: '/əˈkwaɪər/', pos: 'v.',
        definitions: ['获得，取得', '习得（知识、技能）'],
        phrases: [{ en: 'acquire knowledge', zh: '获取知识' }, { en: 'acquire a reputation', zh: '获得声誉' }],
        sentences: [{ en: 'She acquired a good knowledge of English.', zh: '她习得了良好的英语知识。' }],
        synonyms: ['obtain', 'gain', 'attain'], antonyms: ['lose', 'forfeit'],
        confused: ['inquire', 'require'] }
    ];
    let cet6Words = [
      { front: 'abolish', back: '废除；取消', word: 'abolish', phonetic: '/əˈbɑːlɪʃ/', pos: 'v.',
        definitions: ['废除，废止（法律、制度、习俗等）'],
        phrases: [{ en: 'abolish slavery', zh: '废除奴隶制' }, { en: 'abolish a law', zh: '废止一项法律' }],
        sentences: [{ en: 'Many countries have abolished the death penalty.', zh: '许多国家已废除了死刑。' }],
        synonyms: ['eliminate', 'terminate', 'repeal'], antonyms: ['establish', 'institute'],
        confused: ['polish', 'admonish'] },
      { front: 'adhere', back: '黏附；坚持，遵守', word: 'adhere', phonetic: '/ədˈhɪr/', pos: 'v.',
        definitions: ['黏附，附着', '坚持，遵守（原则、规则等）'],
        phrases: [{ en: 'adhere to', zh: '遵守，坚持，黏附于' }],
        sentences: [{ en: 'We must adhere to the safety regulations.', zh: '我们必须遵守安全规定。' }, { en: 'The paint adheres to the wall well.', zh: '油漆很好地附着在墙上。' }],
        synonyms: ['stick', 'cling', 'comply'], antonyms: ['disobey', 'ignore'],
        confused: ['cohere'] },
      { front: 'advocate', back: '提倡；倡导者', word: 'advocate', phonetic: '/ˈædvəkeɪt/', pos: 'v./n.',
        definitions: ['提倡，主张 (v.)', '倡导者，拥护者 (n.)'],
        phrases: [{ en: 'advocate for', zh: '为……倡导' }, { en: 'a strong advocate', zh: '坚定的倡导者' }],
        sentences: [{ en: 'He advocates reducing plastic waste.', zh: '他提倡减少塑料垃圾。' }],
        synonyms: ['champion', 'support', 'promote'], antonyms: ['oppose', 'reject'],
        confused: ['adverse'] },
      { front: 'ambiguous', back: '模棱两可的；含糊的', word: 'ambiguous', phonetic: '/æmˈbɪɡjuəs/', pos: 'adj.',
        definitions: ['模棱两可的，含糊不清的', '引起歧义的'],
        phrases: [{ en: 'ambiguous statement', zh: '含糊的陈述' }, { en: 'highly ambiguous', zh: '非常模棱两可' }],
        sentences: [{ en: 'The contract contains some ambiguous terms.', zh: '合同中包含一些模棱两可的条款。' }],
        synonyms: ['vague', 'unclear', 'obscure'], antonyms: ['clear', 'explicit', 'unambiguous'],
        confused: ['ambitious'] },
      { front: 'allocate', back: '分配；拨出', word: 'allocate', phonetic: '/ˈæləkeɪt/', pos: 'v.',
        definitions: ['分配，分派', '拨出（资金、资源）'],
        phrases: [{ en: 'allocate resources', zh: '分配资源' }, { en: 'allocate funds', zh: '拨出资金' }],
        sentences: [{ en: 'The government allocated funds for education.', zh: '政府为教育拨出了资金。' }],
        synonyms: ['assign', 'distribute', 'allot'], antonyms: ['withhold', 'withdraw'],
        confused: ['locate', 'alleviate'] }
    ];
    App.state.decks = [
      { id: App.genId(), name: '四级高频词汇（演示）', cards: cet4Words.map(function (w) {
          return Object.assign({ id: App.genId(), difficulty: Math.floor(Math.random() * 5) + 1 }, w);
      })},
      { id: App.genId(), name: '六级高频词汇（演示）', cards: cet6Words.map(function (w) {
          return Object.assign({ id: App.genId(), difficulty: Math.floor(Math.random() * 5) + 1 }, w);
      })},
    ];
    App.state.currentDeckId = null;
    App.saveData();
  };

  /* 预览搜索辅助：支持模糊匹配英文 + 精确匹配释义/词性 */
  App._filterPreviewCards = function (deck, query) {
    if (!query) return deck.cards;
    return deck.cards.filter(function (c) {
      let front = App.getCardFront(c).toLowerCase();
      let back = App.getCardBack(c).toLowerCase();
      let pos = (c.pos || '').toLowerCase();
      return App.fuzzyMatch(query, front) || back.indexOf(query) !== -1 || pos.indexOf(query) !== -1;
    });
  };

  /* ========== Toast 通知 ========== */
  App.showToast = function (message, type, duration) {
    type = type || 'info';
    duration = duration || 2500;
    let toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.classList.add('toast-exit');
      setTimeout(function () { toast.remove(); }, 300);
    }, duration);
  };

  /* debounce 工具 */
  App.debounce = function (fn, delay) {
    let timer;
    return function () {
      let ctx = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, delay);
    };
  };

  /* ========== 事件绑定 ========== */
  App.init = function () {
    /* 创建牌组 */
    document.getElementById('btnAddDeck').addEventListener('click', function () {
      let input = document.getElementById('deckNameInput');
      let name = input.value.trim();
      if (!name) return;
      App.state.decks.push({ id: App.genId(), name: name, cards: [] });
      App.saveData();
      input.value = '';
      App.renderAll();
    });

    document.getElementById('deckNameInput').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') document.getElementById('btnAddDeck').click();
    });

    /* 牌组选择器 */
    document.getElementById('deckSelect').addEventListener('change', function (e) {
      App.state.currentDeckId = e.target.value || null;
      App.saveData();
      App.renderAll();
    });

    /* 开始学习按钮 */
    document.getElementById('btnStudyNow').addEventListener('click', function () {
      let deck = App.getCurrentDeck();
      if (!deck) { App.showToast('请先选择一个牌组', 'warn'); return; }
      if (deck.cards.length === 0) { App.showToast('该牌组还没有卡片，请先添加', 'warn'); return; }
      App.switchTab('study');
    });

    /* Tab 导航 */
    document.querySelectorAll('nav button').forEach(function (btn) {
      btn.addEventListener('click', function () { App.switchTab(btn.dataset.tab); });
    });

    /* 牌组卡片操作 */
    document.getElementById('deckGrid').addEventListener('click', function (e) {
      let btn = e.target.closest('button[data-action]');
      if (!btn) return;
      App.handleDeckAction(btn.dataset.action, btn.dataset.deck);
    });

    /* 卡片列表操作 */
    document.getElementById('cardList').addEventListener('click', function (e) {
      let delBtn = e.target.closest('button[data-action="deleteCard"]');
      if (delBtn) {
        App.handleCardDelete(parseInt(delBtn.dataset.index));
        return;
      }
      let speakBtn = e.target.closest('.speak-card-btn');
      if (!speakBtn) return;
      e.stopPropagation();
      let frontDiv = speakBtn.closest('.edit-card-front');
      if (!frontDiv) return;
      let text = (frontDiv.textContent || '').replace(/🔊\s*$/, '').trim();
      if (text) App.speak(text);
    });

    /* 批量操作 */
    document.getElementById('btnBatchMode').addEventListener('click', App.toggleBatchMode);
    document.getElementById('btnSelectAll').addEventListener('click', App.selectAllCards);
    document.getElementById('btnDeselectAll').addEventListener('click', App.deselectAllCards);
    document.getElementById('btnBatchDelete').addEventListener('click', App.batchDeleteCards);
    document.getElementById('btnBatchImport').addEventListener('click', App.batchImportCards);

    /* 添加卡片 */
    document.getElementById('btnAddCard').addEventListener('click', function () {
      let deck = App.getCurrentDeck();
      if (!deck) return;
      let front = document.getElementById('cardFrontInput').value.trim();
      let back = document.getElementById('cardBackInput').value.trim();
      if (!front || !back) { App.showToast('请填写正面和反面内容', 'warn'); return; }
      deck.cards.push({ id: App.genId(), front: front, back: back, difficulty: 3 });
      App.saveData();
      document.getElementById('cardFrontInput').value = '';
      document.getElementById('cardBackInput').value = '';
      document.getElementById('cardFrontInput').focus();
      App.renderAll();
    });

    /* 翻卡 */
    document.getElementById('flashcard').addEventListener('click', function () {
      if (App.studyQueue.length === 0 || App.studyIndex >= App.studyQueue.length) return;
      document.getElementById('flashcard').classList.toggle('flipped');
      App.isFlipped = !App.isFlipped;
    });

    /* 移动端滑动翻卡 */
    (function () {
      let card = document.getElementById('flashcard');
      let startX = 0, startY = 0, moved = false;

      card.addEventListener('touchstart', function (e) {
        if (App.studyQueue.length === 0 || App.studyIndex >= App.studyQueue.length) return;
        let t = e.touches[0];
        startX = t.clientX;
        startY = t.clientY;
        moved = false;
      }, { passive: true });

      card.addEventListener('touchmove', function (e) {
        let t = e.touches[0];
        if (!t) return;
        let dx = t.clientX - startX;
        let dy = t.clientY - startY;
        if (Math.abs(dx) > 5 && Math.abs(dx) > Math.abs(dy)) {
          moved = true;
          card.style.transform = 'translateX(' + dx + 'px) rotateY(' + (App.isFlipped ? 180 : 0) + 'deg)';
          card.style.transition = 'none';
        }
      }, { passive: true });

      card.addEventListener('touchend', function (e) {
        card.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        card.style.transform = App.isFlipped ? 'rotateY(180deg)' : '';
        let ct = e.changedTouches[0];
        let dx = ct ? ct.clientX - startX : 0;
        if (moved && Math.abs(dx) > 60) {
          if (App.isFlipped) {
            App.answerStudy(dx > 0);
          } else {
            document.getElementById('flashcard').classList.toggle('flipped');
            App.isFlipped = !App.isFlipped;
          }
        }
        moved = false;
      });
    })();

    /* 学习作答 */
    document.getElementById('btnFail').addEventListener('click', function () { App.answerStudy(false); });
    document.getElementById('btnPass').addEventListener('click', function () { App.answerStudy(true); });
    document.getElementById('btnRestart').addEventListener('click', function () {
      if (App.isReviewMode) { App.startFailedReview(); }
      else { App.startStudy(); }
    });

    /* 拼写模式 */
    document.getElementById('btnToggleSpell').addEventListener('click', function () {
      App.toggleSpellMode();
    });
    document.getElementById('btnSpellCheck').addEventListener('click', function () {
      App.checkSpelling();
    });
    document.getElementById('spellInput').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        App.checkSpelling();
      }
    });

    /* 返回模式选择 */
    document.getElementById('btnBackToMode').addEventListener('click', function () {
      App.returnToModeSelect();
    });

    /* 错题复习按钮 */
    document.getElementById('btnReviewFailed').addEventListener('click', function () {
      App.startFailedReview();
    });

    /* 键盘快捷键 */
    document.addEventListener('keydown', function (e) {
      /* 全局快捷键 */
      if (e.key === '?' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        App.showShortcutModal();
        return;
      }
      /* 学习中 */
      if (document.activeElement.tagName === 'INPUT') return;
      if (App.studyQueue.length > 0 && App.studyIndex < App.studyQueue.length) {
        if (e.key === ' ' || e.key === 'ArrowUp') {
          e.preventDefault();
          document.getElementById('flashcard').classList.toggle('flipped');
          App.isFlipped = !App.isFlipped;
        }
        if (e.key === 'ArrowLeft') { e.preventDefault(); App.answerStudy(false); }
        if (e.key === 'ArrowRight') { e.preventDefault(); App.answerStudy(true); }
      }
    });

    /* 预览模式 */
    document.getElementById('btnToggleAnswer').addEventListener('click', function () {
      App.previewAnswersVisible = !App.previewAnswersVisible;
      let deck = App.getCurrentDeck();
      if (deck) {
        let query = document.getElementById('previewSearch').value.trim().toLowerCase();
        App._renderPreviewTable(App._filterPreviewCards(deck, query));
      }
      document.getElementById('btnToggleAnswer').textContent =
        App.previewAnswersVisible ? '🙈 隐藏释义' : '👁️ 显示释义';
    });
    document.getElementById('previewSearch').addEventListener('input', App.debounce(function () {
      let deck = App.getCurrentDeck();
      if (!deck) return;
      let query = this.value.trim().toLowerCase();
      App._renderPreviewTable(App._filterPreviewCards(deck, query));
    }, 150));

    /* 预览表格朗读按钮 */
    document.getElementById('previewTbody').addEventListener('click', function (e) {
      let btn = e.target.closest('.speak-preview-btn');
      if (!btn) return;
      e.stopPropagation();
      let td = btn.closest('td');
      if (!td) return;
      let text = (td.textContent || '').replace(/🔊\s*$/, '').trim();
      if (text) App.speak(text);
    });

    /* 全局搜索 */
    document.getElementById('globalSearch').addEventListener('input', App.debounce(function () {
      let query = this.value.trim().toLowerCase();
      let results = document.getElementById('globalSearchResults');
      if (!query || query.length < 1) { results.style.display = 'none'; return; }

      let hits = [];
      let seen = new Set();
      App.state.decks.forEach(function (deck) {
        deck.cards.forEach(function (c) {
          let front = App.getCardFront(c).toLowerCase();
          let back = App.getCardBack(c).toLowerCase();
          let pos = (c.pos || '').toLowerCase();
          let key = front + '|' + deck.id;
          if (seen.has(key)) return;
          if (App.fuzzyMatch(query, front) || back.indexOf(query) !== -1 || pos.indexOf(query) !== -1) {
            hits.push({ deckName: deck.name, deckId: deck.id, card: c });
            seen.add(key);
          }
        });
      });

      if (hits.length === 0) {
        results.innerHTML = '<div class="gsr-empty">未找到匹配单词</div>';
      } else {
        results.innerHTML = hits.slice(0, 20).map(function (h) {
          let c = h.card;
          let front = App.escHtml(App.getCardFront(c));
          let back = App.escHtml(App.getCardBack(c));
          let posBadge = c.pos ? '<span class="gsr-pos">' + App.escHtml(c.pos) + '</span>' : '';
          let phonetic = c.phonetic ? '<span class="gsr-phonetic">' + App.escHtml(c.phonetic) + '</span>' : '';
          return '<div class="gsr-item" data-deck="' + h.deckId + '" data-word="' + front + '">' +
            '<span class="gsr-word">' + front + phonetic + '</span>' +
            posBadge +
            '<span class="gsr-def">' + back + '</span>' +
            '<span class="gsr-deck">' + App.escHtml(h.deckName) + '</span>' +
            '<button class="gsr-speak-btn" title="朗读">🔊</button>' +
          '</div>';
        }).join('');
        results.querySelectorAll('.gsr-item').forEach(function (item) {
          item.addEventListener('click', function () {
            let deckId = this.dataset.deck;
            let word = this.dataset.word;
            App.state.currentDeckId = deckId;
            App.saveData();
            App.renderDeckSelect();
            App.switchTab('preview');
            let deck = App.getDeck(deckId);
            if (deck) {
              let query = document.getElementById('previewSearch');
              query.value = word;
              App._renderPreviewTable(App._filterPreviewCards(deck, word));
            }
            document.getElementById('globalSearch').value = '';
            results.style.display = 'none';
          });
        });
        results.querySelectorAll('.gsr-speak-btn').forEach(function (btn) {
          btn.addEventListener('click', function (e) {
            e.stopPropagation();
            var word = this.closest('.gsr-item').dataset.word;
            if (word) App.speak(word);
          });
        });
      }
      results.style.display = 'block';
    }, 150));

    /* 点击空白关闭全局搜索 */
    document.addEventListener('click', function (e) {
      let results = document.getElementById('globalSearchResults');
      let search = document.getElementById('globalSearch');
      if (!results.contains(e.target) && e.target !== search) {
        results.style.display = 'none';
      }
    });

    /* 顺序切换 */
    document.getElementById('btnStudyOrder').addEventListener('click', function () {
      App.cycleOrder();
      App.startStudy();
    });

    /* 词书导入 */
    document.getElementById('btnImportBook').addEventListener('click', function () {
      App.renderImportModal();
      document.getElementById('importModal').style.display = 'flex';
    });
    document.getElementById('importModal').addEventListener('click', function (e) {
      if (e.target === this) App.closeImportModal();
      let bookBtn = e.target.closest('[data-book]');
      if (bookBtn && !bookBtn.disabled) {
        let bookInfo = App.BUILTIN_WORDBOOKS.find(function (b) { return b.key === bookBtn.dataset.book; });
        if (bookInfo) App.loadAndImportWordbook(bookInfo);
      }
    });
    document.getElementById('btnModalCancel').addEventListener('click', App.closeImportModal);
    document.getElementById('importFileInput').addEventListener('change', function () {
      if (this.files && this.files[0]) App.handleFileImport(this.files[0]);
    });

    /* 主题切换 */
    document.getElementById('themeToggle').addEventListener('click', function () {
      let html = document.documentElement;
      let current = html.getAttribute('data-theme');
      let next = current === 'dark' ? null : 'dark';
      if (next) html.setAttribute('data-theme', next);
      else html.removeAttribute('data-theme');
      localStorage.setItem('flashcard-theme', next || 'light');
      document.getElementById('themeToggle').textContent = next ? '☀️' : '🌙';
    });

    /* 口音切换按钮 */
    document.getElementById('btnAccentToggle').addEventListener('click', function (e) {
      e.stopPropagation();
      App.toggleAccent();
    });

    /* 初始化 TTS 语音列表 */
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = function () { /* 预加载 voices */ };
      window.speechSynthesis.getVoices();
    }
    App._updateAccentUI();

    /* ========== 启动 ========== */
    App.seedDemoData();
    App.migrateCardsEbbinghaus();
    App.migrateCardsSchema();
    App.migrateToIDB();
    App.renderAll();

    /* 恢复主题 */
    (function () {
      let saved = localStorage.getItem('flashcard-theme');
      if (saved === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('themeToggle').textContent = '☀️';
      }
      if (!saved && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('themeToggle').textContent = '☀️';
      }
    })();

    /* 恢复选中牌组 */
    if (App.state.currentDeckId && App.getDeck(App.state.currentDeckId)) {
      document.getElementById('deckSelect').value = App.state.currentDeckId;
    }

    /* 后台预加载词书 */
    App.BUILTIN_WORDBOOKS.forEach(function (b) { App.loadWordbookScript(b).catch(function () {}); });

    /* 启动学习提醒定时器 */
    App._setupReminderTimer();

    /* 页面关闭/刷新时保存学习进度 */
    window.addEventListener('beforeunload', function () {
      App.saveStudyProgress();
    });

    /* 页面隐藏时也保存（移动端切换 app） */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) App.saveStudyProgress();
    });

    /* 页面加载时显示待复习提示 */
    setTimeout(function () {
      var today = new Date().toISOString().slice(0, 10);
      var dueCount = 0;
      var newCount = 0;
      App.state.decks.forEach(function (d) {
        d.cards.forEach(function (c) {
          App.initEbbinghaus(c);
          if (App.isDueToday(c)) dueCount++;
          if (App.isNewWord(c)) newCount++;
        });
      });
      if (dueCount > 0) {
        App.showToast('📖 今日有 ' + dueCount + ' 个词待复习，' + newCount + ' 个新词可学', 'info', 4000);
      }
    }, 1500);
  };

  /* ========== 快捷键弹窗 ========== */
  App.showShortcutModal = function () {
    let existing = document.querySelector('.shortcut-overlay');
    if (existing) { existing.remove(); return; }

    let overlay = document.createElement('div');
    overlay.className = 'shortcut-overlay';
    overlay.innerHTML = '<div class="shortcut-modal">' +
      '<h3>⌨️ 快捷键</h3>' +
      '<table>' +
        '<tr><td>Space / ↑</td><td>翻转卡片</td></tr>' +
        '<tr><td>←</td><td>标记"不会"</td></tr>' +
        '<tr><td>→</td><td>标记"会了"</td></tr>' +
        '<tr><td>Enter</td><td>打字模式：确认 / 下一题</td></tr>' +
        '<tr><td>?</td><td>显示/关闭此面板</td></tr>' +
      '</table>' +
      '<button class="modal-close-btn">关闭</button>' +
    '</div>';
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target.className === 'modal-close-btn') {
        overlay.remove();
      }
    });
    overlay.querySelector('.modal-close-btn').addEventListener('click', function () { overlay.remove(); });
  };

  /* 庆祝粒子动画 */
  App.spawnConfetti = function () {
    let container = document.createElement('div');
    container.className = 'confetti-container';
    let colors = ['#4f46e5', '#818cf8', '#f59e0b', '#ef4444', '#16a34a', '#06b6d4', '#ec4899', '#f97316'];
    for (let i = 0; i < 50; i++) {
      let piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = Math.random() * 0.8 + 's';
      piece.style.animationDuration = (2 + Math.random() * 2) + 's';
      container.appendChild(piece);
    }
    document.body.appendChild(container);
    setTimeout(function () { container.remove(); }, 3500);
  };

  /* TTS 口音偏好: 'en-US' | 'en-GB' */
  App.ttsAccent = (function () {
    try { return localStorage.getItem('flashcard-tts-accent') || 'en-US'; }
    catch (e) { return 'en-US'; }
  })();

  /* 获取当前口音对应的最佳语音 */
  App._getBestVoice = function () {
    var voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return null;
    var lang = App.ttsAccent;
    var exactDefault = null, exactAny = null, prefixDefault = null, prefixAny = null;
    voices.forEach(function (v) {
      if (v.lang === lang) {
        if (v.default || v.localService) { exactDefault = exactDefault || v; }
        else { exactAny = exactAny || v; }
      }
      if (v.lang.indexOf(lang) === 0) {
        if (v.default || v.localService) { prefixDefault = prefixDefault || v; }
        else { prefixAny = prefixAny || v; }
      }
    });
    return exactDefault || exactAny || prefixDefault || prefixAny || null;
  };

  /* 切换口音 */
  App.toggleAccent = function () {
    App.ttsAccent = (App.ttsAccent === 'en-US') ? 'en-GB' : 'en-US';
    try { localStorage.setItem('flashcard-tts-accent', App.ttsAccent); }
    catch (e) {}
    App._updateAccentUI();
    App.showToast('发音切换为: ' + (App.ttsAccent === 'en-US' ? '美式 🇺🇸' : '英式 🇬🇧'), 'info', 1500);
  };

  /* 更新 UI 中的口音标识 */
  App._updateAccentUI = function () {
    var flag = App.ttsAccent === 'en-US' ? '🇺🇸' : '🇬🇧';
    var el = document.getElementById('accentLabel');
    if (el) el.textContent = flag;
  };

  /* 朗读功能 */
  App.speak = function (text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    var utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = App.ttsAccent;
    utterance.rate = 0.85;
    var voice = App._getBestVoice();
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };

})(FlashcardApp);
