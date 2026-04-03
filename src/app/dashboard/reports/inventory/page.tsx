import { getInventoryReport } from '@/app/actions/reports'
import InventoryReportClient from '@/components/reports/inventory-report-client'

export default async function InventoryReportPage() {
  const data = await getInventoryReport()

  return <InventoryReportClient initialData={data} />
}
