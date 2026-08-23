/* sync-ui.js —— 数据联通：Web 端收集/应用 + 同步面板（文件通道；二期接配对码云通道） */
var FlashcardApp = window.FlashcardApp || {};
(function (App) {
  'use strict';

  var SC = App.SyncCodec;

  /* 日志合并状态（按发送端 deviceKind 分槽：{ web: {snap, remotePrev}, mini: {...} }，防重复累计基线） */
  App.SYNC_STATE_KEY = 'flashcard-sync-log-state';

  function isObj(v) {
    return v !== null && typeof v === 'object';
  }

  function loadStateSlot(kind) {
    try {
      var all = JSON.parse(localStorage.getItem(App.SYNC_STATE_KEY) || '{}');
      var slot = isObj(all) && isObj(all[kind]) ? all[kind] : {};
      return {
        snap: isObj(slot.snap) ? slot.snap : {},
        remotePrev: isObj(slot.remotePrev) ? slot.remotePrev : {}
      };
    } catch (e) { return { snap: {}, remotePrev: {} }; }
  }

  function saveStateSlot(kind, state) {
    try {
      var all = JSON.parse(localStorage.getItem(App.SYNC_STATE_KEY) || '{}');
      if (!isObj(all)) all = {};
      all[kind] = state;
      localStorage.setItem(App.SYNC_STATE_KEY, JSON.stringify(all));
    } catch (e) { /* ignore */ }
  }

  /* 读取本端设置并归一化（web 值域 → payload 值域） */
  function readLocalSettings() {
    var accentRaw = 'en-US';
    var themeRaw = null;
    var goalRaw = null;
    try {
      accentRaw = localStorage.getItem('flashcard-tts-accent') || 'en-US';
      themeRaw = localStorage.getItem('flashcard-theme');
      goalRaw = localStorage.getItem('flashcard-daily-goal');
    } catch (e) { /* ignore */ }
    var goal = parseInt(goalRaw, 10);
    return SC.normalizeSettings({
      dailyGoal: isFinite(goal) ? goal : undefined,
      accent: accentRaw === 'en-GB' ? 'uk' : 'us',
      theme: themeRaw === 'dark' ? 'dark' : (themeRaw === 'light' ? 'light' : undefined)
    });
  }

  /* 应用远端设置到本端（写 localStorage + 即时生效 UI） */
  function applyLocalSettings(settings) {
    var s = SC.settingsMerge(readLocalSettings(), settings);
    try {
      if (s.dailyGoal !== undefined) localStorage.setItem('flashcard-daily-goal', String(s.dailyGoal));
      if (s.theme) localStorage.setItem('flashcard-theme', s.theme);
      if (s.accent) {
        var accent = s.accent === 'uk' ? 'en-GB' : 'en-US';
        localStorage.setItem('flashcard-tts-accent', accent);
        App.ttsAccent = accent;
      }
    } catch (e) { /* ignore */ }
    /* 主题即时生效（对齐 app.js 主题恢复逻辑） */
    var html = document.documentElement;
    if (s.theme === 'dark') html.setAttribute('data-theme', 'dark');
    else html.removeAttribute('data-theme');
    var themeBtn = document.getElementById('themeToggle');
    if (themeBtn) themeBtn.textContent = s.theme === 'dark' ? '☀️' : '🌙';
    if (App._updateAccentUI) App._updateAccentUI();
    if (App.refreshStatsCharts) App.refreshStatsCharts();
  }

  /* 收集本端持久数据 → 规范 payload */
  SC.collectPayload = function () {
    var decks = [];
    App.state.decks.forEach(function (deck) {
      var source = SC.canonicalizeKey(deck.source, 'web');
      if (!source) return; /* 手工牌组不传输 */
      var cards = [];
      deck.cards.forEach(function (c) {
        var p = SC.cardToProgress(c);
        if (p) cards.push(p);
      });
      decks.push({ source: source, name: deck.name, cards: cards });
    });
    return {
      schemaVersion: SC.SCHEMA_VERSION,
      appName: SC.APP_NAME,
      deviceKind: 'web',
      exportTime: new Date().toISOString(),
      data: {
        settings: readLocalSettings(),
        decks: decks,
        logs: { deep: App.loadLearningLog(), quick: App.loadQuickLog() }
      }
    };
  };

  /* 将远端 payload 合并进本端（卡片/日志/设置/快照），并保存与重渲染 */
  SC.mergeIntoLocal = function (payload) {
    var data = isObj(payload) && isObj(payload.data) ? payload.data : {};
    var summary = { decksMerged: 0, cardsMerged: 0, cardsSkipped: 0, decksSkipped: [] };
    (Array.isArray(data.decks) ? data.decks : []).forEach(function (rd) {
      if (!isObj(rd) || !rd.source) return;
      var local = null;
      App.state.decks.forEach(function (d) {
        if (!local && SC.canonicalizeKey(d.source, 'web') === rd.source) local = d;
      });
      if (!local) {
        summary.decksSkipped.push(rd.name || rd.source);
        return;
      }
      var res = SC.mergeDeckCards(local.cards, rd.cards);
      local.cards = res.cards;
      summary.decksMerged++;
      summary.cardsMerged += res.mergedCount;
      summary.cardsSkipped += res.skippedCount;
    });
    var remoteLogs = isObj(data.logs) ? data.logs : {};
    var kind = payload.deviceKind === 'mini' ? 'mini' : 'web';
    var slot = loadStateSlot(kind);
    var deep = SC.logMerge(App.loadLearningLog(), remoteLogs.deep || {}, {
      snap: slot.snap.deep || {},
      remotePrev: slot.remotePrev.deep || {}
    });
    var quick = SC.logMerge(App.loadQuickLog(), remoteLogs.quick || {}, {
      snap: slot.snap.quick || {},
      remotePrev: slot.remotePrev.quick || {}
    });
    try {
      localStorage.setItem(App.LEARNING_LOG_KEY, JSON.stringify(deep.merged));
      localStorage.setItem(App.QUICK_LOG_KEY, JSON.stringify(quick.merged));
      saveStateSlot(kind, {
        snap: { deep: deep.state.snap, quick: quick.state.snap },
        remotePrev: { deep: deep.state.remotePrev, quick: quick.state.remotePrev }
      });
    } catch (e) { /* ignore */ }
    if (data.settings) applyLocalSettings(data.settings);
    App.saveData();
    return summary;
  };

  /* ================= 同步面板 UI ================= */

  var _fileInput = null;

  function fileDateStr() {
    return new Date().toISOString().slice(0, 10);
  }

  App.openSyncModal = function () {
    var status = document.getElementById('syncStatus');
    if (status) status.textContent = '';
    document.getElementById('syncModal').style.display = 'flex';
  };

  App.closeSyncModal = function () {
    document.getElementById('syncModal').style.display = 'none';
  };

  /* 导出：规范 schema JSON 文件下载 */
  App.exportSyncFile = function () {
    var payload = SC.collectPayload();
    var blob = new Blob([SC.encodePayload(payload)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'english_sync_' + fileDateStr() + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    App.showToast('📤 已导出 ' + payload.data.decks.length + ' 本词书的学习数据', 'success', 2500);
  };

  /* 导入：选择文件 → 解析合并 */
  App.importSyncFile = function () {
    if (!_fileInput) {
      _fileInput = document.createElement('input');
      _fileInput.type = 'file';
      _fileInput.accept = '.json,application/json';
      _fileInput.style.display = 'none';
      document.body.appendChild(_fileInput);
      _fileInput.addEventListener('change', function () {
        var file = _fileInput.files && _fileInput.files[0];
        _fileInput.value = '';
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () { App.applySyncImport(String(reader.result)); };
        reader.onerror = function () { App.showToast('文件读取失败', 'warn'); };
        reader.readAsText(file);
      });
    }
    _fileInput.click();
  };

  /* 解析 + 合并 + 摘要展示 */
  App.applySyncImport = function (text) {
    var payload;
    try {
      payload = SC.decodePayload(text);
    } catch (e) {
      App.showToast(e.message || '数据解析失败', 'warn');
      return;
    }
    var summary = SC.mergeIntoLocal(payload);
    App.renderAll();
    var parts = ['已合并 ' + summary.cardsMerged + ' 词' + (summary.cardsSkipped > 0 ? '，跳过 ' + summary.cardsSkipped + ' 词' : '')];
    if (summary.decksSkipped.length > 0) {
      parts.push(summary.decksSkipped.length + ' 本词书未导入已跳过（请先导入词书再同步）');
    }
    App.showToast('📥 ' + parts.join('；'), 'success', 3500);
    var status = document.getElementById('syncStatus');
    if (status) status.textContent = parts.join('；');
  };

  /* 初始化：头部按钮 + 弹窗事件（脚本位于 body 末尾，DOM 已就绪；测试环境缺元素时静默跳过） */
  (function init() {
    var btn = document.getElementById('btnSyncToggle');
    if (btn) {
      btn.addEventListener('click', App.openSyncModal);
      btn.addEventListener('touchstart', function (e) { e.stopPropagation(); });
    }
    var modal = document.getElementById('syncModal');
    if (!modal) return;
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        App.closeSyncModal();
        return;
      }
      var action = e.target.closest('[data-sync-action]');
      if (!action) return;
      if (action.dataset.syncAction === 'export') App.exportSyncFile();
      if (action.dataset.syncAction === 'import') App.importSyncFile();
    });
    document.getElementById('btnSyncCancel').addEventListener('click', App.closeSyncModal);
  })();

})(FlashcardApp);
