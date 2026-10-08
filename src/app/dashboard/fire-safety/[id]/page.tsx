// src/app/dashboard/fire-safety/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Flame,
  Calendar,
  MapPin,
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
  Package,
  Gauge,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface FireEquipment {
  id: string
  name: string
  equipment_type: string
  serial_number: string
  model: string
  manufacturer: string
  location: string
  building: string
  floor: string
  room: string
  installation_date: string
  expiry_date: string
  last_inspection_date: string
  next_inspection_date: string
  inspection_frequency: number
  status: string
  condition: string
  capacity: string
  pressure_level: number
  notes: string
  created_at: string
}

export default function FireEquipmentDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()

  const [equipment, setEquipment] = useState<FireEquipment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEquipment = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('fire_equipment')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        setEquipment(data)
      } catch (err: any) {
        setError(err.message)
        toast.error('Failed to load equipment: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchEquipment()
    }
  }, [id, supabase])

  // ✅ تصدير PDF عبر API
  const handleExportPDF = () => {
    if (equipment) {
      window.open(`/api/fire-safety/${equipment.id}/export-pdf`, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading equipment...</p>
        </div>
      </div>
    )
  }

  if (error || !equipment) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-600">
          <p>{error || 'Equipment not found'}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/fire-safety')}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Equipment
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

  const status = getStatusBadge(equipment.status)
  const condition = getConditionBadge(equipment.condition)
  const StatusIcon = status.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/fire-safety')}
            className="gap-2"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{equipment.name}</h1>
            <p className="text-sm text-gray-500 mt-1">Fire safety equipment details</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* ✅ رابط التعديل الصحيح مع /dashboard */}
          <Link href={`/dashboard/fire-safety/${equipment.id}/edit`}>
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
            <div className="p-4 rounded-full bg-red-50">
              <Flame className="h-12 w-12 text-red-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold">{equipment.name}</h2>
                <Badge className={status.className}>
                  <StatusIcon size={12} className="mr-1" />
                  {status.label}
                </Badge>
                <Badge className={condition.className}>{condition.label}</Badge>
              </div>
              <p className="text-gray-600 mt-1">
                <span className="font-medium">Type:</span> {getTypeLabel(equipment.equipment_type)}
                {equipment.serial_number && ` • SN: ${equipment.serial_number}`}
              </p>
              <div className="flex flex-wrap gap-4 mt-2 text-sm">
                <div className="flex items-center gap-1">
                  <MapPin size={14} className="text-gray-400" />
                  <span>{equipment.location || 'N/A'}</span>
                </div>
                {equipment.building && (
                  <div className="flex items-center gap-1">
                    <Building2 size={14} className="text-gray-400" />
                    <span>{equipment.building}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar size={14} className="text-gray-400" />
                  <span>Next Inspection: {equipment.next_inspection_date ? new Date(equipment.next_inspection_date).toLocaleDateString() : 'N/A'}</span>
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
            <InfoItem label="Type" value={getTypeLabel(equipment.equipment_type)} />
            <InfoItem label="Serial Number" value={equipment.serial_number || 'N/A'} />
            <InfoItem label="Model" value={equipment.model || 'N/A'} />
            <InfoItem label="Manufacturer" value={equipment.manufacturer || 'N/A'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <MapPin size={16} /> Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem label="Location" value={equipment.location || 'N/A'} />
            <InfoItem label="Building" value={equipment.building || 'N/A'} />
            <InfoItem label="Floor" value={equipment.floor || 'N/A'} />
            <InfoItem label="Room" value={equipment.room || 'N/A'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Calendar size={16} /> Schedule & Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem label="Status" value={status.label} />
            <InfoItem label="Condition" value={condition.label} />
            <InfoItem label="Installation Date" value={equipment.installation_date ? new Date(equipment.installation_date).toLocaleDateString() : 'N/A'} />
            <InfoItem label="Expiry Date" value={equipment.expiry_date ? new Date(equipment.expiry_date).toLocaleDateString() : 'N/A'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Hash size={16} /> Specifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem label="Capacity" value={equipment.capacity || 'N/A'} />
            <InfoItem label="Pressure (bar)" value={equipment.pressure_level ? String(equipment.pressure_level) : 'N/A'} />
            <InfoItem label="Inspection Frequency" value={`${equipment.inspection_frequency || 30} days`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Clock size={16} /> Inspections
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem label="Last Inspection" value={equipment.last_inspection_date ? new Date(equipment.last_inspection_date).toLocaleDateString() : 'N/A'} />
            <InfoItem label="Next Inspection" value={equipment.next_inspection_date ? new Date(equipment.next_inspection_date).toLocaleDateString() : 'N/A'} />
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {equipment.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 whitespace-pre-wrap">{equipment.notes}</p>
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