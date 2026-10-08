// src/app/dashboard/ppe/[id]/page.tsx
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
  Hash,
  Tag,
  DollarSign,
  HardHat,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface PPEItem {
  id: string
  name: string
  category: string
  model: string
  manufacturer: string
  serial_number: string
  size: string
  color: string
  quantity: number
  min_quantity: number
  location: string
  storage_area: string
  purchase_date: string
  purchase_cost: number
  expiry_date: string
  inspection_frequency: number
  next_inspection_date: string
  status: string
  condition: string
  notes: string
  created_at: string
  employees: { first_name: string; last_name: string }
}

export default function PPEDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()

  const [item, setItem] = useState<PPEItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('ppe_items')
          .select(`
            *,
            employees:assigned_to (first_name, last_name)
          `)
          .eq('id', id)
          .single()

        if (error) throw error
        setItem(data)
      } catch (err: any) {
        setError(err.message)
        toast.error('Failed to load PPE item: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchItem()
    }
  }, [id, supabase])

  // ✅ تصدير PDF عبر API
  const handleExportPDF = () => {
    if (item) {
      window.open(`/api/ppe/${item.id}/export-pdf`, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading PPE item...</p>
        </div>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-600">
          <p>{error || 'PPE item not found'}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/ppe')}>
            <ArrowLeft size={16} className="mr-2" />
            Back to PPE
          </Button>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      available: { className: 'bg-green-100 text-green-800', label: 'Available', icon: CheckCircle },
      issued: { className: 'bg-blue-100 text-blue-800', label: 'Issued', icon: User },
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

  const status = getStatusBadge(item.status)
  const condition = getConditionBadge(item.condition)
  const StatusIcon = status.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/ppe')}
            className="gap-2"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{item.name}</h1>
            <p className="text-sm text-gray-500 mt-1">PPE item details</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* ✅ رابط التعديل الصحيح مع /dashboard */}
          <Link href={`/dashboard/ppe/${item.id}/edit`}>
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
              <HardHat className="h-12 w-12 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold">{item.name}</h2>
                <Badge className={status.className}>
                  <StatusIcon size={12} className="mr-1" />
                  {status.label}
                </Badge>
                <Badge className={condition.className}>{condition.label}</Badge>
              </div>
              <p className="text-gray-600 mt-1">
                <span className="font-medium">Category:</span> {getCategoryLabel(item.category)}
                {item.serial_number && ` • SN: ${item.serial_number}`}
              </p>
              <div className="flex flex-wrap gap-4 mt-2 text-sm">
                <div className="flex items-center gap-1">
                  <MapPin size={14} className="text-gray-400" />
                  <span>{item.location || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Package size={14} className="text-gray-400" />
                  <span>Qty: {item.quantity} {item.min_quantity > 0 ? `(Min: ${item.min_quantity})` : ''}</span>
                </div>
                {item.employees && (
                  <div className="flex items-center gap-1">
                    <User size={14} className="text-gray-400" />
                    <span>Assigned to: {item.employees.first_name} {item.employees.last_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar size={14} className="text-gray-400" />
                  <span>Expiry: {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : 'N/A'}</span>
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
            <InfoItem label="Category" value={getCategoryLabel(item.category)} />
            <InfoItem label="Serial Number" value={item.serial_number || 'N/A'} />
            <InfoItem label="Model" value={item.model || 'N/A'} />
            <InfoItem label="Manufacturer" value={item.manufacturer || 'N/A'} />
            <InfoItem label="Size" value={item.size || 'N/A'} />
            <InfoItem label="Color" value={item.color || 'N/A'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <MapPin size={16} /> Location & Stock
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem label="Location" value={item.location || 'N/A'} />
            <InfoItem label="Storage Area" value={item.storage_area || 'N/A'} />
            <InfoItem label="Quantity" value={String(item.quantity)} />
            <InfoItem label="Minimum Quantity" value={String(item.min_quantity)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Calendar size={16} /> Purchase & Expiry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem label="Purchase Date" value={item.purchase_date ? new Date(item.purchase_date).toLocaleDateString() : 'N/A'} />
            <InfoItem label="Purchase Cost" value={item.purchase_cost ? `${item.purchase_cost} AED` : 'N/A'} />
            <InfoItem label="Expiry Date" value={item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : 'N/A'} />
            <InfoItem label="Next Inspection" value={item.next_inspection_date ? new Date(item.next_inspection_date).toLocaleDateString() : 'N/A'} />
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {item.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 whitespace-pre-wrap">{item.notes}</p>
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