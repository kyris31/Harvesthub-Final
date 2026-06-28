/**
 * Shared supplier-invoice math. Used by both the invoice form (client) and the
 * server actions so totals always agree.
 *
 * VAT can differ per line (e.g. 19% vs 12%). The invoice header tax rate acts
 * as the default applied to any line that doesn't specify its own rate.
 */

function num(v: unknown): number {
  const n = parseFloat(String(v ?? ''))
  return Number.isFinite(n) ? n : 0
}

function hasValue(v: unknown): boolean {
  return v !== '' && v !== null && v !== undefined
}

export interface InvoiceLineInput {
  quantity?: string | number | null
  pricePerUnit?: string | number | null
  discountType?: string | null
  discountValue?: string | number | null
  taxRate?: string | number | null // per-line override; blank → use default
}

export interface InvoiceHeaderInput {
  defaultTaxRate?: string | number | null
  shippingCost?: string | number | null
  invoiceDiscount?: string | number | null
}

export interface ComputedLine {
  lineSubtotal: number
  lineDiscount: number
  lineTotal: number
  taxRate: number
  lineTax: number
}

export interface ComputedInvoice {
  lines: ComputedLine[]
  subtotal: number
  invoiceDiscount: number
  afterDiscount: number
  taxAmount: number
  shipping: number
  total: number
}

export function lineDiscountAmount(
  lineSubtotal: number,
  discountType?: string | null,
  discountValue?: number | null
): number {
  if (!discountType || !discountValue) return 0
  return discountType === 'percentage' ? lineSubtotal * (discountValue / 100) : discountValue
}

export function computeInvoice(
  items: InvoiceLineInput[],
  header: InvoiceHeaderInput
): ComputedInvoice {
  const defaultRate = num(header.defaultTaxRate)
  const invoiceDiscount = num(header.invoiceDiscount)
  const shipping = num(header.shippingCost)

  const pre = items.map((it) => {
    const lineSubtotal = num(it.quantity) * num(it.pricePerUnit)
    const lineDiscount = lineDiscountAmount(lineSubtotal, it.discountType, num(it.discountValue))
    const lineTotal = lineSubtotal - lineDiscount
    const taxRate = hasValue(it.taxRate) ? num(it.taxRate) : defaultRate
    return { lineSubtotal, lineDiscount, lineTotal, taxRate }
  })

  const subtotal = pre.reduce((s, l) => s + l.lineTotal, 0)

  // The invoice-level discount reduces each line's taxable base proportionally.
  const lines: ComputedLine[] = pre.map((l) => {
    const allocatedDiscount = subtotal > 0 ? invoiceDiscount * (l.lineTotal / subtotal) : 0
    const taxable = l.lineTotal - allocatedDiscount
    const lineTax = taxable * (l.taxRate / 100)
    return { ...l, lineTax }
  })

  const taxAmount = lines.reduce((s, l) => s + l.lineTax, 0)
  const afterDiscount = subtotal - invoiceDiscount
  const total = afterDiscount + taxAmount + shipping

  return { lines, subtotal, invoiceDiscount, afterDiscount, taxAmount, shipping, total }
}

/**
 * Cost of one invoice line for inventory purposes.
 * - Not VAT-registered: VAT is a real cost → add the line's VAT.
 * - VAT-registered: VAT is reclaimable → keep net.
 */
export function lineGrossCost(lineTotal: number, lineTax: number, vatRegistered: boolean): number {
  return vatRegistered ? lineTotal : lineTotal + lineTax
}
