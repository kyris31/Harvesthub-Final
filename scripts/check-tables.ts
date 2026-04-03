import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { sql } from 'drizzle-orm'

async function main() {
  console.log('Checking database tables...')
  const { db } = await import('../src/lib/db')
  try {
    const result = await db.execute(sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `)
    console.log(
      'Tables found:',
      result.rows.map((row: any) => row.table_name)
    )
  } catch (error: any) {
    console.error('Failed to list tables:', error)
  }
}

main()
