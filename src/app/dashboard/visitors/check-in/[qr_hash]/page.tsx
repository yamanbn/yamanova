// src/app/dashboard/visitors/check-in/[qr_hash]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { QrCode, User, Building2, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface VisitData {
  id: string
  visitor_id: string
  visitors: {
    full_name: string
    company_name: string
    phone: string
    email: string
  }
  project_id: string
  projects: { name: string } | null
  host_employee_id: string
  employees: { first_name: string, last_name: string, job_title: string } | null
  purpose: string
  status: string
  check_in_time: string
  check_out_time: string
}

export default function CheckInQRPage() {
  const params = useParams()
  const qrHash = params.qr_hash as string
  const supabase = createClient()

  const [visit, setVisit] = useState<VisitData | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkingIn, setCheckingIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchVisit = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/visitors/qr/${qrHash}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setVisit(data)
      } catch (err: any) {
        setError(err.message)
        toast.error(`❌ ${err.message}`)
      } finally {
        setLoading(false)
      }
    }
    if (qrHash) fetchVisit()
  }, [qrHash])

  const handleCheckIn = async () => {
    setCheckingIn(true)
    try {
      // استخدام موقع المتصفح (اختياري)
      let location = null
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject)
          })
          location = `${pos.coords.latitude}, ${pos.coords.longitude}`
        } catch (geoError) {
          console.log('Geolocation not available')
        }
      }

      const res = await fetch(`/api/visitors/qr/${qrHash}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('✅ تم تسجيل الدخول بنجاح')
      // تحديث البيانات
      const updatedRes = await fetch(`/api/visitors/qr/${qrHash}`)
      const updatedData = await updatedRes.json()
      setVisit(updatedData)
    } catch (err: any) {
      toast.error(`❌ ${err.message}`)
    } finally {
      setCheckingIn(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !visit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-red-600">رمز QR غير صالح</h2>
        <p className="text-gray-500 mt-2">{error || 'هذا الرابط غير صحيح أو منتهي الصلاحية'}</p>
      </div>
    )
  }

  const isActive = visit.status === 'active'
  const hasCheckedIn = visit.check_in_time && new Date(visit.check_in_time) > new Date(0)

  return (
    <div className="max-w-md mx-auto space-y-6 py-8">
      {/* Header */}
      <div className="text-center">
        <QrCode className="h-16 w-16 text-purple-600 mx-auto mb-3" />
        <h1 className="text-2xl font-bold">تسجيل الدخول</h1>
        <p className="text-gray-500">قم بتأكيد دخولك للموقع</p>
      </div>

      {/* Visitor Card */}
      <div className="bg-white rounded-lg border shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b">
          <User className="h-5 w-5 text-blue-600" />
          <div>
            <p className="font-medium">{visit.visitors.full_name}</p>
            <p className="text-sm text-gray-500">{visit.visitors.company_name || 'شركة غير محددة'}</p>
          </div>
        </div>

        <InfoRow label="الغرض" value={visit.purpose} />
        <InfoRow label="المشروع" value={visit.projects?.name || 'غير محدد'} />
        <InfoRow 
          label="الموظف المزور" 
          value={visit.employees ? `${visit.employees.first_name} ${visit.employees.last_name}` : 'غير محدد'} 
        />
        <InfoRow 
          label="الحالة" 
          value={
            <span className={`px-2 py-1 rounded-full text-xs ${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {isActive ? 'نشط' : 'مكتمل'}
            </span>
          } 
        />
        {hasCheckedIn && (
          <InfoRow label="وقت الدخول" value={new Date(visit.check_in_time).toLocaleString()} />
        )}
      </div>

      {/* Action Button */}
      {isActive && !hasCheckedIn ? (
        <button
          onClick={handleCheckIn}
          disabled={checkingIn}
          className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {checkingIn ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
          {checkingIn ? 'جاري التحقق...' : 'تسجيل الدخول'}
        </button>
      ) : isActive && hasCheckedIn ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center text-blue-800">
          <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
          <p className="font-medium">تم تسجيل الدخول بنجاح</p>
          <p className="text-sm">وقت الدخول: {new Date(visit.check_in_time).toLocaleString()}</p>
        </div>
      ) : (
        <div className="bg-gray-50 border rounded-lg p-4 text-center text-gray-500">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p>هذه الزيارة غير نشطة</p>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string, value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center border-b border-gray-50 pb-2 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}