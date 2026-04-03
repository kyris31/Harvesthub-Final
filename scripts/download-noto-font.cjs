/**
 * Downloads Noto Sans TTF (with Greek support) from Google Fonts GitHub repo.
 * Run once: node scripts/download-noto-font.cjs
 */
const https = require('https')
const fs = require('fs')
const path = require('path')

const OUT_DIR = path.join(__dirname, '..', 'public', 'fonts')

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'node' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return httpsGet(res.headers.location).then(resolve).catch(reject)
      }
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }))
    }).on('error', reject)
  })
}

const FONTS = [
  {
    label: 'NotoSans-Regular',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosans/NotoSans%5Bwdth%2Cwght%5D.ttf',
  },
]

async function run() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

  for (const font of FONTS) {
    const outPath = path.join(OUT_DIR, `${font.label}.ttf`)
    console.log(`Downloading ${font.label}...`)
    const { status, body } = await httpsGet(font.url)
    if (status !== 200) {
      console.error(`  HTTP ${status}`)
      process.exit(1)
    }
    fs.writeFileSync(outPath, body)
    console.log(`  Saved (${(body.length / 1024).toFixed(1)} KB) → ${outPath}`)
  }
  console.log('Done.')
}

run().catch((e) => { console.error(e); process.exit(1) })
