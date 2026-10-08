// src/app/(dashboard)/incidents/[id]/edit/page.tsx
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

export default function EditIncidentPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    incident_type: 'accident',
    severity: 'medium',
    location: '',
    datetime: '',
    description: '',
    reported_by_name: '',
    status: 'pending',
    investigation_status: 'pending',
    root_cause_analysis: '',
    corrective_actions: '',
    preventive_actions: '',
    corrective_actions_completed: false,
    preventive_actions_completed: false,
  })

  useEffect(() => {
    const fetchIncident = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('incidents')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        
        setFormData({
          title: data.title || '',
          incident_type: data.incident_type || 'accident',
          severity: data.severity || 'medium',
          location: data.location || '',
          datetime: data.datetime || '',
          description: data.description || '',
          reported_by_name: data.reported_by_name || '',
          status: data.status || 'pending',
          investigation_status: data.investigation_status || 'pending',
          root_cause_analysis: data.root_cause_analysis || '',
          corrective_actions: data.corrective_actions || '',
          preventive_actions: data.preventive_actions || '',
          corrective_actions_completed: data.corrective_actions_completed || false,
          preventive_actions_completed: data.preventive_actions_completed || false,
        })
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchIncident()
    }
  }, [id, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const dataToSave = {
        title: formData.title,
        incident_type: formData.incident_type,
        severity: formData.severity,
        location: formData.location || null,
        datetime: formData.datetime || null,
        description: formData.description,
        reported_by_name: formData.reported_by_name || null,
        status: formData.status,
        investigation_status: formData.investigation_status,
        root_cause_analysis: formData.root_cause_analysis || null,
        corrective_actions: formData.corrective_actions || null,
        preventive_actions: formData.preventive_actions || null,
        corrective_actions_completed: formData.corrective_actions_completed,
        preventive_actions_completed: formData.preventive_actions_completed,
      }

      const { error } = await supabase
        .from('incidents')
        .update(dataToSave)
        .eq('id', id)

      if (error) throw error

      toast.success('Incident updated successfully')
      router.push(`/incidents/${id}`)
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to update incident: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading incident...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push(`/incidents/${id}`)}>
            ← Back to Incident
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/incidents/${id}`)} className="gap-2">
          <ArrowLeft size={16} />
          Back to Incident
        </Button>
        <h1 className="text-2xl font-bold">Edit Incident</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
              {error}
            </div>
          )}

          <div>
            <Label>Incident Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Incident Type *</Label>
              <Select
                value={formData.incident_type}
                onValueChange={(value) => setFormData({ ...formData, incident_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accident">Accident</SelectItem>
                  <SelectItem value="near_miss">Near Miss</SelectItem>
                  <SelectItem value="unsafe_act">Unsafe Act</SelectItem>
                  <SelectItem value="property_damage">Property Damage</SelectItem>
                  <SelectItem value="environmental">Environmental</SelectItem>
                  <SelectItem value="health_issue">Health Issue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Severity *</Label>
              <Select
                value={formData.severity}
                onValueChange={(value) => setFormData({ ...formData, severity: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="catastrophic">Catastrophic</SelectItem>
                </SelectContent>
              </Select>
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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Investigation Status</Label>
              <Select
                value={formData.investigation_status}
                onValueChange={(value) => setFormData({ ...formData, investigation_status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Location</Label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Enter location"
            />
          </div>

          <div>
            <Label>Date & Time</Label>
            <Input
              type="datetime-local"
              value={formData.datetime}
              onChange={(e) => setFormData({ ...formData, datetime: e.target.value })}
            />
          </div>

          <div>
            <Label>Reported By</Label>
            <Input
              value={formData.reported_by_name}
              onChange={(e) => setFormData({ ...formData, reported_by_name: e.target.value })}
              placeholder="Name of person reporting"
            />
          </div>

          <div>
            <Label>Description *</Label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border rounded-md px-3 py-2 min-h-[80px]"
              placeholder="Describe the incident"
              required
            />
          </div>

          <div>
            <Label>Root Cause Analysis</Label>
            <textarea
              value={formData.root_cause_analysis}
              onChange={(e) => setFormData({ ...formData, root_cause_analysis: e.target.value })}
              className="w-full border rounded-md px-3 py-2 min-h-[60px]"
              placeholder="Root cause analysis"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Corrective Actions</Label>
              <textarea
                value={formData.corrective_actions}
                onChange={(e) => setFormData({ ...formData, corrective_actions: e.target.value })}
                className="w-full border rounded-md px-3 py-2 min-h-[60px]"
                placeholder="Corrective actions"
              />
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={formData.corrective_actions_completed}
                  onChange={(e) => setFormData({ ...formData, corrective_actions_completed: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label className="text-sm">Completed</Label>
              </div>
            </div>
            <div>
              <Label>Preventive Actions</Label>
              <textarea
                value={formData.preventive_actions}
                onChange={(e) => setFormData({ ...formData, preventive_actions: e.target.value })}
                className="w-full border rounded-md px-3 py-2 min-h-[60px]"
                placeholder="Preventive actions"
              />
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={formData.preventive_actions_completed}
                  onChange={(e) => setFormData({ ...formData, preventive_actions_completed: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label className="text-sm">Completed</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => router.push(`/incidents/${id}`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Update Incident'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}