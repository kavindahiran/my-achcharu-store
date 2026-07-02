import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const inputPath = path.join(__dirname, '..', 'public', 'jar.png')
const sharp = (await import('sharp')).default

const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const { width, height, channels } = info
const px = new Uint8ClampedArray(data)

const colorMap = new Map()
const border = 8
const addSample = (x, y) => {
  const p = (y * width + x) * channels
  const a = px[p+3]
  if (a < 10) return   // already transparent, skip
  const r = px[p], g = px[p+1], b = px[p+2]
  const key = `rgb(${r},${g},${b})`
  colorMap.set(key, (colorMap.get(key) || 0) + 1)
}

for (let x = 0; x < width; x++) {
  for (let y = 0; y < border; y++) { addSample(x, y); addSample(x, height-1-y) }
}
for (let y = border; y < height - border; y++) {
  for (let x = 0; x < border; x++) { addSample(x, y); addSample(width-1-x, y) }
}

const sorted = [...colorMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
console.log('Top remaining opaque border pixels:')
sorted.forEach(([color, count]) => console.log(` ${count.toString().padStart(6)}×  ${color}`))
