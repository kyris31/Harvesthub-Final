'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { History, User, Calendar } from 'lucide-react'

interface AuditLogEntry {
  id: string
  action: string
  changes: string | null
  timestamp: Date
  user: {
    id: string
    name: string | null
  }
}

interface AuditHistoryProps {
  auditLog: AuditLogEntry[]
}

export function AuditHistory({ auditLog }: AuditHistoryProps) {
  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      created: 'Invoice Created',
      updated: 'Invoice Updated',
      processed: 'Invoice Processed',
      unprocessed: 'Invoice Unprocessed',
      payment_added: 'Payment Added',
      payment_deleted: 'Payment Deleted',
    }
    return labels[action] || action
  }

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      created: 'bg-blue-500',
      updated: 'bg-yellow-500',
      processed: 'bg-green-500',
      unprocessed: 'bg-orange-500',
      payment_added: 'bg-purple-500',
      payment_deleted: 'bg-red-500',
    }
    return colors[action] || 'bg-gray-500'
  }

  const formatChanges = (changesStr: string | null) => {
    if (!changesStr) return null

    try {
      const changes = JSON.parse(changesStr)
      return (
        <div className="text-muted-foreground mt-2 space-y-1 text-sm">
          {Object.entries(changes).map(([key, value]) => (
            <div key={key} className="flex gap-2">
              <span className="font-medium capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}:
              </span>
              <span>{String(value)}</span>
            </div>
          ))}
        </div>
      )
    } catch {
      return null
    }
  }

  if (auditLog.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Audit History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground py-8 text-center">
            <History className="mx-auto mb-3 h-12 w-12 opacity-50" />
            <p>No audit history available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Audit History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {auditLog.map((entry, index) => (
            <div
              key={entry.id}
              className={`border-l-4 py-3 pl-4 ${
                index !== auditLog.length - 1 ? 'border-b pb-4' : ''
              }`}
              style={{ borderLeftColor: `var(--${getActionColor(entry.action)})` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge className={getActionColor(entry.action)}>
                      {getActionLabel(entry.action)}
                    </Badge>
                    <span className="text-muted-foreground text-sm">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <User className="h-3 w-3" />
                    <span>{entry.user.name || 'Unknown User'}</span>
                  </div>

                  {formatChanges(entry.changes)}
                </div>

                <Calendar className="text-muted-foreground h-4 w-4" />
              </div>
            </div>
          ))}
        </div>

        <div className="text-muted-foreground mt-4 border-t pt-4 text-center text-xs">
          {auditLog.length} {auditLog.length === 1 ? 'entry' : 'entries'} • Showing all activity
        </div>
      </CardContent>
    </Card>
  )
}
