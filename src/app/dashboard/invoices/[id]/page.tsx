import {
  getSupplierInvoice,
  getInvoicePayments,
  getInvoiceAuditLog,
} from '@/app/actions/supplier-invoices'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ProcessInvoiceButton } from '@/components/invoices/process-invoice-button'
import { UnprocessInvoiceButton } from '@/components/invoices/unprocess-invoice-button'
import { PaymentTracker } from '@/components/invoices/payment-tracker'
import { AuditHistory } from '@/components/invoices/audit-history'

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const invoice = await getSupplierInvoice(id).catch(() => null)

  if (!invoice) notFound()

  // Fetch payments and audit log
  const payments = await getInvoicePayments(id).catch(() => [])
  const auditLog = await getInvoiceAuditLog(id).catch(() => [])

  const subtotal = parseFloat(invoice.subtotal || '0')
  const total = parseFloat(invoice.totalAmount)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/invoices">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoice {invoice.invoiceNumber}</h1>
            <p className="text-muted-foreground">
              {invoice.supplier?.name || 'No supplier'} •{' '}
              {new Date(invoice.invoiceDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={invoice.status === 'processed' ? 'default' : 'secondary'}
            className="capitalize"
          >
            {invoice.status}
          </Badge>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Invoice Header Info */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-muted-foreground text-sm">Invoice Number</div>
              <div className="font-medium">{invoice.invoiceNumber}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-sm">Supplier</div>
              <div className="font-medium">{invoice.supplier?.name || '-'}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-sm">Invoice Date</div>
              <div className="font-medium">
                {new Date(invoice.invoiceDate).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-sm">Due Date</div>
              <div className="font-medium">
                {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}
              </div>
            </div>
            {invoice.notes && (
              <div className="col-span-2">
                <div className="text-muted-foreground text-sm">Notes</div>
                <div className="font-medium">{invoice.notes}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invoice Items */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoice.items.map((item, index) => (
              <div key={item.id} className="rounded-lg border p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <div className="font-medium">{item.description}</div>
                    {item.category && (
                      <Badge variant="outline" className="mt-1 capitalize">
                        {item.category}
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">€{parseFloat(item.lineTotal).toFixed(2)}</div>
                  </div>
                </div>
                <div className="text-muted-foreground grid grid-cols-3 gap-4 text-sm">
                  <div>
                    Quantity: {item.quantity} {item.unit}
                  </div>
                  <div>Price/Unit: €{parseFloat(item.pricePerUnit).toFixed(2)}</div>
                  <div>
                    {item.createdInventoryId && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        <span>In Inventory</span>
                      </div>
                    )}
                  </div>
                </div>
                {item.notes && (
                  <div className="text-muted-foreground mt-2 text-sm">Note: {item.notes}</div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-2 border-t pt-4">
            <div className="text-muted-foreground flex justify-between">
              <span>Subtotal</span>
              <span>€{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>€{total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Tracker */}
      <PaymentTracker
        invoiceId={invoice.id}
        totalAmount={invoice.totalAmount}
        paidAmount={invoice.paidAmount || '0'}
        paymentStatus={invoice.paymentStatus}
        payments={payments}
      />

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {invoice.status === 'draft' ? (
            <div>
              <ProcessInvoiceButton invoiceId={invoice.id} />
              <p className="text-muted-foreground mt-2 text-sm">
                Processing will create input inventory items for each line item and record an
                expense.
              </p>
            </div>
          ) : (
            <div>
              <UnprocessInvoiceButton invoiceId={invoice.id} />
              <p className="text-muted-foreground mt-2 text-sm">
                Unprocessing will delete all created inventory items and the expense record.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit History */}
      <AuditHistory auditLog={auditLog} />
    </div>
  )
}
