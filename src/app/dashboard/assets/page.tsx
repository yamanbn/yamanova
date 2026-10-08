// src/app/dashboard/assets/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Edit2, Trash2, Eye, Calendar, MapPin, User, Package, CheckCircle, XCircle, Clock, AlertTriangle, Truck, Tool, Wrench, Monitor } from 'lucide-react'
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

interface Asset {
  id: string
  name: string
  asset_type: string
  serial_number: string
  asset_tag: string
  location: string
  status: string
  condition: string
  purchase_date: string
  warranty_expiry: string
  next_maintenance_date: string
  assigned_to: string
  created_at: string
  employees: { first_name: string; last_name: string }
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    asset_type: 'equipment',
    serial_number: '',
    model: '',
    manufacturer: '',
    asset_tag: '',
    location: '',
    building: '',
    floor: '',
    room: '',
    purchase_date: '',
    purchase_cost: '',
    warranty_expiry: '',
    lifespan_years: '',
    status: 'active',
    condition: 'good',
    maintenance_frequency: 365,
    notes: '',
  })
  const [projects, setProjects] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const supabase = createClient()

  // جلب المشاريع والموظفين
  const fetchData = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .limit(1)
        .maybeSingle()

      if (profile?.organization_id) {
        const [{ data: projectsData }, { data: employeesData }] = await Promise.all([
          supabase.from('projects').select('id, name').eq('organization_id', profile.organization_id),
          supabase.from('employees').select('id, first_name, last_name').eq('organization_id', profile.organization_id),
        ])
        setProjects(projectsData || [])
        setEmployees(employeesData || [])
      }
    } catch (e) { /* ignore */ }
  }

  // ✅ استخدام limit(1).maybeSingle() لتجنب مشكلة الصفوف المتعددة
  const fetchAssets = async () => {
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
        setAssets([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('assets')
        .select(`
          *,
          employees:assigned_to (first_name, last_name)
        `)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAssets(data || [])
    } catch (err: any) {
      console.error('Fetch error:', err)
      setError(err.message || 'حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    fetchAssets()
  }, [])

  const filteredAssets = assets.filter(a => {
    const search = searchTerm.toLowerCase()
    return (
      a.name?.toLowerCase().includes(search) ||
      a.serial_number?.toLowerCase().includes(search) ||
      a.asset_tag?.toLowerCase().includes(search) ||
      a.location?.toLowerCase().includes(search)
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
        asset_type: formData.asset_type,
        serial_number: formData.serial_number || null,
        model: formData.model || null,
        manufacturer: formData.manufacturer || null,
        asset_tag: formData.asset_tag || null,
        location: formData.location || null,
        building: formData.building || null,
        floor: formData.floor || null,
        room: formData.room || null,
        purchase_date: formData.purchase_date || null,
        purchase_cost: formData.purchase_cost ? parseFloat(formData.purchase_cost) : null,
        warranty_expiry: formData.warranty_expiry || null,
        lifespan_years: formData.lifespan_years ? parseInt(formData.lifespan_years) : null,
        status: formData.status,
        condition: formData.condition,
        maintenance_frequency: parseInt(formData.maintenance_frequency as any) || 365,
        notes: formData.notes || null,
      }

      let result
      if (editingAsset) {
        result = await supabase
          .from('assets')
          .update(dataToSave)
          .eq('id', editingAsset.id)
        if (!result.error) toast.success('Asset updated successfully')
      } else {
        result = await supabase
          .from('assets')
          .insert(dataToSave)
        if (!result.error) toast.success('Asset added successfully')
      }

      if (result.error) throw result.error

      setShowForm(false)
      setEditingAsset(null)
      setFormData({
        name: '',
        asset_type: 'equipment',
        serial_number: '',
        model: '',
        manufacturer: '',
        asset_tag: '',
        location: '',
        building: '',
        floor: '',
        room: '',
        purchase_date: '',
        purchase_cost: '',
        warranty_expiry: '',
        lifespan_years: '',
        status: 'active',
        condition: 'good',
        maintenance_frequency: 365,
        notes: '',
      })
      fetchAssets()
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to save: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedAsset) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', selectedAsset.id)

      if (error) throw error
      toast.success('Asset deleted successfully')
      setShowDeleteDialog(false)
      setSelectedAsset(null)
      fetchAssets()
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to delete: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const openEditForm = (asset: Asset) => {
    setEditingAsset(asset)
    setFormData({
      name: asset.name || '',
      asset_type: asset.asset_type || 'equipment',
      serial_number: asset.serial_number || '',
      model: asset.model || '',
      manufacturer: asset.manufacturer || '',
      asset_tag: asset.asset_tag || '',
      location: asset.location || '',
      building: asset.building || '',
      floor: asset.floor || '',
      room: asset.room || '',
      purchase_date: asset.purchase_date || '',
      purchase_cost: asset.purchase_cost ? String(asset.purchase_cost) : '',
      warranty_expiry: asset.warranty_expiry || '',
      lifespan_years: asset.lifespan_years ? String(asset.lifespan_years) : '',
      status: asset.status || 'active',
      condition: asset.condition || 'good',
      maintenance_frequency: asset.maintenance_frequency || 365,
      notes: asset.notes || '',
    })
    setShowForm(true)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: { className: 'bg-green-100 text-green-800', label: 'Active', icon: CheckCircle },
      inactive: { className: 'bg-gray-100 text-gray-800', label: 'Inactive', icon: XCircle },
      maintenance: { className: 'bg-yellow-100 text-yellow-800', label: 'Maintenance', icon: Clock },
      repair: { className: 'bg-orange-100 text-orange-800', label: 'Repair', icon: Wrench },
      scrapped: { className: 'bg-red-100 text-red-800', label: 'Scrapped', icon: XCircle },
      on_loan: { className: 'bg-blue-100 text-blue-800', label: 'On Loan', icon: Truck },
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
      case 'vehicle': return <Truck size={14} />
      case 'machinery': return <Tool size={14} />
      case 'equipment': return <Package size={14} />
      case 'tool': return <Wrench size={14} />
      case 'it_equipment': return <Monitor size={14} />
      default: return <Package size={14} />
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      vehicle: 'Vehicle',
      machinery: 'Machinery',
      equipment: 'Equipment',
      tool: 'Tool',
      facility: 'Facility',
      furniture: 'Furniture',
      it_equipment: 'IT Equipment',
      other: 'Other',
    }
    return labels[type] || type
  }

  const getEmployeeName = (asset: any) => {
    if (asset.employees) {
      return `${asset.employees.first_name || ''} ${asset.employees.last_name || ''}`.trim() || 'N/A'
    }
    return 'N/A'
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Assets</h1>
          <p className="text-sm text-gray-500">Manage your assets and equipment</p>
        </div>
        <Button onClick={() => {
          setEditingAsset(null)
          setFormData({
            name: '',
            asset_type: 'equipment',
            serial_number: '',
            model: '',
            manufacturer: '',
            asset_tag: '',
            location: '',
            building: '',
            floor: '',
            room: '',
            purchase_date: '',
            purchase_cost: '',
            warranty_expiry: '',
            lifespan_years: '',
            status: 'active',
            condition: 'good',
            maintenance_frequency: 365,
            notes: '',
          })
          setShowForm(true)
        }}>
          <Plus size={18} className="mr-2" />
          Add Asset
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by name, serial, tag..."
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
                  <th className="p-4 text-left">Asset</th>
                  <th className="p-4 text-left">Type</th>
                  <th className="p-4 text-left">Tag</th>
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
                ) : filteredAssets.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <Package className="h-12 w-12 text-gray-300 mb-2" />
                      <p>No assets found</p>
                      <p className="text-xs">Click "Add Asset" to get started</p>
                    </div>
                  </td></tr>
                ) : (
                  filteredAssets.map((asset) => {
                    const status = getStatusBadge(asset.status)
                    const condition = getConditionBadge(asset.condition)
                    const StatusIcon = status.icon
                    return (
                      <tr key={asset.id} className="border-t hover:bg-gray-50">
                        <td className="p-4">
                          {/* ✅ الرابط الصحيح مع /dashboard */}
                          <Link href={`/dashboard/assets/${asset.id}`} className="hover:text-blue-600 hover:underline">
                            <div className="font-medium">{asset.name}</div>
                            <div className="text-xs text-gray-500">SN: {asset.serial_number || 'N/A'}</div>
                          </Link>
                        </td>
                        <td className="p-4">
                          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {getTypeIcon(asset.asset_type)}
                            {getTypeLabel(asset.asset_type)}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-xs">{asset.asset_tag || 'N/A'}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <MapPin size={14} className="text-gray-400" />
                            <span>{asset.location || 'N/A'}</span>
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
                            <span>{getEmployeeName(asset)}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/dashboard/assets/${asset.id}`} title="View Details">
                              <Eye size={16} className="text-gray-500 hover:text-blue-600 cursor-pointer" />
                            </Link>
                            <button
                              onClick={() => openEditForm(asset)}
                              className="p-1 hover:bg-blue-50 rounded text-blue-600"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAsset(asset)
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
            <DialogTitle>{editingAsset ? 'Edit Asset' : 'Add New Asset'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Asset Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Asset Type *</Label>
                <Select
                  value={formData.asset_type}
                  onValueChange={(value) => setFormData({ ...formData, asset_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vehicle">Vehicle</SelectItem>
                    <SelectItem value="machinery">Machinery</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="tool">Tool</SelectItem>
                    <SelectItem value="facility">Facility</SelectItem>
                    <SelectItem value="furniture">Furniture</SelectItem>
                    <SelectItem value="it_equipment">IT Equipment</SelectItem>
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
              <Label>Asset Tag</Label>
              <Input
                value={formData.asset_tag}
                onChange={(e) => setFormData({ ...formData, asset_tag: e.target.value })}
                placeholder="Asset tag"
              />
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
                <Label>Warranty Expiry</Label>
                <Input
                  type="date"
                  value={formData.warranty_expiry}
                  onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })}
                />
              </div>
              <div>
                <Label>Lifespan (Years)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.lifespan_years}
                  onChange={(e) => setFormData({ ...formData, lifespan_years: e.target.value })}
                  placeholder="Years"
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
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="scrapped">Scrapped</SelectItem>
                    <SelectItem value="on_loan">On Loan</SelectItem>
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
              <Label>Maintenance Frequency (days)</Label>
              <Input
                type="number"
                min="1"
                value={formData.maintenance_frequency}
                onChange={(e) => setFormData({ ...formData, maintenance_frequency: parseInt(e.target.value) || 365 })}
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
                {loading ? 'Saving...' : editingAsset ? 'Update' : 'Add'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Asset</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete <strong>{selectedAsset?.name}</strong>?
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