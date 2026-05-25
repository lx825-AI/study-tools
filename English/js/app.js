/* app.js —— 事件绑定与初始化 */
var FlashcardApp = window.FlashcardApp || {};
(function (App) {
  'use strict';

  /* ========== 演示数据 ========== */
  App.seedDemoData = function () {
    if (App.state.decks.length > 0) return;
    var words = [
      ['abandon','放弃；遗弃'],['ability','能力；才能'],['abroad','在国外；到国外'],
      ['absence','缺席；不在'],['absolute','绝对的；完全的'],['absorb','吸收；吸引'],
      ['abstract','抽象的；摘要'],['abundant','丰富的；充裕的'],['academic','学术的；学院的'],
      ['accelerate','加速；促进'],['access','进入；通道；访问'],['accompany','陪伴；伴随'],
      ['accomplish','完成；实现'],['account','账户；解释；占比'],['accurate','准确的；精确的'],
      ['achieve','达到；取得'],['acknowledge','承认；感谢'],['acquire','获得；习得'],
      ['adapt','适应；改编'],['adequate','足够的；适当的'],['adjust','调整；适应'],
      ['adopt','采用；收养'],['advance','前进；进步'],['affair','事务；事件'],
      ['abolish','废除；取消'],['absurd','荒谬的；荒唐的'],['adhere','坚持；黏附'],
      ['adjacent','邻近的；毗连的'],['administer','管理；执行'],['adolescent','青少年'],
      ['adverse','不利的；有害的'],['advocate','提倡；倡导者'],['aesthetic','美学的；审美的'],
      ['affiliate','使附属；分支机构'],['aggravate','加重；恶化'],['aggregate','总计；集合体'],
      ['agony','极度的痛苦'],['alienate','疏远；使隔离'],['allege','断言；声称'],
      ['alleviate','减轻；缓解'],['allocate','分配；拨出'],['alternate','交替；轮流'],
      ['ambiguous','模棱两可的'],['amend','修改；修订'],['analogy','类比；比喻'],
      ['anonymous','匿名的'],['apparatus','仪器；设备'],['abuse','滥用；虐待'],
      ['acquaint','使认识；使了解'],['blunder','大错；犯错'],
    ];
    var mid = Math.floor(words.length / 2);
    App.state.decks = [
      { id: App.genId(), name: '四级高频词汇（演示）', cards: words.slice(0, mid).map(function (pair) { return { id: App.genId(), front: pair[0], back: pair[1], difficulty: Math.floor(Math.random() * 5) + 1 }; }) },
      { id: App.genId(), name: '六级高频词汇（演示）', cards: words.slice(mid).map(function (pair) { return { id: App.genId(), front: pair[0], back: pair[1], difficulty: Math.floor(Math.random() * 5) + 1 }; }) },
    ];
    App.state.currentDeckId = null;
    App.saveData();
  };

  /* 预览搜索辅助：支持模糊匹配英文 + 精确匹配释义/词性 */
  App._filterPreviewCards = function (deck, query) {
    if (!query) return deck.cards;
    return deck.cards.filter(function (c) {
      var front = (c.front || c.word || '').toLowerCase();
      var back = (c.back || (c.definitions || [''])[0] || '').toLowerCase();
      var pos = (c.pos || '').toLowerCase();
      return App.fuzzyMatch(query, front) || back.indexOf(query) !== -1 || pos.indexOf(query) !== -1;
    });
  };

  /* ========== Toast 通知 ========== */
  App.showToast = function (message, type, duration) {
    type = type || 'info';
    duration = duration || 2500;
    var toast = document.createElement('div');
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
    var timer;
    return function () {
      var ctx = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, delay);
    };
  };

  /* ========== 事件绑定 ========== */
  App.init = function () {
    /* 创建牌组 */
    document.getElementById('btnAddDeck').addEventListener('click', function () {
      var input = document.getElementById('deckNameInput');
      var name = input.value.trim();
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
      var deck = App.getCurrentDeck();
      if (!deck) { App.showToast('请先选择一个牌组', 'warn'); return; }
      if (deck.cards.length === 0) { App.showToast('该牌组还没有卡片，请先添加', 'warn'); return; }
      App.startStudy();
      App.switchTab('study');
    });

    /* Tab 导航 */
    document.querySelectorAll('nav button').forEach(function (btn) {
      btn.addEventListener('click', function () { App.switchTab(btn.dataset.tab); });
    });

    /* 牌组卡片操作 */
    document.getElementById('deckGrid').addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-action]');
      if (!btn) return;
      App.handleDeckAction(btn.dataset.action, btn.dataset.deck);
    });

    /* 卡片列表操作 */
    document.getElementById('cardList').addEventListener('click', function (e) {
      var delBtn = e.target.closest('button[data-action="deleteCard"]');
      if (delBtn) {
        App.handleCardDelete(parseInt(delBtn.dataset.index));
        return;
      }
      var speakBtn = e.target.closest('.speak-card-btn');
      if (!speakBtn) return;
      e.stopPropagation();
      var frontDiv = speakBtn.closest('.edit-card-front');
      if (!frontDiv) return;
      var text = (frontDiv.textContent || '').replace(/🔊\s*$/, '').trim();
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
      var deck = App.getCurrentDeck();
      if (!deck) return;
      var front = document.getElementById('cardFrontInput').value.trim();
      var back = document.getElementById('cardBackInput').value.trim();
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
      var card = document.getElementById('flashcard');
      var startX = 0, startY = 0, moved = false;

      card.addEventListener('touchstart', function (e) {
        if (App.studyQueue.length === 0 || App.studyIndex >= App.studyQueue.length) return;
        var t = e.touches[0];
        startX = t.clientX;
        startY = t.clientY;
        moved = false;
      }, { passive: true });

      card.addEventListener('touchmove', function (e) {
        var t = e.touches[0];
        if (!t) return;
        var dx = t.clientX - startX;
        var dy = t.clientY - startY;
        if (Math.abs(dx) > 5 && Math.abs(dx) > Math.abs(dy)) {
          moved = true;
          card.style.transform = 'translateX(' + dx + 'px) rotateY(' + (App.isFlipped ? 180 : 0) + 'deg)';
          card.style.transition = 'none';
        }
      }, { passive: true });

      card.addEventListener('touchend', function (e) {
        card.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        card.style.transform = App.isFlipped ? 'rotateY(180deg)' : '';
        var ct = e.changedTouches[0];
        var dx = ct ? ct.clientX - startX : 0;
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
    document.getElementById('btnRestart').addEventListener('click', function () { App.startStudy(); });

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

    /* 打字模式 */
    document.getElementById('btnTypingSubmit').addEventListener('click', App.submitTyping);
    document.getElementById('btnTypingNext').addEventListener('click', App.nextTyping);
    document.getElementById('btnTypingRestart').addEventListener('click', App.startTyping);
    document.getElementById('typingInput').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        if (document.getElementById('btnTypingNext').style.display !== 'none') {
          App.nextTyping();
        } else {
          App.submitTyping();
        }
      }
    });

    /* 预览模式 */
    document.getElementById('btnToggleAnswer').addEventListener('click', function () {
      App.previewAnswersVisible = !App.previewAnswersVisible;
      var deck = App.getCurrentDeck();
      if (deck) {
        var query = document.getElementById('previewSearch').value.trim().toLowerCase();
        App._renderPreviewTable(App._filterPreviewCards(deck, query));
      }
      document.getElementById('btnToggleAnswer').textContent =
        App.previewAnswersVisible ? '🙈 隐藏释义' : '👁️ 显示释义';
    });
    document.getElementById('previewSearch').addEventListener('input', App.debounce(function () {
      var deck = App.getCurrentDeck();
      if (!deck) return;
      var query = this.value.trim().toLowerCase();
      App._renderPreviewTable(App._filterPreviewCards(deck, query));
    }, 150));

    /* 预览表格朗读按钮 */
    document.getElementById('previewTbody').addEventListener('click', function (e) {
      var btn = e.target.closest('.speak-preview-btn');
      if (!btn) return;
      e.stopPropagation();
      var td = btn.closest('td');
      if (!td) return;
      var text = (td.textContent || '').replace(/🔊\s*$/, '').trim();
      if (text) App.speak(text);
    });

    /* 全局搜索 */
    document.getElementById('globalSearch').addEventListener('input', App.debounce(function () {
      var query = this.value.trim().toLowerCase();
      var results = document.getElementById('globalSearchResults');
      if (!query || query.length < 1) { results.style.display = 'none'; return; }

      var hits = [];
      var seen = new Set();
      App.state.decks.forEach(function (deck) {
        deck.cards.forEach(function (c) {
          var front = (c.front || c.word || '').toLowerCase();
          var back = (c.back || (c.definitions || [''])[0] || '').toLowerCase();
          var pos = (c.pos || '').toLowerCase();
          var key = front + '|' + deck.id;
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
          var c = h.card;
          var front = App.escHtml(c.front || c.word);
          var back = App.escHtml(c.back || (c.definitions || [''])[0]);
          var posBadge = c.pos ? '<span class="gsr-pos">' + App.escHtml(c.pos) + '</span>' : '';
          var phonetic = c.phonetic ? '<span class="gsr-phonetic">' + App.escHtml(c.phonetic) + '</span>' : '';
          return '<div class="gsr-item" data-deck="' + h.deckId + '" data-word="' + App.escHtml(front) + '">' +
            '<span class="gsr-word">' + front + phonetic + '</span>' +
            posBadge +
            '<span class="gsr-def">' + back + '</span>' +
            '<span class="gsr-deck">' + App.escHtml(h.deckName) + '</span>' +
          '</div>';
        }).join('');
        results.querySelectorAll('.gsr-item').forEach(function (item) {
          item.addEventListener('click', function () {
            var deckId = this.dataset.deck;
            var word = this.dataset.word;
            App.state.currentDeckId = deckId;
            App.saveData();
            App.renderDeckSelect();
            App.switchTab('preview');
            var deck = App.getDeck(deckId);
            if (deck) {
              var query = document.getElementById('previewSearch');
              query.value = word;
              App._renderPreviewTable(App._filterPreviewCards(deck, word));
            }
            document.getElementById('globalSearch').value = '';
            results.style.display = 'none';
          });
        });
      }
      results.style.display = 'block';
    }, 150));

    /* 点击空白关闭全局搜索 */
    document.addEventListener('click', function (e) {
      var results = document.getElementById('globalSearchResults');
      var search = document.getElementById('globalSearch');
      if (!results.contains(e.target) && e.target !== search) {
        results.style.display = 'none';
      }
    });

    /* 顺序切换 */
    document.getElementById('btnStudyOrder').addEventListener('click', function () {
      App.cycleOrder();
      App.startStudy();
    });
    document.getElementById('btnTypingOrder').addEventListener('click', function () {
      App.cycleOrder();
      App.startTyping();
    });

    /* 词书导入 */
    document.getElementById('btnImportBook').addEventListener('click', function () {
      App.renderImportModal();
      document.getElementById('importModal').style.display = 'flex';
    });
    document.getElementById('importModal').addEventListener('click', function (e) {
      if (e.target === this) App.closeImportModal();
      var bookBtn = e.target.closest('[data-book]');
      if (bookBtn && !bookBtn.disabled) {
        var bookInfo = App.BUILTIN_WORDBOOKS.find(function (b) { return b.key === bookBtn.dataset.book; });
        if (bookInfo) App.loadAndImportWordbook(bookInfo);
      }
    });
    document.getElementById('btnModalCancel').addEventListener('click', App.closeImportModal);
    document.getElementById('btnImportFile').addEventListener('click', function () {
      document.getElementById('importFileInput').click();
    });
    document.getElementById('importFileInput').addEventListener('change', function () {
      if (this.files && this.files[0]) App.handleFileImport(this.files[0]);
    });

    /* 主题切换 */
    document.getElementById('themeToggle').addEventListener('click', function () {
      var html = document.documentElement;
      var current = html.getAttribute('data-theme');
      var next = current === 'dark' ? null : 'dark';
      if (next) html.setAttribute('data-theme', next);
      else html.removeAttribute('data-theme');
      localStorage.setItem('flashcard-theme', next || 'light');
      document.getElementById('themeToggle').textContent = next ? '☀️' : '🌙';
    });

    /* ========== 启动 ========== */
    App.seedDemoData();
    App.renderAll();

    /* 恢复主题 */
    (function () {
      var saved = localStorage.getItem('flashcard-theme');
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
  };

  /* ========== 快捷键弹窗 ========== */
  App.showShortcutModal = function () {
    var existing = document.querySelector('.shortcut-overlay');
    if (existing) { existing.remove(); return; }

    var overlay = document.createElement('div');
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
    var container = document.createElement('div');
    container.className = 'confetti-container';
    var colors = ['#4f46e5', '#818cf8', '#f59e0b', '#ef4444', '#16a34a', '#06b6d4', '#ec4899', '#f97316'];
    for (var i = 0; i < 50; i++) {
      var piece = document.createElement('div');
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

  /* 朗读功能 */
  App.speak = function (text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    var utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

})(FlashcardApp);
