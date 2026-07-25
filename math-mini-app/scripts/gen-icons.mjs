/**
 * 生成 tabBar 图标（8 张 64x64 PNG，纯色剪影）
 * 用法：node scripts/gen-icons.mjs
 * 颜色与 pages.json tabBar 配置一致：普通 #999999，激活 #667eea
 */
import zlib from 'node:zlib'
import fs from 'node:fs'
import path from 'node:path'

const SIZE = 64
const OUT_DIR = path.resolve(import.meta.dirname, '../src/static/tab')

// ---------- CRC32 ----------
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

/** 将 RGBA 像素数组编码为 PNG Buffer */
function encodePng(pixels, size) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0 // filter: none
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/** 多边形扫描线填充 */
function fillPolygon(set, points) {
  for (let y = 0; y < SIZE; y++) {
    const xs = []
    for (let i = 0; i < points.length; i++) {
      const [x1, y1] = points[i]
      const [x2, y2] = points[(i + 1) % points.length]
      if (y1 === y2 || y < Math.min(y1, y2) || y >= Math.max(y1, y2)) continue
      xs.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1))
    }
    xs.sort((a, b) => a - b)
    for (let i = 0; i + 1 < xs.length; i += 2) {
      for (let x = Math.ceil(xs[i]); x < xs[i + 1]; x++) set(x, y)
    }
  }
}

function fillCircle(set, cx, cy, r) {
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++)
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) set(x, y)
}

function fillRing(set, cx, cy, rOut, rIn) {
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++) {
      const d2 = (x - cx) ** 2 + (y - cy) ** 2
      if (d2 <= rOut * rOut && d2 >= rIn * rIn) set(x, y)
    }
}

function fillLine(set, x1, y1, x2, y2, w) {
  const len = Math.hypot(x2 - x1, y2 - y1)
  const steps = Math.ceil(len * 2)
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    fillCircle(set, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, w / 2)
  }
}

function fillEllipse(set, cx, cy, rx, ry, yMax = SIZE) {
  for (let y = 0; y < yMax; y++)
    for (let x = 0; x < SIZE; x++)
      if ((x - cx) ** 2 / rx ** 2 + (y - cy) ** 2 / ry ** 2 <= 1) set(x, y)
}

// ---------- 各图标形状定义 ----------
const shapes = {
  home(set) {
    fillPolygon(set, [
      [32, 8], [56, 30], [50, 30], [50, 54], [37, 54], [37, 40], [27, 40],
      [27, 54], [14, 54], [14, 30], [8, 30],
    ])
  },
  search(set) {
    fillRing(set, 27, 27, 17, 11)
    fillLine(set, 39, 39, 54, 54, 7)
  },
  star(set) {
    const cx = 32, cy = 33, rOut = 25, rIn = 10
    const points = []
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? rOut : rIn
      const a = -Math.PI / 2 + (i * Math.PI) / 5
      points.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
    }
    fillPolygon(set, points)
  },
  user(set) {
    fillCircle(set, 32, 21, 11)
    fillEllipse(set, 32, 62, 20, 17, 55) // 肩部（只取上半椭圆）
  },
}

/** 渲染一张图标 */
function render(shapeFn, color) {
  const pixels = Buffer.alloc(SIZE * SIZE * 4)
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16))
  const set = (x, y) => {
    const o = (y * SIZE + x) * 4
    pixels[o] = r
    pixels[o + 1] = g
    pixels[o + 2] = b
    pixels[o + 3] = 255
  }
  shapeFn(set)
  return encodePng(pixels, SIZE)
}

// ---------- 生成 ----------
fs.mkdirSync(OUT_DIR, { recursive: true })
const NORMAL = '#999999'
const ACTIVE = '#667eea'
for (const [name, fn] of Object.entries(shapes)) {
  fs.writeFileSync(path.join(OUT_DIR, `${name}.png`), render(fn, NORMAL))
  fs.writeFileSync(path.join(OUT_DIR, `${name}-active.png`), render(fn, ACTIVE))
}
console.log(`已生成 8 张 tabBar 图标 → ${OUT_DIR}`)
