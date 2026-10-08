// src/app/dashboard/inspections/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Edit2, Trash2, Eye, Calendar, MapPin, User, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
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

interface Inspection {
  id: string
  title: string
  inspection_type: string
  status: string
  priority: string
  location: string
  scheduled_date: string
  inspector_name: string
  project_id: string
  passed: boolean
  score: number
  created_at: string
  projects: { name: string }
}

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingInspection, setEditingInspection] = useState<Inspection | null>(null)
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
  })
  const [projects, setProjects] = useState<any[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null)
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
  const fetchInspections = async () => {
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
        setInspections([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('inspections')
        .select(`
          *,
          projects:project_id (name)
        `)
        .eq('organization_id', profile.organization_id)
        .order('scheduled_date', { ascending: false })

      if (error) throw error

      setInspections(data || [])
    } catch (err: any) {
      console.error('Fetch error:', err)
      setError(err.message || 'حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
    fetchInspections()
  }, [])

  const filteredInspections = inspections.filter(ins => {
    const search = searchTerm.toLowerCase()
    return (
      ins.title?.toLowerCase().includes(search) ||
      ins.inspection_type?.toLowerCase().includes(search) ||
      ins.location?.toLowerCase().includes(search) ||
      ins.inspector_name?.toLowerCase().includes(search)
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
        inspection_type: formData.inspection_type,
        status: formData.status,
        priority: formData.priority,
        location: formData.location || null,
        scheduled_date: formData.scheduled_date || null,
        inspector_name: formData.inspector_name || null,
        project_id: formData.project_id || null,
        notes: formData.notes || null,
        inspector_id: profile.id,
      }

      let result
      if (editingInspection) {
        result = await supabase
          .from('inspections')
          .update(dataToSave)
          .eq('id', editingInspection.id)
        if (!result.error) toast.success('Inspection updated successfully')
      } else {
        result = await supabase
          .from('inspections')
          .insert(dataToSave)
        if (!result.error) toast.success('Inspection scheduled successfully')
      }

      if (result.error) throw result.error

      setShowForm(false)
      setEditingInspection(null)
      setFormData({ title: '', inspection_type: 'site', status: 'scheduled', priority: 'medium', location: '', scheduled_date: '', inspector_name: '', project_id: '', notes: '' })
      fetchInspections()
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to save inspection: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedInspection) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('inspections')
        .delete()
        .eq('id', selectedInspection.id)

      if (error) throw error
      toast.success('Inspection deleted successfully')
      setShowDeleteDialog(false)
      setSelectedInspection(null)
      fetchInspections()
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to delete inspection: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const openEditForm = (inspection: Inspection) => {
    setEditingInspection(inspection)
    setFormData({
      title: inspection.title || '',
      inspection_type: inspection.inspection_type || 'site',
      status: inspection.status || 'scheduled',
      priority: inspection.priority || 'medium',
      location: inspection.location || '',
      scheduled_date: inspection.scheduled_date || '',
      inspector_name: inspection.inspector_name || '',
      project_id: inspection.project_id || '',
      notes: inspection.notes || '',
    })
    setShowForm(true)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      scheduled: { className: 'bg-blue-100 text-blue-800', label: 'Scheduled', icon: Clock },
      in_progress: { className: 'bg-yellow-100 text-yellow-800', label: 'In Progress', icon: AlertCircle },
      completed: { className: 'bg-green-100 text-green-800', label: 'Completed', icon: CheckCircle },
      cancelled: { className: 'bg-gray-100 text-gray-800', label: 'Cancelled', icon: XCircle },
      overdue: { className: 'bg-red-100 text-red-800', label: 'Overdue', icon: AlertCircle },
    }
    return variants[status] || variants.scheduled
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
      site: 'Site Inspection',
      fire_safety: 'Fire Safety',
      ppe: 'PPE Inspection',
      vehicle: 'Vehicle Inspection',
      equipment: 'Equipment Inspection',
      environmental: 'Environmental',
      quality: 'Quality Check',
      custom: 'Custom Inspection',
    }
    return labels[type] || type
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inspections</h1>
          <p className="text-sm text-gray-500">Schedule and manage inspections</p>
        </div>
        <Button onClick={() => {
          setEditingInspection(null)
          setFormData({ title: '', inspection_type: 'site', status: 'scheduled', priority: 'medium', location: '', scheduled_date: '', inspector_name: '', project_id: '', notes: '' })
          setShowForm(true)
        }}>
          <Plus size={18} className="mr-2" />
          Schedule Inspection
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search inspections by title, type, location..."
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

      {/* Inspections Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left">Inspection</th>
                  <th className="p-4 text-left">Type</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Priority</th>
                  <th className="p-4 text-left">Date</th>
                  <th className="p-4 text-left">Inspector</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-500">Loading...</td></tr>
                ) : filteredInspections.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <Search className="h-12 w-12 text-gray-300 mb-2" />
                      <p>No inspections found</p>
                      <p className="text-xs">Click "Schedule Inspection" to get started</p>
                    </div>
                  </td></tr>
                ) : (
                  filteredInspections.map((ins) => {
                    const status = getStatusBadge(ins.status)
                    const priority = getPriorityBadge(ins.priority)
                    const StatusIcon = status.icon
                    return (
                      <tr key={ins.id} className="border-t hover:bg-gray-50">
                        <td className="p-4">
                          {/* ✅ الرابط الصحيح مع /dashboard */}
                          <Link href={`/dashboard/inspections/${ins.id}`} className="hover:text-blue-600 hover:underline">
                            <div className="font-medium">{ins.title || 'Untitled Inspection'}</div>
                            <div className="text-xs text-gray-500">
                              {ins.projects?.name || 'No Project'}
                            </div>
                          </Link>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {getTypeLabel(ins.inspection_type)}
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
                            <Calendar size={14} className="text-gray-400" />
                            <span>{ins.scheduled_date ? new Date(ins.scheduled_date).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <User size={14} className="text-gray-400" />
                            <span>{ins.inspector_name || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/dashboard/inspections/${ins.id}`} title="View Details">
                              <Eye size={16} className="text-gray-500 hover:text-blue-600 cursor-pointer" />
                            </Link>
                            <button
                              onClick={() => openEditForm(ins)}
                              className="p-1 hover:bg-blue-50 rounded text-blue-600"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedInspection(ins)
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

      {/* Schedule Inspection Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingInspection ? 'Edit Inspection' : 'Schedule Inspection'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Inspection Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter inspection title"
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
                {loading ? 'Saving...' : editingInspection ? 'Update' : 'Schedule'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Inspection</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete <strong>{selectedInspection?.title}</strong>?
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