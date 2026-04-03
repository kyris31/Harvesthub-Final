import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const sql = neon(process.env.DATABASE_URL!)

async function createInvoiceTables() {
  console.log('Creating supplier invoice tables...')

  try {
    // Create supplier_invoices table
    await sql`
            CREATE TABLE IF NOT EXISTS supplier_invoices (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
                invoice_number TEXT NOT NULL,
                invoice_date DATE NOT NULL,
                due_date DATE,
                status TEXT NOT NULL DEFAULT 'draft',
                subtotal DECIMAL(10, 2),
                tax_amount DECIMAL(10, 2),
                total_amount DECIMAL(10, 2) NOT NULL,
                notes TEXT,
                created_at TIMESTAMP DEFAULT NOW() NOT NULL,
                updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
                deleted_at TIMESTAMP
            )
        `
    console.log('✅ Created supplier_invoices table')

    // Create supplier_invoice_items table
    await sql`
            CREATE TABLE IF NOT EXISTS supplier_invoice_items (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                invoice_id UUID NOT NULL REFERENCES supplier_invoices(id) ON DELETE CASCADE,
                description TEXT NOT NULL,
                quantity DECIMAL(10, 2) NOT NULL,
                unit TEXT NOT NULL,
                price_per_unit DECIMAL(10, 2) NOT NULL,
                line_total DECIMAL(10, 2) NOT NULL,
                category TEXT,
                created_inventory_id UUID,
                notes TEXT,
                created_at TIMESTAMP DEFAULT NOW() NOT NULL,
                updated_at TIMESTAMP DEFAULT NOW() NOT NULL
            )
        `
    console.log('✅ Created supplier_invoice_items table')

    console.log('\n✅ All invoice tables created successfully!')
    console.log('\nYou can now:')
    console.log('1. Navigate to /dashboard/invoices')
    console.log('2. Create a new invoice')
    console.log('3. Process it to auto-create inventory')
  } catch (error) {
    console.error('❌ Error creating tables:', error)
    throw error
  }
}

createInvoiceTables()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
