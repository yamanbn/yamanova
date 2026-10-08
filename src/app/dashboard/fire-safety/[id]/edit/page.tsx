// src/app/dashboard/fire-safety/[id]/edit/page.tsx
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

export default function EditFireEquipmentPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    equipment_type: 'extinguisher',
    serial_number: '',
    model: '',
    manufacturer: '',
    location: '',
    building: '',
    floor: '',
    room: '',
    installation_date: '',
    expiry_date: '',
    inspection_frequency: 30,
    status: 'active',
    condition: 'good',
    capacity: '',
    pressure_level: '',
    notes: '',
  })

  useEffect(() => {
    const fetchEquipment = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('fire_equipment')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error

        setFormData({
          name: data.name || '',
          equipment_type: data.equipment_type || 'extinguisher',
          serial_number: data.serial_number || '',
          model: data.model || '',
          manufacturer: data.manufacturer || '',
          location: data.location || '',
          building: data.building || '',
          floor: data.floor || '',
          room: data.room || '',
          installation_date: data.installation_date || '',
          expiry_date: data.expiry_date || '',
          inspection_frequency: data.inspection_frequency || 30,
          status: data.status || 'active',
          condition: data.condition || 'good',
          capacity: data.capacity || '',
          pressure_level: data.pressure_level ? String(data.pressure_level) : '',
          notes: data.notes || '',
        })
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchEquipment()
    }
  }, [id, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const nextInspectionDate = formData.installation_date ? new Date(formData.installation_date) : null
      if (nextInspectionDate) {
        nextInspectionDate.setDate(nextInspectionDate.getDate() + parseInt(formData.inspection_frequency as any))
      }

      const dataToSave = {
        name: formData.name,
        equipment_type: formData.equipment_type,
        serial_number: formData.serial_number || null,
        model: formData.model || null,
        manufacturer: formData.manufacturer || null,
        location: formData.location || null,
        building: formData.building || null,
        floor: formData.floor || null,
        room: formData.room || null,
        installation_date: formData.installation_date || null,
        expiry_date: formData.expiry_date || null,
        inspection_frequency: parseInt(formData.inspection_frequency as any) || 30,
        next_inspection_date: nextInspectionDate ? nextInspectionDate.toISOString().split('T')[0] : null,
        status: formData.status,
        condition: formData.condition,
        capacity: formData.capacity || null,
        pressure_level: formData.pressure_level ? parseFloat(formData.pressure_level) : null,
        notes: formData.notes || null,
      }

      const { error } = await supabase
        .from('fire_equipment')
        .update(dataToSave)
        .eq('id', id)

      if (error) throw error

      toast.success('Equipment updated successfully')
      router.push(`/dashboard/fire-safety/${id}`)
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
          <p className="mt-4 text-gray-500">Loading equipment...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push(`/dashboard/fire-safety/${id}`)}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Equipment
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
          onClick={() => router.push(`/dashboard/fire-safety/${id}`)}
          className="gap-2"
        >
          <ArrowLeft size={16} />
          Back to Equipment
        </Button>
        <h1 className="text-2xl font-bold">Edit Equipment</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
              {error}
            </div>
          )}

          <div>
            <Label>Equipment Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Equipment Type *</Label>
              <Select
                value={formData.equipment_type}
                onValueChange={(value) => setFormData({ ...formData, equipment_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="extinguisher">Extinguisher</SelectItem>
                  <SelectItem value="alarm">Alarm</SelectItem>
                  <SelectItem value="hydrant">Hydrant</SelectItem>
                  <SelectItem value="pump">Pump</SelectItem>
                  <SelectItem value="emergency_light">Emergency Light</SelectItem>
                  <SelectItem value="sprinkler">Sprinkler</SelectItem>
                  <SelectItem value="hose">Hose</SelectItem>
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
              <Label>Installation Date</Label>
              <Input
                type="date"
                value={formData.installation_date}
                onChange={(e) => setFormData({ ...formData, installation_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Inspection Frequency (days)</Label>
              <Input
                type="number"
                min="1"
                value={formData.inspection_frequency}
                onChange={(e) => setFormData({ ...formData, inspection_frequency: parseInt(e.target.value) || 30 })}
              />
            </div>
            <div>
              <Label>Capacity</Label>
              <Input
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                placeholder="e.g., 5kg"
              />
            </div>
            <div>
              <Label>Pressure (bar)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.pressure_level}
                onChange={(e) => setFormData({ ...formData, pressure_level: e.target.value })}
                placeholder="Pressure"
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
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="out_of_service">Out of Service</SelectItem>
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
            <Label>Notes</Label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full border rounded-md px-3 py-2 min-h-[60px]"
              placeholder="Additional notes"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => router.push(`/dashboard/fire-safety/${id}`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Update Equipment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}