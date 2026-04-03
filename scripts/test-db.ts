import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { db } from '../src/lib/db'

async function main() {
  console.log('Testing DB connection...')
  try {
    const result = await db.execute('SELECT 1')
    console.log('DB Connection successful:', result)
  } catch (error: any) {
    console.error('DB Connection failed:', error)
  }
}

main()
