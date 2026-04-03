import { notFound } from 'next/navigation'
import { getSale } from '@/app/actions/sales'
import { format } from 'date-fns'
import { PrintButton } from './print-button'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  try {
    const sale = await getSale(id)
    return {
      title: `Sale — ${sale.customer?.name ?? 'Walk-in'} — ${format(new Date(sale.saleDate), 'dd MMM yyyy')}`,
    }
  } catch {
    return { title: 'Sale Receipt' }
  }
}

const STATUS_LABELS: Record<string, string> = {
  paid: 'Paid',
  pending: 'Pending',
  partial: 'Partial',
  overdue: 'Overdue',
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  check: 'Check',
  card: 'Card',
  other: 'Other',
}

export default async function PrintSalePage({ params }: Props) {
  const { id } = await params

  let sale: Awaited<ReturnType<typeof getSale>>
  try {
    sale = await getSale(id)
  } catch {
    return notFound()
  }

  const total = parseFloat(sale.totalAmount)
  const paid = parseFloat(sale.amountPaid)
  const balance = total - paid
  const dateStr = format(new Date(sale.saleDate), 'dd/MM/yyyy')
  const customerName = sale.customer?.name ?? 'Walk-in Customer'

  return (
    <>
      {/* Controls — hidden when printing */}
      <div className="no-print fixed top-0 right-0 left-0 z-50 flex items-center justify-between border-b bg-white px-6 py-3 shadow-sm">
        <div>
          <h1 className="text-lg font-bold">Sale Receipt — {customerName}</h1>
          <p className="text-sm text-gray-500">{dateStr}</p>
        </div>
        <div className="flex gap-3">
          <a
            href={`/dashboard/sales`}
            className="text-sm text-gray-500 underline hover:text-gray-800"
          >
            ← Back to Sales
          </a>
          <PrintButton />
        </div>
      </div>

      {/* Printable content */}
      <div className="print-page mx-auto max-w-3xl px-8 pt-20 pb-12 print:pt-0">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between border-b pb-6">
          <div>
            <h1 className="text-2xl font-bold">Sales Receipt</h1>
            <p className="mt-1 text-sm text-gray-600">
              Date: {format(new Date(sale.saleDate), 'EEEE, dd MMMM yyyy')}
            </p>
            <p className="mt-0.5 text-sm text-gray-600">
              Customer: <span className="font-semibold">{customerName}</span>
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              Printed: {format(new Date(), 'dd/MM/yyyy HH:mm')}
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Bio & Fresh" style={{ height: '70px', objectFit: 'contain' }} />
        </div>

        {/* Items table */}
        <section className="mb-8">
          <h2 className="mb-3 text-base font-bold tracking-wide text-gray-700 uppercase">
            Products Sold
          </h2>
          {(sale as any).saleItems && (sale as any).saleItems.length > 0 ? (
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
                    Product
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-right font-semibold">Qty</th>
                  <th className="border border-gray-300 px-3 py-2 text-right font-semibold">
                    Unit
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-right font-semibold">
                    Price/Unit
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-right font-semibold">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {(sale as any).saleItems.map((item: any, i: number) => (
                  <tr key={item.id} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                    <td className="border border-gray-300 px-3 py-2 font-medium">
                      {item.productName}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right">
                      {parseFloat(item.quantity).toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right">{item.unit}</td>
                    <td className="border border-gray-300 px-3 py-2 text-right">
                      €{parseFloat(item.unitPrice).toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right font-semibold">
                      €{parseFloat(item.subtotal).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-500 italic">No item details recorded.</p>
          )}
        </section>

        {/* Payment summary */}
        <section className="mb-6 flex justify-end">
          <div className="w-64 rounded border border-gray-200 text-sm">
            <div className="flex justify-between border-b px-4 py-2">
              <span className="text-gray-600">Total</span>
              <span className="font-bold">€{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-b px-4 py-2">
              <span className="text-gray-600">Amount Paid</span>
              <span className="font-semibold text-green-700">€{paid.toFixed(2)}</span>
            </div>
            {balance > 0 && (
              <div className="flex justify-between px-4 py-2">
                <span className="text-gray-600">Balance Due</span>
                <span className="font-bold text-red-600">€{balance.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between border-t bg-gray-50 px-4 py-2">
              <span className="text-gray-600">Status</span>
              <span className="font-semibold capitalize">
                {STATUS_LABELS[sale.paymentStatus] ?? sale.paymentStatus}
              </span>
            </div>
            {sale.paymentMethod && (
              <div className="flex justify-between border-t px-4 py-2">
                <span className="text-gray-600">Payment Method</span>
                <span>{METHOD_LABELS[sale.paymentMethod] ?? sale.paymentMethod}</span>
              </div>
            )}
          </div>
        </section>

        {/* Notes */}
        {sale.notes && (
          <section className="border-t pt-4">
            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Notes</p>
            <p className="mt-1 text-sm text-gray-700">{sale.notes}</p>
          </section>
        )}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          header, nav, aside,
          [class*="sidebar"], [class*="Sidebar"],
          [class*="header"], [class*="Header"] { display: none !important; }
          html, body, main,
          body > div, body > div > div { overflow: visible !important; height: auto !important; }
          body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4 portrait; margin: 1.5cm; }
          .print-page { padding-top: 0 !important; max-width: none !important; }
        }
      `}</style>
    </>
  )
}
