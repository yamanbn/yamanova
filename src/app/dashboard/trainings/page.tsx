// src/app/dashboard/trainings/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Edit2, Trash2, Eye, Calendar, MapPin, User, GraduationCap, CheckCircle, XCircle, Clock, Users, Award } from 'lucide-react'
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

interface Training {
  id: string
  title: string
  training_type: string
  trainer_name: string
  location: string
  start_date: string
  end_date: string
  status: string
  max_attendees: number
  is_mandatory: boolean
  created_at: string
}

export default function TrainingsPage() {
  const [trainings, setTrainings] = useState<Training[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingTraining, setEditingTraining] = useState<Training | null>(null)
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null)
  const supabase = createClient()

  // ✅ استخدام limit(1).maybeSingle() لتجنب مشكلة الصفوف المتعددة
  const fetchTrainings = async () => {
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
        setTrainings([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('trainings')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('start_date', { ascending: false })

      if (error) throw error
      setTrainings(data || [])
    } catch (err: any) {
      console.error('Fetch error:', err)
      setError(err.message || 'حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrainings()
  }, [])

  const filteredTrainings = trainings.filter(t => {
    const search = searchTerm.toLowerCase()
    return (
      t.title?.toLowerCase().includes(search) ||
      t.training_type?.toLowerCase().includes(search) ||
      t.trainer_name?.toLowerCase().includes(search) ||
      t.location?.toLowerCase().includes(search)
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

      let result
      if (editingTraining) {
        result = await supabase
          .from('trainings')
          .update(dataToSave)
          .eq('id', editingTraining.id)
        if (!result.error) toast.success('Training updated successfully')
      } else {
        result = await supabase
          .from('trainings')
          .insert(dataToSave)
        if (!result.error) toast.success('Training created successfully')
      }

      if (result.error) throw result.error

      setShowForm(false)
      setEditingTraining(null)
      setFormData({
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
      fetchTrainings()
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to save: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedTraining) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('trainings')
        .delete()
        .eq('id', selectedTraining.id)

      if (error) throw error
      toast.success('Training deleted successfully')
      setShowDeleteDialog(false)
      setSelectedTraining(null)
      fetchTrainings()
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to delete: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const openEditForm = (training: Training) => {
    setEditingTraining(training)
    setFormData({
      title: training.title || '',
      description: training.description || '',
      training_type: training.training_type || 'safety',
      trainer_name: training.trainer_name || '',
      trainer_company: training.trainer_company || '',
      location: training.location || '',
      start_date: training.start_date || '',
      end_date: training.end_date || '',
      duration_hours: training.duration_hours || 0,
      max_attendees: training.max_attendees || 0,
      status: training.status || 'scheduled',
      cost: training.cost ? String(training.cost) : '',
      notes: training.notes || '',
      is_mandatory: training.is_mandatory || false,
    })
    setShowForm(true)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      scheduled: { className: 'bg-blue-100 text-blue-800', label: 'Scheduled', icon: Clock },
      in_progress: { className: 'bg-yellow-100 text-yellow-800', label: 'In Progress', icon: Clock },
      completed: { className: 'bg-green-100 text-green-800', label: 'Completed', icon: CheckCircle },
      cancelled: { className: 'bg-red-100 text-red-800', label: 'Cancelled', icon: XCircle },
    }
    return variants[status] || variants.scheduled
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      safety: 'Safety',
      technical: 'Technical',
      leadership: 'Leadership',
      compliance: 'Compliance',
      soft_skills: 'Soft Skills',
      certification: 'Certification',
      other: 'Other',
    }
    return labels[type] || type
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trainings</h1>
          <p className="text-sm text-gray-500">Manage training programs and certifications</p>
        </div>
        <Button onClick={() => {
          setEditingTraining(null)
          setFormData({
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
          setShowForm(true)
        }}>
          <Plus size={18} className="mr-2" />
          New Training
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold">{trainings.length}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Scheduled</p>
                <p className="text-2xl font-bold text-blue-600">
                  {trainings.filter(t => t.status === 'scheduled').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {trainings.filter(t => t.status === 'in_progress').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {trainings.filter(t => t.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Mandatory</p>
                <p className="text-2xl font-bold text-orange-600">
                  {trainings.filter(t => t.is_mandatory).length}
                </p>
              </div>
              <Award className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by title, type, trainer..."
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
                  <th className="p-4 text-left">Training</th>
                  <th className="p-4 text-left">Type</th>
                  <th className="p-4 text-left">Trainer</th>
                  <th className="p-4 text-left">Location</th>
                  <th className="p-4 text-left">Date</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Mandatory</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="p-8 text-center text-gray-500">Loading...</td></tr>
                ) : filteredTrainings.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <GraduationCap className="h-12 w-12 text-gray-300 mb-2" />
                      <p>No trainings found</p>
                      <p className="text-xs">Click "New Training" to get started</p>
                    </div>
                  </td></tr>
                ) : (
                  filteredTrainings.map((t) => {
                    const status = getStatusBadge(t.status)
                    const StatusIcon = status.icon
                    return (
                      <tr key={t.id} className="border-t hover:bg-gray-50">
                        <td className="p-4">
                          {/* ✅ الرابط الصحيح مع /dashboard */}
                          <Link href={`/dashboard/trainings/${t.id}`} className="hover:text-blue-600 hover:underline">
                            <div className="font-medium">{t.title}</div>
                            <div className="text-xs text-gray-500">Max: {t.max_attendees} attendees</div>
                          </Link>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {getTypeLabel(t.training_type)}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <User size={14} className="text-gray-400" />
                            <span>{t.trainer_name || 'N/A'}</span>
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
                            <Calendar size={14} className="text-gray-400" />
                            <span>{t.start_date ? new Date(t.start_date).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${status.className}`}>
                            <StatusIcon size={12} />
                            {status.label}
                          </span>
                        </td>
                        <td className="p-4">
                          {t.is_mandatory ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Mandatory</span>
                          ) : (
                            <span className="text-xs text-gray-400">Optional</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/dashboard/trainings/${t.id}`} title="View Details">
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
                                setSelectedTraining(t)
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
            <DialogTitle>{editingTraining ? 'Edit Training' : 'New Training'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : editingTraining ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Training</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete <strong>{selectedTraining?.title}</strong>?
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