import { getHarvestReport } from '@/app/actions/reports'
import HarvestReportClient from '@/components/reports/harvest-report-client'

export default async function HarvestReportPage() {
  // Get last 30 days data
  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const data = await getHarvestReport(startDate, endDate)

  return <HarvestReportClient initialData={data} />
}
