import fs from 'fs'
import path from 'path'

const envPath = path.resolve(process.cwd(), '.env.local')
console.log('Reading:', envPath)

try {
  const content = fs.readFileSync(envPath, 'utf8')
  console.log('Content:')
  console.log(content)
} catch (e) {
  console.error(e)
}
