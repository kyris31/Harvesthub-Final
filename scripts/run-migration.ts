import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'
import * as path from 'path'

// Load env vars manually
const envPath = path.resolve(process.cwd(), '.env.local')
try {
  let envFile = fs.readFileSync(envPath, 'utf8')
  // Handle BOM
  if (envFile.charCodeAt(0) === 0xfeff) {
    envFile = envFile.slice(1)
  }

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
} catch (e) {
  console.warn('Could not load .env.local', e)
}

async function main() {
  try {
    console.log('Running manual migration...')

    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not defined')
    }

    const sql = neon(process.env.DATABASE_URL)

    // Read and execute the migration file
    const migrationPath = path.join(process.cwd(), 'drizzle', '0001_past_switch.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    console.log('Executing migration:', migrationSQL)
    await sql.unsafe(migrationSQL)

    console.log('Migration completed successfully!')
  } catch (error: any) {
    console.error('Error running migration:', error)
    process.exit(1)
  }
  process.exit(0)
}

main()
