// src/app/dashboard/incidents/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Edit2, Trash2, Eye, AlertTriangle, Calendar, MapPin, User } from 'lucide-react'
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

interface Incident {
  id: string
  title: string
  incident_type: string
  severity: string
  location: string
  datetime: string
  description: string
  status: string
  investigation_status: string
  reported_by: string
  reported_by_name: string
  created_at: string
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    incident_type: 'accident',
    severity: 'medium',
    location: '',
    datetime: '',
    description: '',
    reported_by_name: '',
  })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const supabase = createClient()

  // ✅ استخدام limit(1).maybeSingle() لتجنب مشكلة الصفوف المتعددة
  const fetchIncidents = async () => {
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
        setIncidents([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('incidents')
        .select(`
          *,
          profiles:reported_by (full_name)
        `)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedData = data?.map((inc: any) => ({
        ...inc,
        reported_by_name: inc.profiles?.full_name || 'N/A'
      })) || []
      
      setIncidents(formattedData)
    } catch (err: any) {
      console.error('Fetch error:', err)
      setError(err.message || 'حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIncidents()
  }, [])

  const filteredIncidents = incidents.filter(inc => {
    const search = searchTerm.toLowerCase()
    return (
      inc.title?.toLowerCase().includes(search) ||
      inc.incident_type?.toLowerCase().includes(search) ||
      inc.location?.toLowerCase().includes(search) ||
      inc.description?.toLowerCase().includes(search) ||
      inc.reported_by_name?.toLowerCase().includes(search)
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
        incident_type: formData.incident_type,
        severity: formData.severity,
        location: formData.location || null,
        datetime: formData.datetime || new Date().toISOString(),
        description: formData.description,
        reported_by: profile.id,
        status: 'pending',
        investigation_status: 'pending',
        reported_by_name: formData.reported_by_name || null,
      }

      let result
      if (editingIncident) {
        result = await supabase
          .from('incidents')
          .update(dataToSave)
          .eq('id', editingIncident.id)
        if (!result.error) toast.success('Incident updated successfully')
      } else {
        result = await supabase
          .from('incidents')
          .insert(dataToSave)
        if (!result.error) toast.success('Incident reported successfully')
      }

      if (result.error) throw result.error

      setShowForm(false)
      setEditingIncident(null)
      setFormData({ title: '', incident_type: 'accident', severity: 'medium', location: '', datetime: '', description: '', reported_by_name: '' })
      fetchIncidents()
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to save incident: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedIncident) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('incidents')
        .delete()
        .eq('id', selectedIncident.id)

      if (error) throw error
      toast.success('Incident deleted successfully')
      setShowDeleteDialog(false)
      setSelectedIncident(null)
      fetchIncidents()
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to delete incident: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const openEditForm = (incident: Incident) => {
    setEditingIncident(incident)
    setFormData({
      title: incident.title || '',
      incident_type: incident.incident_type || 'accident',
      severity: incident.severity || 'medium',
      location: incident.location || '',
      datetime: incident.datetime || '',
      description: incident.description || '',
      reported_by_name: incident.reported_by_name || '',
    })
    setShowForm(true)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'catastrophic': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      accident: 'Accident',
      near_miss: 'Near Miss',
      unsafe_act: 'Unsafe Act',
      property_damage: 'Property Damage',
      environmental: 'Environmental',
      health_issue: 'Health Issue',
    }
    return labels[type] || type
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { className: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      in_progress: { className: 'bg-blue-100 text-blue-800', label: 'In Progress' },
      completed: { className: 'bg-green-100 text-green-800', label: 'Completed' },
      closed: { className: 'bg-gray-100 text-gray-800', label: 'Closed' },
    }
    return variants[status] || variants.pending
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Incidents</h1>
          <p className="text-sm text-gray-500">Report and manage safety incidents</p>
        </div>
        <Button onClick={() => {
          setEditingIncident(null)
          setFormData({ title: '', incident_type: 'accident', severity: 'medium', location: '', datetime: '', description: '', reported_by_name: '' })
          setShowForm(true)
        }}>
          <Plus size={18} className="mr-2" />
          Report Incident
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search incidents by title, type, location..."
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

      {/* Incidents Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left">Incident</th>
                  <th className="p-4 text-left">Type</th>
                  <th className="p-4 text-left">Severity</th>
                  <th className="p-4 text-left">Location</th>
                  <th className="p-4 text-left">Date</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-500">Loading...</td></tr>
                ) : filteredIncidents.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <AlertTriangle className="h-12 w-12 text-gray-300 mb-2" />
                      <p>No incidents reported</p>
                      <p className="text-xs">Click "Report Incident" to get started</p>
                    </div>
                  </td></tr>
                ) : (
                  filteredIncidents.map((inc) => {
                    const status = getStatusBadge(inc.status)
                    return (
                      <tr key={inc.id} className="border-t hover:bg-gray-50">
                        <td className="p-4">
                          {/* ✅ الرابط الصحيح مع /dashboard */}
                          <Link href={`/dashboard/incidents/${inc.id}`} className="hover:text-blue-600 hover:underline">
                            <div className="font-medium">{inc.title || 'Untitled Incident'}</div>
                            <div className="text-xs text-gray-500">Reported by: {inc.reported_by_name || 'N/A'}</div>
                          </Link>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {getTypeBadge(inc.incident_type)}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(inc.severity)}`}>
                            {inc.severity || 'N/A'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <MapPin size={14} className="text-gray-400" />
                            <span>{inc.location || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} className="text-gray-400" />
                            <span>{inc.datetime ? new Date(inc.datetime).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/dashboard/incidents/${inc.id}`} title="View Details">
                              <Eye size={16} className="text-gray-500 hover:text-blue-600 cursor-pointer" />
                            </Link>
                            <button
                              onClick={() => openEditForm(inc)}
                              className="p-1 hover:bg-blue-50 rounded text-blue-600"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedIncident(inc)
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

      {/* Report Incident Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingIncident ? 'Edit Incident' : 'Report Incident'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Incident Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter incident title"
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
                className="w-full border rounded-md px-3 py-2 min-h-[100px]"
                placeholder="Describe the incident in detail"
                required
              />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : editingIncident ? 'Update' : 'Report'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Incident</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete <strong>{selectedIncident?.title}</strong>?
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