import { getFinancialReport } from '@/app/actions/reports'
import FinancialReportClient from '@/components/reports/financial-report-client'

export default async function FinancialReportPage() {
  // Get last 30 days data
  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const data = await getFinancialReport(startDate, endDate)

  return <FinancialReportClient initialData={data} />
}
