// Generates PNG icons for the PWA using only built-in Node modules.
const zlib = require('zlib')
const fs = require('fs')
const path = require('path')

function crc32(buf) {
  const table = Array.from({ length: 256 }, (_, n) => {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    return c >>> 0
  })
  let crc = 0xffffffff
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const t = Buffer.from(type)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crcBuf])
}

function makePNG(size, draw) {
  const pixels = new Uint8Array(size * size * 4)
  draw(pixels, size)

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 6  // RGBA

  const rows = []
  for (let y = 0; y < size; y++) {
    rows.push(0) // filter byte
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      rows.push(pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3])
    }
  }

  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(Buffer.from(rows))),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

function setPixel(pixels, size, x, y, r, g, b, a = 255) {
  if (x < 0 || x >= size || y < 0 || y >= size) return
  const i = (Math.round(y) * size + Math.round(x)) * 4
  pixels[i] = r; pixels[i + 1] = g; pixels[i + 2] = b; pixels[i + 3] = a
}

function thickLine(pixels, size, x1, y1, x2, y2, r, g, b, w) {
  const dx = x2 - x1, dy = y2 - y1
  const steps = Math.ceil(Math.hypot(dx, dy) * 2)
  for (let s = 0; s <= steps; s++) {
    const px = x1 + dx * s / steps
    const py = y1 + dy * s / steps
    for (let ty = -w; ty <= w; ty++)
      for (let tx = -w; tx <= w; tx++)
        if (tx * tx + ty * ty <= w * w)
          setPixel(pixels, size, px + tx, py + ty, r, g, b)
  }
}

function drawIcon(pixels, size) {
  const cx = size / 2, cy = size / 2
  const cr = size * 0.22  // corner radius

  // Background with rounded corners
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const inTL = x < cr && y < cr && Math.hypot(x - cr, y - cr) > cr
      const inTR = x > size - cr && y < cr && Math.hypot(x - (size - cr), y - cr) > cr
      const inBL = x < cr && y > size - cr && Math.hypot(x - cr, y - (size - cr)) > cr
      const inBR = x > size - cr && y > size - cr && Math.hypot(x - (size - cr), y - (size - cr)) > cr
      const i = (y * size + x) * 4
      if (inTL || inTR || inBL || inBR) {
        pixels[i + 3] = 0
      } else {
        pixels[i] = 15; pixels[i + 1] = 15; pixels[i + 2] = 15; pixels[i + 3] = 255
      }
    }
  }

  // Clock ring
  const ring = size * 0.32
  const lw = size * 0.05
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - cx, y - cy)
      const i = (y * size + x) * 4
      if (pixels[i + 3] === 0) continue
      if (d >= ring - lw / 2 && d <= ring + lw / 2) {
        pixels[i] = 255; pixels[i + 1] = 255; pixels[i + 2] = 255; pixels[i + 3] = 255
      }
    }
  }

  // Minute hand → 12 o'clock
  const hw = Math.max(2, Math.round(size * 0.032))
  thickLine(pixels, size, cx, cy, cx, cy - ring * 0.68, 255, 255, 255, hw)
  // Hour hand → 3 o'clock
  thickLine(pixels, size, cx, cy, cx + ring * 0.5, cy, 255, 255, 255, hw)

  // Center dot (accent color)
  const dot = hw * 1.6
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      if (pixels[i + 3] === 0) continue
      if (Math.hypot(x - cx, y - cy) <= dot) {
        pixels[i] = 100; pixels[i + 1] = 108; pixels[i + 2] = 255; pixels[i + 3] = 255
      }
    }
}

const publicDir = path.join(__dirname, '..', 'public')
fs.mkdirSync(publicDir, { recursive: true })

for (const size of [192, 512]) {
  fs.writeFileSync(path.join(publicDir, `icon-${size}.png`), makePNG(size, drawIcon))
  console.log(`icon-${size}.png`)
}
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), makePNG(180, drawIcon))
console.log('apple-touch-icon.png')
