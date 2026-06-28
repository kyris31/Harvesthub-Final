import { getPlantingReport } from '@/app/actions/reports'
import PlantingReportClient from '@/components/reports/planting-report-client'

export default async function PlantingReportPage() {
  // Default to the last 12 months so older plantings aren't hidden
  const endDate = new Date().toISOString().slice(0, 10)
  const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const data = await getPlantingReport(startDate, endDate)

  return (
    <PlantingReportClient
      initialData={data}
      initialStartDate={startDate}
      initialEndDate={endDate}
    />
  )
}
