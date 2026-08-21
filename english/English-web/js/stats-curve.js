/* stats-curve.js —— 遗忘曲线模块：HTML 片段 + Canvas 双线绘制（对齐小程序 ForgettingCurve） */
var FlashcardApp = window.FlashcardApp || {};
(function (App) {
  'use strict';

  /* 当前统计页日志条目（renderCurveSectionHtml 时暂存，供绘制与主题重绘） */
  var _curveEntries = [];

  /** 曲线卡片 HTML（canvas 340×200 + 双线图例 + 评语） */
  App.renderCurveSectionHtml = function (entries) {
    _curveEntries = entries || [];
    return '<div class="curve-card">' +
      '<div class="curve-title">🧠 遗忘曲线</div>' +
      '<canvas id="statsCurveCanvas" width="340" height="200"></canvas>' +
      '<div class="curve-legend">' +
        '<span class="legend-item"><span class="legend-line theoretical"></span>理论艾宾浩斯</span>' +
        '<span class="legend-item"><span class="legend-line actual"></span>你的记忆</span>' +
      '</div>' +
      '<div class="curve-note">' + App.escHtml(App.curveNoteText(entries)) + '</div>' +
    '</div>';
  };

  /** 读 CSS 变量（主题色）；无则用回退值 */
  function _cssVar(name, fallback) {
    try {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    } catch (e) { return fallback; }
  }

  /** 绘制单条曲线（含顶点实心点，对齐小程序 drawCurve） */
  function _drawLine(ctx, values, pad, plotW, plotH, color, dashed) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    if (dashed && ctx.setLineDash) ctx.setLineDash([5, 3]);
    ctx.beginPath();
    values.forEach(function (v, i) {
      var x = pad.left + (plotW / 5) * i;
      var y = pad.top + plotH * (1 - v);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    if (ctx.setLineDash) ctx.setLineDash([]);
    values.forEach(function (v, i) {
      var x = pad.left + (plotW / 5) * i;
      var y = pad.top + plotH * (1 - v);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });
  }

  /** 绘制遗忘曲线（dpr 缩放 + 双主题；jsdom 无 canvas 实现时静默返回） */
  App.drawStatsCurve = function () {
    var canvas = document.getElementById('statsCurveCanvas');
    if (!canvas) return;
    var ctx = null;
    try { ctx = canvas.getContext && canvas.getContext('2d'); } catch (e) { ctx = null; }
    if (!ctx) return;

    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    var W = 340, H = 200;
    var dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);

    var pad = { top: 20, right: 20, bottom: 30, left: 40 };
    var plotW = W - pad.left - pad.right;
    var plotH = H - pad.top - pad.bottom;

    /* 底色 */
    ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
    ctx.fillRect(0, 0, W, H);

    /* 横网格线 + Y 轴标签（100%..0% 步进 20）+ X 轴标签 */
    var labels = ['1天', '2天', '4天', '7天', '15天', '30天'];
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'right';
    ctx.strokeStyle = isDark ? 'rgba(51,65,85,0.4)' : 'rgba(100,116,139,0.35)';
    ctx.lineWidth = 0.5;
    var i, y, x;
    for (i = 0; i <= 5; i++) {
      y = pad.top + plotH / 5 * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(W - pad.right, y);
      ctx.stroke();
      ctx.fillText(String(100 - i * 20) + '%', pad.left - 6, y + 3);
    }
    ctx.textAlign = 'center';
    for (i = 0; i < 6; i++) {
      x = pad.left + plotW / 5 * i;
      ctx.fillText(labels[i], x, H - 8);
    }
    ctx.textAlign = 'left';

    /* 理论曲线（灰色虚线）+ 个人曲线（主色实线，≥3 天数据时） */
    _drawLine(ctx, App.THEORETICAL_CURVE, pad, plotW, plotH, isDark ? '#94a3b8' : '#475569', true);
    if (_curveEntries.length >= 3) {
      _drawLine(ctx, App.estimateUserCurve(_curveEntries), pad, plotW, plotH, _cssVar('--primary', '#4f46e5'), false);
    }
  };

  /** 主题切换后重绘曲线（app.js 钩子） */
  App.refreshStatsCharts = function () {
    var panel = document.getElementById('panelStats');
    if (!panel || !panel.classList.contains('visible')) return;
    App.drawStatsCurve();
  };
})(FlashcardApp);
