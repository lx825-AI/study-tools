/**
 * enrich-phonetics.js —— 从 ECDICT 词典提取音标，填充到词书词条中
 * 用法: node scripts/enrich-phonetics.js
 * 前提: 已下载 ECDICT CSV 到 tmp/ecdict.csv
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// ---- 1. 解析 ECDICT CSV 构建 词→音标 映射 ----
console.log('读取词典数据...');
const dictRaw = fs.readFileSync(path.join(ROOT, 'tmp', 'ecdict.csv'), 'utf-8');
const dictLines = dictRaw.split('\n');
const phoneticMap = new Map();
let skipped = 0;

// 跳过表头
for (let i = 1; i < dictLines.length; i++) {
  const line = dictLines[i];
  if (!line) continue;
  // 简单 CSV 解析：取前两个字段（word,phonetic）
  const firstComma = line.indexOf(',');
  if (firstComma === -1) continue;
  const word = line.slice(0, firstComma).trim().toLowerCase();
  if (!word) continue;

  const rest = line.slice(firstComma + 1);
  const secondComma = rest.indexOf(',');
  if (secondComma === -1) continue;
  const phonetic = rest.slice(0, secondComma).trim();

  if (phonetic && !phoneticMap.has(word)) {
    phoneticMap.set(word, phonetic);
  } else if (!phonetic) {
    skipped++;
  }
}

console.log('音标映射: ' + phoneticMap.size + ' 词 (跳过无音标: ' + skipped + ')');

// ---- 2. 处理每个词书文件 ----
const wordbooksDir = path.join(ROOT, 'wordbooks');
const files = fs.readdirSync(wordbooksDir).filter(f => f.endsWith('-enriched.js'));

for (const filename of files) {
  const filepath = path.join(wordbooksDir, filename);
  let code = fs.readFileSync(filepath, 'utf-8');
  let filledCount = 0;
  let totalCount = 0;

  // 匹配每个词条对象中的 "word":"xxx" 字段，提取 word 值
  // 模式: { word:"ability", phonetic:"", ... }
  // 替换模式: 找到 phonetic 为空字符串的项，填充音标
  const entryPattern = /"word"\s*:\s*"([^"]+)"[^}]*?"phonetic"\s*:\s*"([^"]*)"/g;

  code = code.replace(entryPattern, (match, word, currentPhonetic) => {
    totalCount++;
    // 如果已有音标，保留原值
    if (currentPhonetic && currentPhonetic.trim()) {
      return match;
    }
    const key = word.toLowerCase();
    const phonetic = phoneticMap.get(key);
    if (phonetic) {
      filledCount++;
      return match.replace('"phonetic":"' + currentPhonetic + '"', '"phonetic":"' + phonetic + '"');
    }
    return match;
  });

  fs.writeFileSync(filepath, code, 'utf-8');
  console.log('  ' + filename + ': ' + filledCount + ' / ' + totalCount + ' 词填充音标');
}

console.log('\n完成！');
