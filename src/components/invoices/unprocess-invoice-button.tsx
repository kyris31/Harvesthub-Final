'use client'

import { unprocessInvoice } from '@/app/actions/supplier-invoices'
import { Button } from '@/components/ui/button'
import { XCircle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'

interface UnprocessInvoiceButtonProps {
  invoiceId: string
}

export function UnprocessInvoiceButton({ invoiceId }: UnprocessInvoiceButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isUnprocessing, setIsUnprocessing] = useState(false)

  async function handleUnprocess() {
    if (
      !confirm(
        'Unprocess this invoice? This will delete all created inventory items and the expense record.'
      )
    ) {
      return
    }

    setIsUnprocessing(true)
    try {
      await unprocessInvoice(invoiceId)
      toast({ title: 'Invoice unprocessed successfully' })
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error unprocessing invoice',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      })
    } finally {
      setIsUnprocessing(false)
    }
  }

  return (
    <Button variant="destructive" onClick={handleUnprocess} disabled={isUnprocessing}>
      {isUnprocessing ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <XCircle className="mr-2 h-4 w-4" />
      )}
      Unprocess Invoice
    </Button>
  )
}
