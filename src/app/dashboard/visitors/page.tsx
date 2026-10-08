// src/app/dashboard/visitors/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  UserRoundCheck, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  QrCode,
  Calendar,
  Building2,
  Phone,
  Mail
} from 'lucide-react'
import { toast } from 'sonner'

interface Visitor {
  id: string
  full_name: string
  phone: string
  email: string
  id_type: string
  id_number: string
  company_name: string
  notes: string
  created_at: string
  last_visit_status: 'active' | 'completed' | 'cancelled' | 'no_show' | 'no_visits'
  last_visit_time: string | null
  host_name: string | null
}

export default function VisitorsPage() {
  const router = useRouter()
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // ============================================================
  // جلب الزوار
  // ============================================================
  const fetchVisitors = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const res = await fetch(`/api/visitors?${params.toString()}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'فشل جلب الزوار')
      }

      setVisitors(data || [])
    } catch (err: any) {
      console.error('❌ Fetch error:', err)
      setError(err.message)
      toast.error(`❌ ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // تحميل البيانات عند تغيير البحث أو الفلتر
  // ============================================================
  useEffect(() => {
    fetchVisitors()
  }, [search, statusFilter])

  // ============================================================
  // حذف زائر (اختياري)
  // ============================================================
  const deleteVisitor = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الزائر؟')) return

    try {
      const res = await fetch(`/api/visitors/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'فشل الحذف')
      }

      toast.success('✅ تم حذف الزائر بنجاح')
      fetchVisitors()
    } catch (err: any) {
      toast.error(`❌ ${err.message}`)
    }
  }

  // ============================================================
  // الحصول على شارة الحالة
  // ============================================================
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium">نشط</span>
      case 'completed':
        return <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium">مكتمل</span>
      case 'cancelled':
        return <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs font-medium">ملغي</span>
      case 'no_show':
        return <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-xs font-medium">لم يحضر</span>
      default:
        return <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-xs font-medium">لا زيارات</span>
    }
  }

  // ============================================================
  // تنسيق التاريخ
  // ============================================================
  const formatDate = (date: string | null) => {
    if (!date) return '—'
    return new Date(date).toLocaleString('ar-EG', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // ============================================================
  // العرض
  // ============================================================
  return (
    <div className="space-y-6">
      {/* الهيدر */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserRoundCheck className="h-7 w-7 text-blue-600" />
            الزوار
          </h1>
          <p className="text-sm text-gray-500 mt-1">إدارة وتسجيل الزوار في المنظمة</p>
        </div>
        <Link href="/dashboard/visitors/new">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Plus className="h-5 w-5" />
            إضافة زائر
          </button>
        </Link>
      </div>

      {/* شريط البحث والفلترة */}
      <div className="flex flex-wrap gap-3 items-center bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم، الشركة، رقم الهوية..."
              className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="completed">مكتمل</option>
            <option value="cancelled">ملغي</option>
            <option value="no_show">لم يحضر</option>
          </select>
        </div>
        <button
          onClick={fetchVisitors}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          تحديث
        </button>
      </div>

      {/* عرض الأخطاء */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600 border border-red-200">
          ⚠️ {error}
        </div>
      )}

      {/* قائمة الزوار */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">جاري التحميل...</p>
          </div>
        ) : visitors.length === 0 ? (
          <div className="text-center py-16">
            <UserRoundCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">لا يوجد زوار</p>
            <p className="text-sm text-gray-400 mt-1">أضف أول زائر للبدء</p>
            <Link href="/dashboard/visitors/new">
              <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                أضف أول زائر
              </button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">الاسم</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">الشركة</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">رقم الهوية</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">آخر زيارة</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">الحالة</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visitors.map((visitor) => (
                  <tr key={visitor.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium">{visitor.full_name}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {visitor.phone || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        {visitor.company_name || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {visitor.id_number || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {visitor.last_visit_time ? (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-gray-400" />
                          {formatDate(visitor.last_visit_time)}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(visitor.last_visit_status)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/visitors/${visitor.id}`}>
                          <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="عرض التفاصيل">
                            <Eye className="h-4 w-4" />
                          </button>
                        </Link>
                        {visitor.last_visit_status === 'active' && (
                          <Link href={`/dashboard/visitors/check-in/${visitor.id}`}>
                            <button className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="تسجيل خروج">
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          </Link>
                        )}
                        <button
                          onClick={() => deleteVisitor(visitor.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}