// src/app/dashboard/assets/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Package,
  Calendar,
  MapPin,
  User,
  Edit2,
  Download,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Info,
  Building2,
  Hash,
  Tag,
  DollarSign,
  Wrench,
  Truck,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Asset {
  id: string
  name: string
  asset_type: string
  serial_number: string
  model: string
  manufacturer: string
  asset_tag: string
  location: string
  building: string
  floor: string
  room: string
  purchase_date: string
  purchase_cost: number
  warranty_expiry: string
  lifespan_years: number
  status: string
  condition: string
  maintenance_frequency: number
  next_maintenance_date: string
  assigned_to: string
  notes: string
  created_at: string
  employees: { first_name: string; last_name: string }
}

export default function AssetDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()

  const [asset, setAsset] = useState<Asset | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAsset = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('assets')
          .select(`
            *,
            employees:assigned_to (first_name, last_name)
          `)
          .eq('id', id)
          .single()

        if (error) throw error
        setAsset(data)
      } catch (err: any) {
        setError(err.message)
        toast.error('Failed to load asset: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchAsset()
    }
  }, [id, supabase])

  // ✅ تصدير PDF عبر API
  const handleExportPDF = () => {
    if (asset) {
      window.open(`/api/assets/${asset.id}/export-pdf`, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading asset...</p>
        </div>
      </div>
    )
  }

  if (error || !asset) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-600">
          <p>{error || 'Asset not found'}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/assets')}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Assets
          </Button>
        </div>
      </div>
    )
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

  const status = getStatusBadge(asset.status)
  const condition = getConditionBadge(asset.condition)
  const StatusIcon = status.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/assets')}
            className="gap-2"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{asset.name}</h1>
            <p className="text-sm text-gray-500 mt-1">Asset details and information</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* ✅ رابط التعديل الصحيح مع /dashboard */}
          <Link href={`/dashboard/assets/${asset.id}/edit`}>
            <Button variant="outline">
              <Edit2 size={16} className="mr-2" />
              Edit
            </Button>
          </Link>
          {/* ✅ زر Export PDF المعدل */}
          <Button onClick={handleExportPDF}>
            <Download size={16} className="mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="p-4 rounded-full bg-blue-50">
              <Package className="h-12 w-12 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold">{asset.name}</h2>
                <Badge className={status.className}>
                  <StatusIcon size={12} className="mr-1" />
                  {status.label}
                </Badge>
                <Badge className={condition.className}>{condition.label}</Badge>
              </div>
              <p className="text-gray-600 mt-1">
                <span className="font-medium">Type:</span> {getTypeLabel(asset.asset_type)}
                {asset.serial_number && ` • SN: ${asset.serial_number}`}
              </p>
              <div className="flex flex-wrap gap-4 mt-2 text-sm">
                <div className="flex items-center gap-1">
                  <MapPin size={14} className="text-gray-400" />
                  <span>{asset.location || 'N/A'}</span>
                </div>
                {asset.asset_tag && (
                  <div className="flex items-center gap-1">
                    <Tag size={14} className="text-gray-400" />
                    <span>{asset.asset_tag}</span>
                  </div>
                )}
                {asset.employees && (
                  <div className="flex items-center gap-1">
                    <User size={14} className="text-gray-400" />
                    <span>Assigned to: {asset.employees.first_name} {asset.employees.last_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar size={14} className="text-gray-400" />
                  <span>Next Maintenance: {asset.next_maintenance_date ? new Date(asset.next_maintenance_date).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Info size={16} /> Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem label="Asset Type" value={getTypeLabel(asset.asset_type)} />
            <InfoItem label="Serial Number" value={asset.serial_number || 'N/A'} />
            <InfoItem label="Model" value={asset.model || 'N/A'} />
            <InfoItem label="Manufacturer" value={asset.manufacturer || 'N/A'} />
            <InfoItem label="Asset Tag" value={asset.asset_tag || 'N/A'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <MapPin size={16} /> Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem label="Location" value={asset.location || 'N/A'} />
            <InfoItem label="Building" value={asset.building || 'N/A'} />
            <InfoItem label="Floor" value={asset.floor || 'N/A'} />
            <InfoItem label="Room" value={asset.room || 'N/A'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Calendar size={16} /> Purchase & Warranty
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem label="Purchase Date" value={asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : 'N/A'} />
            <InfoItem label="Purchase Cost" value={asset.purchase_cost ? `${asset.purchase_cost} AED` : 'N/A'} />
            <InfoItem label="Warranty Expiry" value={asset.warranty_expiry ? new Date(asset.warranty_expiry).toLocaleDateString() : 'N/A'} />
            <InfoItem label="Lifespan" value={asset.lifespan_years ? `${asset.lifespan_years} years` : 'N/A'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Wrench size={16} /> Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem label="Frequency" value={`${asset.maintenance_frequency || 365} days`} />
            <InfoItem label="Next Maintenance" value={asset.next_maintenance_date ? new Date(asset.next_maintenance_date).toLocaleDateString() : 'N/A'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <User size={16} /> Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem 
              label="Assigned To" 
              value={asset.employees ? `${asset.employees.first_name} ${asset.employees.last_name}` : 'N/A'} 
            />
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {asset.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 whitespace-pre-wrap">{asset.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  )
}