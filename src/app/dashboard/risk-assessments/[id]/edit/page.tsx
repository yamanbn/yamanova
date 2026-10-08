// src/app/dashboard/risk-assessments/[id]/edit/page.tsx
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

export default function EditRiskAssessmentPage() {
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
    hazard_identification: '',
    likelihood_score: 3,
    severity_score: 3,
    control_measures: '',
    residual_risk_score: 0,
    residual_risk_level: 'low',
    status: 'draft',
    assessor_name: '',
    project_id: '',
    department: '',
    review_date: '',
    notes: '',
    approval_required: true,
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

  // جلب بيانات التقييم
  useEffect(() => {
    const fetchRisk = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('risk_assessments')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error

        setFormData({
          title: data.title || '',
          hazard_identification: data.hazard_identification || '',
          likelihood_score: data.likelihood_score || 3,
          severity_score: data.severity_score || 3,
          control_measures: data.control_measures || '',
          residual_risk_score: data.residual_risk_score || 0,
          residual_risk_level: data.residual_risk_level || 'low',
          status: data.status || 'draft',
          assessor_name: data.assessor_name || '',
          project_id: data.project_id || '',
          department: data.department || '',
          review_date: data.review_date || '',
          notes: data.notes || '',
          approval_required: data.approval_required !== undefined ? data.approval_required : true,
        })
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchRisk()
    }
  }, [id, supabase])

  // حساب مستوى المخاطر (للعرض فقط)
  const calculateRiskLevel = (likelihood: number, severity: number) => {
    const score = likelihood * severity
    if (score >= 20) return 'extreme'
    if (score >= 12) return 'high'
    if (score >= 6) return 'medium'
    return 'low'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const dataToSave = {
        title: formData.title,
        hazard_identification: formData.hazard_identification,
        likelihood_score: parseInt(formData.likelihood_score as any),
        severity_score: parseInt(formData.severity_score as any),
        control_measures: formData.control_measures || null,
        residual_risk_score: formData.residual_risk_score || null,
        residual_risk_level: formData.residual_risk_level || 'low',
        status: formData.status,
        assessor_name: formData.assessor_name || null,
        project_id: formData.project_id || null,
        department: formData.department || null,
        review_date: formData.review_date || null,
        notes: formData.notes || null,
        approval_required: formData.approval_required,
      }

      const { error } = await supabase
        .from('risk_assessments')
        .update(dataToSave)
        .eq('id', id)

      if (error) throw error

      toast.success('Risk assessment updated successfully')
      // ✅ العودة إلى صفحة التفاصيل مع المسار الصحيح
      router.push(`/dashboard/risk-assessments/${id}`)
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
          <p className="mt-4 text-gray-500">Loading risk assessment...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push(`/dashboard/risk-assessments/${id}`)}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Assessment
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
          onClick={() => router.push(`/dashboard/risk-assessments/${id}`)}
          className="gap-2"
        >
          <ArrowLeft size={16} />
          Back to Assessment
        </Button>
        <h1 className="text-2xl font-bold">Edit Risk Assessment</h1>
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

          <div>
            <Label>Hazard Identification *</Label>
            <textarea
              value={formData.hazard_identification}
              onChange={(e) => setFormData({ ...formData, hazard_identification: e.target.value })}
              className="w-full border rounded-md px-3 py-2 min-h-[60px]"
              placeholder="Describe the hazard"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Likelihood (1-5) *</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={formData.likelihood_score}
                onChange={(e) => setFormData({ ...formData, likelihood_score: parseInt(e.target.value) || 1 })}
                required
              />
            </div>
            <div>
              <Label>Severity (1-5) *</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={formData.severity_score}
                onChange={(e) => setFormData({ ...formData, severity_score: parseInt(e.target.value) || 1 })}
                required
              />
            </div>
          </div>

          <div>
            <Label>Risk Level: <span className="font-bold">
              {calculateRiskLevel(formData.likelihood_score, formData.severity_score).toUpperCase()}
            </span></Label>
            <p className="text-xs text-gray-500">Automatically calculated from likelihood × severity</p>
          </div>

          <div>
            <Label>Control Measures</Label>
            <textarea
              value={formData.control_measures}
              onChange={(e) => setFormData({ ...formData, control_measures: e.target.value })}
              className="w-full border rounded-md px-3 py-2 min-h-[60px]"
              placeholder="Describe control measures"
            />
          </div>

          <div>
            <Label>Residual Risk Score</Label>
            <Input
              type="number"
              min="0"
              value={formData.residual_risk_score}
              onChange={(e) => setFormData({ ...formData, residual_risk_score: parseInt(e.target.value) || 0 })}
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
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="obsolete">Obsolete</SelectItem>
                </SelectContent>
              </Select>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Assessor Name</Label>
              <Input
                value={formData.assessor_name}
                onChange={(e) => setFormData({ ...formData, assessor_name: e.target.value })}
                placeholder="Assessor name"
              />
            </div>
            <div>
              <Label>Department</Label>
              <Input
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Department"
              />
            </div>
          </div>

          <div>
            <Label>Review Date</Label>
            <Input
              type="date"
              value={formData.review_date}
              onChange={(e) => setFormData({ ...formData, review_date: e.target.value })}
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

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.approval_required}
              onChange={(e) => setFormData({ ...formData, approval_required: e.target.checked })}
              className="h-4 w-4"
            />
            <Label className="text-sm">Approval Required</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => router.push(`/dashboard/risk-assessments/${id}`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Update Risk Assessment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}