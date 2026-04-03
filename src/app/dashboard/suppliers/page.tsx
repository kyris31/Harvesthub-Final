import { getSuppliers } from '@/app/actions/suppliers'
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
import { Plus, Edit } from 'lucide-react'
import Link from 'next/link'

export default async function SuppliersPage() {
  const suppliers = await getSuppliers()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground">Manage your farm suppliers</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/suppliers/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Suppliers</CardTitle>
          <CardDescription>{suppliers.length} suppliers</CardDescription>
        </CardHeader>
        <CardContent>
          {suppliers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">No suppliers yet. Add your first supplier!</p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/suppliers/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Supplier
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/suppliers/${supplier.id}`}
                        className="hover:underline"
                      >
                        {supplier.name}
                      </Link>
                    </TableCell>
                    <TableCell>{supplier.supplierType || '-'}</TableCell>
                    <TableCell className="text-sm">
                      {supplier.email || supplier.phone || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/suppliers/${supplier.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
