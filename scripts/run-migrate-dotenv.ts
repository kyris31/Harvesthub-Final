import { execSync } from 'child_process'

// Escape the URL for command line
import fs from 'fs'
import path from 'path'

// Load env vars manually
const envPath = path.resolve(process.cwd(), '.env.local')
let envFile = fs.readFileSync(envPath, 'utf8')
if (envFile.charCodeAt(0) === 0xfeff) envFile = envFile.slice(1)

const lines = envFile.split(/\r?\n/)
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
    process.env[key] = value
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined')
}
const url = process.env.DATABASE_URL.replace(/"/g, '\\"')

try {
  console.log('Running drizzle-kit migrate...')
  // Use cross-env to set the variable explicitly for the child process
  execSync(`npx cross-env DATABASE_URL="${url}" drizzle-kit migrate`, {
    stdio: 'inherit',
  })
} catch (e: any) {
  console.error('Migration failed:', e.message)
  process.exit(1)
}
