/* stats-aggregate.js —— 统计页纯聚合函数（对齐小程序 stats.vue / HeatmapChart / ForgettingCurve） */
var FlashcardApp = window.FlashcardApp || {};
(function (App) {
  'use strict';

  /* 艾宾浩斯 8 阶段标签与配色（对齐小程序 STAGE_COLORS） */
  App.STAGE_LABELS = ['新学', '1天后', '2天后', '4天后', '7天后', '15天后', '30天后', '已掌握'];
  App.STAGE_COLORS = ['#94a3b8', '#f87171', '#fb923c', '#facc15', '#4ade80', '#2dd4bf', '#60a5fa', '#a78bfa'];
  /* 理论艾宾浩斯记忆曲线（对齐小程序 ForgettingCurve） */
  App.THEORETICAL_CURVE = [0.67, 0.55, 0.45, 0.35, 0.25, 0.21];
  App.WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

  /** 合并快速/深度日志：同日求和（对齐小程序 mergeDailyCounts：cardsStudied/correct/wrong 逐项相加，
      与引导页每日目标 todayTotal、首页 todayProgress = deep + quick 口径一致；
      typeof number 归一防御损坏条目（字符串字段致 NaN%、null 条目致白屏）） */
  App.mergeLogs = function (quickLog, deepLog) {
    var merged = {};
    var FIELD_KEYS = ['cardsStudied', 'correct', 'wrong'];
    var sources = [quickLog, deepLog];
    sources.forEach(function (src) {
      var k, entry, i, field, cur;
      for (k in src) {
        if (!src.hasOwnProperty(k)) continue;
        entry = src[k];
        cur = merged[k] || { cardsStudied: 0, correct: 0, wrong: 0 };
        for (i = 0; i < FIELD_KEYS.length; i++) {
          field = FIELD_KEYS[i];
          cur[field] += (entry && typeof entry[field] === 'number') ? entry[field] : 0;
        }
        merged[k] = cur;
      }
    });
    return merged;
  };

  /** 热力图 5 档色阶分档（对齐小程序 getColor 阈值：0/≤5/≤10/≤20/>20） */
  App.heatLevel = function (count) {
    if (!count || count <= 0) return 0;
    if (count <= 5) return 1;
    if (count <= 10) return 2;
    if (count <= 20) return 3;
    return 4;
  };

  /** 本周学习报告（周一为首日 7 天窗口；含上周对比趋势与副文案，对齐小程序 loadStats） */
  App.buildWeekSeries = function (log, now) {
    /* 全部用 UTC 星期运算：log key 是 toISOString 的 UTC 日期，本地星期在
       UTC+8 凌晨（00:00-08:00，UTC 仍前一天）会让窗口错位一天 */
    var dow = (now.getUTCDay() + 6) % 7; /* UTC 周一=0 */
    var monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - dow);

    var weekWords = 0, weekDays = 0, weekCorrect = 0, weekWrong = 0;
    var bars = [];
    var i, d, key, entry, count;
    for (i = 0; i < 7; i++) {
      d = new Date(monday);
      d.setDate(monday.getDate() + i);
      key = d.toISOString().slice(0, 10);
      entry = log[key];
      count = entry ? (entry.cardsStudied || 0) : 0;
      if (count > 0) {
        weekWords += count;
        weekDays++;
        weekCorrect += entry.correct || 0;
        weekWrong += entry.wrong || 0;
      }
      /* 柱高 clamp(4, count/100*60)，对齐小程序 weekBars */
      bars.push({
        label: App.WEEKDAY_LABELS[i],
        heightPx: count > 0 ? Math.max(4, Math.min(60, Math.round(count / 100 * 60))) : 0,
        total: count
      });
    }

    var accuracy = (weekCorrect + weekWrong) > 0
      ? Math.round(weekCorrect / (weekCorrect + weekWrong) * 100) : 0;

    /* 上周总量与趋势（对齐小程序 weekTrend） */
    var lastMonday = new Date(monday);
    lastMonday.setUTCDate(monday.getUTCDate() - 7);
    var lastWeekTotal = 0;
    for (i = 0; i < 7; i++) {
      d = new Date(lastMonday);
      d.setDate(lastMonday.getDate() + i);
      key = d.toISOString().slice(0, 10);
      entry = log[key];
      if (entry) lastWeekTotal += entry.cardsStudied || 0;
    }
    var weekTrend, trendDown = false;
    if (lastWeekTotal > 0) {
      var change = Math.round((weekWords - lastWeekTotal) / lastWeekTotal * 100);
      weekTrend = (change >= 0 ? '↑ ' : '↓ ') + Math.abs(change) + '%';
      trendDown = change < 0;
    } else {
      weekTrend = '新增';
    }

    return {
      weekWords: weekWords,
      weekDays: weekDays,
      weekWrong: weekWrong,
      weekAccuracy: accuracy,
      weekTrend: weekTrend,
      trendDown: trendDown,
      weekSubText: lastWeekTotal > 0 ? '上周 ' + lastWeekTotal + ' 词' : '首次学习',
      weekDayText: weekDays >= 5 ? '坚持得很好' : '加油多来几天',
      weekAccuracyText: accuracy >= 80 ? '正确率优秀' : (accuracy >= 60 ? '继续努力' : '需要加强'),
      bars: bars
    };
  };

  /** 打卡日历数据（周一为首日；本地月历手动拼日期串，对齐小程序 buildCalendar）
      已知偏差（与小程序同款不修）：日志 key 为 UTC 日期，本地 UTC+8 凌晨 00:00-08:00 窗口
      （本地日期 = UTC 日期 + 1）下：今日圈画在前一格；月初该窗口学习记录显示到上月格 */
  App.buildCalendarData = function (year, month, studiedMap, todayStr) {
    var firstDay = new Date(year, month, 1);
    var lastDay = new Date(year, month + 1, 0);
    var startDow = (firstDay.getDay() + 6) % 7;
    var cells = [];
    var i, d, dateStr;
    for (i = 0; i < startDow; i++) cells.push({ empty: true });
    for (d = 1; d <= lastDay.getDate(); d++) {
      dateStr = year + '-' + (month + 1 < 10 ? '0' : '') + (month + 1) + '-' + (d < 10 ? '0' : '') + d;
      cells.push({
        day: String(d),
        isToday: dateStr === todayStr,
        studied: !!studiedMap[dateStr]
      });
    }
    return {
      title: year + '年 ' + (month + 1) + '月',
      cells: cells
    };
  };

  /** 热力图（回退 weekCount 周对齐 UTC 周一后逐周 7 天；默认 12 周；对齐小程序 HeatmapChart weeks） */
  App.buildHeatmapWeeks = function (log, now, weekCount) {
    var span = (weekCount || 12) * 7;
    var start = new Date(now);
    start.setUTCDate(now.getUTCDate() - span);
    var offset = start.getUTCDay() === 0 ? 6 : start.getUTCDay() - 1; /* 对齐 UTC 周一 */
    start.setUTCDate(start.getUTCDate() - offset);

    var todayKey = now.toISOString().slice(0, 10);
    var weeks = [];
    var cursor = new Date(start);
    while (cursor <= now) {
      var col = [];
      var i, d, key, count;
      for (i = 0; i < 7; i++) {
        d = new Date(cursor);
        d.setUTCDate(cursor.getUTCDate() + i);
        key = d.toISOString().slice(0, 10);
        count = (log[key] && log[key].cardsStudied) || 0;
        col.push({ date: key, count: count, level: App.heatLevel(count), isFuture: key > todayKey });
      }
      weeks.push(col);
      cursor.setUTCDate(cursor.getUTCDate() + 7);
    }
    return weeks;
  };

  /** 艾宾浩斯 8 阶段分布（stage 整数钳制 0-7；负值/浮点/NaN/非数字统一归 0 防计数静默丢失；
      按最大 count 归一化，对齐小程序 loadStats） */
  App.stageDistribution = function (cards) {
    var dist = [0, 0, 0, 0, 0, 0, 0, 0];
    cards.forEach(function (c) {
      var raw = c.ebbinghausStage;
      var stage = (typeof raw === 'number' && isFinite(raw))
        ? Math.max(0, Math.min(7, Math.floor(raw))) : 0;
      dist[stage]++;
    });
    var maxCount = Math.max.apply(null, dist.concat([1]));
    return App.STAGE_LABELS.map(function (label, i) {
      return {
        stage: i,
        label: label,
        count: dist[i],
        percent: Math.round(dist[i] / maxCount * 100),
        color: App.STAGE_COLORS[i]
      };
    });
  };

  /** 个人记忆曲线估算（对齐小程序 estimateUserCurve：按历史总正确率定基点再递减；
      调用方保证 entries ≥3（绘制前守卫），null 条目防御跳过） */
  App.estimateUserCurve = function (entries) {
    var totalCorrect = 0, totalStudied = 0;
    entries.forEach(function (l) {
      totalCorrect += (l && l.correct) || 0;
      totalStudied += (l && l.cardsStudied) || 0;
    });
    var baseRate = totalStudied > 0 ? totalCorrect / totalStudied : 0.8;
    var base = Math.max(0.6, Math.min(0.9, baseRate));
    return [
      base,
      Math.max(0.5, base - 0.08),
      Math.max(0.4, base - 0.14),
      Math.max(0.3, base - 0.22),
      Math.max(0.2, base - 0.32),
      Math.max(0.15, base - 0.4)
    ];
  };

  /** 记忆曲线评语（对齐小程序 curve-note 规则） */
  App.curveNoteText = function (entries) {
    if (entries.length === 0) return '完成 3 天学习后，将显示你的记忆曲线';
    if (entries.length < 3) return '再学习 ' + (3 - entries.length) + ' 天后，就能看到你的记忆曲线了';
    var totalCorrect = 0, totalStudied = 0;
    entries.forEach(function (l) {
      totalCorrect += (l && l.correct) || 0;
      totalStudied += (l && l.cardsStudied) || 0;
    });
    var rate = totalStudied > 0 ? Math.round(totalCorrect / totalStudied * 100) : 0;
    if (rate >= 80) return '你的遗忘速度比理论曲线慢，坚持复习有效果！';
    if (rate >= 60) return '保持复习节奏，你的记忆曲线会越来越好';
    return '多复习错词可以显著改善记忆曲线';
  };
})(FlashcardApp);
