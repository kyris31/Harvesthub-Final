import { getProfitabilityReport } from '@/app/actions/reports'
import ProfitabilityReportClient from '@/components/reports/profitability-report-client'

export default async function ProfitabilityReportPage() {
  // Default to the last 12 months so older plantings/trees aren't hidden
  const endDate = new Date().toISOString().slice(0, 10)
  const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const report = await getProfitabilityReport(startDate, endDate)

  return (
    <ProfitabilityReportClient
      initialData={report}
      initialStartDate={startDate}
      initialEndDate={endDate}
    />
  )
}
