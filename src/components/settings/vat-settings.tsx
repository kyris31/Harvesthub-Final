'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { updateVatRegistration, recalculateInventoryCosts } from '@/app/actions/settings'

export function VatSettings({ vatRegistered }: { vatRegistered: boolean }) {
  // 'inclusive' = not VAT-registered, 'net' = VAT-registered
  const [mode, setMode] = useState<'inclusive' | 'net'>(vatRegistered ? 'net' : 'inclusive')
  const [isSaving, setIsSaving] = useState(false)
  const [isRecalculating, setIsRecalculating] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { updated } = await updateVatRegistration(mode === 'net')
      toast.success(`Saved. Recalculated ${updated} inventory ${updated === 1 ? 'item' : 'items'}.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRecalculate = async () => {
    setIsRecalculating(true)
    try {
      const { updated } = await recalculateInventoryCosts()
      toast.success(`Recalculated ${updated} inventory ${updated === 1 ? 'item' : 'items'}.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Recalculation failed')
    } finally {
      setIsRecalculating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>VAT &amp; Costing</CardTitle>
        <CardDescription>
          Choose how VAT is treated when supplier invoices create inventory costs. This affects the
          cost per unit used in cultivation and reports.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          value={mode}
          onValueChange={(v) => setMode(v as 'inclusive' | 'net')}
          className="gap-4"
        >
          <div className="flex items-start gap-3 rounded-md border p-4">
            <RadioGroupItem value="inclusive" id="vat-inclusive" className="mt-1" />
            <div className="space-y-1">
              <Label htmlFor="vat-inclusive" className="cursor-pointer font-medium">
                Not VAT-registered
              </Label>
              <p className="text-muted-foreground text-sm">
                VAT can&apos;t be reclaimed, so it&apos;s part of your real cost. Material costs are
                stored <strong>VAT-inclusive</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-md border p-4">
            <RadioGroupItem value="net" id="vat-net" className="mt-1" />
            <div className="space-y-1">
              <Label htmlFor="vat-net" className="cursor-pointer font-medium">
                VAT-registered
              </Label>
              <p className="text-muted-foreground text-sm">
                VAT is reclaimable, so material costs are stored <strong>net (ex-VAT)</strong>.
              </p>
            </div>
          </div>
        </RadioGroup>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleSave} disabled={isSaving || isRecalculating}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save &amp; recalculate costs
          </Button>
          <Button
            variant="outline"
            onClick={handleRecalculate}
            disabled={isSaving || isRecalculating}
          >
            {isRecalculating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Recalculate existing costs now
          </Button>
        </div>

        <p className="text-muted-foreground text-xs">
          Saving applies the selected mode and re-costs all inventory items created from processed
          invoices. If you register for VAT later (or change your mind), just switch the option and
          save again — quantities and stock levels are never changed, only costs.
        </p>
      </CardContent>
    </Card>
  )
}
