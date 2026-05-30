/* stats-panel.js —— 学习统计面板 */
var FlashcardApp = window.FlashcardApp || {};
(function (App) {
  'use strict';

  /* 学习记录 key */
  App.LEARNING_LOG_KEY = 'flashcard-learning-log';

  /* 提醒功能 */
  App._REMINDER_KEY = 'flashcard-reminder';
  App._REMINDER_TIMER = null;

  App._loadReminderSettings = function () {
    try {
      var raw = localStorage.getItem(App._REMINDER_KEY);
      return raw ? JSON.parse(raw) : { enabled: false, time: '09:00' };
    } catch (e) { return { enabled: false, time: '09:00' }; }
  };

  App._saveReminderSettings = function (settings) {
    try { localStorage.setItem(App._REMINDER_KEY, JSON.stringify(settings)); } catch (e) {}
  };

  App._isReminderEnabled = function () {
    return App._loadReminderSettings().enabled;
  };

  App._getReminderTime = function () {
    return App._loadReminderSettings().time;
  };

  App._setupReminderTimer = function () {
    if (App._REMINDER_TIMER) clearInterval(App._REMINDER_TIMER);
    var settings = App._loadReminderSettings();
    if (!settings.enabled) return;
    App._REMINDER_TIMER = setInterval(function () {
      var now = new Date();
      var current = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
      if (current === settings.time) {
        App._fireReminder();
      }
    }, 60000);
  };

  App._fireReminder = function () {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('📚 学习时间到！', {
        body: '该复习英语单词了，打开闪卡开始练习吧。',
        icon: './icon.svg',
        tag: 'flashcard-reminder'
      });
    } else if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(function (perm) {
        if (perm === 'granted') App._fireReminder();
      });
    }
    App.showToast('📚 学习时间到！该复习单词了', 'info', 5000);
  };

  /* 加载学习日志: { 'YYYY-MM-DD': { correct: N, wrong: N } } */
  App.loadLearningLog = function () {
    try {
      let raw = localStorage.getItem(App.LEARNING_LOG_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  };

  /* 记录一次学习（correct: 1=对, 0=错） */
  App.trackLearning = function (correct) {
    let today = new Date().toISOString().slice(0, 10);
    let log = App.loadLearningLog();
    if (!log[today]) log[today] = { correct: 0, wrong: 0 };
    if (correct) log[today].correct++;
    else log[today].wrong++;
    try { localStorage.setItem(App.LEARNING_LOG_KEY, JSON.stringify(log)); } catch (e) {}
  };

  /* 计算连续打卡天数 */
  App.calcStreak = function (log) {
    let streak = 0;
    let d = new Date();
    d.setDate(d.getDate()); // today
    while (true) {
      let key = d.toISOString().slice(0, 10);
      if (log[key]) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return streak;
  };

  /* 渲染统计面板 */
  App.renderStatsPanel = function () {
    let panel = document.getElementById('panelStats');
    if (!panel) return;

    let log = App.loadLearningLog();
    let now = new Date();
    let todayKey = now.toISOString().slice(0, 10);
    let todayData = log[todayKey] || { correct: 0, wrong: 0 };
    let tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    let tomorrowKey = tomorrow.toISOString().slice(0, 10);

    /* 总词汇量/已掌握 */
    let allCards = [];
    App.state.decks.forEach(function (d) { allCards = allCards.concat(d.cards); });
    let totalCards = allCards.length;
    let masteredCount = allCards.filter(function (c) { return (c.easeFactor || 2.5) >= 2.8; }).length;

    /* SM-2 统计 */
    let dueToday = allCards.filter(function (c) {
      return c.nextReview && c.nextReview <= todayKey;
    }).length;
    let dueTomorrow = allCards.filter(function (c) {
      return c.nextReview && c.nextReview === tomorrowKey;
    }).length;
    let avgEF = allCards.length > 0
      ? (allCards.reduce(function (s, c) { return s + (c.easeFactor || 2.5); }, 0) / allCards.length).toFixed(1)
      : '2.5';

    /* 连续打卡 */
    let streak = App.calcStreak(log);

    /* 每日目标 */
    let dailyGoal = parseInt(localStorage.getItem('flashcard-daily-goal') || '20', 10);
    let todayTotal = todayData.correct + todayData.wrong;
    let goalPercent = Math.min(100, Math.round(todayTotal / dailyGoal * 100));

    /* 本周统计 */
    let weekStats = [];
    for (let i = 6; i >= 0; i--) {
      let d = new Date(now);
      d.setDate(d.getDate() - i);
      let key = d.toISOString().slice(0, 10);
      let dayData = log[key] || { correct: 0, wrong: 0 };
      weekStats.push({ label: d.getDate() + '日', correct: dayData.correct, wrong: dayData.wrong, total: dayData.correct + dayData.wrong });
    }
    let maxTotal = Math.max.apply(null, weekStats.map(function (s) { return s.total; }).concat([1]));

    panel.innerHTML =
      '<div class="stats-grid">' +
        '<div class="stat-card">' +
          '<div class="stat-value">' + totalCards + '</div>' +
          '<div class="stat-label">总词汇量</div>' +
        '</div>' +
        '<div class="stat-card">' +
          '<div class="stat-value">' + masteredCount + '</div>' +
          '<div class="stat-label">已掌握 (EF≥2.8)</div>' +
        '</div>' +
        '<div class="stat-card">' +
          '<div class="stat-value">' + todayTotal + '</div>' +
          '<div class="stat-label">今日已学</div>' +
        '</div>' +
        '<div class="stat-card">' +
          '<div class="stat-value">' + streak + ' 天</div>' +
          '<div class="stat-label">连续打卡</div>' +
        '</div>' +
      '</div>' +

      /* SM-2 概览 */
      '<div class="section-title" style="margin-top:24px;">🧠 间隔重复状态</div>' +
      '<div class="stats-grid">' +
        '<div class="stat-card">' +
          '<div class="stat-value" style="color:' + (dueToday > 0 ? 'var(--danger)' : 'var(--success)') + '">' + dueToday + '</div>' +
          '<div class="stat-label">今日待复习</div>' +
        '</div>' +
        '<div class="stat-card">' +
          '<div class="stat-value">' + dueTomorrow + '</div>' +
          '<div class="stat-label">明日待复习</div>' +
        '</div>' +
        '<div class="stat-card">' +
          '<div class="stat-value">' + avgEF + '</div>' +
          '<div class="stat-label">平均难度系数</div>' +
        '</div>' +
        '<div class="stat-card">' +
          '<div class="stat-value" style="font-size:20px;">' + (dueToday > 0 ? '📖 去复习' : dueToday === 0 && totalCards > 0 ? '✅ 已清空' : '📝 去添加') + '</div>' +
          '<div class="stat-label">状态</div>' +
        '</div>' +
      '</div>' +

      /* 错题统计 */
      (function () {
        var failedCards = App.collectFailedCards ? App.collectFailedCards() : [];
        var weekWrong = 0;
        weekStats.forEach(function (s) { weekWrong += s.wrong; });
        var topFailed = failedCards
          .sort(function (a, b) { return (a.card.easeFactor || 2.5) - (b.card.easeFactor || 2.5); })
          .slice(0, 5)
          .map(function (f) {
            return '<div class="failed-word-item">' +
              '<span class="failed-word">' + App.escHtml(f.card.word || f.card.front) + '</span>' +
              '<span class="failed-ef">EF: ' + ((f.card.easeFactor || 2.5).toFixed(1)) + '</span>' +
              '<span class="failed-deck">' + App.escHtml(f.deckName) + '</span>' +
            '</div>';
          }).join('');
        return '<div class="section-title" style="margin-top:24px;">📋 错题统计</div>' +
        '<div class="stats-grid">' +
          '<div class="stat-card">' +
            '<div class="stat-value" style="color:' + (failedCards.length > 0 ? 'var(--danger-text)' : 'var(--success)') + '">' + failedCards.length + '</div>' +
            '<div class="stat-label">待强化词汇</div>' +
          '</div>' +
          '<div class="stat-card">' +
            '<div class="stat-value">' + weekWrong + '</div>' +
            '<div class="stat-label">本周错题数</div>' +
          '</div>' +
        '</div>' +
        (topFailed ? '<div class="section-title" style="margin-top:16px;font-size:12px;">📌 最需强化的词</div>' +
        '<div class="failed-words-list">' + topFailed + '</div>' : '');
      })() +

      /* 每日目标 */
      '<div class="section-title" style="margin-top:24px;">🎯 每日目标</div>' +
      '<div class="daily-goal">' +
        '<div class="daily-goal-settings">' +
          '<span>每日目标:</span>' +
          '<input type="number" id="dailyGoalInput" value="' + dailyGoal + '" min="5" max="200" step="5">' +
          '<span>词</span>' +
          '<button class="btn btn-outline btn-sm" id="btnSaveGoal">保存</button>' +
        '</div>' +
        '<div class="daily-goal-progress">' +
          '<div class="daily-goal-fill" style="width:' + goalPercent + '%"></div>' +
        '</div>' +
        '<div style="text-align:center;font-size:13px;color:var(--text-muted);margin-top:6px;">' +
          todayTotal + ' / ' + dailyGoal + ' (' + goalPercent + '%)' +
          (goalPercent >= 100 ? ' 🎉 目标达成！' : '') +
        '</div>' +
      '</div>' +

      /* 周柱状图 */
      '<div class="section-title" style="margin-top:24px;">📊 本周学习量</div>' +
      '<div class="week-chart">' +
        weekStats.map(function (s) {
          let height = maxTotal > 0 ? Math.max(4, Math.round((s.total / maxTotal) * 100)) : 0;
          return '<div class="week-bar-col">' +
            '<div class="week-bar" style="height:' + height + 'px"></div>' +
            '<div class="week-bar-label">' + s.label + '</div>' +
            '<div class="week-bar-num">' + s.total + '</div>' +
          '</div>';
        }).join('') +
      '</div>' +

      /* 热力图 */
      '<div class="section-title" style="margin-top:24px;">📅 最近 30 天</div>' +
      '<div class="heatmap">' + App._renderHeatmap(log) + '</div>' +

      /* 数据备份 */
      '<div class="section-title" style="margin-top:24px;">💾 数据备份</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
        '<button id="btnExportAll" class="btn btn-outline btn-sm">📥 导出全部数据</button>' +
        '<button id="btnImportAll" class="btn btn-outline btn-sm">📤 导入数据恢复</button>' +
        '<button id="btnExportFailed" class="btn btn-outline btn-sm">📋 导出错题集</button>' +
        '<input type="file" id="importFileInput" accept=".json" style="display:none;">' +
      '</div>' +
      '<div style="font-size:12px;color:var(--text-muted);margin-top:4px;">导出包含所有牌组、学习进度和偏好设置。导入将<strong>替换</strong>当前全部数据。错题集导出为CSV格式，可在Excel中打开。</div>' +

      /* 学习提醒 */
      (function () {
        var settings = App._loadReminderSettings();
        var checked = settings.enabled ? ' checked' : '';
        var disabled = settings.enabled ? '' : ' disabled';
        return '<div class="section-title" style="margin-top:24px;">⏰ 学习提醒</div>' +
        '<div class="reminder-settings">' +
          '<label class="reminder-row">' +
            '<input type="checkbox" id="reminderEnabled"' + checked + '>' +
            '<span>开启每日学习提醒</span>' +
          '</label>' +
          '<div class="reminder-row">' +
            '<span>提醒时间:</span>' +
            '<input type="time" id="reminderTime" value="' + settings.time + '"' + disabled + '>' +
          '</div>' +
          '<button class="btn btn-outline btn-sm" id="btnTestReminder">🔔 测试提醒</button>' +
          '<div style="font-size:12px;color:var(--text-muted);margin-top:6px;">提醒仅在安装为桌面应用后支持系统通知。页面打开时会在设定时间弹出提示。</div>' +
        '</div>';
      })();

    /* 绑定导出按钮 */
    let btnExport = document.getElementById('btnExportAll');
    if (btnExport) {
      btnExport.addEventListener('click', App.exportAllData);
    }

    /* 绑定导出错题按钮 */
    let btnExportFailed = document.getElementById('btnExportFailed');
    if (btnExportFailed) {
      btnExportFailed.addEventListener('click', App.exportFailedCards);
    }

    /* 绑定导入按钮 → 触发文件选择 */
    let btnImport = document.getElementById('btnImportAll');
    let importInput = document.getElementById('importFileInput');
    if (btnImport && importInput) {
      btnImport.addEventListener('click', function () { importInput.click(); });
      importInput.addEventListener('change', function () {
        let file = importInput.files && importInput.files[0];
        if (!file) return;
        let reader = new FileReader();
        reader.onload = function () {
          try {
            App.importAllData(reader.result);
          } catch (e) {
            App.showToast('导入失败：文件格式不正确', 'error');
          }
          importInput.value = '';
        };
        reader.readAsText(file);
      });
    }

    /* 绑定每日目标保存事件（innerHTML 同步赋值后 DOM 已可用） */
      let goalInput = document.getElementById('dailyGoalInput');
      let saveBtn = document.getElementById('btnSaveGoal');
      if (goalInput && saveBtn) {
        saveBtn.addEventListener('click', function () {
          let v = parseInt(goalInput.value, 10);
          if (v >= 5 && v <= 200) {
            localStorage.setItem('flashcard-daily-goal', v);
            App.renderStatsPanel();
          }
        });
      }

      /* 绑定提醒设置 */
      var reminderCheckbox = document.getElementById('reminderEnabled');
      var reminderTimeInput = document.getElementById('reminderTime');
      var testReminderBtn = document.getElementById('btnTestReminder');
      if (reminderCheckbox) {
        reminderCheckbox.addEventListener('change', function () {
          var settings = App._loadReminderSettings();
          settings.enabled = this.checked;
          App._saveReminderSettings(settings);
          if (reminderTimeInput) reminderTimeInput.disabled = !this.checked;
          App._setupReminderTimer();
        });
      }
      if (reminderTimeInput) {
        reminderTimeInput.addEventListener('change', function () {
          var settings = App._loadReminderSettings();
          settings.time = this.value;
          App._saveReminderSettings(settings);
          App._setupReminderTimer();
        });
      }
      if (testReminderBtn) {
        testReminderBtn.addEventListener('click', function () {
          App._fireReminder();
        });
      }
  };

  App._renderHeatmap = function (log) {
    let cells = '';
    let now = new Date();
    for (let i = 29; i >= 0; i--) {
      let d = new Date(now);
      d.setDate(d.getDate() - i);
      let key = d.toISOString().slice(0, 10);
      let dayData = log[key] || { correct: 0, wrong: 0 };
      let total = dayData.correct + dayData.wrong;
      let level = total === 0 ? 0 : total < 10 ? 1 : total < 30 ? 2 : total < 60 ? 3 : 4;
      let title = key + ': ' + total + ' 次学习';
      cells += '<div class="heat-cell heat-level-' + level + '" title="' + title + '"></div>';
    }
    return cells;
  };

  /* 导出全部数据为 JSON 文件下载 */
  App.exportAllData = function () {
    let backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      decks: App.state.decks,
      currentDeckId: App.state.currentDeckId,
      learningLog: App.loadLearningLog(),
      dailyGoal: parseInt(localStorage.getItem('flashcard-daily-goal') || '20', 10),
      theme: localStorage.getItem('flashcard-theme') || 'auto',
    };
    let json = JSON.stringify(backup, null, 2);
    let blob = new Blob(['﻿' + json], { type: 'application/json;charset=utf-8' });
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = 'flashcard-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
    App.showToast('数据已导出', 'success');
  };

  /* 导出错题集为 CSV 文件 */
  App.exportFailedCards = function () {
    var failedCards = App.collectFailedCards();
    if (failedCards.length === 0) {
      App.showToast('暂无错题可导出', 'warn');
      return;
    }
    /* CSV header: word,phonetic,pos,definitions,easeFactor,deck */
    var rows = [['单词', '音标', '词性', '释义', 'EF系数', '所属牌组']];
    failedCards.forEach(function (f) {
      rows.push([
        f.card.word || f.card.front || '',
        f.card.phonetic || '',
        f.card.pos || '',
        (f.card.definitions || [f.card.back || '']).join('; '),
        String((f.card.easeFactor || 2.5).toFixed(1)),
        f.deckName
      ]);
    });
    var csv = '﻿' + rows.map(function (r) {
      return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(',');
    }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'flashcard-failed-' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    App.showToast('已导出 ' + failedCards.length + ' 个错题', 'success');
  };

  /* 从 JSON 文件导入恢复全部数据 */
  App.importAllData = function (raw) {
    let backup = JSON.parse(raw);
    if (!backup.version || !Array.isArray(backup.decks)) {
      throw new Error('Invalid backup format');
    }
    if (!confirm(
      '即将导入备份数据（' + backup.decks.length + ' 个牌组，共 ' +
      backup.decks.reduce(function (s, d) { return s + d.cards.length; }, 0) + ' 张卡片）。\n\n' +
      '导入将替换当前全部数据，是否继续？'
    )) return;

    App.state.decks = backup.decks;
    App.state.currentDeckId = backup.currentDeckId || null;
    App.saveData();

    if (backup.learningLog) {
      try { localStorage.setItem(App.LEARNING_LOG_KEY, JSON.stringify(backup.learningLog)); } catch (e) {}
    }
    if (backup.dailyGoal) {
      localStorage.setItem('flashcard-daily-goal', String(backup.dailyGoal));
    }
    if (backup.theme) {
      localStorage.setItem('flashcard-theme', backup.theme);
    }

    App.renderAll();
    App.showToast('数据已恢复', 'success');
  };

})(FlashcardApp);
