import { config } from 'dotenv'
import { resolve } from 'path'
import { neon } from '@neondatabase/serverless'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

async function migrateOrganicStatus() {
  console.log('🚀 Database Migration Script')
  console.log('━'.repeat(60))
  console.log('Loading environment variables from .env.local...\n')

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set!')
    console.log('\nChecked file: .env.local')
    console.log('\nPlease ensure your .env.local file contains:')
    console.log('DATABASE_URL=your_neon_postgres_connection_string\n')
    process.exit(1)
  }

  console.log('✓ DATABASE_URL found\n')
  const sql = neon(process.env.DATABASE_URL)

  console.log('Starting migration: Converting organic_certified from boolean to text...\n')

  try {
    // Step 1: Add a temporary column
    console.log('[1/4] Adding temporary TEXT column...')
    await sql`
      ALTER TABLE seed_batches 
      ADD COLUMN IF NOT EXISTS organic_certified_temp TEXT
    `
    console.log('      ✓ Added organic_certified_temp\n')

    // Step 2: Copy data with conversion
    console.log('[2/4] Migrating existing data...')
    await sql`
      UPDATE seed_batches 
      SET organic_certified_temp = CASE 
        WHEN organic_certified = true THEN 'certified'
        WHEN organic_certified = false THEN ''
        ELSE ''
      END
    `
    console.log('      ✓ Converted boolean values to text\n')

    // Step 3: Drop the old boolean column
    console.log('[3/4] Dropping old boolean column...')
    await sql`
      ALTER TABLE seed_batches 
      DROP COLUMN organic_certified
    `
    console.log('      ✓ Removed organic_certified (boolean)\n')

    // Step 4: Rename temp column
    console.log('[4/4] Renaming temp column...')
    await sql`
      ALTER TABLE seed_batches 
      RENAME COLUMN organic_certified_temp TO organic_certified
    `
    console.log('      ✓ Column renamed to organic_certified (text)\n')

    console.log('━'.repeat(60))
    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY!\n')
    console.log('The organic_certified column now accepts these values:')
    console.log('  • "certified"     → Certified Organic')
    console.log('  • "organic"       → Organic (Not Certified)')
    console.log('  • "untreated"     → Untreated')
    console.log('  • "conventional"  → Conventional')
    console.log('  • "unknown"       → Unknown')
    console.log('  • ""              → Not specified\n')
    console.log('Your form should now work perfectly! 🎉')
    console.log('━'.repeat(60))

    process.exit(0)
  } catch (error: any) {
    console.error('\n━'.repeat(60))
    console.error('❌ MIGRATION FAILED!\n')
    console.error('Error:', error.message)
    if (error.code) {
      console.error('Error code:', error.code)
    }
    console.error('\nFull error details:')
    console.error(error)
    console.error('━'.repeat(60))
    process.exit(1)
  }
}

migrateOrganicStatus()
