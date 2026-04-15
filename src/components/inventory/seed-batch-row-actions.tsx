'use client'

import { useState } from 'react'
import { Pencil, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface SeedBatch {
  id: string
  batchCode: string
  cropName: string
  cropVariety: string | null
  supplierId: string | null
  supplierName: string | null
  initialQuantity: string
  currentQuantity: string
  quantityUnit: string
  purchaseDate: string | null
  organicCertified: string | null
  costPerUnit: string | null
  notes: string | null
}

interface Props {
  batch: SeedBatch
  onSuccess: () => void
}

const ORGANIC_OPTIONS = [
  { value: 'none', label: 'None / Unknown' },
  { value: 'certified', label: 'Certified Organic' },
  { value: 'organic', label: 'Organic (Not Certified)' },
  { value: 'untreated', label: 'Untreated' },
  { value: 'conventional', label: 'Conventional' },
]

// ─── Edit Dialog ─────────────────────────────────────────────────────────────

function EditDialog({
  batch,
  open,
  onOpenChange,
  onSuccess,
}: {
  batch: SeedBatch
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [initialQty, setInitialQty] = useState(batch.initialQuantity)
  const [currentQty, setCurrentQty] = useState(batch.currentQuantity)
  const [purchaseDate, setPurchaseDate] = useState(
    batch.purchaseDate ? batch.purchaseDate.split('T')[0] : ''
  )
  const [costPerUnit, setCostPerUnit] = useState(batch.costPerUnit ?? '')
  const [organicCertified, setOrganicCertified] = useState(batch.organicCertified ?? 'none')
  const [notes, setNotes] = useState(batch.notes ?? '')

  const initNum = parseFloat(initialQty) || 0
  const currNum = parseFloat(currentQty) || 0
  const qtyError =
    currNum > initNum
      ? 'Current quantity cannot exceed initial quantity.'
      : currNum < 0
        ? 'Current quantity cannot be negative.'
        : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (qtyError) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/seed-batches/${batch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initialQuantity: initialQty,
          currentQuantity: currentQty,
          purchaseDate: purchaseDate || null,
          costPerUnit: costPerUnit || null,
          organicCertified: organicCertified === 'none' ? null : organicCertified,
          notes: notes.trim() || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update seed batch')
      }

      toast.success('Seed batch updated successfully!')
      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Edit Seed Batch</DialogTitle>
          <DialogDescription>
            <span className="font-mono font-medium">{batch.batchCode}</span>
            {batch.cropName && (
              <span className="text-muted-foreground ml-1">
                — {batch.cropName}
                {batch.cropVariety ? ` - ${batch.cropVariety}` : ''}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Quantities */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="initialQty">Initial Qty ({batch.quantityUnit})</Label>
              <Input
                id="initialQty"
                type="number"
                min="0"
                step="0.01"
                required
                value={initialQty}
                onChange={(e) => setInitialQty(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currentQty">Current Qty ({batch.quantityUnit})</Label>
              <Input
                id="currentQty"
                type="number"
                min="0"
                step="0.01"
                required
                value={currentQty}
                onChange={(e) => setCurrentQty(e.target.value)}
                className={qtyError ? 'border-destructive' : ''}
              />
              {qtyError && <p className="text-destructive text-xs">{qtyError}</p>}
            </div>
          </div>

          {/* Purchase date + Cost */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="costPerUnit">Cost per Unit</Label>
              <Input
                id="costPerUnit"
                type="number"
                min="0"
                step="0.01"
                placeholder="Optional"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(e.target.value)}
              />
            </div>
          </div>

          {/* Organic status */}
          <div className="space-y-1.5">
            <Label>Organic Status</Label>
            <Select value={organicCertified} onValueChange={setOrganicCertified}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORGANIC_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Optional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !!qtyError}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Delete Dialog ────────────────────────────────────────────────────────────

function DeleteDialog({
  batch,
  open,
  onOpenChange,
  onSuccess,
}: {
  batch: SeedBatch
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
}) {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/seed-batches/${batch.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete seed batch')
      }
      toast.success('Seed batch deleted.')
      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Delete Seed Batch?</DialogTitle>
          <DialogDescription>
            This will archive batch <span className="font-mono font-medium">{batch.batchCode}</span>
            . It won&apos;t appear in the inventory but is kept for historical records.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Row Actions ──────────────────────────────────────────────────────────────

export function SeedBatchRowActions({ batch, onSuccess }: Props) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)} title="Edit">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDeleteOpen(true)}
          title="Delete"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <EditDialog batch={batch} open={editOpen} onOpenChange={setEditOpen} onSuccess={onSuccess} />
      <DeleteDialog
        batch={batch}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onSuccess={onSuccess}
      />
    </>
  )
}
