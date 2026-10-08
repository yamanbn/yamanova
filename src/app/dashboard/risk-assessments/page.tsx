// src/app/dashboard/risk-assessments/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Edit2, Trash2, Eye, Shield, Calendar, User, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import Link from 'next/link'

interface RiskAssessment {
  id: string
  title: string
  hazard_identification: string
  likelihood_score: number
  severity_score: number
  risk_level: string
  residual_risk_level: string
  status: string
  assessor_name: string
  project_id: string
  created_at: string
  projects: { name: string }
}

export default function RiskAssessmentsPage() {
  const [risks, setRisks] = useState<RiskAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingRisk, setEditingRisk] = useState<RiskAssessment | null>(null)
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
  const [projects, setProjects] = useState<any[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedRisk, setSelectedRisk] = useState<RiskAssessment | null>(null)
  const supabase = createClient()

  // جلب المشاريع
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

  // ✅ استخدام limit(1).maybeSingle() لتجنب مشكلة الصفوف المتعددة
  const fetchRisks = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .limit(1)
        .maybeSingle()

      if (profileError) {
        console.error('Profile error:', profileError)
        throw new Error('خطأ في جلب بيانات المنظمة: ' + profileError.message)
      }

      if (!profile || !profile.organization_id) {
        setError('لم يتم العثور على منظمة. يرجى إضافة منظمة من صفحة المنظمات.')
        setRisks([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('risk_assessments')
        .select(`
          *,
          projects:project_id (name)
        `)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRisks(data || [])
    } catch (err: any) {
      console.error('Fetch error:', err)
      setError(err.message || 'حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
    fetchRisks()
  }, [])

  const filteredRisks = risks.filter(r => {
    const search = searchTerm.toLowerCase()
    return (
      r.title?.toLowerCase().includes(search) ||
      r.hazard_identification?.toLowerCase().includes(search) ||
      r.assessor_name?.toLowerCase().includes(search) ||
      r.risk_level?.toLowerCase().includes(search)
    )
  })

  // حساب مستوى المخاطر (يستخدم فقط للعرض، وليس للإدراج)
  const calculateRiskLevel = (likelihood: number, severity: number) => {
    const score = likelihood * severity
    if (score >= 20) return 'extreme'
    if (score >= 12) return 'high'
    if (score >= 6) return 'medium'
    return 'low'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id, id')
        .limit(1)
        .maybeSingle()

      if (profileError || !profile?.organization_id) {
        throw new Error('لم يتم العثور على منظمة')
      }

      // حساب مستوى المخاطر فقط للعرض (لا يتم إدراجه)
      const riskLevel = calculateRiskLevel(
        parseInt(formData.likelihood_score as any),
        parseInt(formData.severity_score as any)
      )

      const dataToSave = {
        organization_id: profile.organization_id,
        title: formData.title,
        hazard_identification: formData.hazard_identification,
        likelihood_score: parseInt(formData.likelihood_score as any),
        severity_score: parseInt(formData.severity_score as any),
        control_measures: formData.control_measures || null,
        residual_risk_score: formData.residual_risk_score || null,
        residual_risk_level: formData.residual_risk_level || riskLevel,
        status: formData.status,
        assessor_name: formData.assessor_name || null,
        project_id: formData.project_id || null,
        department: formData.department || null,
        review_date: formData.review_date || null,
        notes: formData.notes || null,
        approval_required: formData.approval_required,
        assessor_id: profile.id,
      }

      let result
      if (editingRisk) {
        result = await supabase
          .from('risk_assessments')
          .update(dataToSave)
          .eq('id', editingRisk.id)
        if (!result.error) toast.success('Risk assessment updated successfully')
      } else {
        result = await supabase
          .from('risk_assessments')
          .insert(dataToSave)
        if (!result.error) toast.success('Risk assessment created successfully')
      }

      if (result.error) throw result.error

      setShowForm(false)
      setEditingRisk(null)
      setFormData({
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
      fetchRisks()
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to save: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedRisk) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('risk_assessments')
        .delete()
        .eq('id', selectedRisk.id)

      if (error) throw error
      toast.success('Risk assessment deleted successfully')
      setShowDeleteDialog(false)
      setSelectedRisk(null)
      fetchRisks()
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to delete: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const openEditForm = (risk: RiskAssessment) => {
    setEditingRisk(risk)
    setFormData({
      title: risk.title || '',
      hazard_identification: risk.hazard_identification || '',
      likelihood_score: risk.likelihood_score || 3,
      severity_score: risk.severity_score || 3,
      control_measures: risk.control_measures || '',
      residual_risk_score: risk.residual_risk_score || 0,
      residual_risk_level: risk.residual_risk_level || 'low',
      status: risk.status || 'draft',
      assessor_name: risk.assessor_name || '',
      project_id: risk.project_id || '',
      department: risk.department || '',
      review_date: risk.review_date || '',
      notes: risk.notes || '',
      approval_required: risk.approval_required !== undefined ? risk.approval_required : true,
    })
    setShowForm(true)
  }

  const getRiskLevelBadge = (level: string) => {
    const variants: Record<string, any> = {
      low: { className: 'bg-green-100 text-green-800', label: 'Low' },
      medium: { className: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
      high: { className: 'bg-orange-100 text-orange-800', label: 'High' },
      extreme: { className: 'bg-red-100 text-red-800', label: 'Extreme' },
    }
    return variants[level] || variants.medium
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: { className: 'bg-gray-100 text-gray-800', label: 'Draft' },
      in_review: { className: 'bg-blue-100 text-blue-800', label: 'In Review' },
      approved: { className: 'bg-green-100 text-green-800', label: 'Approved' },
      rejected: { className: 'bg-red-100 text-red-800', label: 'Rejected' },
      obsolete: { className: 'bg-gray-300 text-gray-700', label: 'Obsolete' },
    }
    return variants[status] || variants.draft
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Risk Assessments</h1>
          <p className="text-sm text-gray-500">Identify, analyze, and manage risks</p>
        </div>
        <Button onClick={() => {
          setEditingRisk(null)
          setFormData({
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
          setShowForm(true)
        }}>
          <Plus size={18} className="mr-2" />
          New Risk Assessment
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by title, hazard, assessor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 max-w-sm"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600 border border-red-200">
          {error}
          {error.includes('منظمة') && (
            <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.href = '/dashboard/organizations'}>
              Go to Organizations
            </Button>
          )}
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left">Title</th>
                  <th className="p-4 text-left">Risk Level</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Assessor</th>
                  <th className="p-4 text-left">Project</th>
                  <th className="p-4 text-left">Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-500">Loading...</td></tr>
                ) : filteredRisks.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <Shield className="h-12 w-12 text-gray-300 mb-2" />
                      <p>No risk assessments found</p>
                      <p className="text-xs">Click "New Risk Assessment" to get started</p>
                    </div>
                  </td></tr>
                ) : (
                  filteredRisks.map((r) => {
                    const riskBadge = getRiskLevelBadge(r.risk_level)
                    const statusBadge = getStatusBadge(r.status)
                    return (
                      <tr key={r.id} className="border-t hover:bg-gray-50">
                        <td className="p-4">
                          {/* ✅ الرابط الصحيح مع /dashboard */}
                          <Link href={`/dashboard/risk-assessments/${r.id}`} className="hover:text-blue-600 hover:underline">
                            <div className="font-medium">{r.title}</div>
                            <div className="text-xs text-gray-500">{r.hazard_identification?.substring(0, 50)}...</div>
                          </Link>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${riskBadge.className}`}>
                            {riskBadge.label}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.className}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <User size={14} className="text-gray-400" />
                            <span>{r.assessor_name || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          {r.projects?.name || 'N/A'}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} className="text-gray-400" />
                            <span>{new Date(r.created_at).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/dashboard/risk-assessments/${r.id}`} title="View Details">
                              <Eye size={16} className="text-gray-500 hover:text-blue-600 cursor-pointer" />
                            </Link>
                            <button
                              onClick={() => openEditForm(r)}
                              className="p-1 hover:bg-blue-50 rounded text-blue-600"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRisk(r)
                                setShowDeleteDialog(true)
                              }}
                              className="p-1 hover:bg-red-50 rounded text-red-600"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRisk ? 'Edit Risk Assessment' : 'New Risk Assessment'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                <Label>Review Date</Label>
                <Input
                  type="date"
                  value={formData.review_date}
                  onChange={(e) => setFormData({ ...formData, review_date: e.target.value })}
                />
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
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.approval_required}
                onChange={(e) => setFormData({ ...formData, approval_required: e.target.checked })}
                className="h-4 w-4"
              />
              <Label className="text-sm">Approval Required</Label>
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : editingRisk ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Risk Assessment</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete <strong>{selectedRisk?.title}</strong>?
          </p>
          <p className="text-sm text-gray-500">This action cannot be undone.</p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}