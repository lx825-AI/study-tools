/** build.js —— 构建脚本：合并 CSS/JS、转换词书为 JSON、输出 dist/ */
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

/* 确保输出目录 */
fs.mkdirSync(DIST, { recursive: true });
fs.mkdirSync(path.join(DIST, 'wordbooks'), { recursive: true });

/* ========== CSS 合并 ========== */
const CSS_ORDER = [
  'variables.css', 'base.css', 'components.css', 'deck.css',
  'study.css', 'mode.css', 'typing.css', 'preview.css', 'stats.css'
];

const cssContent = CSS_ORDER
  .map(f => fs.readFileSync(path.join(ROOT, 'css', f), 'utf8'))
  .join('\n');

fs.writeFileSync(path.join(DIST, 'styles.css'), cssContent);
console.log('✓ CSS merged (' + cssContent.length + ' bytes)');

/* ========== JS 合并 + 压缩 ========== */
const JS_ORDER = [
  'js/idb-storage.js', 'js/state.js',
  'js/models.js', 'js/utils.js', 'js/ebbinghaus.js',
  'js/ui.js', 'js/deck-panel.js', 'js/study-panel.js',
  'js/typing-panel.js',
  'js/preview-panel.js', 'js/cards-panel.js',
  'js/import.js', 'js/stats-panel.js',
  'data/word-schema.js', 'js/app.js'
];

const jsContent = JS_ORDER
  .map(f => fs.readFileSync(path.join(ROOT, f), 'utf8'))
  .join('\n');

const result = esbuild.transformSync(jsContent, {
  minify: true,
  target: 'es2017',
  charset: 'utf8'
});

fs.writeFileSync(path.join(DIST, 'app.bundle.js'), result.code);
console.log('✓ JS merged + minified (' + jsContent.length + ' -> ' + result.code.length + ' bytes)');

/* ========== 词书：直接复制 JS 文件（通过动态 &lt;script&gt; 标签加载） ========== */
const WORDBOOKS = [
  'senior-high-enriched',
  'kaoyan-enriched',
  'cet4-syllabus-enriched',
  'cet6-core-enriched',
  'cet6-syllabus-enriched'
];

WORDBOOKS.forEach(name => {
  const src = path.join(ROOT, 'wordbooks', name + '.js');
  if (!fs.existsSync(src)) {
    console.warn('⚠ Wordbook source not found, skipping: ' + name);
    return;
  }
  fs.copyFileSync(src, path.join(DIST, 'wordbooks', name + '.js'));
  console.log('✓ Wordbook copied: ' + name);
});

/* ========== 复制 index.html 并替换引用 ========== */
let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

/* 移除所有 CSS link 标签 */
html = html.replace(/<link rel="stylesheet" href="css\/[^"]+">\s*/g, '');
/* 替换为单个打包后的 CSS */
html = html.replace('</head>', '  <link rel="stylesheet" href="./styles.css">\n</head>');

/* 移除内联 style 标签（全局搜索样式 + 移动端响应式） */
html = html.replace(/<style>[\s\S]*?<\/style>\s*/g, '');

/* 移除所有 script 标签（包括内联 SW 注册和初始化） */
/* 先移除外部 script 标签 */
html = html.replace(/<script src="[^"]+"><\/script>\s*/g, '');
/* 移除内联 SW 注册 + 初始化 script */
html = html.replace(/<script>\s*\/\* 注册 Service Worker \*\/[\s\S]*?<\/script>\s*/g, '');

/* 在 body 末尾插入 bundle script + SW 注册 */
html = html.replace('</body>',
  '<script src="./app.bundle.js"></script>\n' +
  '<script>\n' +
  'if ("serviceWorker" in navigator) {\n' +
  '  try { navigator.serviceWorker.register("./sw.js").catch(function () {}); } catch (e) {}\n' +
  '}\n' +
  'FlashcardApp.init();\n' +
  '</script>\n' +
  '</body>'
);

fs.writeFileSync(path.join(DIST, 'index.html'), html);
console.log('✓ index.html copied + updated');

/* ========== 复制 manifest.json 和 sw.js ========== */
fs.copyFileSync(path.join(ROOT, 'manifest.json'), path.join(DIST, 'manifest.json'));
console.log('✓ manifest.json copied');
fs.copyFileSync(path.join(ROOT, 'sw.js'), path.join(DIST, 'sw.js'));
console.log('✓ sw.js copied');
fs.copyFileSync(path.join(ROOT, 'icon.svg'), path.join(DIST, 'icon.svg'));
console.log('✓ icon.svg copied');

console.log('\n✓ Build complete. Output: ' + DIST);
