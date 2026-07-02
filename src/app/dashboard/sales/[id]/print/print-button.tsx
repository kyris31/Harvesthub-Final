'use client'

import { Button } from '@/components/ui/button'
import { Download, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { exportSaleReceiptPDF, exportSaleInvoicePDF } from '@/lib/pdf-export'

export function PrintButton({ sale }: { sale: any }) {
  const handleSaveReceipt = async () => {
    try {
      await exportSaleReceiptPDF(sale)
      toast.success('Receipt PDF saved (Reports/Sales Reciept or Downloads)')
    } catch (err) {
      console.error('Receipt PDF export failed:', err)
      toast.error(`Could not create receipt: ${(err as Error)?.message ?? err}`)
    }
  }

  const handleIssueInvoice = async () => {
    try {
      await exportSaleInvoicePDF(sale)
      toast.success('Invoice PDF saved (Reports/Sales Invoice or Downloads)')
    } catch (err) {
      console.error('Invoice PDF export failed:', err)
      toast.error(`Could not create invoice: ${(err as Error)?.message ?? err}`)
    }
  }

  return (
    <>
      <Button onClick={handleIssueInvoice} size="sm" variant="outline">
        <FileText className="mr-2 h-4 w-4" />
        Issue Invoice
      </Button>
      <Button onClick={handleSaveReceipt} size="sm">
        <Download className="mr-2 h-4 w-4" />
        Save as PDF
      </Button>
    </>
  )
}
