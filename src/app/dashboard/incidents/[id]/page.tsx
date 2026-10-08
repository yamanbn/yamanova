// src/app/dashboard/incidents/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
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
  Info,
  Brain,
  Loader2,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Incident {
  id: string
  title: string
  incident_type: string
  severity: string
  location: string
  datetime: string
  description: string
  status: string
  investigation_status: string
  reported_by_name: string
  created_at: string
  root_cause_analysis: string
  corrective_actions: string
  preventive_actions: string
  corrective_actions_completed: boolean
  preventive_actions_completed: boolean
}

export default function IncidentDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()

  const [incident, setIncident] = useState<Incident | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ============================================================
  // حالة تحليل الذكاء الاصطناعي
  // ============================================================
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<string | null>(null)
  const [showAnalysis, setShowAnalysis] = useState(false)

  useEffect(() => {
    const fetchIncident = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('incidents')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        setIncident(data)
      } catch (err: any) {
        setError(err.message)
        toast.error('Failed to load incident: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchIncident()
    }
  }, [id, supabase])

  // ============================================================
  // تحليل الحادث باستخدام الذكاء الاصطناعي
  // ============================================================
  const analyzeIncident = async () => {
    if (!incident) return

    setAnalyzing(true)
    setAnalysisResult(null)
    setShowAnalysis(false)

    try {
      const prompt = `
قم بتحليل الحادث التالي وقدم تقريراً موجزاً يشمل:
1. الأسباب الجذرية المحتملة
2. الإجراءات الوقائية المقترحة
3. توصيات لتحسين السلامة

تفاصيل الحادث:
- العنوان: ${incident.title || 'غير محدد'}
- النوع: ${incident.incident_type || 'غير محدد'}
- الخطورة: ${incident.severity || 'غير محدد'}
- الموقع: ${incident.location || 'غير محدد'}
- الوصف: ${incident.description || 'لا يوجد وصف'}
- الإجراءات التصحيحية الحالية: ${incident.corrective_actions || 'لا توجد'}
- الإجراءات الوقائية الحالية: ${incident.preventive_actions || 'لا توجد'}
`

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: prompt }
          ],
          type: 'incident_analysis'
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'فشل تحليل الحادث')
      }

      setAnalysisResult(data.reply)
      setShowAnalysis(true)
      toast.success('✅ تم إنشاء التحليل بنجاح')
    } catch (err: any) {
      console.error('❌ Analysis error:', err)
      toast.error(`❌ ${err.message}`)
    } finally {
      setAnalyzing(false)
    }
  }

  // ============================================================
  // تصدير PDF
  // ============================================================
  const handleExportPDF = () => {
    if (incident) {
      window.open(`/api/incidents/${incident.id}/export-pdf`, '_blank')
    }
  }

  // ============================================================
  // حالة التحميل
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading incident...</p>
        </div>
      </div>
    )
  }

  // ============================================================
  // حالة الخطأ
  // ============================================================
  if (error || !incident) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-600">
          <p>{error || 'Incident not found'}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/incidents')}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Incidents
          </Button>
        </div>
      </div>
    )
  }

  // ============================================================
  // دوال مساعدة للـ Badges
  // ============================================================
  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, any> = {
      low: { className: 'bg-blue-100 text-blue-800', label: 'Low' },
      medium: { className: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
      high: { className: 'bg-orange-100 text-orange-800', label: 'High' },
      critical: { className: 'bg-red-100 text-red-800', label: 'Critical' },
      catastrophic: { className: 'bg-red-200 text-red-900', label: 'Catastrophic' },
    }
    return variants[severity] || variants.medium
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { className: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      in_progress: { className: 'bg-blue-100 text-blue-800', label: 'In Progress' },
      completed: { className: 'bg-green-100 text-green-800', label: 'Completed' },
      closed: { className: 'bg-gray-100 text-gray-800', label: 'Closed' },
    }
    return variants[status] || variants.pending
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      accident: 'Accident',
      near_miss: 'Near Miss',
      unsafe_act: 'Unsafe Act',
      property_damage: 'Property Damage',
      environmental: 'Environmental',
      health_issue: 'Health Issue',
    }
    return labels[type] || type
  }

  const severity = getSeverityBadge(incident.severity)
  const status = getStatusBadge(incident.status)
  const investigationStatus = getStatusBadge(incident.investigation_status)

  // ============================================================
  // عرض الصفحة
  // ============================================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/incidents')}
            className="gap-2"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{incident.title || 'Incident Report'}</h1>
            <p className="text-sm text-gray-500 mt-1">Incident details and information</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* ✅ زر تحليل الذكاء الاصطناعي */}
          <Button
            onClick={analyzeIncident}
            disabled={analyzing}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {analyzing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Brain className="h-4 w-4 mr-2" />
            )}
            {analyzing ? 'جاري التحليل...' : 'تحليل بالذكاء الاصطناعي'}
          </Button>

          <Link href={`/dashboard/incidents/${incident.id}/edit`}>
            <Button variant="outline">
              <Edit2 size={16} className="mr-2" />
              Edit
            </Button>
          </Link>
          <Button onClick={handleExportPDF}>
            <Download size={16} className="mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* ============================================================
          تحليل الذكاء الاصطناعي (يظهر عند الضغط على الزر)
          ============================================================ */}
      {showAnalysis && analysisResult && (
        <Card className="border-purple-300 bg-purple-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Sparkles className="h-5 w-5" />
              تحليل الذكاء الاصطناعي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
              {analysisResult}
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAnalysis(false)}
                className="text-gray-500"
              >
                إخفاء التحليل
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(analysisResult)
                  toast.success('تم نسخ التحليل إلى الحافظة')
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                نسخ التحليل
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Incident Summary Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="p-4 rounded-full bg-red-50">
              <AlertTriangle className="h-12 w-12 text-red-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold">{incident.title}</h2>
                <Badge className={severity.className}>{severity.label}</Badge>
                <Badge className={status.className}>{status.label}</Badge>
              </div>
              <p className="text-gray-600 mt-1">
                <span className="font-medium">Type:</span> {getTypeLabel(incident.incident_type)}
              </p>
              <div className="flex flex-wrap gap-4 mt-2 text-sm">
                <div className="flex items-center gap-1">
                  <User size={14} className="text-gray-400" />
                  <span>Reported by: {incident.reported_by_name || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin size={14} className="text-gray-400" />
                  <span>{incident.location || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={14} className="text-gray-400" />
                  <span>{incident.datetime ? new Date(incident.datetime).toLocaleString() : 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <FileText size={16} /> Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem label="Incident Type" value={getTypeLabel(incident.incident_type)} />
            <InfoItem label="Severity" value={severity.label} />
            <InfoItem label="Status" value={status.label} />
            <InfoItem label="Investigation Status" value={investigationStatus.label} />
            <InfoItem label="Reported On" value={new Date(incident.created_at).toLocaleDateString()} />
          </CardContent>
        </Card>

        {/* Location & Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Clock size={16} /> Location & Time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem label="Location" value={incident.location || 'N/A'} />
            <InfoItem label="Date & Time" value={incident.datetime ? new Date(incident.datetime).toLocaleString() : 'N/A'} />
          </CardContent>
        </Card>

        {/* Reported By */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <User size={16} /> Reported By
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem label="Name" value={incident.reported_by_name || 'N/A'} />
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {incident.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Info size={16} /> Description
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 whitespace-pre-wrap">{incident.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {(incident.corrective_actions || incident.preventive_actions) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {incident.corrective_actions && (
              <div>
                <h4 className="font-medium text-sm flex items-center gap-2">
                  {incident.corrective_actions_completed ? (
                    <CheckCircle size={16} className="text-green-600" />
                  ) : (
                    <XCircle size={16} className="text-red-600" />
                  )}
                  Corrective Actions
                </h4>
                <p className="text-sm text-gray-600 mt-1">{incident.corrective_actions}</p>
              </div>
            )}
            {incident.preventive_actions && (
              <div>
                <h4 className="font-medium text-sm flex items-center gap-2">
                  {incident.preventive_actions_completed ? (
                    <CheckCircle size={16} className="text-green-600" />
                  ) : (
                    <XCircle size={16} className="text-red-600" />
                  )}
                  Preventive Actions
                </h4>
                <p className="text-sm text-gray-600 mt-1">{incident.preventive_actions}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Root Cause Analysis */}
      {incident.root_cause_analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Root Cause Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 whitespace-pre-wrap">{incident.root_cause_analysis}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ============================================================
// مكون InfoItem المساعد
// ============================================================
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  )
}