'use client'

// PDF Export using CDN-loaded jsPDF

// Cache the base64-encoded font so it is only fetched/converted once per session
let _notoSansBase64: string | null = null

/**
 * Reliable cross-browser PDF download.
 * jsPDF's built-in doc.save() revokes the blob URL synchronously after clicking,
 * which can cause ERR_FILE_NOT_FOUND on Windows/Chrome before the download starts.
 * This helper delays revocation by 2 s and appends the anchor to the DOM.
 */
function downloadPDF(doc: any, fileName: string) {
  const blob: Blob = doc.output('blob')
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.style.display = 'none'
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

// ── Save-to-folder support (File System Access API) ─────────────────────────
// Browsers can't be told an absolute path, but Chrome's File System Access API
// lets the user pick a folder once; we persist the handle in IndexedDB and reuse
// it so subsequent exports write straight there with no dialog.

function idbDirStore(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('report-fs', 1)
    req.onupgradeneeded = () => req.result.createObjectStore('handles')
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function getSavedDirHandle(key: string): Promise<any | null> {
  try {
    const db = await idbDirStore()
    return await new Promise((resolve) => {
      const getReq = db.transaction('handles', 'readonly').objectStore('handles').get(key)
      getReq.onsuccess = () => resolve(getReq.result ?? null)
      getReq.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

async function saveDirHandle(key: string, handle: any): Promise<void> {
  try {
    const db = await idbDirStore()
    await new Promise<void>((resolve) => {
      const tx = db.transaction('handles', 'readwrite')
      tx.objectStore('handles').put(handle, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  } catch {
    /* ignore — falls back to a normal download */
  }
}

/**
 * Resolve a writable handle to a report's target folder, given the path segments
 * under the chosen "Reports" folder — e.g. ("Harvest") → Reports/Harvest, or
 * ("Inventory", "Seeds") → Reports/Inventory/Seeds. Each path remembers its own
 * handle. The user picks a folder once; we then normalise:
 *   - if they picked the folder already named after the first segment, use it;
 *   - otherwise treat their pick as the parent and create the first segment under it,
 * then create any deeper segments. This is self-correcting whether the user selects
 * `Reports` or `Reports\Harvest`, and never double-nests. The resolved target is
 * stored, so later exports save straight there. Returns null when the API is
 * unavailable or the user cancels, signalling a fall back to a normal download.
 * Call this BEFORE building the PDF so the picker runs inside the click's
 * user-activation window.
 */
async function resolveReportDir(...segments: string[]): Promise<any | null> {
  // @ts-ignore - File System Access API is Chromium-only
  if (typeof window.showDirectoryPicker !== 'function') return null
  // Versioned key — bump the prefix to discard handles saved by older, buggier logic.
  const key = `reportdir3:${segments.join('/')}`
  try {
    let dir = await getSavedDirHandle(key)
    if (dir) {
      const opts = { mode: 'readwrite' as const }
      let perm = (await dir.queryPermission?.(opts)) ?? 'prompt'
      if (perm !== 'granted') perm = (await dir.requestPermission?.(opts)) ?? 'denied'
      if (perm !== 'granted') dir = null
    }
    if (dir) {
      // Cached handle already points at the final target folder.
      return dir
    }
    // @ts-ignore
    const picked = await window.showDirectoryPicker({
      id: 'reports',
      mode: 'readwrite',
      startIn: 'documents',
    })
    // The picked folder may be the Reports root, or any folder along the target
    // path (e.g. the user drilled into Inventory or Inventory/Seeds). Match its
    // name against the path segments and only create what's still missing, so we
    // never re-nest an already-correct path.
    let startIdx = segments.length // default: nothing of the path is satisfied
    for (let i = segments.length - 1; i >= 0; i--) {
      if (segments[i] === picked.name) {
        startIdx = i + 1
        break
      }
    }
    let target = picked
    for (let i = startIdx; i < segments.length; i++) {
      target = await target.getDirectoryHandle(segments[i], { create: true })
    }
    await saveDirHandle(key, target)
    return target
  } catch {
    return null // user cancelled or denied
  }
}

/**
 * Write the PDF into `dirHandle` if provided, otherwise trigger a normal download.
 */
async function savePDF(doc: any, fileName: string, dirHandle: any | null) {
  if (!dirHandle) {
    downloadPDF(doc, fileName)
    return
  }
  try {
    const blob: Blob = doc.output('blob')
    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true })
    const writable = await fileHandle.createWritable()
    await writable.write(blob)
    await writable.close()
  } catch {
    downloadPDF(doc, fileName) // any write failure → fall back
  }
}

async function loadLogoDataUrl(): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(null)
        return
      }
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => resolve(null)
    img.src = '/logo.png'
  })
}

async function setupNotoSans(doc: any): Promise<void> {
  try {
    if (!_notoSansBase64) {
      const response = await fetch('/fonts/NotoSans-Regular.ttf')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const arrayBuffer = await response.arrayBuffer()
      const uint8 = new Uint8Array(arrayBuffer)
      // Convert to base64 in chunks to avoid call-stack overflow on large buffers
      let binary = ''
      const chunkSize = 8192
      for (let i = 0; i < uint8.length; i += chunkSize) {
        binary += String.fromCharCode(...uint8.subarray(i, i + chunkSize))
      }
      _notoSansBase64 = btoa(binary)
    }
    doc.addFileToVFS('NotoSans-Regular.ttf', _notoSansBase64)
    // Register for both normal and bold (same file – bold weight is inside the variable font)
    doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal')
    doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'bold')
    doc.setFont('NotoSans', 'normal')
  } catch {
    // Fall back to Helvetica (Greek will not render, but the rest of the PDF works)
    doc.setFont('helvetica', 'normal')
  }
}

// Returns the Y position where content should start after the header
function addCompanyHeader(doc: any, logoData: string | null, title: string): number {
  // Logo top-left
  if (logoData) {
    doc.addImage(logoData, 'PNG', 14, 5, 32, 20)
  }

  // Company info below logo
  doc.setFontSize(9)
  doc.setFont('NotoSans', 'bold')
  doc.text('K.K. Biofresh', 14, 30)
  doc.setFont('NotoSans', 'normal')
  doc.setFontSize(8)
  doc.text('1ης Απριλίου 300', 14, 35)
  doc.text('7520 Ξυλοφάγου, Λάρνακα', 14, 40)
  doc.text('Phone: 99611241', 14, 45)
  doc.text('Email: kyris31@gmail.com', 14, 50)

  // "Generated" date top-right
  doc.setFontSize(8)
  doc.setFont('NotoSans', 'normal')
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 196, 10, { align: 'right' })

  // Horizontal rule
  doc.setDrawColor(180, 180, 180)
  doc.line(14, 55, 196, 55)

  // Report title
  doc.setFontSize(16)
  doc.setFont('NotoSans', 'bold')
  doc.text(title, 14, 64)
  doc.setFont('NotoSans', 'normal')

  return 72
}

export async function exportFinancialReportPDF(data: any, startDate: string, endDate: string) {
  // Resolve the target folder first, while the button click's activation is live.
  const dirHandle = await resolveReportDir('Financial')

  // @ts-ignore - jsPDF loaded from CDN
  const { jsPDF } = window.jspdf
  const doc = new jsPDF()
  await setupNotoSans(doc)
  const logo = await loadLogoDataUrl()
  const startY = addCompanyHeader(doc, logo, 'Financial Report')

  doc.setFontSize(10)
  doc.text(`Period: ${startDate} to ${endDate}`, 14, startY)

  // @ts-ignore
  doc.autoTable({
    startY: startY + 8,
    head: [['Metric', 'Value']],
    body: [
      ['Total Revenue', `€${data.revenue.total.toFixed(2)}`],
      ['Total Expenses', `€${data.expenses.total.toFixed(2)}`],
      ['Net Profit', `€${data.profit.total.toFixed(2)}`],
      ['Profit Margin', `${data.profit.margin.toFixed(1)}%`],
    ],
    styles: { font: 'NotoSans', fontSize: 9 },
    headStyles: { fillColor: [34, 139, 34] },
  })

  const fileName = `Financial_Report_${startDate}_to_${endDate}.pdf`
  await savePDF(doc, fileName, dirHandle)
}

export async function exportSalesReportPDF(data: any, startDate: string, endDate: string) {
  // Ask for the target folder first, while we still have the button click's
  // user-activation (the picker only appears the first time / if access is lost).
  const dirHandle = await resolveReportDir('Sales')

  // @ts-ignore - jsPDF loaded from CDN
  const { jsPDF } = window.jspdf
  const doc = new jsPDF()
  await setupNotoSans(doc)
  const logo = await loadLogoDataUrl()
  const startY = addCompanyHeader(doc, logo, 'Sales Report')

  doc.setFontSize(10)
  doc.text(`Period: ${startDate} to ${endDate}`, 14, startY)

  // Summary
  // @ts-ignore
  doc.autoTable({
    startY: startY + 8,
    head: [['Metric', 'Value']],
    body: [
      ['Total Sales', `${data.summary.saleCount}`],
      ['Total Revenue', `€${data.summary.totalRevenue.toFixed(2)}`],
      ['Total Collected', `€${data.summary.totalPaid.toFixed(2)}`],
      ['Outstanding', `€${data.summary.totalOutstanding.toFixed(2)}`],
      ['Average Sale', `€${data.summary.averageSale.toFixed(2)}`],
    ],
    styles: { font: 'NotoSans', fontSize: 9 },
    headStyles: { fillColor: [34, 139, 34] },
  })

  // Top products
  const productRows = [...data.topProducts]
    .sort((a: any, b: any) => a.name.localeCompare(b.name))
    .map((p: any) => [p.name, `${p.quantity.toFixed(2)} ${p.unit}`, `€${p.revenue.toFixed(2)}`])
  // @ts-ignore
  doc.autoTable({
    // @ts-ignore
    startY: doc.lastAutoTable.finalY + 10,
    head: [['Product', 'Quantity Sold', 'Revenue']],
    body: productRows.length > 0 ? productRows : [['No sales data', '', '']],
    styles: { font: 'NotoSans', fontSize: 9 },
    headStyles: { fillColor: [34, 139, 34] },
  })

  // Top customers
  const customerRows = [...data.topCustomers]
    .sort((a: any, b: any) => a.name.localeCompare(b.name))
    .map((c: any) => [c.name, `${c.orders}`, `€${c.revenue.toFixed(2)}`])
  // @ts-ignore
  doc.autoTable({
    // @ts-ignore
    startY: doc.lastAutoTable.finalY + 10,
    head: [['Customer', 'Orders', 'Revenue']],
    body: customerRows.length > 0 ? customerRows : [['No sales data', '', '']],
    styles: { font: 'NotoSans', fontSize: 9 },
    headStyles: { fillColor: [34, 139, 34] },
  })

  const fileName = `Sales_Report_${startDate}_to_${endDate}.pdf`
  await savePDF(doc, fileName, dirHandle)
}

// Fixed identifier stamped on every sales receipt.
const RECEIPT_CODE = 'CY - BIO - 001'

export async function exportSaleReceiptPDF(sale: any) {
  // Resolve the target folder first, while the button click's activation is live.
  const dirHandle = await resolveReportDir('Sales Reciept')

  // @ts-ignore - jsPDF loaded from CDN
  const { jsPDF } = window.jspdf
  const doc = new jsPDF()
  await setupNotoSans(doc)
  const logo = await loadLogoDataUrl()
  const startY = addCompanyHeader(doc, logo, 'Sales Receipt')

  const total = parseFloat(sale.totalAmount)
  const paid = parseFloat(sale.amountPaid ?? '0')
  const balance = total - paid
  const customerName = sale.customer?.name ?? 'Walk-in Customer'
  const saleDate = new Date(sale.saleDate).toLocaleDateString('en-GB')

  const statusLabels: Record<string, string> = {
    paid: 'Paid',
    pending: 'Pending',
    partial: 'Partial',
    overdue: 'Overdue',
  }
  const methodLabels: Record<string, string> = {
    cash: 'Cash',
    bank_transfer: 'Bank Transfer',
    check: 'Check',
    card: 'Card',
    other: 'Other',
  }

  // Receipt code (replaces the old "Printed:" timestamp) + core details.
  doc.setFontSize(10)
  doc.setFont('NotoSans', 'bold')
  doc.text(RECEIPT_CODE, 14, startY)
  doc.setFont('NotoSans', 'normal')
  doc.text(`Date: ${saleDate}`, 14, startY + 6)
  doc.text(`Customer: ${customerName}`, 14, startY + 12)

  // Items table
  const items = sale.saleItems ?? []
  const itemRows =
    items.length > 0
      ? items.map((item: any) => [
          item.productName,
          parseFloat(item.quantity).toFixed(2),
          item.unit,
          `€${parseFloat(item.unitPrice).toFixed(2)}`,
          `€${parseFloat(item.subtotal).toFixed(2)}`,
        ])
      : [['No item details recorded.', '', '', '', '']]

  // @ts-ignore
  doc.autoTable({
    startY: startY + 20,
    head: [['Product', 'Qty', 'Unit', 'Price/Unit', 'Subtotal']],
    body: itemRows,
    styles: { font: 'NotoSans', fontSize: 9 },
    headStyles: { fillColor: [34, 139, 34] },
    columnStyles: {
      1: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
    },
  })

  // Payment summary
  const summaryRows: string[][] = [
    ['Total', `€${total.toFixed(2)}`],
    ['Amount Paid', `€${paid.toFixed(2)}`],
  ]
  if (balance > 0) summaryRows.push(['Balance Due', `€${balance.toFixed(2)}`])
  summaryRows.push(['Status', statusLabels[sale.paymentStatus ?? ''] ?? sale.paymentStatus ?? '—'])
  if (sale.paymentMethod)
    summaryRows.push(['Payment Method', methodLabels[sale.paymentMethod] ?? sale.paymentMethod])

  // @ts-ignore
  doc.autoTable({
    // @ts-ignore
    startY: doc.lastAutoTable.finalY + 10,
    body: summaryRows,
    theme: 'plain',
    styles: { font: 'NotoSans', fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { halign: 'right' },
    },
    margin: { left: 116 },
  })

  if (sale.notes) {
    doc.setFontSize(9)
    doc.setFont('NotoSans', 'bold')
    // @ts-ignore
    doc.text('Notes', 14, doc.lastAutoTable.finalY + 10)
    doc.setFont('NotoSans', 'normal')
    // @ts-ignore
    doc.text(doc.splitTextToSize(sale.notes, 180), 14, doc.lastAutoTable.finalY + 16)
  }

  const fileName = `Receipt_${RECEIPT_CODE.replace(/\s/g, '')}_${customerName.replace(/[^\w]/g, '_')}_${saleDate.replace(/\//g, '-')}.pdf`
  await savePDF(doc, fileName, dirHandle)
}

export async function exportSaleInvoicePDF(sale: any) {
  // Resolve the target folder first, while the button click's activation is live.
  const dirHandle = await resolveReportDir('Sales Invoice')

  // @ts-ignore - jsPDF loaded from CDN
  const { jsPDF } = window.jspdf
  const doc = new jsPDF()
  await setupNotoSans(doc)
  const logo = await loadLogoDataUrl()

  const total = parseFloat(sale.totalAmount)
  const paid = parseFloat(sale.amountPaid ?? '0')
  const balance = total - paid
  const customerName = sale.customer?.name ?? 'Walk-in Customer'
  const saleDate = new Date(sale.saleDate).toLocaleDateString('en-GB')
  const issueDate = new Date().toLocaleDateString('en-GB')

  // Fully paid → cash invoice; otherwise it is still owed → unpaid.
  const isPaid = (sale.paymentStatus ?? '') === 'paid' || balance <= 0
  const invoiceType = isPaid ? 'CASH INVOICE' : 'UNPAID INVOICE'

  const startY = addCompanyHeader(doc, logo, 'Invoice')

  const statusLabels: Record<string, string> = {
    paid: 'Paid',
    pending: 'Pending',
    partial: 'Partial',
    overdue: 'Overdue',
  }
  const methodLabels: Record<string, string> = {
    cash: 'Cash',
    bank_transfer: 'Bank Transfer',
    check: 'Check',
    card: 'Card',
    other: 'Other',
  }

  // Invoice type badge (Cash / Unpaid) at the top-right of the details block.
  doc.setFontSize(12)
  doc.setFont('NotoSans', 'bold')
  doc.setTextColor(isPaid ? 34 : 200, isPaid ? 139 : 30, isPaid ? 34 : 30)
  doc.text(invoiceType, 196, startY, { align: 'right' })
  doc.setTextColor(0, 0, 0)

  // Code + core details.
  doc.setFontSize(10)
  doc.setFont('NotoSans', 'bold')
  doc.text(RECEIPT_CODE, 14, startY)
  doc.setFont('NotoSans', 'normal')
  doc.text(`Date Issued: ${issueDate}`, 14, startY + 6)
  doc.text(`Sale Date: ${saleDate}`, 14, startY + 12)
  doc.text(`Customer: ${customerName}`, 14, startY + 18)

  // Items table
  const items = sale.saleItems ?? []
  const itemRows =
    items.length > 0
      ? items.map((item: any) => [
          item.productName,
          parseFloat(item.quantity).toFixed(2),
          item.unit,
          `€${parseFloat(item.unitPrice).toFixed(2)}`,
          `€${parseFloat(item.subtotal).toFixed(2)}`,
        ])
      : [['No item details recorded.', '', '', '', '']]

  // @ts-ignore
  doc.autoTable({
    startY: startY + 26,
    head: [['Product', 'Qty', 'Unit', 'Price/Unit', 'Subtotal']],
    body: itemRows,
    styles: { font: 'NotoSans', fontSize: 9 },
    headStyles: { fillColor: [34, 139, 34] },
    columnStyles: {
      1: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
    },
  })

  // Payment summary
  const summaryRows: string[][] = [
    ['Total', `€${total.toFixed(2)}`],
    ['Amount Paid', `€${paid.toFixed(2)}`],
  ]
  if (balance > 0) summaryRows.push(['Balance Due', `€${balance.toFixed(2)}`])
  summaryRows.push(['Status', statusLabels[sale.paymentStatus ?? ''] ?? sale.paymentStatus ?? '—'])
  if (sale.paymentMethod)
    summaryRows.push(['Payment Method', methodLabels[sale.paymentMethod] ?? sale.paymentMethod])

  // @ts-ignore
  doc.autoTable({
    // @ts-ignore
    startY: doc.lastAutoTable.finalY + 10,
    body: summaryRows,
    theme: 'plain',
    styles: { font: 'NotoSans', fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { halign: 'right' },
    },
    margin: { left: 116 },
  })

  if (sale.notes) {
    doc.setFontSize(9)
    doc.setFont('NotoSans', 'bold')
    // @ts-ignore
    doc.text('Notes', 14, doc.lastAutoTable.finalY + 10)
    doc.setFont('NotoSans', 'normal')
    // @ts-ignore
    doc.text(doc.splitTextToSize(sale.notes, 180), 14, doc.lastAutoTable.finalY + 16)
  }

  const typeSlug = isPaid ? 'Cash' : 'Unpaid'
  const fileName = `Invoice_${typeSlug}_${RECEIPT_CODE.replace(/\s/g, '')}_${customerName.replace(/[^\w]/g, '_')}_${saleDate.replace(/\//g, '-')}.pdf`
  await savePDF(doc, fileName, dirHandle)
}

export async function exportHarvestReportPDF(data: any, startDate: string, endDate: string) {
  // Resolve the target folder first, while the button click's activation is live.
  const dirHandle = await resolveReportDir('Harvest')

  // @ts-ignore
  const { jsPDF } = window.jspdf
  const doc = new jsPDF()
  await setupNotoSans(doc)
  const logo = await loadLogoDataUrl()
  const startY = addCompanyHeader(doc, logo, 'Summarized Harvest Report')

  doc.setFontSize(10)
  doc.text(`Period: ${startDate} to ${endDate}`, 14, startY)

  // Summarize harvests by crop name + variety + unit
  const summaryMap: Record<
    string,
    { cropName: string; variety: string; totalQty: number; unit: string }
  > = {}
  for (const h of data.harvests) {
    // Harvests come from either a planting log (crops) or a tree.
    const cropName = h.plantingLog?.crop?.name ?? h.tree?.species ?? 'Unknown'
    const variety = h.plantingLog?.crop?.variety ?? h.tree?.variety ?? ''
    const unit = h.quantityUnit
    const key = `${cropName}||${variety}||${unit}`
    if (!summaryMap[key]) {
      summaryMap[key] = { cropName, variety, totalQty: 0, unit }
    }
    summaryMap[key].totalQty += Number(h.quantityHarvested || 0)
  }

  const summaryRows = Object.values(summaryMap)
    .sort((a, b) => a.cropName.localeCompare(b.cropName))
    .map((r) => [r.cropName, r.variety || '—', r.totalQty.toFixed(2), r.unit])

  // @ts-ignore
  doc.autoTable({
    startY: startY + 8,
    head: [['Crop Name', 'Variety', 'Total Quantity', 'Unit']],
    body: summaryRows.length > 0 ? summaryRows : [['No harvest data', '', '', '']],
    styles: { font: 'NotoSans', fontSize: 9 },
    headStyles: { fillColor: [34, 139, 34] },
  })

  const fileName = `Summarized_Harvest_Report_${startDate}_to_${endDate}.pdf`
  await savePDF(doc, fileName, dirHandle)
}

export async function exportInventoryReportPDF(data: any, category?: string) {
  // Strict per-category export: each selection includes only that category.
  const cat = category ?? 'all'

  // Save into Inventory/<Category>, one subfolder per filter option.
  const categoryFolders: Record<string, string> = {
    all: 'All Categories',
    seeds: 'Seeds',
    inputs: 'Inputs',
    seedlings: 'Seedlings',
  }
  const dirHandle = await resolveReportDir('Inventory', categoryFolders[cat] ?? 'All Categories')

  // @ts-ignore
  const { jsPDF } = window.jspdf
  const doc = new jsPDF()
  await setupNotoSans(doc)
  const logo = await loadLogoDataUrl()
  const today = new Date().toISOString().slice(0, 10)

  const showSeeds = cat === 'all' || cat === 'seeds'
  const showInputs = cat === 'all' || cat === 'inputs'
  const showSeedlings = cat === 'all' || cat === 'seedlings'

  const startY = addCompanyHeader(doc, logo, 'Inventory Report')

  // Summary table — only the selected category's figures (everything when 'all').
  const summaryBody: string[][] =
    cat === 'all'
      ? [
          ['Total Inventory Value', `€${data.totalValue.toFixed(2)}`],
          ['Low Stock Items', data.lowStockCount.toString()],
          ['Seeds Value', `€${data.seeds.totalValue.toFixed(2)}`],
          ['Inputs Value', `€${data.inputs.totalValue.toFixed(2)}`],
          ['Seedlings Value', `€${data.seedlings.totalValue.toFixed(2)}`],
        ]
      : []
  if (showSeeds && cat !== 'all')
    summaryBody.push(['Seeds Value', `€${data.seeds.totalValue.toFixed(2)}`])
  if (showInputs && cat !== 'all')
    summaryBody.push(['Inputs Value', `€${data.inputs.totalValue.toFixed(2)}`])
  if (showSeedlings && cat !== 'all')
    summaryBody.push(['Seedlings Value', `€${data.seedlings.totalValue.toFixed(2)}`])

  // @ts-ignore
  doc.autoTable({
    startY,
    head: [['Metric', 'Value']],
    body: summaryBody,
    styles: { font: 'NotoSans', fontSize: 9 },
    headStyles: { fillColor: [34, 139, 34] },
  })

  if (showSeeds && data.seeds.items.length > 0) {
    const sourceLabel = (sourceType: string | null) => {
      if (sourceType === 'self_produced') return 'Self-Produced'
      if (sourceType === 'purchased') return 'Purchased'
      return '—'
    }

    const seedsData = [...data.seeds.items]
      .sort((a: any, b: any) =>
        (a.crop?.name ?? a.batchCode).localeCompare(b.crop?.name ?? b.batchCode)
      )
      .map((s: any) => [
        s.crop?.name ?? s.batchCode,
        s.crop?.variety ?? '—',
        Number(s.initialQuantity).toFixed(2),
        Number(s.currentQuantity).toFixed(2),
        s.quantityUnit,
        sourceLabel(s.sourceType),
      ])

    doc.addPage()
    const seedPageY = addCompanyHeader(doc, logo, 'Seed Batches Report')

    // @ts-ignore
    doc.autoTable({
      startY: seedPageY,
      head: [['Crop Name', 'Variety', 'Initial Qty', 'Current Qty', 'Unit', 'Source']],
      body: seedsData,
      styles: { font: 'NotoSans', fontSize: 9 },
      headStyles: { fillColor: [34, 139, 34] },
    })
  }

  if (showInputs && data.inputs.items.length > 0) {
    const inputsData = [...data.inputs.items]
      .sort((a: any, b: any) => a.name.localeCompare(b.name))
      .map((i: any) => [
        i.name,
        i.type,
        `${Number(i.currentQuantity || 0).toFixed(2)} ${i.quantityUnit || ''}`,
        `€${(Number(i.currentQuantity || 0) * Number(i.costPerUnit || 0)).toFixed(2)}`,
      ])

    doc.addPage()
    const inputPageY = addCompanyHeader(doc, logo, 'Inputs Inventory Report')

    // @ts-ignore
    doc.autoTable({
      startY: inputPageY,
      head: [['Name', 'Type', 'Quantity', 'Value']],
      body: inputsData,
      styles: { font: 'NotoSans', fontSize: 9 },
      headStyles: { fillColor: [34, 139, 34] },
    })
  }

  if (showSeedlings && data.seedlings.items.length > 0) {
    const seedlingsData = [...data.seedlings.items]
      .sort((a: any, b: any) => {
        // Purchased first, then self-produced; alphabetical by crop within each group.
        const rank = (x: any) => (x.source === 'self_produced' ? 1 : 0)
        const groupDiff = rank(a) - rank(b)
        if (groupDiff !== 0) return groupDiff
        const an = a.crop?.name ?? a.name ?? 'Seedling'
        const bn = b.crop?.name ?? b.name ?? 'Seedling'
        return an.localeCompare(bn)
      })
      .map((s: any) => [
        s.crop?.name ?? s.name ?? 'Seedling',
        s.crop?.variety ?? '—',
        s.source === 'self_produced' ? 'Self-Produced' : 'Purchased',
        Number(s.initialQuantity ?? s.quantityPurchased ?? 0).toString(),
        Number(s.currentQuantity || 0).toString(),
        `€${(Number(s.currentQuantity || 0) * Number(s.costPerSeedling || 0)).toFixed(2)}`,
      ])

    doc.addPage()
    const seedlingPageY = addCompanyHeader(doc, logo, 'Seedlings Inventory Report')

    // @ts-ignore
    doc.autoTable({
      startY: seedlingPageY,
      head: [['Crop Name', 'Variety', 'Source', 'Produced/Purchased', 'Current Qty', 'Value']],
      body: seedlingsData,
      styles: { font: 'NotoSans', fontSize: 9 },
      headStyles: { fillColor: [34, 139, 34] },
    })
  }

  const catSuffix = cat === 'all' ? '' : `_${cat}`
  const fileName = `Inventory_Report${catSuffix}_${today}.pdf`
  await savePDF(doc, fileName, dirHandle)
}

export async function exportCultivationReportPDF(data: any, startDate: string, endDate: string) {
  // Resolve the target folder first, while the button click's activation is live.
  const dirHandle = await resolveReportDir('Cultivation')

  // @ts-ignore
  const { jsPDF } = window.jspdf
  const doc = new jsPDF()
  await setupNotoSans(doc)
  const logo = await loadLogoDataUrl()
  const startY = addCompanyHeader(doc, logo, 'Cultivation Report')

  doc.setFontSize(10)
  doc.text(`Period: ${startDate} to ${endDate}`, 14, startY)

  // @ts-ignore
  doc.autoTable({
    startY: startY + 8,
    head: [['Metric', 'Value']],
    body: [
      ['Total Activities', data.totalActivities.toString()],
      ['Total Cost', `€${data.totalCost.toFixed(2)}`],
      ['Average Cost', `€${(data.totalCost / data.totalActivities).toFixed(2)}`],
    ],
    styles: { font: 'NotoSans', fontSize: 9 },
    headStyles: { fillColor: [34, 139, 34] },
  })

  const activityData = Object.entries(data.activityByType).map(([type, stats]: [string, any]) => [
    type.replace('_', ' ').toUpperCase(),
    stats.count.toString(),
    `€${stats.totalCost.toFixed(2)}`,
    `€${(stats.totalCost / stats.count).toFixed(2)}`,
  ])

  // @ts-ignore
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 10,
    head: [['Activity Type', 'Count', 'Total Cost', 'Avg Cost']],
    body: activityData,
    styles: { font: 'NotoSans', fontSize: 9 },
    headStyles: { fillColor: [34, 139, 34] },
  })

  // One row per activity — all inputs combined into a single cell via newlines so they
  // always appear alongside the crops/plots, never pushed below a tall cell.
  // Columns: Date | Activity | Input Item | Qty | Unit | Crop | Plot
  const tableRows: string[][] = []

  for (const a of data.activities) {
    const date = new Date(a.activityDate).toLocaleDateString('en-GB')
    const activityLabel = a.activityType.replace('_', ' ').toUpperCase()
    // Crops: unique planting crop names + unique tree species
    const plantingCrops = (a.activityPlantings ?? [])
      .map((ap: any) => ap.plantingLog?.crop?.name ?? '')
      .filter(Boolean)
    const treeCrops = [
      ...new Set(
        (a.activityTrees ?? [])
          .map((at: any) => {
            const t = at.tree
            if (!t) return ''
            return t.variety ? `${t.species} (${t.variety})` : t.species
          })
          .filter(Boolean)
      ),
    ]
    const crops = [...new Set([...plantingCrops, ...treeCrops])].join('\n') || '—'

    // Plots: unique planting plot names + unique tree locations
    const plantingPlots = (a.activityPlantings ?? [])
      .map((ap: any) => ap.plantingLog?.plot?.name ?? '')
      .filter(Boolean)
    const treePlots = [
      ...new Set(
        (a.activityTrees ?? []).map((at: any) => at.tree?.plot?.name ?? '').filter(Boolean)
      ),
    ]
    const plots = [...new Set([...plantingPlots, ...treePlots])].join('\n') || '—'

    const inputs = a.activityInputs && a.activityInputs.length > 0 ? a.activityInputs : []
    const inputNames =
      inputs.length > 0 ? inputs.map((ai: any) => ai.inputInventory?.name ?? '—').join('\n') : '—'
    // "Current" is the stock BEFORE this activity = live stock + the amount used
    // here. "Remaining" is what's left after = the live stock value.
    const inputUsed =
      inputs.length > 0
        ? inputs
            .map((ai: any) => (ai.quantityUsed != null ? Number(ai.quantityUsed).toFixed(2) : '—'))
            .join('\n')
        : '—'
    const inputRemaining =
      inputs.length > 0
        ? inputs
            .map((ai: any) =>
              ai.inputInventory?.currentQuantity != null
                ? Number(ai.inputInventory.currentQuantity).toFixed(2)
                : '—'
            )
            .join('\n')
        : '—'
    const inputCurrent =
      inputs.length > 0
        ? inputs
            .map((ai: any) => {
              const remaining =
                ai.inputInventory?.currentQuantity != null
                  ? Number(ai.inputInventory.currentQuantity)
                  : null
              const used = ai.quantityUsed != null ? Number(ai.quantityUsed) : null
              if (remaining == null) return '—'
              return (remaining + (used ?? 0)).toFixed(2)
            })
            .join('\n')
        : '—'
    const inputUnits =
      inputs.length > 0 ? inputs.map((ai: any) => ai.quantityUnit ?? '—').join('\n') : '—'

    tableRows.push([
      date,
      activityLabel,
      inputNames,
      inputCurrent,
      inputUsed,
      inputRemaining,
      inputUnits,
      crops,
      plots,
    ])
  }

  if (tableRows.length > 0) {
    doc.addPage()
    const inputPageY = addCompanyHeader(doc, logo, 'Detailed Input Usage Report')

    // @ts-ignore
    doc.autoTable({
      startY: inputPageY,
      head: [
        [
          'Date',
          'Activity',
          'Input Item',
          'Current Qty',
          'Used',
          'Remaining',
          'Unit',
          'Crop',
          'Plot',
        ],
      ],
      body: tableRows,
      styles: { font: 'NotoSans', fontSize: 8, fillColor: [220, 245, 220] },
      headStyles: { fillColor: [34, 139, 34] },
      bodyStyles: { fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 16, fontStyle: 'bold' },
        1: { cellWidth: 18, fontStyle: 'bold' },
        2: { cellWidth: 32, fontStyle: 'normal' },
        3: { cellWidth: 15, fontStyle: 'normal' },
        4: { cellWidth: 13, fontStyle: 'normal' },
        5: { cellWidth: 15, fontStyle: 'normal' },
        6: { cellWidth: 8, fontStyle: 'normal' },
        7: { cellWidth: 36, fontStyle: 'normal' },
        8: { cellWidth: 29, fontStyle: 'normal' },
      },
    })
  }

  const fileName = `Cultivation_Report_${startDate}_to_${endDate}.pdf`
  await savePDF(doc, fileName, dirHandle)
}

export async function exportPlantingReportPDF(data: any, startDate: string, endDate: string) {
  // Resolve the target folder first, while the button click's activation is live.
  const dirHandle = await resolveReportDir('Planting')

  // @ts-ignore
  const { jsPDF } = window.jspdf
  const doc = new jsPDF()
  await setupNotoSans(doc)
  const logo = await loadLogoDataUrl()
  const startY = addCompanyHeader(doc, logo, 'Planting Log Report')

  doc.setFontSize(10)
  doc.text(`Period: ${startDate} to ${endDate}`, 14, startY)

  // @ts-ignore
  doc.autoTable({
    startY: startY + 8,
    head: [['Metric', 'Value']],
    body: [
      ['Total Plantings', data.total.toString()],
      ['Active', data.active.toString()],
      ['Harvested', data.harvested.toString()],
      ['Failed', data.failed.toString()],
    ],
    styles: { font: 'NotoSans', fontSize: 9 },
    headStyles: { fillColor: [34, 139, 34] },
  })

  const sourceLabelPDF = (source: string | null) => {
    if (source === 'direct_sow') return 'Direct Sow'
    if (source === 'self_produced') return 'Self-Produced'
    if (source === 'purchased') return 'Purchased'
    return '—'
  }

  const rows = [...data.logs]
    .sort((a: any, b: any) => (a.crop?.name ?? '').localeCompare(b.crop?.name ?? ''))
    .map((l: any) => [
      `${l.crop?.name ?? '—'}${l.crop?.variety ? ` - ${l.crop.variety}` : ''}`,
      l.plot?.name ?? '—',
      l.plantingDate ? new Date(l.plantingDate).toLocaleDateString('en-GB') : '—',
      `${l.quantityPlanted ?? '—'} ${l.quantityUnit ?? ''}`.trim(),
      l.expectedHarvestDate ? new Date(l.expectedHarvestDate).toLocaleDateString('en-GB') : '—',
      l.status ?? '—',
      sourceLabelPDF(l.plantingSource),
    ])

  // @ts-ignore
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 10,
    head: [['Crop', 'Plot', 'Planting Date', 'Quantity', 'Expected Harvest', 'Status', 'Source']],
    body: rows.length > 0 ? rows : [['No planting data', '', '', '', '', '', '']],
    styles: { font: 'NotoSans', fontSize: 8 },
    headStyles: { fillColor: [34, 139, 34] },
    columnStyles: { 5: { cellWidth: 22 } },
  })

  const fileName = `Planting_Report_${startDate}_to_${endDate}.pdf`
  await savePDF(doc, fileName, dirHandle)
}

export async function exportCropPerformancePDF(data: any[], startDate: string, endDate: string) {
  // Resolve the target folder first, while the button click's activation is live.
  const dirHandle = await resolveReportDir('Crop Performance')

  // @ts-ignore
  const { jsPDF } = window.jspdf
  const doc = new jsPDF()
  await setupNotoSans(doc)
  const logo = await loadLogoDataUrl()
  const startY = addCompanyHeader(doc, logo, 'Crop Performance Report')

  doc.setFontSize(10)
  doc.text(`Period: ${startDate} to ${endDate}`, 14, startY)

  const rows =
    data.length > 0
      ? [...data]
          .sort((a: any, b: any) => a.cropName.localeCompare(b.cropName))
          .map((r: any) => [
            r.cropName,
            r.totalPlantedDisplay ?? r.totalPlanted.toFixed(2),
            r.plantsProduced.toString(),
            r.totalProducedDisplay ?? r.totalProduced.toFixed(2),
            r.totalSalesDisplay ?? r.totalSales.toFixed(2),
            r.differenceDisplay ?? r.difference.toFixed(2),
          ])
      : [['No data', '', '', '', '', '']]

  // @ts-ignore
  doc.autoTable({
    startY: startY + 8,
    head: [
      [
        'Crop Name',
        'Total Planted',
        'Plants Prod.',
        'Total Prod.',
        'Total Sales',
        'Difference (Prod - Sales)',
      ],
    ],
    body: rows,
    styles: { font: 'NotoSans', fontSize: 9 },
    headStyles: { fillColor: [34, 139, 34] },
    columnStyles: {
      5: { halign: 'right' },
      4: { halign: 'right' },
      3: { halign: 'right' },
      2: { halign: 'right' },
      1: { halign: 'right' },
    },
  })

  const fileName = `Crop_Performance_Report_${startDate}_to_${endDate}.pdf`
  await savePDF(doc, fileName, dirHandle)
}

export async function exportSeedlingLifecyclePDF(data: any[], startDate: string, endDate: string) {
  // @ts-ignore
  const { jsPDF } = window.jspdf
  const doc = new jsPDF()
  await setupNotoSans(doc)
  const logo = await loadLogoDataUrl()
  const startY = addCompanyHeader(doc, logo, 'Seedling Lifecycle Report')

  doc.setFontSize(10)
  doc.text(`Period: ${startDate} to ${endDate}`, 14, startY)

  const rows =
    data.length > 0
      ? data.map((r: any) => [
          r.cropName,
          r.sourceLabel ?? '—',
          r.sowingDate ? new Date(r.sowingDate).toLocaleDateString('en-GB') : '—',
          r.sownQty,
          r.produced.toString(),
          Number(r.transplanted).toFixed(0),
          r.harvestUnit
            ? `${Number(r.harvested).toFixed(2)} ${r.harvestUnit}`
            : Number(r.harvested).toFixed(2),
          r.harvestUnit
            ? `${Number(r.sold).toFixed(2)} ${r.harvestUnit}`
            : Number(r.sold).toFixed(2),
          r.remaining.toString(),
        ])
      : [['No data', '', '', '', '', '', '', '', '']]

  // @ts-ignore
  doc.autoTable({
    startY: startY + 8,
    head: [
      [
        'Crop',
        'Source',
        'Sown / Purchased',
        'Sown Qty',
        'Produced',
        'Transplanted',
        'Harvested',
        'Sold',
        'Remaining',
      ],
    ],
    body: rows,
    styles: { font: 'NotoSans', fontSize: 7 },
    headStyles: { fillColor: [34, 139, 34] },
  })

  const fileName = `Seedling_Lifecycle_Report_${startDate}_to_${endDate}.pdf`
  downloadPDF(doc, fileName)
}

export async function exportCropLifecyclePDF(data: any[], startDate: string, endDate: string) {
  // @ts-ignore
  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ orientation: 'landscape' })
  await setupNotoSans(doc)
  const logo = await loadLogoDataUrl()
  const startY = addCompanyHeader(doc, logo, 'Crop Lifecycle Report')

  doc.setFontSize(10)
  doc.text(`Period: ${startDate} to ${endDate}`, 14, startY)

  const rows =
    data.length > 0
      ? data.map((r: any) => [
          r.cropName,
          r.sourceLabel ?? '—',
          r.sowingDate ? new Date(r.sowingDate).toLocaleDateString('en-GB') : '—',
          r.sownQty,
          r.produced !== null && r.produced !== undefined ? r.produced.toString() : '—',
          r.transplanted !== null && r.transplanted !== undefined
            ? Number(r.transplanted).toFixed(0)
            : '—',
          r.harvestUnit
            ? `${Number(r.harvested).toFixed(2)} ${r.harvestUnit}`
            : Number(r.harvested).toFixed(2),
          r.harvestUnit
            ? `${Number(r.sold).toFixed(2)} ${r.harvestUnit}`
            : Number(r.sold).toFixed(2),
          r.remaining !== null && r.remaining !== undefined ? r.remaining.toString() : '—',
        ])
      : [['No data', '', '', '', '', '', '', '', '']]

  // @ts-ignore
  doc.autoTable({
    startY: startY + 8,
    head: [
      [
        'Crop',
        'Source',
        'Date',
        'Qty In',
        'Produced',
        'Transplanted',
        'Harvested',
        'Sold',
        'Remaining',
      ],
    ],
    body: rows,
    styles: { font: 'NotoSans', fontSize: 7 },
    headStyles: { fillColor: [34, 139, 34] },
  })

  const fileName = `Crop_Lifecycle_Report_${startDate}_to_${endDate}.pdf`
  downloadPDF(doc, fileName)
}

export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csv = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = (row as any)[header]
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        })
        .join(',')
    ),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}
