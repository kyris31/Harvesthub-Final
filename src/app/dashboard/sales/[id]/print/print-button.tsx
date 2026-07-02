'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { exportSaleReceiptPDF } from '@/lib/pdf-export'

export function PrintButton({ sale }: { sale: any }) {
  const handleSave = async () => {
    try {
      await exportSaleReceiptPDF(sale)
    } catch (err) {
      console.error('Receipt PDF export failed:', err)
    }
  }

  return (
    <Button onClick={handleSave} size="sm">
      <Download className="mr-2 h-4 w-4" />
      Save as PDF
    </Button>
  )
}
