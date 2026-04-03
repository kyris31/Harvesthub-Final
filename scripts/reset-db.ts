import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { sql } from 'drizzle-orm'

async function main() {
  console.log('Resetting database...')
  const { db } = await import('../src/lib/db')
  try {
    await db.execute(sql`DROP SCHEMA IF EXISTS public CASCADE`)
    await db.execute(sql`CREATE SCHEMA public`)

    const result = await db.execute(
      sql`SELECT count(*) as count FROM information_schema.tables WHERE table_schema = 'public'`
    )
    console.log('Tables in public schema after reset:', result.rows[0])

    console.log('Database reset successfully.')
  } catch (error: any) {
    console.error('Failed to reset database:', error)
    process.exit(1)
  }
}

main()
