'use client'
import { authClient } from '@/lib/auth/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  const router = useRouter()
  return (
    <Button
      variant="outline"
      onClick={async () => {
        await authClient.signOut()
        router.push('/login')
      }}
    >
      Logout
    </Button>
  )
}
