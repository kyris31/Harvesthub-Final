import { auth } from '@/lib/auth/auth'
import { toNextJsHandler } from 'better-auth/next-js'

const handler = toNextJsHandler(auth)

export const GET = async (req: Request) => {
  return handler.GET(req)
}

export const POST = async (req: Request) => {
  const fs = await import('fs')
  try {
    fs.appendFileSync('auth_debug.log', `[${new Date().toISOString()}] Starting POST request\n`)
    const res = await handler.POST(req)
    fs.appendFileSync(
      'auth_debug.log',
      `[${new Date().toISOString()}] Request successful, status: ${res.status}\n`
    )

    if (res.status !== 200) {
      const clonedRes = res.clone()
      const body = await clonedRes.text()
      fs.appendFileSync('auth_debug.log', `[${new Date().toISOString()}] Response body: ${body}\n`)
    }

    return res
  } catch (e: any) {
    console.error('Auth POST error:', e)
    fs.appendFileSync(
      'auth_debug.log',
      `[${new Date().toISOString()}] Error: ${e.message}\nStack: ${e.stack}\n`
    )
    throw e
  }
}
