import { getCustomer } from '@/app/actions/customers'
import { CustomerForm } from '@/components/business/customer-form'
import { notFound } from 'next/navigation'

export default async function EditCustomerPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const customer = await getCustomer(id).catch(() => null)

  if (!customer) notFound()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Customer</h1>
        <p className="text-muted-foreground">Update {customer.name} details</p>
      </div>
      <CustomerForm
        mode="edit"
        defaultValues={{
          id: customer.id,
          name: customer.name,
          customerType: customer.customerType as 'individual' | 'business',
          email: customer.email || '',
          phone: customer.phone || '',
          address: customer.address || '',
          notes: customer.notes || '',
        }}
      />
    </div>
  )
}
