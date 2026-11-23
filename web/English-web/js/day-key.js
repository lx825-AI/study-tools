/* day-key.js —— 本地日历日工具：所有「今天/到期/日志键」统一走这里，不再用 UTC 日界
 *
 * 背景：v1.0.0 之前全部用 new Date().toISOString().slice(0, 10) 取「今天」，
 * 在 UTC+8 会在本地 00:00-08:00 把学习记到前一天（今日目标、打卡、热力图、到期判断全部偏一天）。
 * 现在统一用本地日历日，key 仍是 YYYY-MM-DD 字符串，旧数据无需迁移（字符串比较语义不变）。
 */
var FlashcardApp = window.FlashcardApp || {};
(function (App) {
  'use strict';

  var DAY_MS = 24 * 60 * 60 * 1000;
  var KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  /** 把 key 解析成 UTC 正午时间戳：日历算术的锚点，避开夏令时导致的 23/25 小时日 */
  function keyToNoonMs(key) {
    var m = KEY_RE.exec(String(key == null ? '' : key));
    if (!m) return NaN;
    return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0, 0);
  }

  function utcPartsToKey(ms) {
    var d = new Date(ms);
    return d.getUTCFullYear() + '-' + pad2(d.getUTCMonth() + 1) + '-' + pad2(d.getUTCDate());
  }

  if (typeof App.dayKey !== 'function') {
    /** 本地日历日 key（YYYY-MM-DD）；不传参数取当前时间，非法日期返回空串 */
    App.dayKey = function (input) {
      var d;
      if (input instanceof Date) d = input;
      else if (input === undefined || input === null) d = new Date();
      else d = new Date(input);
      if (isNaN(d.getTime())) return '';
      return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
    };
  }

  /** key 是否为合法日历日（拒绝 2026-02-30 这类溢出日期） */
  App.isDayKey = function (key) {
    var m = KEY_RE.exec(String(key == null ? '' : key));
    if (!m) return false;
    var y = Number(m[1]);
    var mo = Number(m[2]);
    var d = Number(m[3]);
    var dt = new Date(Date.UTC(y, mo - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
  };

  /** key → 本地当天 00:00 的 Date；非法 key（含 2026-13-01 这类溢出）返回 null */
  App.parseDayKey = function (key) {
    if (!App.isDayKey(key)) return null;
    var m = KEY_RE.exec(String(key));
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  };

  /** key 加 n 天（可为负）；非法 key 或 n 返回空串 */
  App.addDays = function (key, n) {
    var ms = keyToNoonMs(key);
    if (isNaN(ms) || typeof n !== 'number' || !isFinite(n)) return '';
    return utcPartsToKey(ms + Math.round(n) * DAY_MS);
  };

  /** 两个 key 的日历日差值（to - from）；任一非法返回 NaN */
  App.daysBetween = function (from, to) {
    var a = keyToNoonMs(from);
    var b = keyToNoonMs(to);
    if (isNaN(a) || isNaN(b)) return NaN;
    return Math.round((b - a) / DAY_MS);
  };

  /** 传入日期所在周的周一 key（本地时区，周一为首日） */
  App.weekStartKey = function (input) {
    var d;
    if (input instanceof Date) d = new Date(input.getTime());
    else if (input === undefined || input === null) d = new Date();
    else d = new Date(input);
    if (isNaN(d.getTime())) return '';
    d.setHours(12, 0, 0, 0); /* 正午锚点，避免极端时区下 setDate 跨日 */
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return App.dayKey(d);
  };

  /** 今天 key（语法糖，便于阅读与测试打桩） */
  App.todayKey = function () {
    return App.dayKey();
  };
})(FlashcardApp);
