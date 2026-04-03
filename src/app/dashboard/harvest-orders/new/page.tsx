'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { createHarvestOrder } from '@/app/actions/harvest-orders'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NewHarvestOrderPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const today = new Date().toISOString().split('T')[0]!

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = e.currentTarget
    const formData = new FormData(form)
    const data = {
      name: formData.get('name') as string,
      orderDate: formData.get('orderDate') as string,
      notes: (formData.get('notes') as string) || undefined,
    }
    try {
      const order = await createHarvestOrder(data)
      router.push(`/dashboard/harvest-orders/${order!.id}`)
    } catch (err: any) {
      setError(err.message ?? 'Failed to create order batch')
      setLoading(false)
    }
  }

  return (
    <div className="page-animate max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild size="sm">
          <Link href="/dashboard/harvest-orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Order Batch</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Create a batch for this week's SMS harvest round
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Batch Details</CardTitle>
          <CardDescription>
            Give this round a descriptive name so you can find it later
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">Batch Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. 17 March Harvest"
                defaultValue={`Harvest ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="orderDate">Order Date *</Label>
              <Input id="orderDate" name="orderDate" type="date" defaultValue={today} required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Any notes about this harvest round…"
                rows={3}
              />
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Batch & Add Orders
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
