import { getCultivationReport } from '@/app/actions/reports'
import CultivationReportClient from '@/components/reports/cultivation-report-client'

export default async function CultivationReportPage() {
  // Default to the last 12 months so older activities aren't hidden
  const endDate = new Date().toISOString().slice(0, 10)
  const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const data = await getCultivationReport(startDate, endDate)

  return (
    <CultivationReportClient
      initialData={data}
      initialStartDate={startDate}
      initialEndDate={endDate}
    />
  )
}
