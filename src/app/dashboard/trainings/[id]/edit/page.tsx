// src/app/dashboard/trainings/[id]/edit/page.tsx
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

export default function EditTrainingPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    training_type: 'safety',
    trainer_name: '',
    trainer_company: '',
    location: '',
    start_date: '',
    end_date: '',
    duration_hours: 0,
    max_attendees: 0,
    status: 'scheduled',
    cost: '',
    notes: '',
    is_mandatory: false,
  })

  useEffect(() => {
    const fetchTraining = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('trainings')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error

        setFormData({
          title: data.title || '',
          description: data.description || '',
          training_type: data.training_type || 'safety',
          trainer_name: data.trainer_name || '',
          trainer_company: data.trainer_company || '',
          location: data.location || '',
          start_date: data.start_date || '',
          end_date: data.end_date || '',
          duration_hours: data.duration_hours || 0,
          max_attendees: data.max_attendees || 0,
          status: data.status || 'scheduled',
          cost: data.cost ? String(data.cost) : '',
          notes: data.notes || '',
          is_mandatory: data.is_mandatory || false,
        })
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchTraining()
    }
  }, [id, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const dataToSave = {
        title: formData.title,
        description: formData.description || null,
        training_type: formData.training_type,
        trainer_name: formData.trainer_name || null,
        trainer_company: formData.trainer_company || null,
        location: formData.location || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        duration_hours: parseInt(formData.duration_hours as any) || 0,
        max_attendees: parseInt(formData.max_attendees as any) || 0,
        status: formData.status,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        notes: formData.notes || null,
        is_mandatory: formData.is_mandatory,
      }

      const { error } = await supabase
        .from('trainings')
        .update(dataToSave)
        .eq('id', id)

      if (error) throw error

      toast.success('Training updated successfully')
      // ✅ العودة إلى صفحة التفاصيل مع المسار الصحيح
      router.push(`/dashboard/trainings/${id}`)
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
          <p className="mt-4 text-gray-500">Loading training...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push(`/dashboard/trainings/${id}`)}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Training
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
          onClick={() => router.push(`/dashboard/trainings/${id}`)}
          className="gap-2"
        >
          <ArrowLeft size={16} />
          Back to Training
        </Button>
        <h1 className="text-2xl font-bold">Edit Training</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
              {error}
            </div>
          )}

          <div>
            <Label>Training Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Training Type *</Label>
              <Select
                value={formData.training_type}
                onValueChange={(value) => setFormData({ ...formData, training_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="leadership">Leadership</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="soft_skills">Soft Skills</SelectItem>
                  <SelectItem value="certification">Certification</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Trainer Name</Label>
              <Input
                value={formData.trainer_name}
                onChange={(e) => setFormData({ ...formData, trainer_name: e.target.value })}
                placeholder="Trainer name"
              />
            </div>
            <div>
              <Label>Trainer Company</Label>
              <Input
                value={formData.trainer_company}
                onChange={(e) => setFormData({ ...formData, trainer_company: e.target.value })}
                placeholder="Trainer company"
              />
            </div>
          </div>

          <div>
            <Label>Location</Label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Training location"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date & Time *</Label>
              <Input
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>End Date & Time *</Label>
              <Input
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Duration (hours)</Label>
              <Input
                type="number"
                min="0"
                value={formData.duration_hours}
                onChange={(e) => setFormData({ ...formData, duration_hours: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Max Attendees</Label>
              <Input
                type="number"
                min="0"
                value={formData.max_attendees}
                onChange={(e) => setFormData({ ...formData, max_attendees: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border rounded-md px-3 py-2 min-h-[60px]"
              placeholder="Training description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cost (AED)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_mandatory}
              onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.checked })}
              className="h-4 w-4"
            />
            <Label className="text-sm">Mandatory Training</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => router.push(`/dashboard/trainings/${id}`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Update Training'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}