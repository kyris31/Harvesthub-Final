import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const envPath = path.resolve(process.cwd(), '.env.local')
console.log('Loading env from:', envPath)

let envFile = fs.readFileSync(envPath, 'utf8')
// Handle BOM
if (envFile.charCodeAt(0) === 0xfeff) {
  envFile = envFile.slice(1)
}

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
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing from env object')
  }

  console.log('Running drizzle-kit migrate with env vars...')

  // Pass the environment variables directly to the child process
  execSync('npx drizzle-kit migrate', {
    stdio: 'inherit',
    env: env,
  })
} catch (e: any) {
  console.error('Migration failed:', e.message)
  process.exit(1)
}
