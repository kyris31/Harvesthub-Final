import { getSalesReport } from '@/app/actions/reports'
import SalesReportClient from '@/components/reports/sales-report-client'

export default async function SalesReportPage() {
  // Default to the last 12 months so older sales aren't hidden
  const endDate = new Date().toISOString().slice(0, 10)
  const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const data = await getSalesReport(startDate, endDate)

  return (
    <SalesReportClient initialData={data} initialStartDate={startDate} initialEndDate={endDate} />
  )
}
