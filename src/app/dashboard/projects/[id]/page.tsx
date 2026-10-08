// src/app/dashboard/projects/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Building2,
  User,
  MapPin,
  FileText,
  Edit2,
  Download,
  Clock,
  Briefcase,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Project {
  id: string
  name: string
  code: string
  client_name: string
  status: string
  start_date: string
  end_date: string
  location: string
  description: string
  created_at: string
}

export default function ProjectDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        setProject(data)
      } catch (err: any) {
        setError(err.message)
        toast.error('Failed to load project: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchProject()
    }
  }, [id, supabase])

  // ✅ تصدير PDF عبر API (بدلاً من window.print)
  const handleExportPDF = () => {
    if (project) {
      window.open(`/api/projects/${project.id}/export-pdf`, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading project...</p>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-600">
          <p>{error || 'Project not found'}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/projects')}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      planning: { className: 'bg-gray-100 text-gray-800', label: 'Planning' },
      active: { className: 'bg-green-100 text-green-800', label: 'Active' },
      on_hold: { className: 'bg-yellow-100 text-yellow-800', label: 'On Hold' },
      completed: { className: 'bg-blue-100 text-blue-800', label: 'Completed' },
      cancelled: { className: 'bg-red-100 text-red-800', label: 'Cancelled' },
    }
    return variants[status] || variants.planning
  }

  const status = getStatusBadge(project.status)

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/projects')}
            className="gap-2"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-sm text-gray-500 mt-1">Project details and information</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/projects/${project.id}/edit`}>
            <Button variant="outline">
              <Edit2 size={16} className="mr-2" />
              Edit
            </Button>
          </Link>
          {/* ✅ زر Export PDF معدل */}
          <Button onClick={handleExportPDF}>
            <Download size={16} className="mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Project Summary Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="p-4 rounded-full bg-blue-50">
              <Building2 className="h-12 w-12 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold">{project.name}</h2>
                <Badge className={status.className}>{status.label}</Badge>
              </div>
              <p className="text-gray-600 mt-1">
                <span className="font-medium">Code:</span> {project.code || 'N/A'}
              </p>
              <div className="flex flex-wrap gap-4 mt-2 text-sm">
                <div className="flex items-center gap-1">
                  <User size={14} className="text-gray-400" />
                  <span>Client: {project.client_name || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin size={14} className="text-gray-400" />
                  <span>{project.location || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} className="text-gray-400" />
                  <span>
                    {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'N/A'}
                    {project.end_date && ` → ${new Date(project.end_date).toLocaleDateString()}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 print:grid-cols-2 print:gap-4">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <FileText size={16} /> Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem label="Project Name" value={project.name} />
            <InfoItem label="Project Code" value={project.code || 'N/A'} />
            <InfoItem label="Status" value={status.label} />
            <InfoItem label="Created" value={new Date(project.created_at).toLocaleDateString()} />
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Calendar size={16} /> Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem 
              label="Start Date" 
              value={project.start_date ? new Date(project.start_date).toLocaleDateString() : 'N/A'} 
            />
            <InfoItem 
              label="End Date" 
              value={project.end_date ? new Date(project.end_date).toLocaleDateString() : 'N/A'} 
            />
            <InfoItem 
              label="Duration" 
              value={project.start_date && project.end_date ? 
                `${Math.ceil((new Date(project.end_date).getTime() - new Date(project.start_date).getTime()) / (1000 * 60 * 60 * 24))} days` 
                : 'N/A'
              }
            />
          </CardContent>
        </Card>

        {/* Client & Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Briefcase size={16} /> Client & Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem label="Client Name" value={project.client_name || 'N/A'} />
            <InfoItem label="Location" value={project.location || 'N/A'} />
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {project.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 whitespace-pre-wrap">{project.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Related Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-500">Related Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-300">0</p>
              <p className="text-xs text-gray-500">Employees</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-300">0</p>
              <p className="text-xs text-gray-500">Incidents</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-300">0</p>
              <p className="text-xs text-gray-500">Inspections</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-300">0</p>
              <p className="text-xs text-gray-500">Risk Assessments</p>
            </div>
          </div>
        </CardContent>
      </Card>
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