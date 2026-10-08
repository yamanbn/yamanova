// src/app/dashboard/ppe/[id]/edit/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'
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
import { toast } from 'sonner'

export default function EditPPEItemPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    category: 'head_protection',
    model: '',
    manufacturer: '',
    serial_number: '',
    size: '',
    color: '',
    quantity: 1,
    min_quantity: 0,
    location: '',
    storage_area: '',
    purchase_date: '',
    purchase_cost: '',
    expiry_date: '',
    inspection_frequency: 30,
    status: 'available',
    condition: 'new',
    notes: '',
  })

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('ppe_items')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error

        setFormData({
          name: data.name || '',
          category: data.category || 'head_protection',
          model: data.model || '',
          manufacturer: data.manufacturer || '',
          serial_number: data.serial_number || '',
          size: data.size || '',
          color: data.color || '',
          quantity: data.quantity || 1,
          min_quantity: data.min_quantity || 0,
          location: data.location || '',
          storage_area: data.storage_area || '',
          purchase_date: data.purchase_date || '',
          purchase_cost: data.purchase_cost ? String(data.purchase_cost) : '',
          expiry_date: data.expiry_date || '',
          inspection_frequency: data.inspection_frequency || 30,
          status: data.status || 'available',
          condition: data.condition || 'new',
          notes: data.notes || '',
        })
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchItem()
    }
  }, [id, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const purchaseDate = formData.purchase_date ? new Date(formData.purchase_date) : null
      const nextInspectionDate = purchaseDate ? new Date(purchaseDate) : null
      if (nextInspectionDate) {
        nextInspectionDate.setDate(nextInspectionDate.getDate() + parseInt(formData.inspection_frequency as any))
      }

      const dataToSave = {
        name: formData.name,
        category: formData.category,
        model: formData.model || null,
        manufacturer: formData.manufacturer || null,
        serial_number: formData.serial_number || null,
        size: formData.size || null,
        color: formData.color || null,
        quantity: parseInt(formData.quantity as any) || 1,
        min_quantity: parseInt(formData.min_quantity as any) || 0,
        location: formData.location || null,
        storage_area: formData.storage_area || null,
        purchase_date: formData.purchase_date || null,
        purchase_cost: formData.purchase_cost ? parseFloat(formData.purchase_cost) : null,
        expiry_date: formData.expiry_date || null,
        inspection_frequency: parseInt(formData.inspection_frequency as any) || 30,
        next_inspection_date: nextInspectionDate ? nextInspectionDate.toISOString().split('T')[0] : null,
        status: formData.status,
        condition: formData.condition,
        notes: formData.notes || null,
      }

      const { error } = await supabase
        .from('ppe_items')
        .update(dataToSave)
        .eq('id', id)

      if (error) throw error

      toast.success('PPE item updated successfully')
      router.push(`/dashboard/ppe/${id}`)
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to update: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading PPE item...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push(`/dashboard/ppe/${id}`)}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Item
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/dashboard/ppe/${id}`)}
          className="gap-2"
        >
          <ArrowLeft size={16} />
          Back to Item
        </Button>
        <h1 className="text-2xl font-bold">Edit PPE Item</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
              {error}
            </div>
          )}

          <div>
            <Label>Item Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="head_protection">Head Protection</SelectItem>
                  <SelectItem value="eye_protection">Eye Protection</SelectItem>
                  <SelectItem value="face_protection">Face Protection</SelectItem>
                  <SelectItem value="hearing_protection">Hearing Protection</SelectItem>
                  <SelectItem value="respiratory_protection">Respiratory</SelectItem>
                  <SelectItem value="hand_protection">Hand Protection</SelectItem>
                  <SelectItem value="foot_protection">Foot Protection</SelectItem>
                  <SelectItem value="body_protection">Body Protection</SelectItem>
                  <SelectItem value="fall_protection">Fall Protection</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Serial Number</Label>
              <Input
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                placeholder="Serial number"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Model</Label>
              <Input
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Model"
              />
            </div>
            <div>
              <Label>Manufacturer</Label>
              <Input
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                placeholder="Manufacturer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Size</Label>
              <Input
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                placeholder="Size"
              />
            </div>
            <div>
              <Label>Color</Label>
              <Input
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="Color"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Quantity *</Label>
              <Input
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                required
              />
            </div>
            <div>
              <Label>Minimum Quantity</Label>
              <Input
                type="number"
                min="0"
                value={formData.min_quantity}
                onChange={(e) => setFormData({ ...formData, min_quantity: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div>
            <Label>Location</Label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Location"
            />
          </div>

          <div>
            <Label>Storage Area</Label>
            <Input
              value={formData.storage_area}
              onChange={(e) => setFormData({ ...formData, storage_area: e.target.value })}
              placeholder="Storage area"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Purchase Date</Label>
              <Input
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Purchase Cost (AED)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.purchase_cost}
                onChange={(e) => setFormData({ ...formData, purchase_cost: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Inspection Frequency (days)</Label>
              <Input
                type="number"
                min="1"
                value={formData.inspection_frequency}
                onChange={(e) => setFormData({ ...formData, inspection_frequency: parseInt(e.target.value) || 30 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="issued">Issued</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="scrapped">Scrapped</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Condition</Label>
              <Select
                value={formData.condition}
                onValueChange={(value) => setFormData({ ...formData, condition: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                  <SelectItem value="damaged">Damaged</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full border rounded-md px-3 py-2 min-h-[60px]"
              placeholder="Additional notes"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => router.push(`/dashboard/ppe/${id}`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Update PPE Item'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}