/**
 * wordbook-lib.js —— 词书生成库（纯函数，供 gen-wordbooks.js 与 vitest 测试使用）
 *
 * 数据源：English-mini-app/wordbooks-cloud/ 的 10 套词书 JSON（乱序版，
 * 与小程序默认导入一致；乱序由 Web 学习模式的排序选项在运行时实现）。
 */
'use strict';

/**
 * 10 本书配置：Web registry key ↔ 小程序词书 JSON 文件名
 *
 * 前 5 本为替换书，沿用旧 key/旧 name（import.js 按 name 去重，
 * 已导入用户不会重复导入）；后 5 本为新增词书。
 */
const BOOK_CONFIG = [
  {
    key: 'senior-high-enriched',
    name: '高中英语词汇（含词性）',
    description: '高中英语完整大纲词汇，100% 音标覆盖',
    sourceFile: 'senior-high-new.json',
  },
  {
    key: 'cet4-syllabus-enriched',
    name: '四级大纲词汇（含词性）',
    description: 'CET-4 完整大纲词汇，100% 音标覆盖',
    sourceFile: 'cet4-new.json',
  },
  {
    key: 'cet6-core-enriched',
    name: '六级核心高频（含词性）',
    description: 'CET-6 考试高频核心词汇，100% 音标覆盖',
    sourceFile: 'cet6-core.json',
  },
  {
    key: 'cet6-syllabus-enriched',
    name: '六级完整大纲（含词性）',
    description: 'CET-6 完整大纲词汇，100% 音标覆盖',
    sourceFile: 'cet6-new.json',
  },
  {
    key: 'kaoyan-enriched',
    name: '考研英语词汇（含词性）',
    description: '考研英语完整大纲词汇，100% 音标覆盖',
    sourceFile: 'kaoyan-new.json',
  },
  {
    key: 'junior-high',
    name: '初中大纲词汇',
    description: '初中英语完整大纲词汇',
    sourceFile: 'junior-high.json',
  },
  {
    key: 'junior-high-core',
    name: '初中核心词汇',
    description: '初中英语考试高频核心词汇',
    sourceFile: 'junior-high-core.json',
  },
  {
    key: 'senior-high-core',
    name: '高中核心词汇',
    description: '高中英语考试高频核心词汇',
    sourceFile: 'senior-high-core.json',
  },
  {
    key: 'cet4-core',
    name: '四级核心词汇',
    description: 'CET-4 考试高频核心词汇',
    sourceFile: 'cet4-core.json',
  },
  {
    key: 'kaoyan-core',
    name: '考研核心词汇',
    description: '考研英语考试高频核心词汇',
    sourceFile: 'kaoyan-core.json',
  },
];

/**
 * 将词条数组转为紧凑 JSON 文本（每词一行，不换行缩进，控制生成文件体积）
 * @param {Array<Object>} words 词条对象数组（word/phonetic/pos/definitions/...）
 * @returns {Array<string>} 每词一行的紧凑 JSON 字符串
 */
function compactWords(words) {
  return words.map(function (word) {
    return JSON.stringify(word);
  });
}

/**
 * 生成可挂载到 window.__VOCAB_REGISTRY__ 的词书 JS 文件文本
 * @param {Object} meta { key, name, description }
 * @param {Array<Object>} words 词条数组
 * @returns {string} 词书 JS 文件完整内容
 */
function buildRegistrySource(meta, words) {
  var lines = [];
  lines.push('window.__VOCAB_REGISTRY__ = window.__VOCAB_REGISTRY__ || {};');
  lines.push("window.__VOCAB_REGISTRY__['" + meta.key + "'] = {");
  lines.push('  name: ' + JSON.stringify(meta.name) + ',');
  lines.push('  description: ' + JSON.stringify(meta.description) + ',');
  lines.push('  words: [');
  var compact = compactWords(words);
  for (var i = 0; i < compact.length; i++) {
    lines.push(compact[i] + (i === compact.length - 1 ? '' : ','));
  }
  lines.push('  ]');
  lines.push('};');
  return lines.join('\n');
}

module.exports = { BOOK_CONFIG, compactWords, buildRegistrySource };
