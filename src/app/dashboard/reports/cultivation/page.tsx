import { getCultivationReport } from '@/app/actions/reports'
import CultivationReportClient from '@/components/reports/cultivation-report-client'

export default async function CultivationReportPage() {
  // Get last 30 days data
  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const data = await getCultivationReport(startDate, endDate)

  return <CultivationReportClient initialData={data} />
}
