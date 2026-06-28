import { getUserSettings } from '@/app/actions/settings'
import { VatSettings } from '@/components/settings/vat-settings'

export default async function SettingsPage() {
  const settings = await getUserSettings()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage how your farm data is calculated</p>
      </div>

      <VatSettings vatRegistered={settings.vatRegistered} />
    </div>
  )
}
