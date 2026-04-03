import { FlockForm } from '@/components/poultry/flock-form'

export default function NewFlockPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New Flock</h1>
        <p className="text-muted-foreground">
          Create a new flock to start tracking production and health
        </p>
      </div>

      <FlockForm />
    </div>
  )
}
