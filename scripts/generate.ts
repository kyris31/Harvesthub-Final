import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const envPath = path.resolve(process.cwd(), '.env.local')
console.log('Loading env from:', envPath)

let envFile = fs.readFileSync(envPath, 'utf8')
if (envFile.charCodeAt(0) === 0xfeff) envFile = envFile.slice(1)

const lines = envFile.split(/\r?\n/)
const env = { ...process.env }

for (const line of lines) {
  const trimmedLine = line.trim()
  if (!trimmedLine || trimmedLine.startsWith('#')) continue
  const match = trimmedLine.match(/^([^=]+)=(.*)$/)
  if (match) {
    const key = match[1]!.trim()
    let value = match[2]!.trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
}

console.log('DATABASE_URL found:', !!env.DATABASE_URL)

try {
  execSync('npx drizzle-kit generate', {
    stdio: 'inherit',
    env: env,
  })
} catch (e: any) {
  console.error('Migration generation failed')
  process.exit(1)
}
