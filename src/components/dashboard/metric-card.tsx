import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    label: string
  }
  className?: string
}

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: MetricCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="text-muted-foreground h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-muted-foreground mt-1 text-xs">{description}</p>}
        {trend && (
          <div className="flex items-center pt-1">
            <span
              className={cn(
                'text-xs font-medium',
                trend.value > 0
                  ? 'text-green-600'
                  : trend.value < 0
                    ? 'text-red-600'
                    : 'text-muted-foreground'
              )}
            >
              {trend.value > 0 && '+'}
              {trend.value}%
            </span>
            <span className="text-muted-foreground ml-1 text-xs">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
