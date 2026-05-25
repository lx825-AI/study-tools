/** fix-wordbooks.js -- 修复词书文件中损坏的 JSON 条目 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const files = [
  'senior-high-enriched.js',
  'cet4-syllabus-enriched.js',
  'cet6-core-enriched.js',
  'cet6-syllabus-enriched.js',
  'kaoyan-enriched.js'
];

function findAndFixErrors(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let totalFixed = 0;
  let maxIter = 100;

  while (maxIter-- > 0) {
    try {
      new vm.Script(content, { filename: path.basename(filePath) });
      break; // 成功
    } catch (e) {
      // 从 stack 中提取行号
      const stackMatch = e.stack ? e.stack.match(new RegExp(path.basename(filePath) + ':(\\d+)')) : null;
      if (!stackMatch) {
        console.log('  Cannot find error line in stack, trying alternate method...');
        // 找不到行号，尝试用 eval 逐段定位
        break;
      }

      const lineNum = parseInt(stackMatch[1]);
      const lines = content.split('\n');
      const errLine = lines[lineNum - 1];

      // 修复 1: \"phonetic\":\"\"XXX\" → \"phonetic\":\"XXX\"
      // 音标值以一个多余的 \" 开头
      const fix1Pattern = /"phonetic":""([^,\}]+?)"/;
      const fix1Match = errLine.match(fix1Pattern);
      if (fix1Match) {
        const old = errLine;
        lines[lineNum - 1] = errLine.replace(fix1Pattern, '"phonetic":"' + fix1Match[1] + '"');
        console.log('  Line ' + lineNum + ': FIXED empty+extra in phonetic');
        console.log('    Old: ' + old.substring(0, 120));
        console.log('    New: ' + lines[lineNum - 1].substring(0, 120));
        content = lines.join('\n');
        totalFixed++;
        fs.writeFileSync(filePath, content, 'utf8');
        continue;
      }

      // 修复 2: \"phonetic\":\"X\"Y\" → 多余的双引号在音标值中间
      // 正常行格式: "phonetic":"VALUE","pos":...
      // 损坏行格式: "phonetic":"VA"LUE","pos":... (中间有多余引号)
      // 用更通用的方法: 找到 phonetic 的起始位置，然后扫描引号配对
      const phoneticIdx = errLine.indexOf('"phonetic":"');
      if (phoneticIdx !== -1) {
        const startIdx = phoneticIdx + '"phonetic":"'.length;
        // 扫描找到配对结束引号 (前面是偶数个反斜杠)
        let endIdx = -1;
        let backslashCount = 0;
        for (let j = startIdx; j < errLine.length; j++) {
          const ch = errLine[j];
          if (ch === '\\') {
            backslashCount++;
          } else if (ch === '"' && backslashCount % 2 === 0) {
            endIdx = j;
            break;
          } else {
            backslashCount = 0;
          }
        }

        if (endIdx !== -1) {
          const afterEnd = errLine.substring(endIdx + 1);
          // 检查结束时后面是否跟 , 或直接到下一字段
          const firstChar = afterEnd.trimStart()[0];
          if (firstChar !== ',' && firstChar !== '}') {
            // 找到一个不是逗号的字符，说明中间有额外引号
            // 用引号数量来判断
            const quoteCount = (errLine.match(/"/g) || []).length;
            // 正常行看起来有 17-19 个引号 (字段+值)
            // 如果有 20+ 个引号，说明有多余的
            // 不太可靠的启发式... 直接输出行内容让用户手动修复
            console.log('  Line ' + lineNum + ': MANUAL FIX NEEDED - unbalanced quotes');
            console.log('    ' + errLine.substring(0, 200));
            break;
          }
        }
      }

      // 无法自动修复
      console.log('  Line ' + lineNum + ': UNKNOWN FIX for error: ' + e.message);
      console.log('    ' + (errLine ? errLine.substring(0, 200) : '(empty)'));
      break;
    }
  }

  if (maxIter <= 0) console.log('  Warning: hit iteration limit');
  return totalFixed;
}

// 主程序
let grandTotal = 0;
for (const f of files) {
  const filePath = path.join(ROOT, 'wordbooks', f);
  console.log('\n=== ' + f + ' ===');
  const fixed = findAndFixErrors(filePath);
  grandTotal += fixed;
}

// 同时修复 dist 目录下的副本
console.log('\n=== Syncing dist/wordbooks/ ===');
for (const f of files) {
  const src = path.join(ROOT, 'wordbooks', f);
  const dst = path.join(ROOT, 'dist', 'wordbooks', f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst);
    console.log('  Copied: ' + f);
  }
}

console.log('\nTotal fixes: ' + grandTotal);
