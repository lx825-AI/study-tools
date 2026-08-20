/* app.js —— 事件绑定与初始化 */
var FlashcardApp = window.FlashcardApp || {};
(function (App) {
  'use strict';

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
    document.querySelectorAll('.top-nav button').forEach(function (btn) {
      btn.addEventListener('click', function () { App.switchTab(btn.dataset.tab); });
    });

    /* 底部导航 Tab 切换 */
    document.querySelectorAll('.bottom-nav button').forEach(function (btn) {
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

    /* 翻卡（拼写模式禁止翻卡，防盲拼泄漏背面释义；翻转仅由点击卡片触发） */
    document.getElementById('flashcard').addEventListener('click', function () {
      if (App.studyQueue.length === 0 || App.studyIndex >= App.studyQueue.length) return;
      if (App.spellMode) return;
      document.getElementById('flashcard').classList.toggle('flipped');
      App.isFlipped = !App.isFlipped;
    });

    /* 学习作答 */
    document.getElementById('btnFail').addEventListener('click', function () { App.answerStudy(false); });
    document.getElementById('btnPass').addEventListener('click', function () { App.answerStudy(true); });
    document.getElementById('btnPrevCard').addEventListener('click', function () { App.goPrevCard(); });
    document.getElementById('btnRestart').addEventListener('click', function () {
      if (App.isReviewMode) { App.startFailedReview(); }
      else { App.startStudy(); }
    });

    /* 拼写模式（槽位输入事件委托在 study-panel.js IIFE 顶层，输满自动判定） */
    document.getElementById('btnToggleSpell').addEventListener('click', function () {
      App.toggleSpellMode();
    });

    /* 返回模式选择 */
    document.getElementById('btnBackToMode').addEventListener('click', function () {
      App.returnToModeSelect();
    });

    /* 预览模式 */
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
    /* 阻止触摸事件冒泡到词卡，防止误触发翻转 */
    document.getElementById('btnAccentToggle').addEventListener('touchstart', function (e) {
      e.stopPropagation();
    });
    document.getElementById('btnAccentToggle').addEventListener('touchend', function (e) {
      e.stopPropagation();
    });

    /* 朗读按钮 */
    document.getElementById('btnSpeak').addEventListener('click', function (e) {
      e.stopPropagation();
      var card = App.studyQueue[App.studyIndex];
      var text = card ? App.getCardFront(card) : '';
      if (text) App.speak(text);
    });
    /* 阻止触摸事件冒泡到词卡，防止误触发翻转 */
    document.getElementById('btnSpeak').addEventListener('touchstart', function (e) {
      e.stopPropagation();
    });
    document.getElementById('btnSpeak').addEventListener('touchend', function (e) {
      e.stopPropagation();
    });

    /* 初始化 TTS 语音列表 */
    /* 预加载 TTS 语音列表，支持 iOS Safari 预热 */
    App._voicesCache = [];
    App._voicesReady = false;
    if (window.speechSynthesis) {
      var _loadVoices = function () {
        App._voicesCache = window.speechSynthesis.getVoices();
        if (App._voicesCache.length > 0) App._voicesReady = true;
      };
      _loadVoices();
      window.speechSynthesis.onvoiceschanged = function () {
        App._voicesCache = window.speechSynthesis.getVoices();
        App._voicesReady = true;
      };
      /* iOS Safari 预热：dummy utterance 激活音频会话，防止首次 speak() 无声 */
      try {
        var _dummy = new SpeechSynthesisUtterance('');
        _dummy.volume = 0;
        _dummy.rate = 1;
        window.speechSynthesis.speak(_dummy);
      } catch (_e) {}
    }
    App._updateAccentUI();

    /* ========== 启动 ========== */
    App.removeDemoDecks();
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

    /* 网络状态监听 */
    window.addEventListener('online', function () {
      App.showToast('🌐 已恢复网络连接', 'success', 2000);
      var badge = document.getElementById('offlineBadge');
      if (badge) badge.remove();
    });
    window.addEventListener('offline', function () {
      App.showToast('📡 您已离线，学习数据将保存在本地', 'warn', 3000);
      if (!document.getElementById('offlineBadge')) {
        var badge = document.createElement('div');
        badge.id = 'offlineBadge';
        badge.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:999;background:#f59e0b;color:#1e293b;text-align:center;padding:4px;font-size:12px;font-weight:600;';
        badge.textContent = '📡 离线模式 - 数据保存本地';
        document.body.prepend(badge);
      }
    });
    if (!navigator.onLine) {
      var badge = document.createElement('div');
      badge.id = 'offlineBadge';
      badge.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:999;background:#f59e0b;color:#1e293b;text-align:center;padding:4px;font-size:12px;font-weight:600;';
      badge.textContent = '📡 离线模式 - 数据保存本地';
      document.body.prepend(badge);
    }

    /* PWA 安装横幅 */
    var deferredPrompt;
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferredPrompt = e;
      App._deferredInstallPrompt = deferredPrompt;
    });
    App.showInstallBanner = function () {
      if (!App._deferredInstallPrompt) return;
      if (document.querySelector('.install-banner')) return;
      var banner = document.createElement('div');
      banner.className = 'install-banner';
      banner.innerHTML = '<span>📱 安装到桌面，随时随地学习</span>' +
        '<button id="btnInstall">安装</button>' +
        '<button id="btnDismissInstall">✕</button>';
      document.body.appendChild(banner);
      document.getElementById('btnInstall').onclick = function () {
        App._deferredInstallPrompt.prompt();
        App._deferredInstallPrompt.userChoice.then(function (choice) {
          App._deferredInstallPrompt = null;
        });
        banner.remove();
      };
      document.getElementById('btnDismissInstall').onclick = function () {
        banner.remove();
      };
    };

    /* 学习完成时提示安装（用户有学习行为后更愿意安装） */
    var origShowStudyComplete = App.showStudyComplete;
    App.showStudyComplete = function () {
      origShowStudyComplete.apply(this, arguments);
      if (App._deferredInstallPrompt && App.state.decks.some(function (d) {
        return d.cards.some(function (c) { return c.ebbinghausStage > 0; });
      })) {
        setTimeout(function () { App.showInstallBanner(); }, 2000);
      }
    };
  };

  /* TTS 口音偏好: 'en-US' | 'en-GB' */
  App.ttsAccent = (function () {
    try { return localStorage.getItem('flashcard-tts-accent') || 'en-US'; }
    catch (e) { return 'en-US'; }
  })();

  /* 获取当前口音对应的最佳语音 */
  App._getBestVoice = function () {
    var voices = (App._voicesCache && App._voicesCache.length > 0)
      ? App._voicesCache
      : window.speechSynthesis.getVoices();
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
    /* 停止正在播放的 TTS 和 Audio */
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (App._audioEl) { App._audioEl.pause(); App._audioEl.currentTime = 0; }
    App._audioPlaySeq++; /* 旧播放挂起的重试不再复活旧 src（对齐小程序 _playSeq） */
    App._updateAccentUI();
    App.showToast('发音切换为: ' + (App.ttsAccent === 'en-US' ? '美式 🇺🇸' : '英式 🇬🇧'), 'info', 1500);
  };

  /* 更新 UI 中的口音标识 */
  App._updateAccentUI = function () {
    var flag = App.ttsAccent === 'en-US' ? '🇺🇸' : '🇬🇧';
    var el = document.getElementById('accentLabel');
    if (el) el.textContent = flag;
  };

  /* ========== TTS 音频兜底（有道词典语音 API） ========== */

  /* 单例 Audio 元素，用于 speechSynthesis 不可用时的 TTS 兜底 */
  App._audioEl = null;

  App._getAudioEl = function () {
    if (!App._audioEl) {
      App._audioEl = new Audio();
      App._audioEl.preload = 'auto';
    }
    return App._audioEl;
  };

  /* 播放序号：新播放使旧请求的重试失效（对齐小程序 tts.js _playSeq） */
  App._audioPlaySeq = 0;

  /* 通过有道词典在线语音 API 播放单词发音（失败自动重试一次，有道 dictvoice 偶发 503 限流） */
  App._speakViaAudio = function (text) {
    App._playAudioAttempt(text, 1, ++App._audioPlaySeq);
  };

  App._playAudioAttempt = function (text, attempt, seq) {
    if (seq !== App._audioPlaySeq) return; /* 期间已有新播放：静默放弃 */
    var word = encodeURIComponent(text.trim());
    var type = App.ttsAccent === 'en-US' ? '0' : '1';
    var url = 'https://dict.youdao.com/dictvoice?audio=' + word + '&type=' + type;
    var audio = App._getAudioEl();
    var fail = function () { /* play().catch 与 onerror 共用失败路径 */
      if (seq !== App._audioPlaySeq) return;
      if (attempt < 2) {
        setTimeout(function () { App._playAudioAttempt(text, attempt + 1, seq); }, 600);
      } else {
        App.showToast('朗读需要网络连接，请检查网络后重试', 'warn', 2000);
      }
    };
    audio.onerror = fail;
    audio.src = url;
    audio.play().catch(fail);
  };

  /* 朗读功能：优先 speechSynthesis，不可用时 Audio 兜底 */
  App.speak = function (text) {
    if (!text) return;
    if (window.speechSynthesis) {
      /* 优先使用浏览器原生 TTS */
      window.speechSynthesis.cancel();
      var utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = App.ttsAccent;
      utterance.rate = 0.85;
      utterance.volume = 1;
      var voice = App._getBestVoice();
      if (voice) utterance.voice = voice;
      utterance.onerror = function (e) {
        if (e.error === 'canceled' || e.error === 'interrupted') return;
        /* speechSynthesis 失败，降级到 Audio 在线播放 */
        App._speakViaAudio(text);
      };
      window.speechSynthesis.speak(utterance);
    } else {
      /* 浏览器不支持 speechSynthesis（如 UC/QQ/微信内置浏览器） */
      App._speakViaAudio(text);
    }
  };

  /* 分享学习成果 */
  App.shareAchievement = function () {
    var today = new Date().toISOString().slice(0, 10);
    var log = {};
    try { log = JSON.parse(localStorage.getItem('flashcard-learning-log') || '{}'); } catch (e) {}
    var todayData = log[today] || { correct: 0, wrong: 0 };
    var total = todayData.correct + todayData.wrong;
    var rate = total > 0 ? Math.round(todayData.correct / total * 100) : 0;
    var text = '我今天学习了 ' + total + ' 个英语单词，正确率 ' + rate + '%！📚 #Flashcard抽认卡';
    if (navigator.share) {
      navigator.share({ title: '我的学习成果', text: text, url: window.location.href }).catch(function () {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        App.showToast('已复制分享内容', 'success');
      });
    } else {
      App.showToast(text, 'info', 4000);
    }
  };

})(FlashcardApp);
