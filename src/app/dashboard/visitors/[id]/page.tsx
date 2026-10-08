// src/app/dashboard/visitors/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  Building2, 
  Calendar, 
  Clock,
  CheckCircle,
  XCircle,
  QrCode,
  FileText,
  MapPin,
  UserCheck,
  UserX,
  Loader2,
  Edit2,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'

interface VisitorDetail {
  id: string
  full_name: string
  phone: string
  email: string
  id_type: string
  id_number: string
  company_name: string
  photo_url: string
  is_blacklisted: boolean
  notes: string
  created_at: string
  visitor_visits: {
    id: string
    purpose: string
    check_in_time: string
    check_out_time: string
    status: string
    qr_code_hash: string
    project_id: string
    projects: { name: string } | null
    host_employee_id: string
    employees: { first_name: string, last_name: string, job_title: string } | null
  }[]
}

export default function VisitorDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()

  const [visitor, setVisitor] = useState<VisitorDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkingOut, setCheckingOut] = useState(false)

  const fetchVisitor = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/visitors/${id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setVisitor(data)
    } catch (err: any) {
      toast.error(`❌ ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) fetchVisitor()
  }, [id])

  const handleCheckOut = async () => {
    if (!confirm('هل أنت متأكد من تسجيل خروج هذا الزائر؟')) return
    setCheckingOut(true)
    try {
      const res = await fetch(`/api/visitors/${id}/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('✅ تم تسجيل الخروج بنجاح')
      fetchVisitor()
    } catch (err: any) {
      toast.error(`❌ ${err.message}`)
    } finally {
      setCheckingOut(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string, label: string, icon: any }> = {
      active: { className: 'bg-green-100 text-green-800', label: 'نشط', icon: CheckCircle },
      completed: { className: 'bg-blue-100 text-blue-800', label: 'مكتمل', icon: CheckCircle },
      cancelled: { className: 'bg-red-100 text-red-800', label: 'ملغي', icon: XCircle },
      no_show: { className: 'bg-yellow-100 text-yellow-800', label: 'لم يحضر', icon: UserX },
    }
    return variants[status] || variants.active
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!visitor) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">الزائر غير موجود</p>
        <Link href="/dashboard/visitors" className="text-blue-600 hover:underline">
          رجوع إلى قائمة الزوار
        </Link>
      </div>
    )
  }

  const activeVisit = visitor.visitor_visits?.find(v => v.status === 'active')
  const latestVisit = visitor.visitor_visits?.[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/visitors">
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" />
              رجوع
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <User className="h-6 w-6 text-blue-600" />
              {visitor.full_name}
            </h1>
            <p className="text-sm text-gray-500 mt-1">تفاصيل الزائر وسجل الزيارات</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeVisit && (
            <button
              onClick={handleCheckOut}
              disabled={checkingOut}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              {checkingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
              تسجيل خروج
            </button>
          )}
          <Link href={`/dashboard/visitors/${visitor.id}/edit`}>
            <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
              <Edit2 className="h-4 w-4" />
              تعديل
            </button>
          </Link>
          {latestVisit?.qr_code_hash && (
            <Link href={`/dashboard/visitors/check-in/${latestVisit.qr_code_hash}`} target="_blank">
              <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                <QrCode className="h-4 w-4" />
                عرض QR
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* معلومات الزائر */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white rounded-lg border shadow-sm p-6 space-y-4">
          <h3 className="font-medium flex items-center gap-2">
            <User className="h-4 w-4 text-blue-600" />
            معلومات شخصية
          </h3>
          <InfoItem label="الاسم الكامل" value={visitor.full_name} />
          <InfoItem label="رقم الهاتف" value={visitor.phone || 'غير محدد'} />
          <InfoItem label="البريد الإلكتروني" value={visitor.email || 'غير محدد'} />
          <InfoItem label="الشركة" value={visitor.company_name || 'غير محددة'} />
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-6 space-y-4">
          <h3 className="font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-600" />
            بيانات الهوية
          </h3>
          <InfoItem label="نوع الهوية" value={visitor.id_type || 'غير محدد'} />
          <InfoItem label="رقم الهوية" value={visitor.id_number || 'غير محدد'} />
          <InfoItem label="الحالة" value={visitor.is_blacklisted ? 'محظور' : 'نشط'} />
          <InfoItem label="تاريخ التسجيل" value={new Date(visitor.created_at).toLocaleDateString()} />
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-6 space-y-4">
          <h3 className="font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-600" />
            آخر زيارة
          </h3>
          {latestVisit ? (
            <>
              <InfoItem label="الحالة" value={getStatusBadge(latestVisit.status).label} />
              <InfoItem label="المشروع" value={latestVisit.projects?.name || 'غير محدد'} />
              <InfoItem label="الموظف المزور" value={
                latestVisit.employees 
                  ? `${latestVisit.employees.first_name} ${latestVisit.employees.last_name}`
                  : 'غير محدد'
              } />
              <InfoItem label="الغرض" value={latestVisit.purpose} />
              <InfoItem label="وقت الدخول" value={new Date(latestVisit.check_in_time).toLocaleString()} />
              {latestVisit.check_out_time && (
                <InfoItem label="وقت الخروج" value={new Date(latestVisit.check_out_time).toLocaleString()} />
              )}
            </>
          ) : (
            <p className="text-gray-500 text-sm">لا توجد زيارات سابقة</p>
          )}
        </div>
      </div>

      {/* سجل الزيارات */}
      {visitor.visitor_visits && visitor.visitor_visits.length > 0 && (
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-600" />
            سجل الزيارات
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">المشروع</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">الغرض</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">دخول</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">خروج</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {visitor.visitor_visits.map((visit) => {
                  const status = getStatusBadge(visit.status)
                  return (
                    <tr key={visit.id}>
                      <td className="px-3 py-2 text-sm">{visit.projects?.name || 'غير محدد'}</td>
                      <td className="px-3 py-2 text-sm">{visit.purpose}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm">{new Date(visit.check_in_time).toLocaleString()}</td>
                      <td className="px-3 py-2 text-sm">
                        {visit.check_out_time ? new Date(visit.check_out_time).toLocaleString() : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ملاحظات */}
      {visitor.notes && (
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-600" />
            ملاحظات
          </h3>
          <p className="text-gray-700 whitespace-pre-wrap">{visitor.notes}</p>
        </div>
      )}
    </div>
  )
}

function InfoItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center border-b border-gray-50 pb-2 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  )
}