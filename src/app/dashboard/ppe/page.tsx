// src/app/dashboard/ppe/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Edit2, Trash2, Eye, Calendar, MapPin, User, Package, CheckCircle, XCircle, Clock, AlertTriangle, HardHat, Shield, Eye as EyeIcon, Ear, Hand, Footprints, UserCheck } from 'lucide-react'
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

interface PPEItem {
  id: string
  name: string
  category: string
  quantity: number
  min_quantity: number
  location: string
  status: string
  condition: string
  expiry_date: string
  next_inspection_date: string
  assigned_to: string
  created_at: string
  employees: { first_name: string; last_name: string }
}

export default function PPEPage() {
  const [items, setItems] = useState<PPEItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<PPEItem | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    category: 'head_protection',
    model: '',
    manufacturer: '',
    serial_number: '',
    size: '',
    color: '',
    quantity: 1,
    min_quantity: 0,
    location: '',
    storage_area: '',
    purchase_date: '',
    purchase_cost: '',
    expiry_date: '',
    inspection_frequency: 30,
    status: 'available',
    condition: 'new',
    notes: '',
  })
  const [employees, setEmployees] = useState<any[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<PPEItem | null>(null)
  const supabase = createClient()

  // جلب الموظفين
  const fetchEmployees = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .limit(1)
        .maybeSingle()

      if (profile?.organization_id) {
        const { data } = await supabase
          .from('employees')
          .select('id, first_name, last_name')
          .eq('organization_id', profile.organization_id)
        setEmployees(data || [])
      }
    } catch (e) { /* ignore */ }
  }

  // ✅ استخدام limit(1).maybeSingle() لتجنب مشكلة الصفوف المتعددة
  const fetchItems = async () => {
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
        setItems([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('ppe_items')
        .select(`
          *,
          employees:assigned_to (first_name, last_name)
        `)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setItems(data || [])
    } catch (err: any) {
      console.error('Fetch error:', err)
      setError(err.message || 'حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
    fetchItems()
  }, [])

  const filteredItems = items.filter(item => {
    const search = searchTerm.toLowerCase()
    return (
      item.name?.toLowerCase().includes(search) ||
      item.category?.toLowerCase().includes(search) ||
      item.location?.toLowerCase().includes(search) ||
      item.serial_number?.toLowerCase().includes(search)
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

      const purchaseDate = formData.purchase_date ? new Date(formData.purchase_date) : null
      const nextInspectionDate = purchaseDate ? new Date(purchaseDate) : null
      if (nextInspectionDate) {
        nextInspectionDate.setDate(nextInspectionDate.getDate() + parseInt(formData.inspection_frequency as any))
      }

      const dataToSave = {
        organization_id: profile.organization_id,
        name: formData.name,
        category: formData.category,
        model: formData.model || null,
        manufacturer: formData.manufacturer || null,
        serial_number: formData.serial_number || null,
        size: formData.size || null,
        color: formData.color || null,
        quantity: parseInt(formData.quantity as any) || 1,
        min_quantity: parseInt(formData.min_quantity as any) || 0,
        location: formData.location || null,
        storage_area: formData.storage_area || null,
        purchase_date: formData.purchase_date || null,
        purchase_cost: formData.purchase_cost ? parseFloat(formData.purchase_cost) : null,
        expiry_date: formData.expiry_date || null,
        inspection_frequency: parseInt(formData.inspection_frequency as any) || 30,
        next_inspection_date: nextInspectionDate ? nextInspectionDate.toISOString().split('T')[0] : null,
        status: formData.status,
        condition: formData.condition,
        notes: formData.notes || null,
      }

      let result
      if (editingItem) {
        result = await supabase
          .from('ppe_items')
          .update(dataToSave)
          .eq('id', editingItem.id)
        if (!result.error) toast.success('PPE item updated successfully')
      } else {
        result = await supabase
          .from('ppe_items')
          .insert(dataToSave)
        if (!result.error) toast.success('PPE item added successfully')
      }

      if (result.error) throw result.error

      setShowForm(false)
      setEditingItem(null)
      setFormData({
        name: '',
        category: 'head_protection',
        model: '',
        manufacturer: '',
        serial_number: '',
        size: '',
        color: '',
        quantity: 1,
        min_quantity: 0,
        location: '',
        storage_area: '',
        purchase_date: '',
        purchase_cost: '',
        expiry_date: '',
        inspection_frequency: 30,
        status: 'available',
        condition: 'new',
        notes: '',
      })
      fetchItems()
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
        .from('ppe_items')
        .delete()
        .eq('id', selectedItem.id)

      if (error) throw error
      toast.success('PPE item deleted successfully')
      setShowDeleteDialog(false)
      setSelectedItem(null)
      fetchItems()
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to delete: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const openEditForm = (item: PPEItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name || '',
      category: item.category || 'head_protection',
      model: item.model || '',
      manufacturer: item.manufacturer || '',
      serial_number: item.serial_number || '',
      size: item.size || '',
      color: item.color || '',
      quantity: item.quantity || 1,
      min_quantity: item.min_quantity || 0,
      location: item.location || '',
      storage_area: item.storage_area || '',
      purchase_date: item.purchase_date || '',
      purchase_cost: item.purchase_cost ? String(item.purchase_cost) : '',
      expiry_date: item.expiry_date || '',
      inspection_frequency: item.inspection_frequency || 30,
      status: item.status || 'available',
      condition: item.condition || 'new',
      notes: item.notes || '',
    })
    setShowForm(true)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      available: { className: 'bg-green-100 text-green-800', label: 'Available', icon: CheckCircle },
      issued: { className: 'bg-blue-100 text-blue-800', label: 'Issued', icon: UserCheck },
      maintenance: { className: 'bg-yellow-100 text-yellow-800', label: 'Maintenance', icon: Clock },
      expired: { className: 'bg-red-100 text-red-800', label: 'Expired', icon: AlertTriangle },
      scrapped: { className: 'bg-gray-100 text-gray-800', label: 'Scrapped', icon: XCircle },
    }
    return variants[status] || variants.available
  }

  const getConditionBadge = (condition: string) => {
    const variants: Record<string, any> = {
      new: { className: 'bg-green-100 text-green-800', label: 'New' },
      good: { className: 'bg-blue-100 text-blue-800', label: 'Good' },
      fair: { className: 'bg-yellow-100 text-yellow-800', label: 'Fair' },
      poor: { className: 'bg-orange-100 text-orange-800', label: 'Poor' },
      damaged: { className: 'bg-red-100 text-red-800', label: 'Damaged' },
    }
    return variants[condition] || variants.good
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'head_protection': return <HardHat size={14} />
      case 'eye_protection': return <EyeIcon size={14} />
      case 'face_protection': return <Shield size={14} />
      case 'hearing_protection': return <Ear size={14} />
      case 'hand_protection': return <Hand size={14} />
      case 'foot_protection': return <Footprints size={14} />
      default: return <Package size={14} />
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      head_protection: 'Head Protection',
      eye_protection: 'Eye Protection',
      face_protection: 'Face Protection',
      hearing_protection: 'Hearing Protection',
      respiratory_protection: 'Respiratory',
      hand_protection: 'Hand Protection',
      foot_protection: 'Foot Protection',
      body_protection: 'Body Protection',
      fall_protection: 'Fall Protection',
      other: 'Other',
    }
    return labels[category] || category
  }

  const getEmployeeName = (item: any) => {
    if (item.employees) {
      return `${item.employees.first_name || ''} ${item.employees.last_name || ''}`.trim() || 'N/A'
    }
    return 'N/A'
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">PPE Management</h1>
          <p className="text-sm text-gray-500">Manage personal protective equipment</p>
        </div>
        <Button onClick={() => {
          setEditingItem(null)
          setFormData({
            name: '',
            category: 'head_protection',
            model: '',
            manufacturer: '',
            serial_number: '',
            size: '',
            color: '',
            quantity: 1,
            min_quantity: 0,
            location: '',
            storage_area: '',
            purchase_date: '',
            purchase_cost: '',
            expiry_date: '',
            inspection_frequency: 30,
            status: 'available',
            condition: 'new',
            notes: '',
          })
          setShowForm(true)
        }}>
          <Plus size={18} className="mr-2" />
          Add PPE
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold">{items.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Available</p>
                <p className="text-2xl font-bold text-green-600">
                  {items.filter(i => i.status === 'available').length}
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
                <p className="text-sm text-gray-500">Issued</p>
                <p className="text-2xl font-bold text-blue-600">
                  {items.filter(i => i.status === 'issued').length}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Expired</p>
                <p className="text-2xl font-bold text-red-600">
                  {items.filter(i => i.status === 'expired').length}
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
                <p className="text-sm text-gray-500">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {items.filter(i => i.quantity <= i.min_quantity && i.status === 'available').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by name, category, location..."
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
                  <th className="p-4 text-left">Item</th>
                  <th className="p-4 text-left">Category</th>
                  <th className="p-4 text-left">Qty</th>
                  <th className="p-4 text-left">Location</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Condition</th>
                  <th className="p-4 text-left">Assigned To</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="p-8 text-center text-gray-500">Loading...</td></tr>
                ) : filteredItems.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <HardHat className="h-12 w-12 text-gray-300 mb-2" />
                      <p>No PPE items found</p>
                      <p className="text-xs">Click "Add PPE" to get started</p>
                    </div>
                  </td></tr>
                ) : (
                  filteredItems.map((item) => {
                    const status = getStatusBadge(item.status)
                    const condition = getConditionBadge(item.condition)
                    const StatusIcon = status.icon
                    const isLowStock = item.quantity <= item.min_quantity && item.status === 'available'
                    return (
                      <tr key={item.id} className={`border-t hover:bg-gray-50 ${isLowStock ? 'bg-yellow-50' : ''}`}>
                        <td className="p-4">
                          {/* ✅ الرابط الصحيح مع /dashboard */}
                          <Link href={`/dashboard/ppe/${item.id}`} className="hover:text-blue-600 hover:underline">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-gray-500">SN: {item.serial_number || 'N/A'}</div>
                          </Link>
                        </td>
                        <td className="p-4">
                          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {getCategoryIcon(item.category)}
                            {getCategoryLabel(item.category)}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`font-medium ${isLowStock ? 'text-red-600' : ''}`}>
                            {item.quantity}
                          </span>
                          {item.min_quantity > 0 && (
                            <span className="text-xs text-gray-400 block">Min: {item.min_quantity}</span>
                          )}
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
                            <User size={14} className="text-gray-400" />
                            <span>{getEmployeeName(item)}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/dashboard/ppe/${item.id}`} title="View Details">
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
            <DialogTitle>{editingItem ? 'Edit PPE Item' : 'Add New PPE Item'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Item Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="head_protection">Head Protection</SelectItem>
                    <SelectItem value="eye_protection">Eye Protection</SelectItem>
                    <SelectItem value="face_protection">Face Protection</SelectItem>
                    <SelectItem value="hearing_protection">Hearing Protection</SelectItem>
                    <SelectItem value="respiratory_protection">Respiratory</SelectItem>
                    <SelectItem value="hand_protection">Hand Protection</SelectItem>
                    <SelectItem value="foot_protection">Foot Protection</SelectItem>
                    <SelectItem value="body_protection">Body Protection</SelectItem>
                    <SelectItem value="fall_protection">Fall Protection</SelectItem>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Size</Label>
                <Input
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  placeholder="Size"
                />
              </div>
              <div>
                <Label>Color</Label>
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="Color"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
              <div>
                <Label>Minimum Quantity</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.min_quantity}
                  onChange={(e) => setFormData({ ...formData, min_quantity: parseInt(e.target.value) || 0 })}
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
            <div>
              <Label>Storage Area</Label>
              <Input
                value={formData.storage_area}
                onChange={(e) => setFormData({ ...formData, storage_area: e.target.value })}
                placeholder="Storage area"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Purchase Date</Label>
                <Input
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Purchase Cost (AED)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.purchase_cost}
                  onChange={(e) => setFormData({ ...formData, purchase_cost: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Inspection Frequency (days)</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.inspection_frequency}
                  onChange={(e) => setFormData({ ...formData, inspection_frequency: parseInt(e.target.value) || 30 })}
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
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="issued">Issued</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="scrapped">Scrapped</SelectItem>
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
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
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
            <DialogTitle className="text-red-600">Delete PPE Item</DialogTitle>
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