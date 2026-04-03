import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function main() {
  console.log('Testing manual user creation...')
  const { db } = await import('../src/lib/db')
  const { users } = await import('../src/lib/db/schema')
  try {
    const newUser = await db
      .insert(users)
      .values({
        id: 'manual-test-id-123',
        name: 'Manual Test User',
        email: 'manual-test@example.com',
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()
    console.log('User created successfully:', newUser)
  } catch (error: any) {
    console.error('Failed to create user:', error)
  }
}

main()
