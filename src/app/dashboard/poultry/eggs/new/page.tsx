import { EggProductionForm } from '@/components/poultry/egg-production-form'

export default function NewEggProductionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Record Egg Collection</h1>
        <p className="text-muted-foreground">Track today's egg production</p>
      </div>

      <EggProductionForm />
    </div>
  )
}
