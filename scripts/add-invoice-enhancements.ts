import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const sql = neon(process.env.DATABASE_URL!)

async function addInvoiceEnhancements() {
  console.log('Adding Invoice Enhancement Fields...\n')

  try {
    // Add new columns to supplier_invoices
    console.log('1. Adding tax, shipping, discount, and payment fields to supplier_invoices...')
    await sql`
            ALTER TABLE supplier_invoices
            ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5, 2),
            ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10, 2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid',
            ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10, 2) DEFAULT 0
        `
    console.log('✅ Added fields to supplier_invoices\n')

    // Add discount fields to supplier_invoice_items
    console.log('2. Adding discount fields to supplier_invoice_items...')
    await sql`
            ALTER TABLE supplier_invoice_items
            ADD COLUMN IF NOT EXISTS discount_type TEXT,
            ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10, 2),
            ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0
        `
    console.log('✅ Added discount fields to supplier_invoice_items\n')

    // Create invoice_payments table
    console.log('3. Creating invoice_payments table...')
    await sql`
            CREATE TABLE IF NOT EXISTS invoice_payments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                invoice_id UUID NOT NULL REFERENCES supplier_invoices(id) ON DELETE CASCADE,
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                payment_date DATE NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                payment_method TEXT,
                reference_number TEXT,
                notes TEXT,
                created_at TIMESTAMP DEFAULT NOW() NOT NULL,
                updated_at TIMESTAMP DEFAULT NOW() NOT NULL
            )
        `
    console.log('✅ Created invoice_payments table\n')

    // Create invoice_audit_log table
    console.log('4. Creating invoice_audit_log table...')
    await sql`
            CREATE TABLE IF NOT EXISTS invoice_audit_log (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                invoice_id UUID NOT NULL REFERENCES supplier_invoices(id) ON DELETE CASCADE,
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                action TEXT NOT NULL,
                changes TEXT,
                timestamp TIMESTAMP DEFAULT NOW() NOT NULL
            )
        `
    console.log('✅ Created invoice_audit_log table\n')

    console.log('🎉 All invoice enhancements added successfully!\n')
    console.log('Summary:')
    console.log('- Tax rate and amount tracking')
    console.log('- Shipping costs')
    console.log('- Invoice and line-item discounts')
    console.log('- Payment status and tracking')
    console.log('- Payment history table')
    console.log('- Audit log for changes')
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  }
}

addInvoiceEnhancements()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
