import { getInputInventory } from '@/app/actions/input-inventory'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Edit, Wrench } from 'lucide-react'
import Link from 'next/link'
import { InputInventoryDeleteButton } from '@/components/inventory/input-inventory-delete-button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default async function InputsInventoryPage({
  searchParams,
}: {
  searchParams: { category?: string }
}) {
  const { category } = await searchParams
  const allInputs = await getInputInventory()

  // Filter by category if selected
  const inputs =
    category && category !== 'all' ? allInputs.filter((item) => item.type === category) : allInputs

  // Calculate low stock items
  const lowStockCount = inputs.filter((item) => {
    if (!item.minimumStockLevel) return false
    return parseFloat(item.currentQuantity) < parseFloat(item.minimumStockLevel)
  }).length

  // Count by type
  const typeCount = allInputs.reduce(
    (acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inputs Inventory</h1>
          <p className="text-muted-foreground">
            Manage fertilizers, pesticides, tools, and other farm inputs
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/inventory/inputs/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Input Item
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Wrench className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allInputs.length}</div>
            <p className="text-muted-foreground mt-1 text-xs">
              {category && category !== 'all' ? `Showing ${inputs.length} filtered` : 'All items'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <Wrench className="text-destructive h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-destructive text-2xl font-bold">{lowStockCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fertilizers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{typeCount.fertilizer || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pesticides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{typeCount.pesticide || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Inputs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Input Items</CardTitle>
              <CardDescription>
                {inputs.length} {inputs.length === 1 ? 'item' : 'items'} in inventory
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select defaultValue={category || 'all'}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <Link href="/dashboard/inventory/inputs" className="block w-full">
                      All Categories
                    </Link>
                  </SelectItem>
                  <SelectItem value="seeds">
                    <Link
                      href="/dashboard/inventory/inputs?category=seeds"
                      className="block w-full"
                    >
                      Seeds
                    </Link>
                  </SelectItem>
                  <SelectItem value="fertilizer">
                    <Link
                      href="/dashboard/inventory/inputs?category=fertilizer"
                      className="block w-full"
                    >
                      Fertilizer
                    </Link>
                  </SelectItem>
                  <SelectItem value="pesticide">
                    <Link
                      href="/dashboard/inventory/inputs?category=pesticide"
                      className="block w-full"
                    >
                      Pesticide
                    </Link>
                  </SelectItem>
                  <SelectItem value="equipment">
                    <Link
                      href="/dashboard/inventory/inputs?category=equipment"
                      className="block w-full"
                    >
                      Equipment
                    </Link>
                  </SelectItem>
                  <SelectItem value="other">
                    <Link
                      href="/dashboard/inventory/inputs?category=other"
                      className="block w-full"
                    >
                      Other
                    </Link>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {inputs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">
                {category && category !== 'all'
                  ? `No ${category} items yet.`
                  : 'No input items yet. Add your first item or process an invoice to get started!'}
              </p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/inventory/inputs/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Item
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Min. Level</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inputs.map((item) => {
                  const isLowStock =
                    item.minimumStockLevel &&
                    parseFloat(item.currentQuantity) < parseFloat(item.minimumStockLevel)

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/dashboard/inventory/inputs/${item.id}`}
                          className="hover:underline"
                        >
                          {item.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {item.type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={isLowStock ? 'text-destructive font-medium' : ''}>
                          {item.currentQuantity} {item.quantityUnit}
                          {isLowStock && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              Low
                            </Badge>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        {item.minimumStockLevel
                          ? `${item.minimumStockLevel} ${item.quantityUnit}`
                          : '-'}
                      </TableCell>
                      <TableCell>{item.supplier?.name || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/inventory/inputs/${item.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <InputInventoryDeleteButton id={item.id} name={item.name} />
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
