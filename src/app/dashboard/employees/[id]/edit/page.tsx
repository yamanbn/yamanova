// src/app/dashboard/employees/[id]/edit/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { EmployeeForm } from '@/components/modules/employees/EmployeeForm'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function EditEmployeePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()

  const [employee, setEmployee] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEmployee = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        setEmployee(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchEmployee()
    }
  }, [id, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading employee data...</p>
        </div>
      </div>
    )
  }

  if (error || !employee) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-600">
          <p>{error || 'Employee not found'}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push(`/dashboard/employees/${id}`)}>
            ← Back to Profile
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/dashboard/employees/${id}`)}
          className="gap-2"
        >
          <ArrowLeft size={16} />
          Back to Profile
        </Button>
        <h1 className="text-2xl font-bold">Edit Employee</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <EmployeeForm
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              router.push(`/dashboard/employees/${id}`)
            }
          }}
          employee={employee}
          onSuccess={() => {
            router.push(`/dashboard/employees/${id}`)
          }}
        />
      </div>
    </div>
  )
}