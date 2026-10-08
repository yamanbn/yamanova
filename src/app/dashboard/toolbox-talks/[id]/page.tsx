// src/app/dashboard/toolbox-talks/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  MapPin,
  User,
  Users,
  FileText,
  Edit2,
  Download,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Info,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface ToolboxTalk {
  id: string
  title: string
  topic: string
  date: string
  location: string
  conducted_by: string
  duration: number
  attendees_count: number
  key_points: string
  discussion_points: string
  action_items: string
  completed: boolean
  project_id: string
  created_at: string
  projects: { name: string }
}

export default function ToolboxTalkDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()

  const [talk, setTalk] = useState<ToolboxTalk | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTalk = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('toolbox_talks')
          .select(`
            *,
            projects:project_id (name)
          `)
          .eq('id', id)
          .single()

        if (error) throw error
        setTalk(data)
      } catch (err: any) {
        setError(err.message)
        toast.error('Failed to load toolbox talk: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchTalk()
    }
  }, [id, supabase])

  // ✅ تصدير PDF عبر API
  const handleExportPDF = () => {
    if (talk) {
      window.open(`/api/toolbox-talks/${talk.id}/export-pdf`, '_blank')
    }
  }

  const handleMarkCompleted = async () => {
    if (!talk) return
    try {
      const { error } = await supabase
        .from('toolbox_talks')
        .update({ completed: true })
        .eq('id', talk.id)

      if (error) throw error
      toast.success('Toolbox talk marked as completed')
      setTalk({ ...talk, completed: true })
    } catch (err: any) {
      toast.error('Failed to mark as completed: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading toolbox talk...</p>
        </div>
      </div>
    )
  }

  if (error || !talk) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-600">
          <p>{error || 'Toolbox talk not found'}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/toolbox-talks')}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Toolbox Talks
          </Button>
        </div>
      </div>
    )
  }

  const getStatusBadge = (completed: boolean) => {
    if (completed) {
      return { className: 'bg-green-100 text-green-800', label: 'Completed', icon: CheckCircle }
    }
    return { className: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: Clock }
  }

  const status = getStatusBadge(talk.completed)
  const StatusIcon = status.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/toolbox-talks')}
            className="gap-2"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{talk.title || 'Toolbox Talk'}</h1>
            <p className="text-sm text-gray-500 mt-1">Daily safety meeting details</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!talk.completed && (
            <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50" onClick={handleMarkCompleted}>
              <CheckCircle size={16} className="mr-2" />
              Mark Complete
            </Button>
          )}
          {/* ✅ رابط التعديل الصحيح مع /dashboard */}
          <Link href={`/dashboard/toolbox-talks/${talk.id}/edit`}>
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
              <Users className="h-12 w-12 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold">{talk.title}</h2>
                <Badge className={status.className}>
                  <StatusIcon size={12} className="mr-1" />
                  {status.label}
                </Badge>
              </div>
              <p className="text-gray-600 mt-1">
                <span className="font-medium">Topic:</span> {talk.topic}
              </p>
              <div className="flex flex-wrap gap-4 mt-2 text-sm">
                <div className="flex items-center gap-1">
                  <User size={14} className="text-gray-400" />
                  <span>Conducted by: {talk.conducted_by || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin size={14} className="text-gray-400" />
                  <span>{talk.location || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={14} className="text-gray-400" />
                  <span>{talk.date ? new Date(talk.date).toLocaleDateString() : 'N/A'}</span>
                </div>
                {talk.projects && (
                  <div className="flex items-center gap-1">
                    <Building2 size={14} className="text-gray-400" />
                    <span>{talk.projects.name}</span>
                  </div>
                )}
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
            <p className="text-2xl font-bold">{talk.attendees_count || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{talk.duration || 0} min</p>
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
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Date</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">{talk.date ? new Date(talk.date).toLocaleDateString() : 'N/A'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Details Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Info size={16} /> Key Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{talk.key_points || 'N/A'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <FileText size={16} /> Discussion Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{talk.discussion_points || 'N/A'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <CheckCircle size={16} /> Action Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{talk.action_items || 'N/A'}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}