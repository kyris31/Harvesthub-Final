import { getHarvestReport } from '@/app/actions/reports'
import HarvestReportClient from '@/components/reports/harvest-report-client'

export default async function HarvestReportPage() {
  // Default to the last 12 months so older harvests aren't hidden
  const endDate = new Date().toISOString().slice(0, 10)
  const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const data = await getHarvestReport(startDate, endDate)

  return (
    <HarvestReportClient initialData={data} initialStartDate={startDate} initialEndDate={endDate} />
  )
}
