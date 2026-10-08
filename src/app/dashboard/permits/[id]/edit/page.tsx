// src/app/dashboard/permits/[id]/edit/page.tsx
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

export default function EditPermitPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [formData, setFormData] = useState({
    title: '',
    permit_type: 'hot_work',
    description: '',
    location: '',
    start_datetime: '',
    end_datetime: '',
    applicant_name: '',
    priority: 'medium',
    risk_level: 'medium',
    control_measures: '',
    ppe_required: '',
    emergency_procedures: '',
    notes: '',
    project_id: '',
  })

  // جلب المشاريع
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .limit(1)
          .maybeSingle()

        if (profile?.organization_id) {
          const { data } = await supabase
            .from('projects')
            .select('id, name')
            .eq('organization_id', profile.organization_id)
          setProjects(data || [])
        }
      } catch (e) { /* ignore */ }
    }
    fetchProjects()
  }, [])

  // جلب بيانات التصريح
  useEffect(() => {
    const fetchPermit = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('permits')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error

        setFormData({
          title: data.title || '',
          permit_type: data.permit_type || 'hot_work',
          description: data.description || '',
          location: data.location || '',
          start_datetime: data.start_datetime || '',
          end_datetime: data.end_datetime || '',
          applicant_name: data.applicant_name || '',
          priority: data.priority || 'medium',
          risk_level: data.risk_level || 'medium',
          control_measures: data.control_measures || '',
          ppe_required: data.ppe_required || '',
          emergency_procedures: data.emergency_procedures || '',
          notes: data.notes || '',
          project_id: data.project_id || '',
        })
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchPermit()
    }
  }, [id, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const dataToSave = {
        title: formData.title,
        permit_type: formData.permit_type,
        description: formData.description || null,
        location: formData.location || null,
        start_datetime: formData.start_datetime || null,
        end_datetime: formData.end_datetime || null,
        applicant_name: formData.applicant_name || null,
        priority: formData.priority,
        risk_level: formData.risk_level,
        control_measures: formData.control_measures || null,
        ppe_required: formData.ppe_required || null,
        emergency_procedures: formData.emergency_procedures || null,
        notes: formData.notes || null,
        project_id: formData.project_id || null,
      }

      const { error } = await supabase
        .from('permits')
        .update(dataToSave)
        .eq('id', id)

      if (error) throw error

      toast.success('Permit updated successfully')
      // ✅ العودة إلى صفحة التفاصيل مع المسار الصحيح
      router.push(`/dashboard/permits/${id}`)
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
          <p className="mt-4 text-gray-500">Loading permit...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push(`/dashboard/permits/${id}`)}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Permit
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
          onClick={() => router.push(`/dashboard/permits/${id}`)}
          className="gap-2"
        >
          <ArrowLeft size={16} />
          Back to Permit
        </Button>
        <h1 className="text-2xl font-bold">Edit Permit</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
              {error}
            </div>
          )}

          <div>
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Permit Type *</Label>
              <Select
                value={formData.permit_type}
                onValueChange={(value) => setFormData({ ...formData, permit_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hot_work">Hot Work</SelectItem>
                  <SelectItem value="cold_work">Cold Work</SelectItem>
                  <SelectItem value="confined_space">Confined Space</SelectItem>
                  <SelectItem value="working_at_height">Working at Height</SelectItem>
                  <SelectItem value="electrical">Electrical Work</SelectItem>
                  <SelectItem value="lifting">Lifting Operations</SelectItem>
                  <SelectItem value="excavation">Excavation</SelectItem>
                  <SelectItem value="chemical">Chemical Handling</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Project</Label>
            <Select
              value={formData.project_id}
              onValueChange={(value) => setFormData({ ...formData, project_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Location</Label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Work location"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date & Time *</Label>
              <Input
                type="datetime-local"
                value={formData.start_datetime}
                onChange={(e) => setFormData({ ...formData, start_datetime: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>End Date & Time *</Label>
              <Input
                type="datetime-local"
                value={formData.end_datetime}
                onChange={(e) => setFormData({ ...formData, end_datetime: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label>Applicant Name</Label>
            <Input
              value={formData.applicant_name}
              onChange={(e) => setFormData({ ...formData, applicant_name: e.target.value })}
              placeholder="Applicant name"
            />
          </div>

          <div>
            <Label>Description</Label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border rounded-md px-3 py-2 min-h-[60px]"
              placeholder="Describe the work"
            />
          </div>

          <div>
            <Label>Control Measures</Label>
            <textarea
              value={formData.control_measures}
              onChange={(e) => setFormData({ ...formData, control_measures: e.target.value })}
              className="w-full border rounded-md px-3 py-2 min-h-[60px]"
              placeholder="Safety control measures"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Risk Level</Label>
              <Select
                value={formData.risk_level}
                onValueChange={(value) => setFormData({ ...formData, risk_level: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select risk level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="extreme">Extreme</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>PPE Required</Label>
              <Input
                value={formData.ppe_required}
                onChange={(e) => setFormData({ ...formData, ppe_required: e.target.value })}
                placeholder="Required PPE"
              />
            </div>
          </div>

          <div>
            <Label>Emergency Procedures</Label>
            <textarea
              value={formData.emergency_procedures}
              onChange={(e) => setFormData({ ...formData, emergency_procedures: e.target.value })}
              className="w-full border rounded-md px-3 py-2 min-h-[60px]"
              placeholder="Emergency procedures"
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
            <Button type="button" variant="outline" onClick={() => router.push(`/dashboard/permits/${id}`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Update Permit'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}