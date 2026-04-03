import { CalendarView } from './calendar-view'
import { getCalendarEvents } from '@/app/actions/planning'

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>
}) {
  const { year: yearStr, month: monthStr } = await searchParams
  const now = new Date()
  const year = yearStr ? parseInt(yearStr) : now.getFullYear()
  const month = monthStr ? parseInt(monthStr) : now.getMonth() + 1

  const events = await getCalendarEvents(year, month)

  return <CalendarView year={year} month={month} events={events} />
}
