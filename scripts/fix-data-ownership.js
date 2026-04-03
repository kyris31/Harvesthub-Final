const { config } = require('dotenv')
const { resolve } = require('path')
const { neon } = require('@neondatabase/serverless')

// Load env vars
config({ path: resolve(process.cwd(), '.env.local') })

const sql = neon(process.env.DATABASE_URL)

async function checkAndReseed() {
  console.log('🔍 Checking current user...')

  // Get all users to see what we have
  const allUsers = await sql`SELECT id, name, email FROM users`
  console.log(`\nFound ${allUsers.length} user(s) in database:`)
  allUsers.forEach((u) => console.log(`  - ${u.name} (${u.email}) - ID: ${u.id}`))

  // Get crops to see which user they belong to
  const allCrops = await sql`SELECT user_id, COUNT(*) as count FROM crops GROUP BY user_id`
  console.log(`\nCrop ownership:`)
  allCrops.forEach((c) => console.log(`  - User ${c.user_id}: ${c.count} crops`))

  // Check if there's a mismatch
  if (allUsers.length > 0 && allCrops.length > 0) {
    const currentUserId = allUsers[0].id
    const cropOwnerId = allCrops[0].user_id

    if (currentUserId !== cropOwnerId) {
      console.log(`\n⚠️  MISMATCH DETECTED!`)
      console.log(`   Current user: ${currentUserId}`)
      console.log(`   Data owner: ${cropOwnerId}`)
      console.log(`\n🔧 Fixing: Updating all data to belong to current user...`)

      // Update all tables to use the current user ID
      await sql`UPDATE crops SET user_id = ${currentUserId} WHERE user_id = ${cropOwnerId}`
      await sql`UPDATE plots SET user_id = ${currentUserId} WHERE user_id = ${cropOwnerId}`
      await sql`UPDATE planting_logs SET user_id = ${currentUserId} WHERE user_id = ${cropOwnerId}`
      await sql`UPDATE harvest_logs SET user_id = ${currentUserId} WHERE user_id = ${cropOwnerId}`
      await sql`UPDATE input_inventory SET user_id = ${currentUserId} WHERE user_id = ${cropOwnerId}`
      await sql`UPDATE customers SET user_id = ${currentUserId} WHERE user_id = ${cropOwnerId}`
      await sql`UPDATE sales SET user_id = ${currentUserId} WHERE user_id = ${cropOwnerId}`

      console.log(`✅ Fixed! All data now belongs to ${allUsers[0].name}`)
    } else {
      console.log(`\n✅ Data ownership is correct!`)
    }
  }

  console.log(`\n🎉 Done! Refresh your dashboard to see the data.`)
  process.exit(0)
}

checkAndReseed().catch((error) => {
  console.error('❌ Failed:', error)
  console.error(error.stack)
  process.exit(1)
})
