import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Package, Sprout } from 'lucide-react'

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
        <p className="text-muted-foreground">Manage all your farm inventory</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              <CardTitle>Input Inventory</CardTitle>
            </div>
            <CardDescription>Fertilizers, pesticides, tools, and farm supplies</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/inventory/inputs">View Input Inventory</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sprout className="h-5 w-5" />
              <CardTitle>Seed Batches</CardTitle>
            </div>
            <CardDescription>Manage seed inventory and batches</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/inventory/seed-batches">View Seed Batches</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sprout className="h-5 w-5" />
              <CardTitle>Seedlings</CardTitle>
            </div>
            <CardDescription>Purchased seedling inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/inventory/seedlings">View Seedlings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
