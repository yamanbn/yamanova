// src/app/dashboard/permits/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Edit2, Trash2, Eye, Calendar, MapPin, User, FileText, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'
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

interface Permit {
  id: string
  title: string
  permit_type: string
  status: string
  priority: string
  risk_level: string
  location: string
  start_datetime: string
  end_datetime: string
  applicant_name: string
  project_id: string
  created_at: string
  projects: { name: string }
}

export default function PermitsPage() {
  const [permits, setPermits] = useState<Permit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingPermit, setEditingPermit] = useState<Permit | null>(null)
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
  const [projects, setProjects] = useState<any[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null)
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
  const fetchPermits = async () => {
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
        setPermits([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('permits')
        .select(`
          *,
          projects:project_id (name)
        `)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPermits(data || [])
    } catch (err: any) {
      console.error('Fetch error:', err)
      setError(err.message || 'حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
    fetchPermits()
  }, [])

  const filteredPermits = permits.filter(p => {
    const search = searchTerm.toLowerCase()
    return (
      p.title?.toLowerCase().includes(search) ||
      p.permit_type?.toLowerCase().includes(search) ||
      p.location?.toLowerCase().includes(search) ||
      p.applicant_name?.toLowerCase().includes(search)
    )
  })

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

      const dataToSave = {
        organization_id: profile.organization_id,
        title: formData.title,
        permit_type: formData.permit_type,
        description: formData.description || null,
        location: formData.location || null,
        start_datetime: formData.start_datetime || null,
        end_datetime: formData.end_datetime || null,
        applicant_name: formData.applicant_name || null,
        applicant_id: profile.id,
        priority: formData.priority,
        risk_level: formData.risk_level,
        control_measures: formData.control_measures || null,
        ppe_required: formData.ppe_required || null,
        emergency_procedures: formData.emergency_procedures || null,
        notes: formData.notes || null,
        project_id: formData.project_id || null,
        status: 'pending',
      }

      let result
      if (editingPermit) {
        result = await supabase
          .from('permits')
          .update(dataToSave)
          .eq('id', editingPermit.id)
        if (!result.error) toast.success('Permit updated successfully')
      } else {
        result = await supabase
          .from('permits')
          .insert(dataToSave)
        if (!result.error) toast.success('Permit created successfully')
      }

      if (result.error) throw result.error

      setShowForm(false)
      setEditingPermit(null)
      setFormData({
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
      fetchPermits()
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to save: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedPermit) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('permits')
        .delete()
        .eq('id', selectedPermit.id)

      if (error) throw error
      toast.success('Permit deleted successfully')
      setShowDeleteDialog(false)
      setSelectedPermit(null)
      fetchPermits()
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to delete: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const openEditForm = (permit: Permit) => {
    setEditingPermit(permit)
    setFormData({
      title: permit.title || '',
      permit_type: permit.permit_type || 'hot_work',
      description: permit.description || '',
      location: permit.location || '',
      start_datetime: permit.start_datetime || '',
      end_datetime: permit.end_datetime || '',
      applicant_name: permit.applicant_name || '',
      priority: permit.priority || 'medium',
      risk_level: permit.risk_level || 'medium',
      control_measures: permit.control_measures || '',
      ppe_required: permit.ppe_required || '',
      emergency_procedures: permit.emergency_procedures || '',
      notes: permit.notes || '',
      project_id: permit.project_id || '',
    })
    setShowForm(true)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { className: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: Clock },
      in_review: { className: 'bg-blue-100 text-blue-800', label: 'In Review', icon: Clock },
      approved: { className: 'bg-green-100 text-green-800', label: 'Approved', icon: CheckCircle },
      rejected: { className: 'bg-red-100 text-red-800', label: 'Rejected', icon: XCircle },
      cancelled: { className: 'bg-gray-100 text-gray-800', label: 'Cancelled', icon: XCircle },
      expired: { className: 'bg-gray-300 text-gray-700', label: 'Expired', icon: Clock },
      closed: { className: 'bg-green-200 text-green-800', label: 'Closed', icon: CheckCircle },
    }
    return variants[status] || variants.pending
  }

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, any> = {
      low: { className: 'bg-gray-100 text-gray-800', label: 'Low' },
      medium: { className: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
      high: { className: 'bg-orange-100 text-orange-800', label: 'High' },
      critical: { className: 'bg-red-100 text-red-800', label: 'Critical' },
    }
    return variants[priority] || variants.medium
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      hot_work: 'Hot Work',
      cold_work: 'Cold Work',
      confined_space: 'Confined Space',
      working_at_height: 'Working at Height',
      electrical: 'Electrical Work',
      lifting: 'Lifting Operations',
      excavation: 'Excavation',
      chemical: 'Chemical Handling',
      other: 'Other',
    }
    return labels[type] || type
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Permits to Work</h1>
          <p className="text-sm text-gray-500">Manage work permits and approvals</p>
        </div>
        <Button onClick={() => {
          setEditingPermit(null)
          setFormData({
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
          setShowForm(true)
        }}>
          <Plus size={18} className="mr-2" />
          New Permit
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by title, type, location..."
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
                  <th className="p-4 text-left">Permit</th>
                  <th className="p-4 text-left">Type</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Priority</th>
                  <th className="p-4 text-left">Applicant</th>
                  <th className="p-4 text-left">Start</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-500">Loading...</td></tr>
                ) : filteredPermits.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <FileText className="h-12 w-12 text-gray-300 mb-2" />
                      <p>No permits found</p>
                      <p className="text-xs">Click "New Permit" to get started</p>
                    </div>
                  </td></tr>
                ) : (
                  filteredPermits.map((p) => {
                    const status = getStatusBadge(p.status)
                    const priority = getPriorityBadge(p.priority)
                    const StatusIcon = status.icon
                    return (
                      <tr key={p.id} className="border-t hover:bg-gray-50">
                        <td className="p-4">
                          {/* ✅ الرابط الصحيح مع /dashboard */}
                          <Link href={`/dashboard/permits/${p.id}`} className="hover:text-blue-600 hover:underline">
                            <div className="font-medium">{p.title}</div>
                            <div className="text-xs text-gray-500">{p.projects?.name || 'No Project'}</div>
                          </Link>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {getTypeLabel(p.permit_type)}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${status.className}`}>
                            <StatusIcon size={12} />
                            {status.label}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${priority.className}`}>
                            {priority.label}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <User size={14} className="text-gray-400" />
                            <span>{p.applicant_name || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} className="text-gray-400" />
                            <span>{p.start_datetime ? new Date(p.start_datetime).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/dashboard/permits/${p.id}`} title="View Details">
                              <Eye size={16} className="text-gray-500 hover:text-blue-600 cursor-pointer" />
                            </Link>
                            <button
                              onClick={() => openEditForm(p)}
                              className="p-1 hover:bg-blue-50 rounded text-blue-600"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedPermit(p)
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
            <DialogTitle>{editingPermit ? 'Edit Permit' : 'New Permit to Work'}</DialogTitle>
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
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : editingPermit ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Permit</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete <strong>{selectedPermit?.title}</strong>?
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