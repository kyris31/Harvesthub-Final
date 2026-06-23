import { getPlantingReport } from '@/app/actions/reports'
import PlantingReportClient from '@/components/reports/planting-report-client'

export default async function PlantingReportPage() {
  const endDate = new Date().toISOString().slice(0, 10)
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const data = await getPlantingReport(startDate, endDate)

  return (
    <PlantingReportClient
      initialData={data}
      initialStartDate={startDate}
      initialEndDate={endDate}
    />
  )
}
