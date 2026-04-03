import { notFound } from 'next/navigation'
import { getHarvestOrderSummary } from '@/app/actions/harvest-orders'
import { format } from 'date-fns'
import { PrintButton } from './print-button'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  try {
    const summary = await getHarvestOrderSummary(id)
    return { title: format(new Date(summary.order.orderDate), 'EEEE dd MMMM yyyy') }
  } catch {
    return { title: 'Harvest Order' }
  }
}

export default async function PrintHarvestOrderPage({ params }: Props) {
  const { id } = await params

  let summary
  try {
    summary = await getHarvestOrderSummary(id)
  } catch {
    return notFound()
  }

  const { order, productTotals, customerBreakdown, grandTotal } = summary
  const allCustomers = [...new Set(summary.items.map((i) => i.customerName))].sort()

  return (
    <>
      {/* Print controls — hidden when printing */}
      <div className="no-print fixed top-0 right-0 left-0 z-50 flex items-center justify-between border-b bg-white px-6 py-3 shadow-sm">
        <div>
          <h1 className="text-lg font-bold">{order.name}</h1>
          <p className="text-sm text-gray-500">
            {format(new Date(order.orderDate), 'dd MMMM yyyy')}
          </p>
        </div>
        <div className="flex gap-3">
          <a
            href={`/dashboard/harvest-orders/${id}`}
            className="text-sm text-gray-500 underline hover:text-gray-800"
          >
            ← Back
          </a>
          <PrintButton />
        </div>
      </div>

      {/* Printable content */}
      <div className="print-page mx-auto max-w-7xl px-8 pt-20 pb-12 print:pt-0">
        {/* Header */}
        <div className="mb-8 border-b pb-4">
          <h1 className="text-2xl font-bold">{order.name}</h1>
          <p className="mt-1 text-sm text-gray-600">
            Date: {format(new Date(order.orderDate), 'EEEE, dd MMMM yyyy')}
            {order.notes && ` · ${order.notes}`}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Printed: {format(new Date(), 'dd/MM/yyyy HH:mm')}
          </p>
        </div>

        {/* ── TABLE 1: Harvest Picking List ── */}
        <section className="mb-10">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
            🌾 Harvest Picking List
          </h2>
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
                  Vegetables
                </th>
                <th className="border border-gray-300 px-3 py-2 text-center font-semibold">
                  Total
                </th>
                {allCustomers.map((c) => (
                  <th
                    key={c}
                    className="border border-gray-300 px-3 py-2 text-center font-semibold whitespace-nowrap"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {productTotals
                .sort((a, b) => a.productName.localeCompare(b.productName))
                .map((pt, i) => (
                  <tr key={pt.productName} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                    <td className="border border-gray-300 px-3 py-2 font-medium">
                      {pt.productName}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center font-bold">
                      {pt.quantity % 1 === 0 ? pt.quantity : pt.quantity.toFixed(1)} {pt.unit}
                    </td>
                    {allCustomers.map((customerName) => {
                      const item = summary.items.find(
                        (i) => i.customerName === customerName && i.productName === pt.productName
                      )
                      const qty = item ? parseFloat(item.quantityKg) : null
                      return (
                        <td
                          key={customerName}
                          className="border border-gray-300 px-3 py-2 text-center"
                        >
                          {qty != null ? (
                            `${qty % 1 === 0 ? qty : qty.toFixed(1)}`
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-bold">
                <td className="border border-gray-300 px-3 py-2">Grand Total</td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  €{grandTotal.toFixed(2)}
                </td>
                {allCustomers.map((customerName) => {
                  const cb = customerBreakdown.find((c) => c.customerName === customerName)
                  return (
                    <td key={customerName} className="border border-gray-300 px-3 py-2 text-center">
                      {cb ? `€${cb.orderTotal.toFixed(2)}` : '—'}
                    </td>
                  )
                })}
              </tr>
            </tfoot>
          </table>
        </section>

        {/* ── TABLE 2: Per-Customer Invoices ── */}
        <section>
          <h2 className="mb-4 text-lg font-bold">👤 Customer Breakdown</h2>
          <div className="space-y-6">
            {customerBreakdown
              .sort((a, b) => a.customerName.localeCompare(b.customerName))
              .map((cb) => (
                <div key={cb.customerName} className="break-inside-avoid">
                  <div className="rounded-t border border-b-0 border-gray-300 bg-gray-100 px-4 py-2 text-sm font-bold">
                    {cb.customerName}
                  </div>
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-3 py-2 text-left font-medium">
                          Vegetable
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-right font-medium">
                          Quantity
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-right font-medium">
                          €/unit
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-right font-medium">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {cb.items
                        .sort((a, b) => a.productName.localeCompare(b.productName))
                        .map((item) => {
                          const qty = parseFloat(item.quantityKg)
                          const price = parseFloat(item.pricePerUnit ?? '0')
                          const total = parseFloat(item.totalPrice ?? '0')
                          return (
                            <tr key={item.id} className="border-b border-gray-100">
                              <td className="border border-gray-300 px-3 py-2 font-medium">
                                {item.productName}
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-right">
                                {qty % 1 === 0 ? qty : qty.toFixed(1)} {item.unit}
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-right text-gray-600">
                                {price > 0 ? `€${price.toFixed(2)}` : '—'}
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-right font-semibold">
                                {total > 0 ? `€${total.toFixed(2)}` : '—'}
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-100 font-bold">
                        <td colSpan={3} className="border border-gray-300 px-3 py-2 text-right">
                          Total Price
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-right">
                          €{cb.orderTotal.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ))}
          </div>
        </section>
      </div>

      <style>{`
                /* Hide the entire dashboard chrome when printing */
                @media print {
                    .no-print { display: none !important; }

                    /* Hide sidebar, header, nav — target common dashboard wrapper class names */
                    header, nav, aside,
                    [class*="sidebar"], [class*="Sidebar"],
                    [class*="header"], [class*="Header"],
                    [data-sidebar], [data-radix-scroll-area-viewport] { display: none !important; }

                    /* Remove overflow/height constraints set by the layout */
                    html, body, main,
                    body > div, body > div > div,
                    [class*="layout"], [class*="Layout"],
                    [class*="content"], [class*="Content"] {
                        overflow: visible !important;
                        height: auto !important;
                        max-height: none !important;
                        position: static !important;
                    }

                    /* Page setup */
                    body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    @page { size: A4 landscape; margin: 1cm; }

                    /* Table styles */
                    table { font-size: 11px; width: 100%; border-collapse: collapse; }
                    th, td { padding: 4px 6px !important; }

                    /* Make the print content fill the full page */
                    .print-page { padding-top: 0 !important; max-width: none !important; }
                }
            `}</style>
    </>
  )
}
