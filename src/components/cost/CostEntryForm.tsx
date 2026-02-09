'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { EntityType } from '@prisma/client'

const CATEGORIES = [
  'LABOR',
  'INFRASTRUCTURE',
  'LICENSING',
  'THIRD_PARTY',
  'OTHER',
] as const

export interface CostEntryFormValues {
  description: string
  amount: number
  currency: string
  category: (typeof CATEGORIES)[number]
  date: string
}

interface CostEntryFormProps {
  entityType: EntityType
  entityId: string
  defaultValues?: Partial<CostEntryFormValues>
  onSuccess?: () => void
  onCancel?: () => void
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function CostEntryForm({
  entityType,
  entityId,
  defaultValues,
  onSuccess,
  onCancel,
}: CostEntryFormProps) {
  const [description, setDescription] = useState(
    defaultValues?.description ?? ''
  )
  const [amount, setAmount] = useState(
    defaultValues?.amount != null
      ? String(defaultValues.amount)
      : ''
  )
  const [currency, setCurrency] = useState(
    defaultValues?.currency ?? 'USD'
  )
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>(
    defaultValues?.category ?? 'LABOR'
  )
  const [date, setDate] = useState(defaultValues?.date ?? todayISO())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const numAmount = parseFloat(amount)
    if (!description.trim()) {
      setError('Description is required.')
      return
    }
    if (Number.isNaN(numAmount) || numAmount <= 0) {
      setError('Amount must be a positive number.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/cost-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          entityType,
          entityId,
          description: description.trim(),
          amount: numAmount,
          currency,
          category,
          date,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to create cost entry.')
        return
      }
      onSuccess?.()
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">
          {error}
        </p>
      )}
      <div>
        <Label htmlFor="cost-description">Description</Label>
        <Textarea
          id="cost-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Sprint development, AWS hosting"
          rows={2}
          className="mt-1"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cost-amount">Amount</Label>
          <Input
            id="cost-amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="cost-currency">Currency</Label>
          <Input
            id="cost-currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            maxLength={3}
            className="mt-1"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cost-category">Category</Label>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as (typeof CATEGORIES)[number])}
          >
            <SelectTrigger id="cost-category" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="cost-date">Date</Label>
          <Input
            id="cost-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save cost entry'}
        </Button>
      </div>
    </form>
  )
}
