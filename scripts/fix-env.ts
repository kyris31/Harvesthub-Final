import fs from 'fs'
import path from 'path'

const envPath = path.resolve(process.cwd(), '.env.local')
console.log('Reading:', envPath)

try {
  let content = fs.readFileSync(envPath, 'utf8')
  // Replace \r\n with \n, then \r with \n
  content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  fs.writeFileSync(envPath, content, 'utf8')
  console.log('Normalized line endings to LF')
} catch (e) {
  console.error(e)
}
