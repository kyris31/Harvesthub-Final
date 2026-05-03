'use client'

import { useRef, useState } from 'react'
import { MessageSquare, Copy, Check, Loader2, Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { translateGreekToEnglish } from '@/app/actions/translate'
import type { getActiveProducts } from '@/app/actions/harvest-orders'

type Products = Awaited<ReturnType<typeof getActiveProducts>>

interface SmsComposerDialogProps {
  products: Products
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!text.trim()}>
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      <span className="ml-1.5">{copied ? 'Copied!' : 'Copy'}</span>
    </Button>
  )
}

export function SmsComposerDialog({ products }: SmsComposerDialogProps) {
  const [open, setOpen] = useState(false)
  const [greekText, setGreekText] = useState('')
  const [englishText, setEnglishText] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)
  const [translateError, setTranslateError] = useState('')
  const greekRef = useRef<HTMLTextAreaElement>(null)

  const { plantingOptions, treeOptions, eggOptions } = products

  function insertProduct(label: string) {
    const ta = greekRef.current
    if (!ta) return
    const start = ta.selectionStart ?? greekText.length
    const end = ta.selectionEnd ?? greekText.length
    const next = greekText.slice(0, start) + label + greekText.slice(end)
    setGreekText(next)
    // restore focus and move cursor after inserted text
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(start + label.length, start + label.length)
    })
  }

  async function handleTranslate() {
    if (!greekText.trim()) return
    setIsTranslating(true)
    setTranslateError('')
    try {
      const result = await translateGreekToEnglish(greekText)
      setEnglishText(result)
    } catch (e) {
      setTranslateError(e instanceof Error ? e.message : 'Translation failed')
    } finally {
      setIsTranslating(false)
    }
  }

  function handleOpenChange(val: boolean) {
    setOpen(val)
    if (!val) {
      setGreekText('')
      setEnglishText('')
      setTranslateError('')
    }
  }

  const hasProducts = plantingOptions.length > 0 || treeOptions.length > 0 || eggOptions.length > 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <MessageSquare className="mr-2 h-4 w-4" />
          Compose SMS
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Compose Harvest SMS</DialogTitle>
          <DialogDescription>
            Write your message in Greek, insert available products, then translate for
            English-speaking customers.
          </DialogDescription>
        </DialogHeader>

        {/* Product chips */}
        {hasProducts && (
          <div className="space-y-3 rounded-lg border p-4">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Click a product to insert it into your message
            </p>

            {plantingOptions.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-muted-foreground text-xs">Plantings</p>
                <div className="flex flex-wrap gap-1.5">
                  {plantingOptions.map((p) => {
                    const name = p.label.split(' (')[0]
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => insertProduct(name)}
                        className="bg-muted hover:bg-primary hover:text-primary-foreground rounded-full px-2.5 py-1 text-xs transition-colors"
                      >
                        {name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {treeOptions.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-muted-foreground text-xs">Trees</p>
                <div className="flex flex-wrap gap-1.5">
                  {treeOptions.map((t) => {
                    const name = t.label.split(' - ')[0]
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => insertProduct(name)}
                        className="bg-muted hover:bg-primary hover:text-primary-foreground rounded-full px-2.5 py-1 text-xs transition-colors"
                      >
                        {name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {eggOptions.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-muted-foreground text-xs">Eggs</p>
                <div className="flex flex-wrap gap-1.5">
                  {eggOptions.map((e) => {
                    const name = e.label.split(' (')[0]
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => insertProduct(name)}
                        className="bg-muted hover:bg-primary hover:text-primary-foreground rounded-full px-2.5 py-1 text-xs transition-colors"
                      >
                        {name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Composer panels */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Greek */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Greek 🇬🇷</p>
              <CopyButton text={greekText} />
            </div>
            <Textarea
              ref={greekRef}
              value={greekText}
              onChange={(e) => setGreekText(e.target.value)}
              placeholder="Γράψε το μήνυμά σου εδώ…"
              rows={9}
              className="resize-none"
            />
            <p className="text-muted-foreground text-right text-xs">{greekText.length} chars</p>
          </div>

          {/* English */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">English 🇬🇧</p>
              <CopyButton text={englishText} />
            </div>
            <Textarea
              value={englishText}
              onChange={(e) => setEnglishText(e.target.value)}
              placeholder="Translation will appear here…"
              rows={9}
              className="resize-none"
            />
            <p className="text-muted-foreground text-right text-xs">{englishText.length} chars</p>
          </div>
        </div>

        {translateError && <p className="text-destructive text-sm">{translateError}</p>}

        {/* Translate button */}
        <div className="flex justify-center pt-1">
          <Button
            onClick={handleTranslate}
            disabled={isTranslating || !greekText.trim()}
            className="w-full sm:w-auto"
          >
            {isTranslating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Languages className="mr-2 h-4 w-4" />
            )}
            {isTranslating ? 'Translating…' : 'Translate to English'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
