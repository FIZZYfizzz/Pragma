// Generates build/icon.ico — a 256x256 brand icon (violet rounded square, white "P").
// ICO containers may embed PNG data directly for 256px images, which is what
// electron-builder needs as a minimum. Re-run with: node scripts/generate-icon.js
const { deflateSync } = require('zlib')
const { mkdirSync, writeFileSync } = require('fs')
const { join } = require('path')

const SIZE = 256

// ─── Draw ─────────────────────────────────────────────────────────────────────

const px = new Uint8Array(SIZE * SIZE * 4)

function inRoundedRect(x, y, x0, y0, x1, y1, r) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false
  const cx = Math.max(x0 + r, Math.min(x, x1 - r))
  const cy = Math.max(y0 + r, Math.min(y, y1 - r))
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r || (x >= x0 + r && x <= x1 - r) || (y >= y0 + r && y <= y1 - r)
}

// The "P": vertical stem plus a bowl (half annulus opening right)
function inP(x, y) {
  // stem
  if (x >= 92 && x < 116 && y >= 64 && y < 196) return true
  // bowl — annulus centred on the stem's top half
  const dx = x - 116
  const dy = y - 100
  const d2 = dx * dx + dy * dy
  if (x >= 116 && d2 <= 38 * 38 && d2 >= 16 * 16) return true
  return false
}

for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const i = (y * SIZE + x) * 4
    if (inRoundedRect(x, y, 16, 16, 239, 239, 56)) {
      if (inP(x, y)) {
        px[i] = 255; px[i + 1] = 255; px[i + 2] = 255; px[i + 3] = 255
      } else {
        // brand violet #7c6af7 with a subtle vertical gradient
        const t = y / SIZE
        px[i] = Math.round(0x7c + (0x6a - 0x7c) * t * 0.4)
        px[i + 1] = Math.round(0x6a + (0x52 - 0x6a) * t * 0.4)
        px[i + 2] = 0xf7
        px[i + 3] = 255
      }
    } else {
      px[i + 3] = 0 // transparent
    }
  }
}

// ─── PNG encode ───────────────────────────────────────────────────────────────

function crc32b(buf) {
  let crc = 0xffffffff
  for (let n = 0; n < buf.length; n++) {
    crc ^= buf[n]
    for (let k = 0; k < 8; k++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32b(typeAndData))
  return Buffer.concat([len, typeAndData, crc])
}

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(SIZE, 0)
ihdr.writeUInt32BE(SIZE, 4)
ihdr[8] = 8   // bit depth
ihdr[9] = 6   // color type RGBA
// compression, filter, interlace all 0

// raw scanlines with filter byte 0
const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1))
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE * 4 + 1)] = 0
  Buffer.from(px.buffer, y * SIZE * 4, SIZE * 4).copy(raw, y * (SIZE * 4 + 1) + 1)
}

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
])

// ─── ICO wrap ─────────────────────────────────────────────────────────────────

const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0) // reserved
header.writeUInt16LE(1, 2) // type: icon
header.writeUInt16LE(1, 4) // one image

const entry = Buffer.alloc(16)
entry[0] = 0 // width 256 → 0
entry[1] = 0 // height 256 → 0
entry.writeUInt16LE(1, 4)  // color planes
entry.writeUInt16LE(32, 6) // bits per pixel
entry.writeUInt32LE(png.length, 8)
entry.writeUInt32LE(22, 12) // data offset (6 + 16)

const outDir = join(__dirname, '..', 'build')
mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'icon.ico'), Buffer.concat([header, entry, png]))
console.log(`Wrote ${join(outDir, 'icon.ico')} (${6 + 16 + png.length} bytes)`)
