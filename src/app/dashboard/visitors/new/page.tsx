// src/app/dashboard/visitors/new/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, QrCode, UserPlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Employee {
  id: string
  first_name: string
  last_name: string
  job_title: string
}

interface Project {
  id: string
  name: string
  code: string
}

export default function NewVisitorPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // نموذج البيانات
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    id_type: 'passport',
    id_number: '',
    company_name: '',
    project_id: '',
    host_employee_id: '',
    purpose: '',
    expected_check_out: '',
    notes: '',
  })

  // جلب الموظفين والمشاريع
  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true)
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .single()

        if (!profile?.organization_id) {
          toast.error('لم يتم العثور على المنظمة')
          return
        }

        const [employeesRes, projectsRes] = await Promise.all([
          supabase
            .from('employees')
            .select('id, first_name, last_name, job_title')
            .eq('organization_id', profile.organization_id)
            .eq('status', 'active'),
          supabase
            .from('projects')
            .select('id, name, code')
            .eq('organization_id', profile.organization_id)
            .eq('status', 'active'),
        ])

        if (employeesRes.error) throw employeesRes.error
        if (projectsRes.error) throw projectsRes.error

        setEmployees(employeesRes.data || [])
        setProjects(projectsRes.data || [])
      } catch (err: any) {
        toast.error(`❌ ${err.message}`)
      } finally {
        setLoadingData(false)
      }
    }
    fetchData()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'فشل إضافة الزائر')
      }

      toast.success(`✅ تم إضافة الزائر "${formData.full_name}" بنجاح`)
      
      // عرض رمز QR في رسالة منبثقة
      if (data.qr_url) {
        toast.info(`🔗 رابط QR: ${data.qr_url}`, {
          duration: 10000,
        })
      }

      router.push('/dashboard/visitors')
    } catch (err: any) {
      toast.error(`❌ ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (loadingData) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/visitors">
          <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            رجوع
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-blue-600" />
            زائر جديد
          </h1>
          <p className="text-sm text-gray-500 mt-1">أدخل بيانات الزائر لإنشاء زيارة جديدة</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border shadow-sm p-6 space-y-6">
        {/* معلومات الزائر */}
        <div>
          <h3 className="text-lg font-medium mb-4">معلومات الزائر</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل *</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="أدخل الاسم الكامل"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="رقم الهاتف"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="البريد الإلكتروني"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نوع الهوية</label>
              <select
                name="id_type"
                value={formData.id_type}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="passport">جواز سفر</option>
                <option value="emirates_id">هوية إماراتية</option>
                <option value="national_id">بطاقة وطنية</option>
                <option value="driver_license">رخصة قيادة</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهوية</label>
              <input
                type="text"
                name="id_number"
                value={formData.id_number}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="رقم الهوية"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الشركة</label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="اسم الشركة"
              />
            </div>
          </div>
        </div>

        {/* معلومات الزيارة */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4">معلومات الزيارة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المشروع</label>
              <select
                name="project_id"
                value={formData.project_id}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">اختر مشروعاً</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الموظف المزور</label>
              <select
                name="host_employee_id"
                value={formData.host_employee_id}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">اختر موظفاً</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.first_name} {e.last_name} - {e.job_title}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">الغرض من الزيارة *</label>
              <textarea
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                required
                rows={2}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ما هو الغرض من الزيارة؟"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">وقت المغادرة المتوقع</label>
              <input
                type="datetime-local"
                name="expected_check_out"
                value={formData.expected_check_out}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={2}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="أي ملاحظات إضافية"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="border-t pt-6 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            {loading ? 'جاري الإضافة...' : 'إضافة الزائر'}
          </button>
          <Link href="/dashboard/visitors">
            <button type="button" className="px-6 py-2 border rounded-lg hover:bg-gray-50">
              إلغاء
            </button>
          </Link>
        </div>
      </form>
    </div>
  )
}