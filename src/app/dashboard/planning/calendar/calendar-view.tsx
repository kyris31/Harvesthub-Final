'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Sprout, Scissors, Plus } from 'lucide-react'
import Link from 'next/link'

interface CalendarEvent {
  id: string
  date: string
  type: 'planting' | 'harvest'
  cropName: string
  plotName: string | null
  seasonName: string | null
  status: string
  planId: string
}

interface Props {
  year: number
  month: number
  events: CalendarEvent[]
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function CalendarView({ year, month, events }: Props) {
  const router = useRouter()

  // Navigation
  function goTo(y: number, m: number) {
    router.push(`/dashboard/planning/calendar?year=${y}&month=${m}`)
  }
  function prev() {
    if (month === 1) goTo(year - 1, 12)
    else goTo(year, month - 1)
  }
  function next() {
    if (month === 12) goTo(year + 1, 1)
    else goTo(year, month + 1)
  }
  function today() {
    const now = new Date()
    goTo(now.getFullYear(), now.getMonth() + 1)
  }

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const daysInMonth = lastDay.getDate()

  // Monday = 0, Sunday = 6
  let startDow = (firstDay.getDay() - 1 + 7) % 7

  const days: (number | null)[] = []
  for (let i = 0; i < startDow; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)
  while (days.length % 7 !== 0) days.push(null)

  // Group events by date
  const eventsByDate = events.reduce<Record<string, CalendarEvent[]>>((acc, ev) => {
    if (!acc[ev.date]) acc[ev.date] = []
    acc[ev.date]!.push(ev)
    return acc
  }, {})

  const todayStr = new Date().toISOString().split('T')[0]

  const plantingCount = events.filter((e) => e.type === 'planting').length
  const harvestCount = events.filter((e) => e.type === 'harvest').length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Planning Calendar</h1>
          <p className="text-muted-foreground">Visualise your planting and harvest schedule</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/planning/plans/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Plan
          </Link>
        </Button>
      </div>

      {/* Legend & stats */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span>
            {plantingCount} planting{plantingCount !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="h-3 w-3 rounded-full bg-orange-400" />
          <span>
            {harvestCount} harvest{harvestCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={prev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="min-w-[180px] text-center text-xl">
              {MONTH_NAMES[month - 1]} {year}
            </CardTitle>
            <Button variant="outline" size="icon" onClick={next}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={today}>
            Today
          </Button>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="mb-2 grid grid-cols-7">
            {DAY_NAMES.map((d) => (
              <div key={d} className="text-muted-foreground py-2 text-center text-xs font-medium">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 border-t border-l">
            {days.map((day, i) => {
              const dateStr = day
                ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                : ''
              const dayEvents = day ? (eventsByDate[dateStr] ?? []) : []
              const isToday = dateStr === todayStr
              const isWeekend = i % 7 >= 5

              return (
                <div
                  key={i}
                  className={`min-h-[90px] border-r border-b p-1.5 ${!day ? 'bg-muted/20' : ''} ${isWeekend && day ? 'bg-slate-50/50' : ''}`}
                >
                  {day && (
                    <>
                      <div
                        className={`mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}
                      >
                        {day}
                      </div>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 3).map((ev) => (
                          <div
                            key={ev.id}
                            className={`flex items-center gap-1 truncate rounded px-1 py-0.5 text-xs ${
                              ev.type === 'planting'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}
                            title={`${ev.type === 'planting' ? '🌱 Plant' : '✂️ Harvest'}: ${ev.cropName}${ev.plotName ? ` @ ${ev.plotName}` : ''}`}
                          >
                            {ev.type === 'planting' ? (
                              <Sprout className="h-2.5 w-2.5 shrink-0" />
                            ) : (
                              <Scissors className="h-2.5 w-2.5 shrink-0" />
                            )}
                            <span className="truncate">{ev.cropName}</span>
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-muted-foreground pl-1 text-xs">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Event list for the month */}
      {events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Events in {MONTH_NAMES[month - 1]}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {events
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((ev) => (
                  <div key={ev.id} className="flex items-center gap-3 rounded-lg border p-2">
                    <div
                      className={`h-2 w-2 shrink-0 rounded-full ${ev.type === 'planting' ? 'bg-green-500' : 'bg-orange-400'}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {ev.type === 'planting' ? '🌱 Plant' : '✂️ Harvest'}: {ev.cropName}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {ev.plotName ?? 'No plot'}
                        {ev.seasonName ? ` · ${ev.seasonName}` : ''}
                      </p>
                    </div>
                    <span className="text-muted-foreground shrink-0 text-sm">{ev.date}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
