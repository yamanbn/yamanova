// src/app/dashboard/projects/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Edit2, Trash2, Calendar, Building2, User, MapPin, Eye } from 'lucide-react'
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

interface Project {
  id: string
  name: string
  code: string
  client_name: string
  status: string
  start_date: string
  end_date: string
  location: string
  description: string
  created_at: string
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    client_name: '',
    status: 'planning',
    start_date: '',
    end_date: '',
    location: '',
    description: '',
  })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const supabase = createClient()

  // ✅ استخدام limit(1).maybeSingle() لتجنب مشكلة الصفوف المتعددة
  const fetchProjects = async () => {
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
        setProjects([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (err: any) {
      console.error('Fetch error:', err)
      setError(err.message || 'حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const filteredProjects = projects.filter(p => {
    const search = searchTerm.toLowerCase()
    return (
      p.name?.toLowerCase().includes(search) ||
      p.code?.toLowerCase().includes(search) ||
      p.client_name?.toLowerCase().includes(search) ||
      p.location?.toLowerCase().includes(search)
    )
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .limit(1)
        .maybeSingle()

      if (profileError || !profile?.organization_id) {
        throw new Error('لم يتم العثور على منظمة')
      }

      const dataToSave = {
        organization_id: profile.organization_id,
        name: formData.name,
        code: formData.code || null,
        client_name: formData.client_name || null,
        status: formData.status,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        location: formData.location || null,
        description: formData.description || null,
      }

      let result
      if (editingProject) {
        result = await supabase
          .from('projects')
          .update(dataToSave)
          .eq('id', editingProject.id)
        if (!result.error) toast.success('Project updated successfully')
      } else {
        result = await supabase
          .from('projects')
          .insert(dataToSave)
        if (!result.error) toast.success('Project created successfully')
      }

      if (result.error) throw result.error

      setShowForm(false)
      setEditingProject(null)
      setFormData({ name: '', code: '', client_name: '', status: 'planning', start_date: '', end_date: '', location: '', description: '' })
      fetchProjects()
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to save project: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedProject) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', selectedProject.id)

      if (error) throw error
      toast.success('Project deleted successfully')
      setShowDeleteDialog(false)
      setSelectedProject(null)
      fetchProjects()
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to delete project: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const openEditForm = (project: Project) => {
    setEditingProject(project)
    setFormData({
      name: project.name || '',
      code: project.code || '',
      client_name: project.client_name || '',
      status: project.status || 'planning',
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      location: project.location || '',
      description: project.description || '',
    })
    setShowForm(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'on_hold': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      planning: 'Planning',
      active: 'Active',
      on_hold: 'On Hold',
      completed: 'Completed',
      cancelled: 'Cancelled',
    }
    return labels[status] || status
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-sm text-gray-500">Manage your projects and sites</p>
        </div>
        <Button onClick={() => {
          setEditingProject(null)
          setFormData({ name: '', code: '', client_name: '', status: 'planning', start_date: '', end_date: '', location: '', description: '' })
          setShowForm(true)
        }}>
          <Plus size={18} className="mr-2" />
          Add Project
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search projects by name, code, client..."
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

      {/* Projects Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left">Project</th>
                  <th className="p-4 text-left">Client</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Timeline</th>
                  <th className="p-4 text-left">Location</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading...</td></tr>
                ) : filteredProjects.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <Building2 className="h-12 w-12 text-gray-300 mb-2" />
                      <p>No projects found</p>
                      <p className="text-xs">Click "Add Project" to get started</p>
                    </div>
                  </td></tr>
                ) : (
                  filteredProjects.map((p) => (
                    <tr key={p.id} className="border-t hover:bg-gray-50">
                      <td className="p-4">
                        <Link href={`/dashboard/projects/${p.id}`} className="hover:text-blue-600 hover:underline">
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-gray-500">#{p.code || 'N/A'}</div>
                        </Link>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <User size={14} className="text-gray-400" />
                          <span>{p.client_name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(p.status)}`}>
                          {getStatusLabel(p.status)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-xs">
                          <Calendar size={14} className="text-gray-400" />
                          <span>
                            {p.start_date ? new Date(p.start_date).toLocaleDateString() : 'N/A'}
                            {p.end_date && ` → ${new Date(p.end_date).toLocaleDateString()}`}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <MapPin size={14} className="text-gray-400" />
                          <span>{p.location || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditForm(p)}
                            className="p-1 hover:bg-blue-50 rounded text-blue-600"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProject(p)
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Project Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProject ? 'Edit Project' : 'Add New Project'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Project Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Project Code</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., PRJ-001"
                />
              </div>
              <div>
                <Label>Client Name</Label>
                <Input
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  placeholder="Client name"
                />
              </div>
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
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Project location"
              />
            </div>
            <div>
              <Label>Description</Label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border rounded-md px-3 py-2 min-h-[80px]"
                placeholder="Project description"
              />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : editingProject ? 'Update' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Project</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete <strong>{selectedProject?.name}</strong>?
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