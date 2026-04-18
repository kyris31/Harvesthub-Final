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
  downloadPDF(doc, fileName)
}

export async function exportHarvestReportPDF(data: any, startDate: string, endDate: string) {
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
    const cropName = h.plantingLog?.crop?.name ?? 'Unknown'
    const variety = h.plantingLog?.crop?.variety ?? ''
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
  downloadPDF(doc, fileName)
}

export async function exportInventoryReportPDF(data: any) {
  // @ts-ignore
  const { jsPDF } = window.jspdf
  const doc = new jsPDF()
  await setupNotoSans(doc)
  const logo = await loadLogoDataUrl()
  const today = new Date().toISOString().split('T')[0]
  const startY = addCompanyHeader(doc, logo, 'Inventory Report')

  // Summary table
  // @ts-ignore
  doc.autoTable({
    startY,
    head: [['Metric', 'Value']],
    body: [
      ['Total Inventory Value', `€${data.totalValue.toFixed(2)}`],
      ['Low Stock Items', data.lowStockCount.toString()],
      ['Seeds Value', `€${data.seeds.totalValue.toFixed(2)}`],
      ['Inputs Value', `€${data.inputs.totalValue.toFixed(2)}`],
      ['Seedlings Value', `€${data.seedlings.totalValue.toFixed(2)}`],
    ],
    styles: { font: 'NotoSans', fontSize: 9 },
    headStyles: { fillColor: [34, 139, 34] },
  })

  if (data.seeds.items.length > 0) {
    const sourceLabel = (sourceType: string | null) => {
      if (sourceType === 'self_produced') return 'Self-Produced'
      if (sourceType === 'purchased') return 'Purchased'
      return '—'
    }

    const seedsData = data.seeds.items.map((s: any) => [
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

  if (data.inputs.items.length > 0) {
    const inputsData = data.inputs.items.map((i: any) => [
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

  const fileName = `Inventory_Report_${today}.pdf`
  downloadPDF(doc, fileName)
}

export async function exportCultivationReportPDF(data: any, startDate: string, endDate: string) {
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
    const inputQtys =
      inputs.length > 0 ? inputs.map((ai: any) => ai.quantityUsed ?? '—').join('\n') : '—'
    const inputUnits =
      inputs.length > 0 ? inputs.map((ai: any) => ai.quantityUnit ?? '—').join('\n') : '—'

    tableRows.push([date, activityLabel, inputNames, inputQtys, inputUnits, crops, plots])
  }

  if (tableRows.length > 0) {
    doc.addPage()
    const inputPageY = addCompanyHeader(doc, logo, 'Detailed Input Usage Report')

    // @ts-ignore
    doc.autoTable({
      startY: inputPageY,
      head: [['Date', 'Activity', 'Input Item', 'Qty', 'Unit', 'Crop', 'Plot']],
      body: tableRows,
      styles: { font: 'NotoSans', fontSize: 9, fillColor: [220, 245, 220] },
      headStyles: { fillColor: [34, 139, 34] },
      bodyStyles: { fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 22, fontStyle: 'bold' },
        1: { cellWidth: 22, fontStyle: 'bold' },
        2: { cellWidth: 42, fontStyle: 'normal' },
        3: { cellWidth: 14, fontStyle: 'normal' },
        4: { cellWidth: 10, fontStyle: 'normal' },
        5: { cellWidth: 45, fontStyle: 'normal' },
        6: { cellWidth: 35, fontStyle: 'normal' },
      },
    })
  }

  const fileName = `Cultivation_Report_${startDate}_to_${endDate}.pdf`
  downloadPDF(doc, fileName)
}

export async function exportPlantingReportPDF(data: any, startDate: string, endDate: string) {
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

  const rows = data.logs.map((l: any) => [
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
  downloadPDF(doc, fileName)
}

export async function exportCropPerformancePDF(data: any[], startDate: string, endDate: string) {
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
      ? data.map((r: any) => [
          r.cropName,
          r.totalPlanted.toFixed(2),
          r.plantsProduced.toString(),
          r.totalProduced.toFixed(2),
          r.totalSales.toFixed(2),
          r.difference.toFixed(2),
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
  downloadPDF(doc, fileName)
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
          Number(r.harvested).toFixed(2),
          Number(r.sold).toFixed(2),
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
          Number(r.harvested).toFixed(2),
          Number(r.sold).toFixed(2),
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
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}
