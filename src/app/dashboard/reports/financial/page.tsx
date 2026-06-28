import { getFinancialReport } from '@/app/actions/reports'
import FinancialReportClient from '@/components/reports/financial-report-client'

export default async function FinancialReportPage() {
  // Default to the last 12 months so older transactions aren't hidden
  const endDate = new Date().toISOString().slice(0, 10)
  const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const data = await getFinancialReport(startDate, endDate)

  return (
    <FinancialReportClient
      initialData={data}
      initialStartDate={startDate}
      initialEndDate={endDate}
    />
  )
}
