'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { deleteTree } from '@/app/actions/trees'
import { Trash2, Loader2 } from 'lucide-react'

export function DeleteTreeButton({ treeId }: { treeId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirm, setConfirm] = useState(false)

  function handleClick() {
    if (!confirm) {
      setConfirm(true)
      return
    }
    startTransition(async () => {
      await deleteTree(treeId)
      router.push('/dashboard/trees')
      router.refresh()
    })
  }

  return (
    <Button variant="destructive" onClick={handleClick} disabled={isPending}>
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="mr-2 h-4 w-4" />
      )}
      {confirm ? 'Confirm Delete' : 'Delete'}
    </Button>
  )
}
