import { config } from 'dotenv'
import { resolve } from 'path'
import { neon } from '@neondatabase/serverless'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

async function migratePlantingLogs() {
  console.log('🚀 Database Migration Script')
  console.log('━'.repeat(60))
  console.log('Loading environment variables from .env.local...\n')

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set!')
    console.log('\nChecked file: .env.local')
    process.exit(1)
  }

  console.log('✓ DATABASE_URL found\n')
  const sql = neon(process.env.DATABASE_URL)

  console.log('Starting migration: Adding planting source fields...\n')

  try {
    // Step 1: Add planting_source column with default value
    console.log('[1/2] Adding planting_source column...')
    await sql`
      ALTER TABLE planting_logs 
      ADD COLUMN IF NOT EXISTS planting_source TEXT DEFAULT 'direct_sow'
    `
    console.log('      ✓ Added planting_source column\n')

    // Step 2: Add self_produced_seedling_id column
    console.log('[2/2] Adding self_produced_seedling_id column...')
    await sql`
      ALTER TABLE planting_logs 
      ADD COLUMN IF NOT EXISTS self_produced_seedling_id UUID
    `
    console.log('      ✓ Added self_produced_seedling_id column\n')

    // Step 3: Add foreign key constraint
    console.log('[3/3] Adding foreign key constraint...')
    await sql`
      ALTER TABLE planting_logs 
      ADD CONSTRAINT fk_self_produced_seedling
      FOREIGN KEY (self_produced_seedling_id) 
      REFERENCES seedling_production_logs(id) 
      ON DELETE SET NULL
    `
    console.log('      ✓ Added foreign key constraint\n')

    // Step 4: Make planting_source NOT NULL (after setting default)
    console.log('[4/4] Making planting_source NOT NULL...')
    await sql`
      ALTER TABLE planting_logs 
      ALTER COLUMN planting_source SET NOT NULL
    `
    console.log('      ✓ Column planting_source is now NOT NULL\n')

    console.log('━'.repeat(60))
    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY!\n')
    console.log('Planting logs now support:')
    console.log('  • planting_source → "direct_sow" | "self_produced" | "purchased"')
    console.log('  • self_produced_seedling_id → References seedling_production_logs\n')
    console.log('Your planting form can now track planting sources! 🎉')
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

migratePlantingLogs()
