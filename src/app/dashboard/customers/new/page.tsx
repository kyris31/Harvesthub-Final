import { CustomerForm } from '@/components/business/customer-form'

export default function NewCustomerPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Customer</h1>
        <p className="text-muted-foreground">Add a new customer to your records</p>
      </div>
      <CustomerForm mode="create" />
    </div>
  )
}
