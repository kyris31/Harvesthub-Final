import { migrate } from 'drizzle-orm/neon-http/migrator'
import * as path from 'path'
import * as fs from 'fs'

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
    console.log('Running migrations...')
    console.log('Env loaded. DATABASE_URL:', process.env.DATABASE_URL ? 'Defined' : 'Undefined')

    // Dynamically import db after env vars are loaded
    console.log('Importing db...')
    const { db } = await import('./lib/db/index')
    console.log('db imported.')

    console.log('Starting migration...')
    await migrate(db, { migrationsFolder: 'drizzle' })
    console.log('Migrations completed successfully')
  } catch (error: any) {
    console.error('Error running migrations:', error)
    fs.writeFileSync(
      'migration-error.log',
      JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
    )
    process.exit(1)
  }
  process.exit(0)
}

main()
