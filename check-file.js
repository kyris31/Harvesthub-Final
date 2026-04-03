const fs = require('fs')
try {
  const stats = fs.statSync('.env.local')
  console.log('Size:', stats.size)
  const content = fs.readFileSync('.env.local', 'utf8')
  console.log('Content length:', content.length)
  console.log('First 50 chars:', content.substring(0, 50))
} catch (e) {
  console.error(e)
}
