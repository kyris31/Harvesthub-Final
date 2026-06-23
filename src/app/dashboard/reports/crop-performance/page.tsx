import { getCropPerformanceReport } from '@/app/actions/reports'
import CropPerformanceClient from '@/components/reports/crop-performance-client'

export default async function CropPerformancePage() {
  const endDate = new Date().toISOString().slice(0, 10)
  const startDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const data = await getCropPerformanceReport(startDate, endDate)

  return (
    <CropPerformanceClient
      initialData={data}
      initialStartDate={startDate}
      initialEndDate={endDate}
    />
  )
}
