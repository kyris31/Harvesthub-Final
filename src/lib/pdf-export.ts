'use client'

// PDF Export using CDN-loaded jsPDF
// The libraries are loaded via script tags in the layout

export function exportFinancialReportPDF(data: any, startDate: string, endDate: string) {
  // @ts-ignore - jsPDF loaded from CDN
  const { jsPDF } = window.jspdf
  const doc = new jsPDF()

  // Add title
  doc.setFontSize(20)
  doc.text('Financial Report', 14, 22)

  // Add date range
  doc.setFontSize(10)
  doc.text(`Period: ${startDate} to ${endDate}`, 14, 30)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 35)

  // Add summary
  doc.setFontSize(12)
  doc.text('Summary', 14, 45)

  // @ts-ignore - autoTable from CDN
  doc.autoTable({
    startY: 50,
    head: [['Metric', 'Value']],
    body: [
      ['Total Revenue', `$${data.revenue.total.toFixed(2)}`],
      ['Total Expenses', `$${data.expenses.total.toFixed(2)}`],
      ['Net Profit', `$${data.profit.total.toFixed(2)}`],
      ['Profit Margin', `${data.profit.margin.toFixed(1)}%`],
    ],
  })

  const fileName = `Financial_Report_${startDate}_to_${endDate}.pdf`
  doc.save(fileName)
}

export function exportHarvestReportPDF(data: any, startDate: string, endDate: string) {
  // @ts-ignore
  const { jsPDF } = window.jspdf
  const doc = new jsPDF()

  doc.setFontSize(20)
  doc.text('Harvest Report', 14, 22)

  doc.setFontSize(10)
  doc.text(`Period: ${startDate} to ${endDate}`, 14, 30)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 35)

  doc.setFontSize(12)
  doc.text('Summary', 14, 45)

  // @ts-ignore
  doc.autoTable({
    startY: 50,
    head: [['Metric', 'Value']],
    body: [
      ['Total Yield', `${data.totalYield.toFixed(2)} kg`],
      ['Total Harvests', data.harvestCount.toString()],
      ['Average per Harvest', `${(data.totalYield / data.harvestCount).toFixed(2)} kg`],
    ],
  })

  if (data.harvests.length > 0) {
    const harvestData = data.harvests
      .slice(0, 20)
      .map((h: any) => [
        new Date(h.harvestDate).toLocaleDateString(),
        `${Number(h.quantityHarvested).toFixed(2)} ${h.quantityUnit}`,
        `${Number(h.currentStock).toFixed(2)} ${h.quantityUnit}`,
        h.qualityGrade || 'N/A',
      ])

    // @ts-ignore
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Date', 'Harvested', 'Current Stock', 'Grade']],
      body: harvestData,
    })
  }

  const fileName = `Harvest_Report_${startDate}_to_${endDate}.pdf`
  doc.save(fileName)
}

export function exportInventoryReportPDF(data: any) {
  // @ts-ignore
  const { jsPDF } = window.jspdf
  const doc = new jsPDF()

  doc.setFontSize(20)
  doc.text('Inventory Report', 14, 22)

  doc.setFontSize(10)
  const today = new Date().toISOString().split('T')[0]
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30)

  doc.setFontSize(12)
  doc.text('Summary', 14, 40)

  // @ts-ignore
  doc.autoTable({
    startY: 45,
    head: [['Metric', 'Value']],
    body: [
      ['Total Inventory Value', `$${data.totalValue.toFixed(2)}`],
      ['Low Stock Items', data.lowStockCount.toString()],
      ['Seeds Value', `$${data.seeds.totalValue.toFixed(2)}`],
      ['Inputs Value', `$${data.inputs.totalValue.toFixed(2)}`],
      ['Seedlings Value', `$${data.seedlings.totalValue.toFixed(2)}`],
    ],
  })

  if (data.seeds.items.length > 0) {
    const seedsData = data.seeds.items
      .slice(0, 15)
      .map((s: any) => [
        s.batchCode,
        `${s.currentQuantity} ${s.quantityUnit}`,
        `$${(s.currentQuantity * Number(s.costPerUnit || 0)).toFixed(2)}`,
      ])

    doc.addPage()
    doc.setFontSize(12)
    doc.text('Seeds Inventory', 14, 20)

    // @ts-ignore
    doc.autoTable({
      startY: 25,
      head: [['Batch Code', 'Quantity', 'Value']],
      body: seedsData,
    })
  }

  if (data.inputs.items.length > 0) {
    const inputsData = data.inputs.items
      .slice(0, 15)
      .map((i: any) => [
        i.name,
        i.type,
        `${i.currentQuantity || 0} ${i.quantityUnit || ''}`,
        `$${(Number(i.currentQuantity || 0) * Number(i.costPerUnit || 0)).toFixed(2)}`,
      ])

    if (data.seeds.items.length === 0) {
      doc.addPage()
    }

    // @ts-ignore
    const startY = data.seeds.items.length > 0 ? doc.lastAutoTable.finalY + 15 : 25
    doc.setFontSize(12)
    doc.text('Inputs Inventory', 14, startY - 5)

    // @ts-ignore
    doc.autoTable({
      startY: startY,
      head: [['Name', 'Type', 'Quantity', 'Value']],
      body: inputsData,
    })
  }

  const fileName = `Inventory_Report_${today}.pdf`
  doc.save(fileName)
}

export function exportCultivationReportPDF(data: any, startDate: string, endDate: string) {
  // @ts-ignore
  const { jsPDF } = window.jspdf
  const doc = new jsPDF()

  doc.setFontSize(20)
  doc.text('Cultivation Report', 14, 22)

  doc.setFontSize(10)
  doc.text(`Period: ${startDate} to ${endDate}`, 14, 30)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 35)

  doc.setFontSize(12)
  doc.text('Summary', 14, 45)

  // @ts-ignore
  doc.autoTable({
    startY: 50,
    head: [['Metric', 'Value']],
    body: [
      ['Total Activities', data.totalActivities.toString()],
      ['Total Cost', `$${data.totalCost.toFixed(2)}`],
      ['Average Cost', `$${(data.totalCost / data.totalActivities).toFixed(2)}`],
    ],
  })

  const activityData = Object.entries(data.activityByType).map(([type, stats]: [string, any]) => [
    type.replace('_', ' ').toUpperCase(),
    stats.count.toString(),
    `$${stats.totalCost.toFixed(2)}`,
    `$${(stats.totalCost / stats.count).toFixed(2)}`,
  ])

  // @ts-ignore
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 10,
    head: [['Activity Type', 'Count', 'Total Cost', 'Avg Cost']],
    body: activityData,
  })

  if (data.activities.length > 0) {
    const activitiesData = data.activities
      .slice(0, 15)
      .map((a: any) => [
        new Date(a.activityDate).toLocaleDateString(),
        a.activityType.replace('_', ' '),
        a.quantityUsed ? `${a.quantityUsed} ${a.quantityUnit}` : 'N/A',
        a.cost ? `$${Number(a.cost).toFixed(2)}` : 'N/A',
      ])

    doc.addPage()
    doc.setFontSize(12)
    doc.text('Recent Activities', 14, 20)

    // @ts-ignore
    doc.autoTable({
      startY: 25,
      head: [['Date', 'Type', 'Quantity', 'Cost']],
      body: activitiesData,
    })
  }

  const fileName = `Cultivation_Report_${startDate}_to_${endDate}.pdf`
  doc.save(fileName)
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
