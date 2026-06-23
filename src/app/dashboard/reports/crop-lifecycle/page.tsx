import { getCropLifecycleReport } from '@/app/actions/reports'
import CropLifecycleClient from '@/components/reports/crop-lifecycle-client'

export default async function CropLifecyclePage() {
  const endDate = new Date().toISOString().slice(0, 10)
  const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const data = await getCropLifecycleReport(startDate, endDate)

  return (
    <CropLifecycleClient initialData={data} initialStartDate={startDate} initialEndDate={endDate} />
  )
}
