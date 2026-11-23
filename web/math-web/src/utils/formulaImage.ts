import katex from 'katex';
// Vite ?inline 将 CSS 文件内容作为字符串导入
import katexCSS from 'katex/dist/katex.min.css?inline';

interface ExportOptions {
  name: string;
  latex: string;
  note?: string;
  subject?: string;
  width?: number;
}

/**
 * 将公式渲染为图片并触发下载
 * 使用 SVG foreignObject 嵌入 KaTeX HTML + 内联 CSS，Canvas 渲染兼容
 */
export async function exportFormulaImage(opts: ExportOptions): Promise<void> {
  const { name, latex, note, subject, width = 600 } = opts;
  const padding = 24;
  const latexHtml = renderLatexToHtml(latex);

  // 计算内容高度
  const nameHeight = 28;
  const latexHeight = estimateLatexHeight(latex);
  const noteHeight = note ? Math.ceil(note.length / 50) * 22 : 0;
  const height = padding * 2 + nameHeight + 20 + latexHeight + 40 + (note ? noteHeight + 30 : 0);

  // 构建 SVG（内联 KaTeX CSS 解决 Canvas 无法解析 @import 的问题）
  const bgColor = '#ffffff';
  const textColor = '#1e293b';
  const latexBg = '#f8fafc';
  const accentColor = subjectColor(subject);
  const fontSize = 15;

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <style>
        ${katexCSS}
        .name { font-family: -apple-system, sans-serif; font-size: ${fontSize}px; font-weight: 600; fill: ${textColor}; }
        .note { font-family: -apple-system, sans-serif; font-size: 13px; fill: #64748b; }
        .badge { font-family: -apple-system, sans-serif; font-size: 11px; }
      </style>
    </defs>
    <rect width="${width}" height="${height}" rx="16" fill="${bgColor}"/>
    <rect x="0" y="0" width="4" height="${height}" rx="2" fill="${accentColor}"/>
    <text x="${padding + 4}" y="${padding + 20}" class="name">${escapeXml(name)}</text>
    <foreignObject x="${padding + 4}" y="${padding + nameHeight + 20}" width="${width - padding * 2 - 8}" height="${latexHeight + 40}">
      <div xmlns="http://www.w3.org/1999/xhtml" style="background:${latexBg};border-radius:8px;padding:16px;display:flex;align-items:center;justify-content:center;">
        ${latexHtml}
      </div>
    </foreignObject>
    ${note ? `<text x="${padding + 4}" y="${padding + nameHeight + 20 + latexHeight + 40 + 20}" class="note">${escapeXml(note)}</text>` : ''}
    <text x="${width - padding - 4}" y="${height - 12}" style="font-family:-apple-system,sans-serif;font-size:10px;fill:#94a3b8;text-anchor:end;">AI 数学公式速查表</text>
  </svg>`;

  const blob = new Blob([svgContent], { type: 'image/svg+xml' });

  // 转为 PNG 通过 Canvas
  const img = new Image();
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width * 2; // 2x for retina
      canvas.height = height * 2;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(2, 2);
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(blob => {
        URL.revokeObjectURL(url);
        if (!blob) { reject(new Error('导出失败')); return; }

        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${name}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
        resolve();
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片加载失败'));
    };
    img.src = url;
  });
}

function renderLatexToHtml(latex: string): string {
  try {
    return katex.renderToString(latex, { throwOnError: false, displayMode: true });
  } catch {
    return escapeXml(latex);
  }
}

function estimateLatexHeight(latex: string): number {
  const lines = latex.split('\\\\').length;
  const alignedLines = (latex.match(/\\\\/g) || []).length + 1;
  return Math.max(lines, alignedLines) * 28 + 16;
}

function subjectColor(subject?: string): string {
  switch (subject) {
    case '高等数学': return '#2563eb';
    case '线性代数': return '#7c3aed';
    case '离散数学': return '#059669';
    case '概率统计': return '#ea580c';
    case '数值分析': return '#0891b2';
    default: return '#4f46e5';
  }
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
