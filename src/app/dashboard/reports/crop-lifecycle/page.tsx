import { getCropLifecycleReport } from '@/app/actions/reports'
import CropLifecycleClient from '@/components/reports/crop-lifecycle-client'

export default async function CropLifecyclePage() {
  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const data = await getCropLifecycleReport(startDate, endDate)

  return (
    <CropLifecycleClient initialData={data} initialStartDate={startDate} initialEndDate={endDate} />
  )
}
