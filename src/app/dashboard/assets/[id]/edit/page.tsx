// src/app/dashboard/assets/[id]/edit/page.tsx
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

export default function EditAssetPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    asset_type: 'equipment',
    serial_number: '',
    model: '',
    manufacturer: '',
    asset_tag: '',
    location: '',
    building: '',
    floor: '',
    room: '',
    purchase_date: '',
    purchase_cost: '',
    warranty_expiry: '',
    lifespan_years: '',
    status: 'active',
    condition: 'good',
    maintenance_frequency: 365,
    notes: '',
  })

  useEffect(() => {
    const fetchAsset = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('assets')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error

        setFormData({
          name: data.name || '',
          asset_type: data.asset_type || 'equipment',
          serial_number: data.serial_number || '',
          model: data.model || '',
          manufacturer: data.manufacturer || '',
          asset_tag: data.asset_tag || '',
          location: data.location || '',
          building: data.building || '',
          floor: data.floor || '',
          room: data.room || '',
          purchase_date: data.purchase_date || '',
          purchase_cost: data.purchase_cost ? String(data.purchase_cost) : '',
          warranty_expiry: data.warranty_expiry || '',
          lifespan_years: data.lifespan_years ? String(data.lifespan_years) : '',
          status: data.status || 'active',
          condition: data.condition || 'good',
          maintenance_frequency: data.maintenance_frequency || 365,
          notes: data.notes || '',
        })
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchAsset()
    }
  }, [id, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const dataToSave = {
        name: formData.name,
        asset_type: formData.asset_type,
        serial_number: formData.serial_number || null,
        model: formData.model || null,
        manufacturer: formData.manufacturer || null,
        asset_tag: formData.asset_tag || null,
        location: formData.location || null,
        building: formData.building || null,
        floor: formData.floor || null,
        room: formData.room || null,
        purchase_date: formData.purchase_date || null,
        purchase_cost: formData.purchase_cost ? parseFloat(formData.purchase_cost) : null,
        warranty_expiry: formData.warranty_expiry || null,
        lifespan_years: formData.lifespan_years ? parseInt(formData.lifespan_years) : null,
        status: formData.status,
        condition: formData.condition,
        maintenance_frequency: parseInt(formData.maintenance_frequency as any) || 365,
        notes: formData.notes || null,
      }

      const { error } = await supabase
        .from('assets')
        .update(dataToSave)
        .eq('id', id)

      if (error) throw error

      toast.success('Asset updated successfully')
      router.push(`/dashboard/assets/${id}`)
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
          <p className="mt-4 text-gray-500">Loading asset...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push(`/dashboard/assets/${id}`)}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Asset
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
          onClick={() => router.push(`/dashboard/assets/${id}`)}
          className="gap-2"
        >
          <ArrowLeft size={16} />
          Back to Asset
        </Button>
        <h1 className="text-2xl font-bold">Edit Asset</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
              {error}
            </div>
          )}

          <div>
            <Label>Asset Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Asset Type *</Label>
              <Select
                value={formData.asset_type}
                onValueChange={(value) => setFormData({ ...formData, asset_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vehicle">Vehicle</SelectItem>
                  <SelectItem value="machinery">Machinery</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="tool">Tool</SelectItem>
                  <SelectItem value="facility">Facility</SelectItem>
                  <SelectItem value="furniture">Furniture</SelectItem>
                  <SelectItem value="it_equipment">IT Equipment</SelectItem>
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

          <div>
            <Label>Asset Tag</Label>
            <Input
              value={formData.asset_tag}
              onChange={(e) => setFormData({ ...formData, asset_tag: e.target.value })}
              placeholder="Asset tag"
            />
          </div>

          <div>
            <Label>Location</Label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Location"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Building</Label>
              <Input
                value={formData.building}
                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                placeholder="Building"
              />
            </div>
            <div>
              <Label>Floor</Label>
              <Input
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                placeholder="Floor"
              />
            </div>
            <div>
              <Label>Room</Label>
              <Input
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                placeholder="Room"
              />
            </div>
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
              <Label>Warranty Expiry</Label>
              <Input
                type="date"
                value={formData.warranty_expiry}
                onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })}
              />
            </div>
            <div>
              <Label>Lifespan (Years)</Label>
              <Input
                type="number"
                min="0"
                value={formData.lifespan_years}
                onChange={(e) => setFormData({ ...formData, lifespan_years: e.target.value })}
                placeholder="Years"
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                  <SelectItem value="scrapped">Scrapped</SelectItem>
                  <SelectItem value="on_loan">On Loan</SelectItem>
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
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Maintenance Frequency (days)</Label>
            <Input
              type="number"
              min="1"
              value={formData.maintenance_frequency}
              onChange={(e) => setFormData({ ...formData, maintenance_frequency: parseInt(e.target.value) || 365 })}
            />
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
            <Button type="button" variant="outline" onClick={() => router.push(`/dashboard/assets/${id}`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Update Asset'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}