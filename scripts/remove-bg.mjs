import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const inputPath  = path.join(__dirname, '..', 'public', 'jar.png')
const outputPath = path.join(__dirname, '..', 'public', 'jar.png')
const sharp = (await import('sharp')).default

const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const { width, height, channels } = info
const px = new Uint8ClampedArray(data)

// Background = near-achromatic (low color saturation) AND reachable from any edge.
// The checkerboard uses ~rgb(197,197,197) gray squares. We also cover very dark squares.
const isBg = (r, g, b, a) => {
  if (a < 10) return true                         // already transparent
  const lo = Math.min(r, g, b)
  const hi = Math.max(r, g, b)
  const sat = hi - lo                             // colour saturation
  if (sat > 30) return false                      // clearly coloured → keep
  // Achromatic pixel — accept if light or dark (both checkerboard shades)
  return hi > 170 || lo < 80                      // light gray OR dark gray/black
}

// BFS from all four edges
const visited = new Uint8Array(width * height)
const qx = new Int32Array(width * height * 2)
const qy = new Int32Array(width * height * 2)
let head = 0, tail = 0

const enqueue = (x, y) => {
  if (x < 0 || x >= width || y < 0 || y >= height) return
  const i = y * width + x
  if (visited[i]) return
  const p = i * channels
  if (!isBg(px[p], px[p+1], px[p+2], px[p+3])) return
  visited[i] = 1
  qx[tail] = x; qy[tail] = y; tail++
}

for (let x = 0; x < width;  x++) { enqueue(x, 0); enqueue(x, height - 1) }
for (let y = 0; y < height; y++) { enqueue(0, y); enqueue(width - 1, y) }

while (head < tail) {
  const x = qx[head], y = qy[head]; head++
  const p = (y * width + x) * channels
  px[p] = px[p+1] = px[p+2] = px[p+3] = 0
  enqueue(x-1, y); enqueue(x+1, y); enqueue(x, y-1); enqueue(x, y+1)
}

// Pass 2: clean up stray edge pixels adjacent to transparent area
for (let iter = 0; iter < 3; iter++) {
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const p = (y * width + x) * channels
      if (px[p+3] === 0) continue
      if (!isBg(px[p], px[p+1], px[p+2], px[p+3])) continue
      const hasTransNeighbour =
        px[((y  )*width+(x-1))*channels+3] === 0 ||
        px[((y  )*width+(x+1))*channels+3] === 0 ||
        px[((y-1)*width+x  )*channels+3] === 0 ||
        px[((y+1)*width+x  )*channels+3] === 0
      if (hasTransNeighbour) px[p] = px[p+1] = px[p+2] = px[p+3] = 0
    }
  }
}

await sharp(Buffer.from(px.buffer), { raw: { width, height, channels } })
  .png({ compressionLevel: 9 })
  .toFile(outputPath)

console.log(`Done — ${width}×${height} saved.`)
