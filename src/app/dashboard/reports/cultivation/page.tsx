import { getCultivationReport } from '@/app/actions/reports'
import CultivationReportClient from '@/components/reports/cultivation-report-client'

export default async function CultivationReportPage() {
  // Get last 30 days data
  const endDate = new Date().toISOString().slice(0, 10)
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const data = await getCultivationReport(startDate, endDate)

  return <CultivationReportClient initialData={data} />
}
