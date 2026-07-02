'use client'

import { Button } from '@/components/ui/button'
import { Download, FileText } from 'lucide-react'
import { exportSaleReceiptPDF, exportSaleInvoicePDF } from '@/lib/pdf-export'

export function PrintButton({ sale }: { sale: any }) {
  const handleSaveReceipt = async () => {
    try {
      await exportSaleReceiptPDF(sale)
    } catch (err) {
      console.error('Receipt PDF export failed:', err)
    }
  }

  const handleIssueInvoice = async () => {
    try {
      await exportSaleInvoicePDF(sale)
    } catch (err) {
      console.error('Invoice PDF export failed:', err)
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
