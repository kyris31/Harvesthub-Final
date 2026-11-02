// Applies drizzle/0016_planting_status_changed_date.sql against DATABASE_URL.
// Usage: node scripts/apply-planting-status-date.cjs
const { neon } = require('@neondatabase/serverless')
const fs = require('fs')
const path = require('path')

// Load env vars from .env.local (handles BOM + quoted values)
const envPath = path.resolve(process.cwd(), '.env.local')
try {
  let envFile = fs.readFileSync(envPath, 'utf8')
  if (envFile.charCodeAt(0) === 0xfeff) envFile = envFile.slice(1)
  for (const line of envFile.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const match = trimmed.match(/^([^=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      let value = match[2].trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      process.env[key] = value
    }
  }
  console.log('Environment loaded')
} catch (e) {
  console.warn('Could not load .env.local', e)
}

async function main() {
  try {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not defined')
    const sql = neon(process.env.DATABASE_URL)
    const file = path.resolve(process.cwd(), 'drizzle', '0016_planting_status_changed_date.sql')
    const migrationSQL = fs.readFileSync(file, 'utf8')
    console.log('Executing migration from', file)
    // The HTTP driver runs one statement per call.
    const statements = migrationSQL
      .split(/;\s*(?:\r?\n|$)/)
      .map((s) => s.trim())
      .filter((s) => s.replace(/--.*$/gm, '').trim().length > 0)
    for (const statement of statements) {
      await sql.query(statement)
    }
    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Error running migration:', error)
    process.exit(1)
  }
  process.exit(0)
}

main()
