'use client'

import { processInvoice } from '@/app/actions/supplier-invoices'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'

interface ProcessInvoiceButtonProps {
  invoiceId: string
}

export function ProcessInvoiceButton({ invoiceId }: ProcessInvoiceButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  async function handleProcess() {
    if (!confirm('Process this invoice? This will create inventory items and an expense record.')) {
      return
    }

    setIsProcessing(true)
    try {
      await processInvoice(invoiceId)
      toast({ title: 'Invoice processed successfully' })
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error processing invoice',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Button onClick={handleProcess} disabled={isProcessing}>
      {isProcessing ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <CheckCircle className="mr-2 h-4 w-4" />
      )}
      Process Invoice
    </Button>
  )
}
