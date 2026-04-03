'use client'

import { Badge } from '@/components/ui/badge'
import { PLANTING_STATUS } from '@/lib/schemas/planting-schema'

interface PlantingStatusBadgeProps {
  status: string
}

export function PlantingStatusBadge({ status }: PlantingStatusBadgeProps) {
  const statusInfo = PLANTING_STATUS.find((s) => s.value === status) || PLANTING_STATUS[0]

  const colorMap: Record<string, string> = {
    green: 'bg-green-100 text-green-800 hover:bg-green-100',
    blue: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    red: 'bg-red-100 text-red-800 hover:bg-red-100',
    gray: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
  }

  const iconMap: Record<string, string> = {
    active: '🌱',
    harvested: '✅',
    failed: '❌',
    completed: '📦',
  }

  return (
    <Badge variant="secondary" className={colorMap[statusInfo.color]}>
      <span className="mr-1">{iconMap[status]}</span>
      {statusInfo.label}
    </Badge>
  )
}
