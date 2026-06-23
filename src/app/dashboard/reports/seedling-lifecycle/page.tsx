import { getSeedlingLifecycleReport } from '@/app/actions/reports'
import SeedlingLifecycleClient from '@/components/reports/seedling-lifecycle-client'

export default async function SeedlingLifecyclePage() {
  const endDate = new Date().toISOString().slice(0, 10)
  const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const data = await getSeedlingLifecycleReport(startDate, endDate)

  return (
    <SeedlingLifecycleClient
      initialData={data}
      initialStartDate={startDate}
      initialEndDate={endDate}
    />
  )
}
