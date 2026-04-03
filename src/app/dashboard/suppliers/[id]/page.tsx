import { getSupplier } from '@/app/actions/suppliers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Edit, ArrowLeft, Mail, Phone, MapPin } from 'lucide-react'
import { notFound } from 'next/navigation'

export default async function SupplierDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const supplier = await getSupplier(id).catch(() => null)
  if (!supplier) notFound()

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/suppliers">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Suppliers
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{supplier.name}</h1>
          {supplier.supplierType && (
            <p className="text-muted-foreground">{supplier.supplierType}</p>
          )}
        </div>
        <Button asChild>
          <Link href={`/dashboard/suppliers/${supplier.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Supplier
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {supplier.email && (
            <div className="flex items-center gap-2">
              <Mail className="text-muted-foreground h-4 w-4" />
              <span>{supplier.email}</span>
            </div>
          )}
          {supplier.phone && (
            <div className="flex items-center gap-2">
              <Phone className="text-muted-foreground h-4 w-4" />
              <span>{supplier.phone}</span>
            </div>
          )}
          {supplier.address && (
            <div className="flex items-start gap-2">
              <MapPin className="text-muted-foreground mt-0.5 h-4 w-4" />
              <span>{supplier.address}</span>
            </div>
          )}
          {supplier.notes && (
            <div className="mt-4 border-t pt-4">
              <p className="mb-2 text-sm font-medium">Notes</p>
              <p className="text-muted-foreground">{supplier.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
