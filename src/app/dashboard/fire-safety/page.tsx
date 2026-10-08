// src/app/dashboard/fire-safety/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Edit2, Trash2, Eye, Calendar, MapPin, AlertTriangle, CheckCircle, XCircle, Clock, Flame, FireExtinguisher, Bell, Droplets, Zap } from 'lucide-react'
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

interface FireEquipment {
  id: string
  name: string
  equipment_type: string
  serial_number: string
  location: string
  building: string
  status: string
  condition: string
  installation_date: string
  expiry_date: string
  last_inspection_date: string
  next_inspection_date: string
  capacity: string
  pressure_level: number
  created_at: string
}

export default function FireSafetyPage() {
  const [equipment, setEquipment] = useState<FireEquipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<FireEquipment | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    equipment_type: 'extinguisher',
    serial_number: '',
    model: '',
    manufacturer: '',
    location: '',
    building: '',
    floor: '',
    room: '',
    installation_date: '',
    expiry_date: '',
    inspection_frequency: 30,
    status: 'active',
    condition: 'good',
    capacity: '',
    pressure_level: '',
    notes: '',
  })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<FireEquipment | null>(null)
  const supabase = createClient()

  // ✅ استخدام limit(1).maybeSingle() لتجنب مشكلة الصفوف المتعددة
  const fetchEquipment = async () => {
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
        setEquipment([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('fire_equipment')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setEquipment(data || [])
    } catch (err: any) {
      console.error('Fetch error:', err)
      setError(err.message || 'حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEquipment()
  }, [])

  const filteredEquipment = equipment.filter(e => {
    const search = searchTerm.toLowerCase()
    return (
      e.name?.toLowerCase().includes(search) ||
      e.serial_number?.toLowerCase().includes(search) ||
      e.location?.toLowerCase().includes(search) ||
      e.equipment_type?.toLowerCase().includes(search)
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

      const installDate = formData.installation_date ? new Date(formData.installation_date) : null
      const nextInspectionDate = installDate ? new Date(installDate) : null
      if (nextInspectionDate) {
        nextInspectionDate.setDate(nextInspectionDate.getDate() + parseInt(formData.inspection_frequency as any))
      }

      const dataToSave = {
        organization_id: profile.organization_id,
        name: formData.name,
        equipment_type: formData.equipment_type,
        serial_number: formData.serial_number || null,
        model: formData.model || null,
        manufacturer: formData.manufacturer || null,
        location: formData.location || null,
        building: formData.building || null,
        floor: formData.floor || null,
        room: formData.room || null,
        installation_date: formData.installation_date || null,
        expiry_date: formData.expiry_date || null,
        inspection_frequency: parseInt(formData.inspection_frequency as any) || 30,
        next_inspection_date: nextInspectionDate ? nextInspectionDate.toISOString().split('T')[0] : null,
        status: formData.status,
        condition: formData.condition,
        capacity: formData.capacity || null,
        pressure_level: formData.pressure_level ? parseFloat(formData.pressure_level) : null,
        notes: formData.notes || null,
      }

      let result
      if (editingItem) {
        result = await supabase
          .from('fire_equipment')
          .update(dataToSave)
          .eq('id', editingItem.id)
        if (!result.error) toast.success('Equipment updated successfully')
      } else {
        result = await supabase
          .from('fire_equipment')
          .insert(dataToSave)
        if (!result.error) toast.success('Equipment added successfully')
      }

      if (result.error) throw result.error

      setShowForm(false)
      setEditingItem(null)
      setFormData({
        name: '',
        equipment_type: 'extinguisher',
        serial_number: '',
        model: '',
        manufacturer: '',
        location: '',
        building: '',
        floor: '',
        room: '',
        installation_date: '',
        expiry_date: '',
        inspection_frequency: 30,
        status: 'active',
        condition: 'good',
        capacity: '',
        pressure_level: '',
        notes: '',
      })
      fetchEquipment()
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to save: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedItem) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('fire_equipment')
        .delete()
        .eq('id', selectedItem.id)

      if (error) throw error
      toast.success('Equipment deleted successfully')
      setShowDeleteDialog(false)
      setSelectedItem(null)
      fetchEquipment()
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to delete: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const openEditForm = (item: FireEquipment) => {
    setEditingItem(item)
    setFormData({
      name: item.name || '',
      equipment_type: item.equipment_type || 'extinguisher',
      serial_number: item.serial_number || '',
      model: item.model || '',
      manufacturer: item.manufacturer || '',
      location: item.location || '',
      building: item.building || '',
      floor: item.floor || '',
      room: item.room || '',
      installation_date: item.installation_date || '',
      expiry_date: item.expiry_date || '',
      inspection_frequency: item.inspection_frequency || 30,
      status: item.status || 'active',
      condition: item.condition || 'good',
      capacity: item.capacity || '',
      pressure_level: item.pressure_level ? String(item.pressure_level) : '',
      notes: item.notes || '',
    })
    setShowForm(true)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: { className: 'bg-green-100 text-green-800', label: 'Active', icon: CheckCircle },
      inactive: { className: 'bg-gray-100 text-gray-800', label: 'Inactive', icon: XCircle },
      maintenance: { className: 'bg-yellow-100 text-yellow-800', label: 'Maintenance', icon: Clock },
      expired: { className: 'bg-red-100 text-red-800', label: 'Expired', icon: AlertTriangle },
      out_of_service: { className: 'bg-red-200 text-red-900', label: 'Out of Service', icon: XCircle },
    }
    return variants[status] || variants.active
  }

  const getConditionBadge = (condition: string) => {
    const variants: Record<string, any> = {
      excellent: { className: 'bg-green-100 text-green-800', label: 'Excellent' },
      good: { className: 'bg-blue-100 text-blue-800', label: 'Good' },
      fair: { className: 'bg-yellow-100 text-yellow-800', label: 'Fair' },
      poor: { className: 'bg-orange-100 text-orange-800', label: 'Poor' },
      critical: { className: 'bg-red-100 text-red-800', label: 'Critical' },
    }
    return variants[condition] || variants.good
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'extinguisher': return <FireExtinguisher size={14} />
      case 'alarm': return <Bell size={14} />
      case 'hydrant': return <Droplets size={14} />
      case 'pump': return <Zap size={14} />
      case 'emergency_light': return <Flame size={14} />
      default: return <AlertTriangle size={14} />
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      extinguisher: 'Extinguisher',
      alarm: 'Alarm',
      hydrant: 'Hydrant',
      pump: 'Pump',
      emergency_light: 'Emergency Light',
      sprinkler: 'Sprinkler',
      hose: 'Hose',
      other: 'Other',
    }
    return labels[type] || type
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fire Safety Equipment</h1>
          <p className="text-sm text-gray-500">Manage fire safety equipment and inspections</p>
        </div>
        <Button onClick={() => {
          setEditingItem(null)
          setFormData({
            name: '',
            equipment_type: 'extinguisher',
            serial_number: '',
            model: '',
            manufacturer: '',
            location: '',
            building: '',
            floor: '',
            room: '',
            installation_date: '',
            expiry_date: '',
            inspection_frequency: 30,
            status: 'active',
            condition: 'good',
            capacity: '',
            pressure_level: '',
            notes: '',
          })
          setShowForm(true)
        }}>
          <Plus size={18} className="mr-2" />
          Add Equipment
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by name, serial, location..."
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

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold">{equipment.length}</p>
              </div>
              <FireExtinguisher className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {equipment.filter(e => e.status === 'active').length}
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
                <p className="text-sm text-gray-500">Expired</p>
                <p className="text-2xl font-bold text-red-600">
                  {equipment.filter(e => e.status === 'expired').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Maintenance</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {equipment.filter(e => e.status === 'maintenance').length}
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
                <p className="text-sm text-gray-500">Due Inspection</p>
                <p className="text-2xl font-bold text-orange-600">
                  {equipment.filter(e => {
                    if (!e.next_inspection_date) return false
                    const next = new Date(e.next_inspection_date)
                    const today = new Date()
                    const diff = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                    return diff <= 30 && diff >= 0
                  }).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left">Equipment</th>
                  <th className="p-4 text-left">Type</th>
                  <th className="p-4 text-left">Location</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Condition</th>
                  <th className="p-4 text-left">Next Inspection</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-500">Loading...</td></tr>
                ) : filteredEquipment.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <Flame className="h-12 w-12 text-gray-300 mb-2" />
                      <p>No fire safety equipment found</p>
                      <p className="text-xs">Click "Add Equipment" to get started</p>
                    </div>
                  </td></tr>
                ) : (
                  filteredEquipment.map((item) => {
                    const status = getStatusBadge(item.status)
                    const condition = getConditionBadge(item.condition)
                    const StatusIcon = status.icon
                    const isExpired = item.status === 'expired'
                    const isDueSoon = item.next_inspection_date && (() => {
                      const next = new Date(item.next_inspection_date)
                      const today = new Date()
                      const diff = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                      return diff <= 30 && diff >= 0 && item.status !== 'expired'
                    })()

                    return (
                      <tr key={item.id} className={`border-t hover:bg-gray-50 ${isExpired ? 'bg-red-50' : isDueSoon ? 'bg-yellow-50' : ''}`}>
                        <td className="p-4">
                          {/* ✅ الرابط الصحيح مع /dashboard */}
                          <Link href={`/dashboard/fire-safety/${item.id}`} className="hover:text-blue-600 hover:underline">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-gray-500">SN: {item.serial_number || 'N/A'}</div>
                          </Link>
                        </td>
                        <td className="p-4">
                          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {getTypeIcon(item.equipment_type)}
                            {getTypeLabel(item.equipment_type)}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <MapPin size={14} className="text-gray-400" />
                            <span>{item.location || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${status.className}`}>
                            <StatusIcon size={12} />
                            {status.label}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${condition.className}`}>
                            {condition.label}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} className="text-gray-400" />
                            <span>{item.next_inspection_date ? new Date(item.next_inspection_date).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/dashboard/fire-safety/${item.id}`} title="View Details">
                              <Eye size={16} className="text-gray-500 hover:text-blue-600 cursor-pointer" />
                            </Link>
                            <button
                              onClick={() => openEditForm(item)}
                              className="p-1 hover:bg-blue-50 rounded text-blue-600"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedItem(item)
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
            <DialogTitle>{editingItem ? 'Edit Equipment' : 'Add New Equipment'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Equipment Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Equipment Type *</Label>
                <Select
                  value={formData.equipment_type}
                  onValueChange={(value) => setFormData({ ...formData, equipment_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="extinguisher">Extinguisher</SelectItem>
                    <SelectItem value="alarm">Alarm</SelectItem>
                    <SelectItem value="hydrant">Hydrant</SelectItem>
                    <SelectItem value="pump">Pump</SelectItem>
                    <SelectItem value="emergency_light">Emergency Light</SelectItem>
                    <SelectItem value="sprinkler">Sprinkler</SelectItem>
                    <SelectItem value="hose">Hose</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Serial Number</Label>
                <Input
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                  placeholder="Serial number"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Model</Label>
                <Input
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Model"
                />
              </div>
              <div>
                <Label>Manufacturer</Label>
                <Input
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  placeholder="Manufacturer"
                />
              </div>
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Location"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Building</Label>
                <Input
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                  placeholder="Building"
                />
              </div>
              <div>
                <Label>Floor</Label>
                <Input
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  placeholder="Floor"
                />
              </div>
              <div>
                <Label>Room</Label>
                <Input
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  placeholder="Room"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Installation Date</Label>
                <Input
                  type="date"
                  value={formData.installation_date}
                  onChange={(e) => setFormData({ ...formData, installation_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Inspection Frequency (days)</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.inspection_frequency}
                  onChange={(e) => setFormData({ ...formData, inspection_frequency: parseInt(e.target.value) || 30 })}
                />
              </div>
              <div>
                <Label>Capacity</Label>
                <Input
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="e.g., 5kg"
                />
              </div>
              <div>
                <Label>Pressure (bar)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.pressure_level}
                  onChange={(e) => setFormData({ ...formData, pressure_level: e.target.value })}
                  placeholder="Pressure"
                />
              </div>
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="out_of_service">Out of Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Condition</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) => setFormData({ ...formData, condition: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
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
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : editingItem ? 'Update' : 'Add'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Equipment</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete <strong>{selectedItem?.name}</strong>?
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