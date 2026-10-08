// src/hooks/useEmployees.ts
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from './useOrganization'

export interface Employee {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  job_title: string
  department: string
  employee_code: string
  status: 'active' | 'inactive' | 'on_leave' | 'terminated'
  nationality: string
  date_of_birth: string
  gender: string
  join_date: string
  employment_type: string
  profile_image: string
  qr_code: string
  created_at: string
  updated_at: string
}

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  
  const supabase = createClient()
  const { orgId } = useOrganization()

  const fetchEmployees = async () => {
    if (!orgId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('employees')
        .select('*', { count: 'exact' })
        .eq('organization_id', orgId)

      // تطبيق البحث
      if (searchTerm) {
        query = query.or(
          `first_name.ilike.%${searchTerm}%,` +
          `last_name.ilike.%${searchTerm}%,` +
          `email.ilike.%${searchTerm}%,` +
          `employee_code.ilike.%${searchTerm}%`
        )
      }

      // تطبيق فلتر الحالة
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      // تطبيق فلتر القسم
      if (departmentFilter !== 'all') {
        query = query.eq('department', departmentFilter)
      }

      // ترتيب وتحديد الصفحة
      const from = (currentPage - 1) * pageSize
      const to = from + pageSize - 1

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      setEmployees(data || [])
      setTotalCount(count || 0)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [orgId, searchTerm, statusFilter, departmentFilter, currentPage])

  return {
    employees,
    loading,
    error,
    totalCount,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    departmentFilter,
    setDepartmentFilter,
    currentPage,
    setCurrentPage,
    pageSize,
    refetch: fetchEmployees,
  }
}