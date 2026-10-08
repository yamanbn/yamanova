// src/app/dashboard/permits/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Calendar,
  MapPin,
  User,
  Edit2,
  Download,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  AlertTriangle,
  Shield,
  Info,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Permit {
  id: string
  title: string
  permit_type: string
  description: string
  location: string
  start_datetime: string
  end_datetime: string
  applicant_name: string
  status: string
  priority: string
  risk_level: string
  control_measures: string
  ppe_required: string
  emergency_procedures: string
  notes: string
  project_id: string
  created_at: string
  projects: { name: string }
}

export default function PermitDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()

  const [permit, setPermit] = useState<Permit | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPermit = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('permits')
          .select(`
            *,
            projects:project_id (name)
          `)
          .eq('id', id)
          .single()

        if (error) throw error
        setPermit(data)
      } catch (err: any) {
        setError(err.message)
        toast.error('Failed to load permit: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchPermit()
    }
  }, [id, supabase])

  // ✅ تصدير PDF عبر API
  const handleExportPDF = () => {
    if (permit) {
      window.open(`/api/permits/${permit.id}/export-pdf`, '_blank')
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (!permit) return
    try {
      const { error } = await supabase
        .from('permits')
        .update({ status: newStatus })
        .eq('id', permit.id)

      if (error) throw error
      toast.success(`Permit ${newStatus} successfully`)
      setPermit({ ...permit, status: newStatus })
    } catch (err: any) {
      toast.error('Failed to update status: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading permit...</p>
        </div>
      </div>
    )
  }

  if (error || !permit) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-600">
          <p>{error || 'Permit not found'}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/permits')}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Permits
          </Button>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { className: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: Clock },
      in_review: { className: 'bg-blue-100 text-blue-800', label: 'In Review', icon: Clock },
      approved: { className: 'bg-green-100 text-green-800', label: 'Approved', icon: CheckCircle },
      rejected: { className: 'bg-red-100 text-red-800', label: 'Rejected', icon: XCircle },
      cancelled: { className: 'bg-gray-100 text-gray-800', label: 'Cancelled', icon: XCircle },
      expired: { className: 'bg-gray-300 text-gray-700', label: 'Expired', icon: Clock },
      closed: { className: 'bg-green-200 text-green-800', label: 'Closed', icon: CheckCircle },
    }
    return variants[status] || variants.pending
  }

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, any> = {
      low: { className: 'bg-gray-100 text-gray-800', label: 'Low' },
      medium: { className: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
      high: { className: 'bg-orange-100 text-orange-800', label: 'High' },
      critical: { className: 'bg-red-100 text-red-800', label: 'Critical' },
    }
    return variants[priority] || variants.medium
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      hot_work: 'Hot Work',
      cold_work: 'Cold Work',
      confined_space: 'Confined Space',
      working_at_height: 'Working at Height',
      electrical: 'Electrical Work',
      lifting: 'Lifting Operations',
      excavation: 'Excavation',
      chemical: 'Chemical Handling',
      other: 'Other',
    }
    return labels[type] || type
  }

  const status = getStatusBadge(permit.status)
  const priority = getPriorityBadge(permit.priority)
  const StatusIcon = status.icon

  const isEditable = ['pending', 'in_review'].includes(permit.status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/permits')}
            className="gap-2"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{permit.title}</h1>
            <p className="text-sm text-gray-500 mt-1">Work permit details</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isEditable && (
            <>
              <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50" onClick={() => handleStatusUpdate('approved')}>
                <CheckCircle size={16} className="mr-2" />
                Approve
              </Button>
              <Button variant="outline" className="border-red-500 text-red-600 hover:bg-red-50" onClick={() => handleStatusUpdate('rejected')}>
                <XCircle size={16} className="mr-2" />
                Reject
              </Button>
            </>
          )}
          {/* ✅ رابط التعديل الصحيح مع /dashboard */}
          <Link href={`/dashboard/permits/${permit.id}/edit`}>
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
            <div className="p-4 rounded-full bg-orange-50">
              <FileText className="h-12 w-12 text-orange-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold">{permit.title}</h2>
                <Badge className={status.className}>
                  <StatusIcon size={12} className="mr-1" />
                  {status.label}
                </Badge>
                <Badge className={priority.className}>{priority.label}</Badge>
              </div>
              <p className="text-gray-600 mt-1">
                <span className="font-medium">Type:</span> {getTypeLabel(permit.permit_type)}
              </p>
              <div className="flex flex-wrap gap-4 mt-2 text-sm">
                <div className="flex items-center gap-1">
                  <User size={14} className="text-gray-400" />
                  <span>Applicant: {permit.applicant_name || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin size={14} className="text-gray-400" />
                  <span>{permit.location || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={14} className="text-gray-400" />
                  <span>{permit.start_datetime ? new Date(permit.start_datetime).toLocaleString() : 'N/A'}</span>
                </div>
                {permit.projects && (
                  <div className="flex items-center gap-1">
                    <Building2 size={14} className="text-gray-400" />
                    <span>{permit.projects.name}</span>
                  </div>
                )}
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
            <InfoItem label="Permit Type" value={getTypeLabel(permit.permit_type)} />
            <InfoItem label="Priority" value={priority.label} />
            <InfoItem label="Risk Level" value={permit.risk_level || 'N/A'} />
            <InfoItem label="Status" value={status.label} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Calendar size={16} /> Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem label="Start" value={permit.start_datetime ? new Date(permit.start_datetime).toLocaleString() : 'N/A'} />
            <InfoItem label="End" value={permit.end_datetime ? new Date(permit.end_datetime).toLocaleString() : 'N/A'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <User size={16} /> Applicant
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem label="Name" value={permit.applicant_name || 'N/A'} />
            <InfoItem label="Location" value={permit.location || 'N/A'} />
          </CardContent>
        </Card>
      </div>

      {/* Description, Control Measures, etc. */}
      <div className="grid gap-6 md:grid-cols-2">
        {permit.description && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{permit.description}</p>
            </CardContent>
          </Card>
        )}

        {permit.control_measures && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Shield size={16} /> Control Measures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{permit.control_measures}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {permit.ppe_required && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <AlertTriangle size={16} /> PPE Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{permit.ppe_required}</p>
            </CardContent>
          </Card>
        )}

        {permit.emergency_procedures && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <AlertTriangle size={16} /> Emergency Procedures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{permit.emergency_procedures}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {permit.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 whitespace-pre-wrap">{permit.notes}</p>
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