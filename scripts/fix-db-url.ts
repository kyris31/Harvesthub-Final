import fs from 'fs'
import path from 'path'

const envPath = path.resolve(process.cwd(), '.env.local')
console.log('Reading:', envPath)

try {
  let content = fs.readFileSync(envPath, 'utf8')

  // Regex to find DATABASE_URL line and extract the postgresql:// part
  // It handles cases where it might be wrapped in psql '...'
  const regex = /DATABASE_URL=["']?psql\s+'?(postgresql:\/\/[^']+)['"]?/

  if (regex.test(content)) {
    console.log('Found malformed DATABASE_URL with psql prefix')
    content = content.replace(regex, 'DATABASE_URL="$1"')
    fs.writeFileSync(envPath, content, 'utf8')
    console.log('Fixed DATABASE_URL in .env.local')
  } else {
    console.log('No psql prefix found in DATABASE_URL')
    // Check if it's just wrapped in quotes but correct
    const simpleRegex = /DATABASE_URL=["'](postgresql:\/\/[^"']+)["']/
    if (simpleRegex.test(content)) {
      console.log('DATABASE_URL looks correct (quoted)')
    } else {
      // Check unquoted
      const unquotedRegex = /DATABASE_URL=(postgresql:\/\/\S+)/
      if (unquotedRegex.test(content)) {
        console.log('DATABASE_URL looks correct (unquoted)')
      } else {
        console.log('Could not validate DATABASE_URL format')
      }
    }
  }
} catch (e) {
  console.error(e)
}
