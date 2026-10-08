// src/app/dashboard/risk-assessments/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Shield,
  Calendar,
  User,
  FileText,
  Edit2,
  Download,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Building2,
  Info,
  ClipboardCheck,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface RiskAssessment {
  id: string
  title: string
  hazard_identification: string
  likelihood_score: number
  severity_score: number
  risk_level: string
  control_measures: string
  residual_risk_score: number
  residual_risk_level: string
  status: string
  assessor_name: string
  project_id: string
  department: string
  review_date: string
  notes: string
  approval_required: boolean
  approved_by: string
  approved_at: string
  created_at: string
  projects: { name: string }
}

export default function RiskAssessmentDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()

  const [risk, setRisk] = useState<RiskAssessment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRisk = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('risk_assessments')
          .select(`
            *,
            projects:project_id (name)
          `)
          .eq('id', id)
          .single()

        if (error) throw error
        setRisk(data)
      } catch (err: any) {
        setError(err.message)
        toast.error('Failed to load risk assessment: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchRisk()
    }
  }, [id, supabase])

  // ✅ تصدير PDF عبر API
  const handleExportPDF = () => {
    if (risk) {
      window.open(`/api/risk-assessments/${risk.id}/export-pdf`, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading risk assessment...</p>
        </div>
      </div>
    )
  }

  if (error || !risk) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-600">
          <p>{error || 'Risk assessment not found'}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/risk-assessments')}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Assessments
          </Button>
        </div>
      </div>
    )
  }

  const getRiskLevelBadge = (level: string) => {
    const variants: Record<string, any> = {
      low: { className: 'bg-green-100 text-green-800', label: 'Low' },
      medium: { className: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
      high: { className: 'bg-orange-100 text-orange-800', label: 'High' },
      extreme: { className: 'bg-red-100 text-red-800', label: 'Extreme' },
    }
    return variants[level] || variants.medium
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: { className: 'bg-gray-100 text-gray-800', label: 'Draft' },
      in_review: { className: 'bg-blue-100 text-blue-800', label: 'In Review' },
      approved: { className: 'bg-green-100 text-green-800', label: 'Approved' },
      rejected: { className: 'bg-red-100 text-red-800', label: 'Rejected' },
      obsolete: { className: 'bg-gray-300 text-gray-700', label: 'Obsolete' },
    }
    return variants[status] || variants.draft
  }

  const riskBadge = getRiskLevelBadge(risk.risk_level)
  const statusBadge = getStatusBadge(risk.status)
  const residualRiskBadge = getRiskLevelBadge(risk.residual_risk_level || 'low')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/risk-assessments')}
            className="gap-2"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{risk.title}</h1>
            <p className="text-sm text-gray-500 mt-1">Risk assessment details</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* ✅ رابط التعديل الصحيح مع /dashboard */}
          <Link href={`/dashboard/risk-assessments/${risk.id}/edit`}>
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
              <Shield className="h-12 w-12 text-red-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold">{risk.title}</h2>
                <Badge className={riskBadge.className}>{riskBadge.label}</Badge>
                <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
              </div>
              <p className="text-gray-600 mt-1">
                <span className="font-medium">Score:</span> {risk.likelihood_score} × {risk.severity_score} = {risk.likelihood_score * risk.severity_score}
              </p>
              <div className="flex flex-wrap gap-4 mt-2 text-sm">
                <div className="flex items-center gap-1">
                  <User size={14} className="text-gray-400" />
                  <span>Assessor: {risk.assessor_name || 'N/A'}</span>
                </div>
                {risk.projects && (
                  <div className="flex items-center gap-1">
                    <Building2 size={14} className="text-gray-400" />
                    <span>{risk.projects.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar size={14} className="text-gray-400" />
                  <span>{new Date(risk.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Matrix Display */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Likelihood</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{risk.likelihood_score} / 5</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{risk.severity_score} / 5</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Risk Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{risk.likelihood_score * risk.severity_score}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Residual Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={residualRiskBadge.className}>{residualRiskBadge.label}</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Details Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <AlertTriangle size={16} /> Hazard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{risk.hazard_identification || 'N/A'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <ClipboardCheck size={16} /> Control Measures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{risk.control_measures || 'N/A'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Info size={16} /> Additional Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem label="Department" value={risk.department || 'N/A'} />
            <InfoItem label="Review Date" value={risk.review_date ? new Date(risk.review_date).toLocaleDateString() : 'N/A'} />
            <InfoItem label="Approval Required" value={risk.approval_required ? '✅ Yes' : '❌ No'} />
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {risk.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 whitespace-pre-wrap">{risk.notes}</p>
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