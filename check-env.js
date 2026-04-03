const dotenv = require('dotenv')
const path = require('path')

const envPath = path.resolve(process.cwd(), '.env.local')
console.log('Loading env from:', envPath)

const result = dotenv.config({ path: envPath })

if (result.error) {
  console.error('Error loading .env.local:', result.error)
} else {
  console.log('Dotenv parsed:', result.parsed)
}

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Defined' : 'Undefined')
