import { getAllBroilerFlocksSummary } from '@/app/actions/broiler-processing'
import BroilerReportClient from '@/components/reports/broiler-report-client'

export default async function BroilerReportPage() {
  // Default to the last 12 months so older flocks aren't hidden
  const endDate = new Date().toISOString().slice(0, 10)
  const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const flocks = await getAllBroilerFlocksSummary(startDate, endDate)

  return (
    <BroilerReportClient
      initialData={flocks}
      initialStartDate={startDate}
      initialEndDate={endDate}
    />
  )
}
