// src/app/dashboard/toolbox-talks/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Edit2, Trash2, Eye, Calendar, MapPin, User, Users, CheckCircle, XCircle, Clock } from 'lucide-react'
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

interface ToolboxTalk {
  id: string
  title: string
  topic: string
  date: string
  location: string
  conducted_by: string
  attendees_count: number
  duration: number
  completed: boolean
  project_id: string
  created_at: string
  projects: { name: string }
}

export default function ToolboxTalksPage() {
  const [talks, setTalks] = useState<ToolboxTalk[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingTalk, setEditingTalk] = useState<ToolboxTalk | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    topic: '',
    date: '',
    location: '',
    conducted_by: '',
    duration: 30,
    attendees_count: 0,
    key_points: '',
    discussion_points: '',
    action_items: '',
    project_id: '',
  })
  const [projects, setProjects] = useState<any[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedTalk, setSelectedTalk] = useState<ToolboxTalk | null>(null)
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
  const fetchTalks = async () => {
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
        setTalks([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('toolbox_talks')
        .select(`
          *,
          projects:project_id (name)
        `)
        .eq('organization_id', profile.organization_id)
        .order('date', { ascending: false })

      if (error) throw error
      setTalks(data || [])
    } catch (err: any) {
      console.error('Fetch error:', err)
      setError(err.message || 'حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
    fetchTalks()
  }, [])

  const filteredTalks = talks.filter(t => {
    const search = searchTerm.toLowerCase()
    return (
      t.title?.toLowerCase().includes(search) ||
      t.topic?.toLowerCase().includes(search) ||
      t.location?.toLowerCase().includes(search) ||
      t.conducted_by?.toLowerCase().includes(search)
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
        title: formData.title,
        topic: formData.topic,
        date: formData.date || new Date().toISOString().split('T')[0],
        location: formData.location || null,
        conducted_by: formData.conducted_by || null,
        duration: parseInt(formData.duration as any) || 30,
        attendees_count: parseInt(formData.attendees_count as any) || 0,
        key_points: formData.key_points || null,
        discussion_points: formData.discussion_points || null,
        action_items: formData.action_items || null,
        project_id: formData.project_id || null,
        completed: false,
      }

      let result
      if (editingTalk) {
        result = await supabase
          .from('toolbox_talks')
          .update(dataToSave)
          .eq('id', editingTalk.id)
        if (!result.error) toast.success('Toolbox talk updated successfully')
      } else {
        result = await supabase
          .from('toolbox_talks')
          .insert(dataToSave)
        if (!result.error) toast.success('Toolbox talk created successfully')
      }

      if (result.error) throw result.error

      setShowForm(false)
      setEditingTalk(null)
      setFormData({
        title: '',
        topic: '',
        date: '',
        location: '',
        conducted_by: '',
        duration: 30,
        attendees_count: 0,
        key_points: '',
        discussion_points: '',
        action_items: '',
        project_id: '',
      })
      fetchTalks()
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to save: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedTalk) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('toolbox_talks')
        .delete()
        .eq('id', selectedTalk.id)

      if (error) throw error
      toast.success('Toolbox talk deleted successfully')
      setShowDeleteDialog(false)
      setSelectedTalk(null)
      fetchTalks()
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to delete: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const openEditForm = (talk: ToolboxTalk) => {
    setEditingTalk(talk)
    setFormData({
      title: talk.title || '',
      topic: talk.topic || '',
      date: talk.date || '',
      location: talk.location || '',
      conducted_by: talk.conducted_by || '',
      duration: talk.duration || 30,
      attendees_count: talk.attendees_count || 0,
      key_points: talk.key_points || '',
      discussion_points: talk.discussion_points || '',
      action_items: talk.action_items || '',
      project_id: talk.project_id || '',
    })
    setShowForm(true)
  }

  const getStatusBadge = (completed: boolean) => {
    if (completed) {
      return { className: 'bg-green-100 text-green-800', label: 'Completed', icon: CheckCircle }
    }
    return { className: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: Clock }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Toolbox Talks</h1>
          <p className="text-sm text-gray-500">Manage daily safety meetings</p>
        </div>
        <Button onClick={() => {
          setEditingTalk(null)
          setFormData({
            title: '',
            topic: '',
            date: '',
            location: '',
            conducted_by: '',
            duration: 30,
            attendees_count: 0,
            key_points: '',
            discussion_points: '',
            action_items: '',
            project_id: '',
          })
          setShowForm(true)
        }}>
          <Plus size={18} className="mr-2" />
          New Toolbox Talk
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by title, topic, location..."
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
                  <th className="p-4 text-left">Topic</th>
                  <th className="p-4 text-left">Date</th>
                  <th className="p-4 text-left">Location</th>
                  <th className="p-4 text-left">Conducted By</th>
                  <th className="p-4 text-left">Attendees</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="p-8 text-center text-gray-500">Loading...</td></tr>
                ) : filteredTalks.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <Users className="h-12 w-12 text-gray-300 mb-2" />
                      <p>No toolbox talks found</p>
                      <p className="text-xs">Click "New Toolbox Talk" to get started</p>
                    </div>
                  </td></tr>
                ) : (
                  filteredTalks.map((t) => {
                    const status = getStatusBadge(t.completed)
                    const StatusIcon = status.icon
                    return (
                      <tr key={t.id} className="border-t hover:bg-gray-50">
                        <td className="p-4">
                          {/* ✅ الرابط الصحيح مع /dashboard */}
                          <Link href={`/dashboard/toolbox-talks/${t.id}`} className="hover:text-blue-600 hover:underline">
                            <div className="font-medium">{t.title || 'Untitled'}</div>
                            <div className="text-xs text-gray-500">{t.projects?.name || 'No Project'}</div>
                          </Link>
                        </td>
                        <td className="p-4">{t.topic || 'N/A'}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} className="text-gray-400" />
                            <span>{t.date ? new Date(t.date).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <MapPin size={14} className="text-gray-400" />
                            <span>{t.location || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <User size={14} className="text-gray-400" />
                            <span>{t.conducted_by || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <Users size={14} className="text-gray-400" />
                            <span>{t.attendees_count || 0}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${status.className}`}>
                            <StatusIcon size={12} />
                            {status.label}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/dashboard/toolbox-talks/${t.id}`} title="View Details">
                              <Eye size={16} className="text-gray-500 hover:text-blue-600 cursor-pointer" />
                            </Link>
                            <button
                              onClick={() => openEditForm(t)}
                              className="p-1 hover:bg-blue-50 rounded text-blue-600"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedTalk(t)
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
            <DialogTitle>{editingTalk ? 'Edit Toolbox Talk' : 'New Toolbox Talk'}</DialogTitle>
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
              <Label>Topic *</Label>
              <Input
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  min="5"
                  max="120"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 30 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Location</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Meeting location"
                />
              </div>
              <div>
                <Label>Conducted By</Label>
                <Input
                  value={formData.conducted_by}
                  onChange={(e) => setFormData({ ...formData, conducted_by: e.target.value })}
                  placeholder="Supervisor name"
                />
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
              <Label>Attendees Count</Label>
              <Input
                type="number"
                min="0"
                value={formData.attendees_count}
                onChange={(e) => setFormData({ ...formData, attendees_count: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Key Points</Label>
              <textarea
                value={formData.key_points}
                onChange={(e) => setFormData({ ...formData, key_points: e.target.value })}
                className="w-full border rounded-md px-3 py-2 min-h-[60px]"
                placeholder="Key points covered"
              />
            </div>
            <div>
              <Label>Discussion Points</Label>
              <textarea
                value={formData.discussion_points}
                onChange={(e) => setFormData({ ...formData, discussion_points: e.target.value })}
                className="w-full border rounded-md px-3 py-2 min-h-[60px]"
                placeholder="Discussion topics"
              />
            </div>
            <div>
              <Label>Action Items</Label>
              <textarea
                value={formData.action_items}
                onChange={(e) => setFormData({ ...formData, action_items: e.target.value })}
                className="w-full border rounded-md px-3 py-2 min-h-[60px]"
                placeholder="Action items from the meeting"
              />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : editingTalk ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Toolbox Talk</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete <strong>{selectedTalk?.title}</strong>?
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