// src/app/dashboard/inspections/[id]/edit/page.tsx
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

export default function EditInspectionPage() {
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
    inspection_type: 'site',
    status: 'scheduled',
    priority: 'medium',
    location: '',
    scheduled_date: '',
    inspector_name: '',
    project_id: '',
    notes: '',
    findings: '',
    recommendations: '',
    passed: false,
    score: '',
    follow_up_required: false,
    follow_up_date: '',
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

  // جلب بيانات التفتيش
  useEffect(() => {
    const fetchInspection = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('inspections')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        
        setFormData({
          title: data.title || '',
          inspection_type: data.inspection_type || 'site',
          status: data.status || 'scheduled',
          priority: data.priority || 'medium',
          location: data.location || '',
          scheduled_date: data.scheduled_date || '',
          inspector_name: data.inspector_name || '',
          project_id: data.project_id || '',
          notes: data.notes || '',
          findings: data.findings || '',
          recommendations: data.recommendations || '',
          passed: data.passed || false,
          score: data.score || '',
          follow_up_required: data.follow_up_required || false,
          follow_up_date: data.follow_up_date || '',
        })
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchInspection()
    }
  }, [id, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const dataToSave = {
        title: formData.title,
        inspection_type: formData.inspection_type,
        status: formData.status,
        priority: formData.priority,
        location: formData.location || null,
        scheduled_date: formData.scheduled_date || null,
        inspector_name: formData.inspector_name || null,
        project_id: formData.project_id || null,
        notes: formData.notes || null,
        findings: formData.findings || null,
        recommendations: formData.recommendations || null,
        passed: formData.passed,
        score: formData.score ? parseFloat(formData.score) : null,
        follow_up_required: formData.follow_up_required,
        follow_up_date: formData.follow_up_date || null,
        completed_date: formData.status === 'completed' ? new Date().toISOString() : null,
      }

      const { error } = await supabase
        .from('inspections')
        .update(dataToSave)
        .eq('id', id)

      if (error) throw error

      toast.success('Inspection updated successfully')
      // ✅ العودة إلى صفحة التفاصيل مع المسار الصحيح
      router.push(`/dashboard/inspections/${id}`)
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to update inspection: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading inspection...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push(`/dashboard/inspections/${id}`)}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Inspection
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
          onClick={() => router.push(`/dashboard/inspections/${id}`)}
          className="gap-2"
        >
          <ArrowLeft size={16} />
          Back to Inspection
        </Button>
        <h1 className="text-2xl font-bold">Edit Inspection</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
              {error}
            </div>
          )}

          <div>
            <Label>Inspection Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Inspection Type *</Label>
              <Select
                value={formData.inspection_type}
                onValueChange={(value) => setFormData({ ...formData, inspection_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="site">Site Inspection</SelectItem>
                  <SelectItem value="fire_safety">Fire Safety</SelectItem>
                  <SelectItem value="ppe">PPE Inspection</SelectItem>
                  <SelectItem value="vehicle">Vehicle Inspection</SelectItem>
                  <SelectItem value="equipment">Equipment Inspection</SelectItem>
                  <SelectItem value="environmental">Environmental</SelectItem>
                  <SelectItem value="quality">Quality Check</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
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
            <Label>Project (Optional)</Label>
            <Select
              value={formData.project_id}
              onValueChange={(value) => setFormData({ ...formData, project_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No Project</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Scheduled Date</Label>
              <Input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Inspector Name</Label>
              <Input
                value={formData.inspector_name}
                onChange={(e) => setFormData({ ...formData, inspector_name: e.target.value })}
                placeholder="Inspector name"
              />
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
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Score (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.score}
                onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                placeholder="0-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.passed}
                onChange={(e) => setFormData({ ...formData, passed: e.target.checked })}
                className="h-4 w-4"
              />
              <Label className="text-sm">Passed</Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.follow_up_required}
                onChange={(e) => setFormData({ ...formData, follow_up_required: e.target.checked })}
                className="h-4 w-4"
              />
              <Label className="text-sm">Follow-up Required</Label>
            </div>
          </div>

          {formData.follow_up_required && (
            <div>
              <Label>Follow-up Date</Label>
              <Input
                type="date"
                value={formData.follow_up_date}
                onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
              />
            </div>
          )}

          <div>
            <Label>Findings</Label>
            <textarea
              value={formData.findings}
              onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
              className="w-full border rounded-md px-3 py-2 min-h-[60px]"
              placeholder="What was found during inspection"
            />
          </div>

          <div>
            <Label>Recommendations</Label>
            <textarea
              value={formData.recommendations}
              onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
              className="w-full border rounded-md px-3 py-2 min-h-[60px]"
              placeholder="Recommendations for improvement"
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
            <Button type="button" variant="outline" onClick={() => router.push(`/dashboard/inspections/${id}`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Update Inspection'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}