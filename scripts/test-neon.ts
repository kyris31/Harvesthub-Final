import { neon } from '@neondatabase/serverless'
import * as path from 'path'
import * as fs from 'fs'

// Load env vars manually
const envPath = path.resolve(process.cwd(), '.env.local')
try {
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
} catch (e) {
  console.error(e)
}

async function main() {
  console.log('Testing connection...')
  console.log('URL:', process.env.DATABASE_URL ? 'Defined' : 'Undefined')

  try {
    const sql = neon(process.env.DATABASE_URL!)
    const result = await sql`SELECT 1 as val`
    console.log('Connection successful:', result)
  } catch (e: any) {
    console.error('Connection failed message:', e.message)
    console.error('Connection failed stack:', e.stack)
  }
}

main()
