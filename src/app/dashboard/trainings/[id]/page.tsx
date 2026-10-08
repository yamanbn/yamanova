// src/app/dashboard/trainings/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  GraduationCap,
  Calendar,
  MapPin,
  User,
  Edit2,
  Download,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Info,
  Users,
  Award,
  DollarSign,
  Building2,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Training {
  id: string
  title: string
  description: string
  training_type: string
  trainer_name: string
  trainer_company: string
  location: string
  start_date: string
  end_date: string
  duration_hours: number
  max_attendees: number
  status: string
  cost: number
  notes: string
  is_mandatory: boolean
  created_at: string
}

export default function TrainingDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()

  const [training, setTraining] = useState<Training | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attendanceCount, setAttendanceCount] = useState(0)

  useEffect(() => {
    const fetchTraining = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('trainings')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        setTraining(data)

        // جلب عدد الحضور
        const { count } = await supabase
          .from('training_attendance')
          .select('*', { count: 'exact', head: true })
          .eq('training_id', id)
        setAttendanceCount(count || 0)
      } catch (err: any) {
        setError(err.message)
        toast.error('Failed to load training: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchTraining()
    }
  }, [id, supabase])

  // ✅ تصدير PDF عبر API
  const handleExportPDF = () => {
    if (training) {
      window.open(`/api/trainings/${training.id}/export-pdf`, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading training...</p>
        </div>
      </div>
    )
  }

  if (error || !training) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-600">
          <p>{error || 'Training not found'}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/trainings')}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Trainings
          </Button>
        </div>
      </div>
    )
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

  const status = getStatusBadge(training.status)
  const StatusIcon = status.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/trainings')}
            className="gap-2"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{training.title}</h1>
            <p className="text-sm text-gray-500 mt-1">Training program details</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* ✅ رابط التعديل الصحيح مع /dashboard */}
          <Link href={`/dashboard/trainings/${training.id}/edit`}>
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
            <div className="p-4 rounded-full bg-purple-50">
              <GraduationCap className="h-12 w-12 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold">{training.title}</h2>
                <Badge className={status.className}>
                  <StatusIcon size={12} className="mr-1" />
                  {status.label}
                </Badge>
                {training.is_mandatory && (
                  <Badge className="bg-orange-100 text-orange-800">Mandatory</Badge>
                )}
              </div>
              <p className="text-gray-600 mt-1">
                <span className="font-medium">Type:</span> {getTypeLabel(training.training_type)}
              </p>
              <div className="flex flex-wrap gap-4 mt-2 text-sm">
                <div className="flex items-center gap-1">
                  <User size={14} className="text-gray-400" />
                  <span>Trainer: {training.trainer_name || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin size={14} className="text-gray-400" />
                  <span>{training.location || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={14} className="text-gray-400" />
                  <span>{training.start_date ? new Date(training.start_date).toLocaleString() : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users size={14} className="text-gray-400" />
                  <span>{attendanceCount} / {training.max_attendees} attendees</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Attendees</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{attendanceCount} / {training.max_attendees}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{training.duration_hours || 0} hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{training.cost ? `${training.cost} AED` : 'Free'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={status.className}>{status.label}</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Details Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Info size={16} /> Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem label="Type" value={getTypeLabel(training.training_type)} />
            <InfoItem label="Status" value={status.label} />
            <InfoItem label="Mandatory" value={training.is_mandatory ? 'Yes' : 'No'} />
            <InfoItem label="Max Attendees" value={String(training.max_attendees)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Calendar size={16} /> Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem label="Start Date" value={training.start_date ? new Date(training.start_date).toLocaleString() : 'N/A'} />
            <InfoItem label="End Date" value={training.end_date ? new Date(training.end_date).toLocaleString() : 'N/A'} />
            <InfoItem label="Duration" value={`${training.duration_hours || 0} hours`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <User size={16} /> Trainer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem label="Name" value={training.trainer_name || 'N/A'} />
            <InfoItem label="Company" value={training.trainer_company || 'N/A'} />
            <InfoItem label="Location" value={training.location || 'N/A'} />
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {training.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 whitespace-pre-wrap">{training.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {training.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 whitespace-pre-wrap">{training.notes}</p>
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