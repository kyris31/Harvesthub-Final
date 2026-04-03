import { getCustomer } from '@/app/actions/customers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Edit, ArrowLeft, Mail, Phone, MapPin } from 'lucide-react'
import { notFound } from 'next/navigation'

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const customer = await getCustomer(id).catch(() => null)

  if (!customer) notFound()

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/customers">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Customers
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
          <Badge variant="outline" className="capitalize">
            {customer.customerType}
          </Badge>
        </div>
        <Button asChild>
          <Link href={`/dashboard/customers/${customer.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Customer
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {customer.email && (
            <div className="flex items-center gap-2">
              <Mail className="text-muted-foreground h-4 w-4" />
              <span>{customer.email}</span>
            </div>
          )}
          {customer.phone && (
            <div className="flex items-center gap-2">
              <Phone className="text-muted-foreground h-4 w-4" />
              <span>{customer.phone}</span>
            </div>
          )}
          {customer.address && (
            <div className="flex items-start gap-2">
              <MapPin className="text-muted-foreground mt-0.5 h-4 w-4" />
              <span>{customer.address}</span>
            </div>
          )}
          {customer.notes && (
            <div className="mt-4 border-t pt-4">
              <p className="mb-2 text-sm font-medium">Notes</p>
              <p className="text-muted-foreground">{customer.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {customer.sales && customer.sales.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              {customer.sales.length} sale{customer.sales.length !== 1 && 's'} recorded
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
