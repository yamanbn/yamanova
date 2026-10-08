// src/app/dashboard/inspections/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ClipboardCheck,
  Calendar,
  MapPin,
  User,
  FileText,
  Edit2,
  Download,
  Clock,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building2,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Inspection {
  id: string
  title: string
  inspection_type: string
  status: string
  priority: string
  location: string
  scheduled_date: string
  completed_date: string
  inspector_name: string
  project_id: string
  notes: string
  findings: string
  recommendations: string
  score: number
  passed: boolean
  follow_up_required: boolean
  follow_up_date: string
  checklist_items: any[]
  created_at: string
  projects: { name: string }
}

export default function InspectionDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()

  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInspection = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('inspections')
          .select(`
            *,
            projects:project_id (name)
          `)
          .eq('id', id)
          .single()

        if (error) throw error
        setInspection(data)
      } catch (err: any) {
        setError(err.message)
        toast.error('Failed to load inspection: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchInspection()
    }
  }, [id, supabase])

  // ✅ تصدير PDF عبر API
  const handleExportPDF = () => {
    if (inspection) {
      window.open(`/api/inspections/${inspection.id}/export-pdf`, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading inspection...</p>
        </div>
      </div>
    )
  }

  if (error || !inspection) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-600">
          <p>{error || 'Inspection not found'}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/inspections')}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Inspections
          </Button>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      scheduled: { className: 'bg-blue-100 text-blue-800', label: 'Scheduled', icon: Clock },
      in_progress: { className: 'bg-yellow-100 text-yellow-800', label: 'In Progress', icon: AlertCircle },
      completed: { className: 'bg-green-100 text-green-800', label: 'Completed', icon: CheckCircle },
      cancelled: { className: 'bg-gray-100 text-gray-800', label: 'Cancelled', icon: XCircle },
      overdue: { className: 'bg-red-100 text-red-800', label: 'Overdue', icon: AlertCircle },
    }
    return variants[status] || variants.scheduled
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
      site: 'Site Inspection',
      fire_safety: 'Fire Safety',
      ppe: 'PPE Inspection',
      vehicle: 'Vehicle Inspection',
      equipment: 'Equipment Inspection',
      environmental: 'Environmental',
      quality: 'Quality Check',
      custom: 'Custom Inspection',
    }
    return labels[type] || type
  }

  const status = getStatusBadge(inspection.status)
  const priority = getPriorityBadge(inspection.priority)
  const StatusIcon = status.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/inspections')}
            className="gap-2"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{inspection.title || 'Inspection Report'}</h1>
            <p className="text-sm text-gray-500 mt-1">Inspection details and findings</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* ✅ رابط التعديل الصحيح مع /dashboard */}
          <Link href={`/dashboard/inspections/${inspection.id}/edit`}>
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

      {/* Inspection Summary Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="p-4 rounded-full bg-blue-50">
              <ClipboardCheck className="h-12 w-12 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold">{inspection.title}</h2>
                <Badge className={status.className}>
                  <StatusIcon size={12} className="mr-1" />
                  {status.label}
                </Badge>
                <Badge className={priority.className}>{priority.label}</Badge>
              </div>
              <p className="text-gray-600 mt-1">
                <span className="font-medium">Type:</span> {getTypeLabel(inspection.inspection_type)}
              </p>
              <div className="flex flex-wrap gap-4 mt-2 text-sm">
                <div className="flex items-center gap-1">
                  <User size={14} className="text-gray-400" />
                  <span>Inspector: {inspection.inspector_name || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin size={14} className="text-gray-400" />
                  <span>{inspection.location || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={14} className="text-gray-400" />
                  <span>{inspection.scheduled_date ? new Date(inspection.scheduled_date).toLocaleDateString() : 'N/A'}</span>
                </div>
                {inspection.projects && (
                  <div className="flex items-center gap-1">
                    <Building2 size={14} className="text-gray-400" />
                    <span>{inspection.projects.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {inspection.status === 'completed' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">Result</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {inspection.passed ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-600" />
                )}
                <div>
                  <p className={`text-lg font-bold ${inspection.passed ? 'text-green-600' : 'text-red-600'}`}>
                    {inspection.passed ? 'Passed' : 'Failed'}
                  </p>
                  {inspection.score !== null && (
                    <p className="text-sm text-gray-500">Score: {inspection.score}%</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {inspection.follow_up_required && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">Follow-up Required</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Follow-up date: {inspection.follow_up_date ? new Date(inspection.follow_up_date).toLocaleDateString() : 'N/A'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Information Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <FileText size={16} /> Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem label="Inspection Type" value={getTypeLabel(inspection.inspection_type)} />
            <InfoItem label="Status" value={status.label} />
            <InfoItem label="Priority" value={priority.label} />
            <InfoItem label="Created" value={new Date(inspection.created_at).toLocaleDateString()} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Calendar size={16} /> Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem label="Scheduled Date" value={inspection.scheduled_date ? new Date(inspection.scheduled_date).toLocaleDateString() : 'N/A'} />
            <InfoItem label="Completed Date" value={inspection.completed_date ? new Date(inspection.completed_date).toLocaleDateString() : 'N/A'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <User size={16} /> Inspector
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem label="Name" value={inspection.inspector_name || 'N/A'} />
            <InfoItem label="Location" value={inspection.location || 'N/A'} />
          </CardContent>
        </Card>
      </div>

      {/* Findings & Recommendations */}
      {(inspection.findings || inspection.recommendations) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Findings & Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {inspection.findings && (
              <div>
                <h4 className="font-medium text-sm text-red-600">Findings</h4>
                <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{inspection.findings}</p>
              </div>
            )}
            {inspection.recommendations && (
              <div>
                <h4 className="font-medium text-sm text-green-600">Recommendations</h4>
                <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{inspection.recommendations}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {inspection.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 whitespace-pre-wrap">{inspection.notes}</p>
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