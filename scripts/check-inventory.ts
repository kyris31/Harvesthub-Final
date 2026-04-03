import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const sql = neon(process.env.DATABASE_URL!)

async function checkInventoryData() {
  console.log('Checking input_inventory table...\n')

  try {
    const inventory =
      await sql`SELECT id, name, type, current_quantity, quantity_unit, user_id FROM input_inventory WHERE deleted_at IS NULL`

    console.log(`Found ${inventory.length} inventory items:\n`)
    inventory.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name}`)
      console.log(`   Type: ${item.type}`)
      console.log(`   Stock: ${item.current_quantity} ${item.quantity_unit}`)
      console.log(`   User ID: ${item.user_id}`)
      console.log('')
    })

    if (inventory.length === 0) {
      console.log('⚠️  No inventory items found!')
      console.log("\nLet's check the invoice items...\n")

      const invoiceItems =
        await sql`SELECT id, description, quantity, unit, created_inventory_id FROM supplier_invoice_items`
      console.log(`Found ${invoiceItems.length} invoice items:`)
      invoiceItems.forEach((item, index) => {
        console.log(`${index + 1}. ${item.description} - ${item.quantity} ${item.unit}`)
        console.log(`   Created Inventory ID: ${item.created_inventory_id || 'NOT SET'}`)
      })
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

checkInventoryData()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
