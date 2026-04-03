const { config } = require('dotenv')
const { resolve } = require('path')
const { neon } = require('@neondatabase/serverless')

// Load env vars
config({ path: resolve(process.cwd(), '.env.local') })

const sql = neon(process.env.DATABASE_URL)

async function seed() {
  console.log('🌱 Starting database seed...')

  // Get the first user
  const users = await sql`SELECT id, name, email FROM users LIMIT 1`

  if (!users || users.length === 0) {
    console.error('❌ No user found. Please create an account at /signup first.')
    process.exit(1)
  }

  const user = users[0]
  const userId = user.id
  console.log(`✅ Found user: ${user.name} (${user.email})`)

  // 1. Create crops
  console.log('\n📦 Creating crops...')
  const crops = await sql`
    INSERT INTO crops (user_id, name, variety, category, description)
    VALUES 
      (${userId}, 'Tomato', 'Cherry', 'vegetable', 'Sweet cherry tomatoes'),
      (${userId}, 'Lettuce', 'Romaine', 'vegetable', 'Crispy romaine lettuce'),
      (${userId}, 'Carrot', 'Nantes', 'vegetable', 'Orange sweet carrots'),
      (${userId}, 'Basil', 'Sweet Basil', 'herb', 'Fragrant Italian basil')
    RETURNING id, name
  `
  console.log(`✅ Created ${crops.length} crops`)

  // 2. Create plot
  console.log('\n🏡 Creating plot...')
  const plots = await sql`
    INSERT INTO plots (user_id, name, description, area_sqm, status)
    VALUES (${userId}, 'Main Garden', 'Primary vegetable garden', 50, 'in_use')
    RETURNING id, name
  `
  const plotId = plots[0].id
  console.log(`✅ Created plot: ${plots[0].name}`)

  // 3. Create inventory
  console.log('\n🧪 Creating inventory items...')
  await sql`
    INSERT INTO input_inventory (user_id, name, type, current_quantity, quantity_unit, minimum_stock_level, cost_per_unit, total_cost)
    VALUES 
      (${userId}, 'Organic Fertilizer', 'fertilizer', 5, 'kg', 10, 15.50, 77.50),
      (${userId}, 'Neem Oil Pesticide', 'pesticide', 2, 'L', 1, 25.00, 50.00)
  `
  console.log('✅ Created 2 inventory items (1 low stock)')

  // 4. Create plantings
  console.log('\n🌱 Creating plantings...')
  const today = new Date()
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  const fiveDaysAhead = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000)

  const plantings = await sql`
    INSERT INTO planting_logs (user_id, crop_id, plot_id, planting_date, quantity_planted, quantity_unit, expected_harvest_date, status, notes)
    VALUES 
      (${userId}, ${crops[0].id}, ${plotId}, ${monthAgo.toISOString().split('T')[0]}, 50, 'plants', ${weekAgo.toISOString().split('T')[0]}, 'active', 'Planted in rows, 30cm spacing'),
      (${userId}, ${crops[1].id}, ${plotId}, ${twoWeeksAgo.toISOString().split('T')[0]}, 100, 'plants', ${fiveDaysAhead.toISOString().split('T')[0]}, 'active', 'Succession planting'),
      (${userId}, ${crops[2].id}, ${plotId}, ${weekAgo.toISOString().split('T')[0]}, 200, 'seeds', ${fiveDaysAhead.toISOString().split('T')[0]}, 'active', NULL),
      (${userId}, ${crops[3].id}, ${plotId}, ${twoWeeksAgo.toISOString().split('T')[0]}, 30, 'plants', ${today.toISOString().split('T')[0]}, 'active', NULL)
    RETURNING id
  `
  console.log('✅ Created 4 plantings (1 upcoming harvest)')

  // 5. Create harvests
  console.log('\n🧺 Creating harvests...')
  const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)
  const harvests = await sql`
    INSERT INTO harvest_logs (user_id, planting_log_id, harvest_date, quantity_harvested, quantity_unit, current_stock, quality_grade, notes)
    VALUES 
      (${userId}, ${plantings[0].id}, ${weekAgo.toISOString().split('T')[0]}, 15, 'kg', 12, 'A', 'Beautiful red tomatoes'),
      (${userId}, ${plantings[1].id}, ${twoDaysAgo.toISOString().split('T')[0]}, 8, 'kg', 5, 'Premium', 'Fresh crispy lettuce')
    RETURNING id
  `
  console.log('✅ Created 2 harvests')

  // 6. Create customer
  console.log('\n👥 Creating customer...')
  const customers = await sql`
    INSERT INTO customers (user_id, name, customer_type, email, phone, notes)
    VALUES (${userId}, 'Green Market', 'business', 'orders@greenmarket.com', '+1-555-0123', 'Weekly orders, payment on delivery')
    RETURNING id, name
  `
  console.log(`✅ Created customer: ${customers[0].name}`)

  // 7. Create sales
  console.log('\n💰 Creating sales...')
  const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000)

  const sales = await sql`
    INSERT INTO sales (user_id, customer_id, sale_date, total_amount, payment_status, payment_method, amount_paid, notes)
    VALUES 
      (${userId}, ${customers[0].id}, ${threeDaysAgo.toISOString().split('T')[0]}, 27.00, 'paid', 'bank_transfer', 27.00, 'Weekly order'),
      (${userId}, ${customers[0].id}, ${today.toISOString().split('T')[0]}, 10.00, 'pending', 'cash', 0, 'Pending payment')
    RETURNING id
  `

  await sql`
    INSERT INTO sale_items (sale_id, harvest_log_id, product_name, quantity, unit, unit_price, subtotal)
    VALUES 
      (${sales[0].id}, ${harvests[0].id}, 'Cherry Tomatoes', 3, 'kg', 5.00, 15.00),
      (${sales[0].id}, ${harvests[1].id}, 'Romaine Lettuce', 3, 'kg', 4.00, 12.00),
      (${sales[1].id}, ${harvests[0].id}, 'Cherry Tomatoes', 2, 'kg', 5.00, 10.00)
  `
  console.log('✅ Created 2 sales (1 pending)')

  console.log('\n✨ Database seeded successfully!')
  console.log('\n📊 Summary:')
  console.log('  - 4 crops (Tomato, Lettuce, Carrot, Basil)')
  console.log('  - 1 plot (Main Garden)')
  console.log('  - 2 inventory items (1 low stock alert)')
  console.log('  - 4 active plantings (1 harvest upcoming in 5 days)')
  console.log('  - 2 harvests with stock available')
  console.log('  - 1 customer (Green Market)')
  console.log('  - 2 sales ($37 total, 1 pending)')
  console.log('\n🎉 Visit http://localhost:3000/dashboard to see the data!')

  process.exit(0)
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error)
  console.error(error.stack)
  process.exit(1)
})
