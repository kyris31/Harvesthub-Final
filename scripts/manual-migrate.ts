import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { sql } from 'drizzle-orm'

async function main() {
  console.log('Running manual migration...')
  const { db } = await import('../src/lib/db')

  // Optional CLI arg: the migration filename inside drizzle/ to run.
  const fileArg = process.argv[2] || '0000_fair_cobalt_man.sql'
  const migrationFile = path.resolve(process.cwd(), 'drizzle', fileArg)
  console.log(`Reading migration file: ${migrationFile}`)

  try {
    const sqlContent = fs.readFileSync(migrationFile, 'utf8')
    console.log('Executing SQL...')

    const statements = sqlContent.split('--> statement-breakpoint')
    console.log(`Found ${statements.length} statements to execute.`)

    for (const statement of statements) {
      const trimmed = statement.trim()
      if (trimmed) {
        console.log('Executing statement...')
        await db.execute(sql.raw(trimmed))
      }
    }

    console.log('Migration executed successfully.')
  } catch (error: any) {
    console.error('Failed to execute migration:', error)
    if (error.cause) console.error('Cause:', error.cause)
    console.error('Stack:', error.stack)
    process.exit(1)
  }
}

main()
