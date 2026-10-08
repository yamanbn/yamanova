// src/components/modules/EmployeeForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const employeeSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  job_title: z.string().min(1, 'Job title is required'),
  department: z.string().optional(),
  employee_code: z.string().optional(),
  status: z.enum(['active', 'inactive', 'on_leave']).default('active'),
})

type EmployeeFormData = z.infer<typeof employeeSchema>

interface EmployeeFormProps {
  onClose: () => void
  onSuccess: () => void
}

export function EmployeeForm({ onClose, onSuccess }: EmployeeFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [fetchingOrg, setFetchingOrg] = useState(true)
  const supabase = createClient()

  // جلب organization_id عند تحميل النموذج
  useEffect(() => {
    const fetchOrgId = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser()
        if (!userData?.user) {
          setError('لم يتم تسجيل الدخول. يرجى تسجيل الدخول مرة أخرى.')
          setFetchingOrg(false)
          return
        }

        // استعلام بسيط بدون maybeSingle()
        const { data, error } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', userData.user.id)
          .limit(1)

        if (error) {
          throw new Error('خطأ في جلب بيانات المنظمة: ' + error.message)
        }

        if (!data || data.length === 0) {
          setError('لم يتم العثور على منظمة مرتبطة بحسابك. يرجى إضافة منظمة من صفحة المنظمات.')
          setOrgId(null)
        } else {
          setOrgId(data[0].organization_id)
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setFetchingOrg(false)
      }
    }

    fetchOrgId()
  }, [supabase])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      job_title: '',
      department: '',
      employee_code: '',
      status: 'active',
    },
  })

  const status = watch('status')

  const onSubmit = async (data: EmployeeFormData) => {
    if (!orgId) {
      setError('لا توجد منظمة مرتبطة بحسابك. يرجى إضافة منظمة أولاً.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error: insertError } = await supabase
        .from('employees')
        .insert({
          organization_id: orgId,
          first_name: data.first_name,
          last_name: data.last_name,
          job_title: data.job_title,
          department: data.department || null,
          employee_code: data.employee_code || null,
          status: data.status,
        })

      if (insertError) throw insertError
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'فشل في إضافة الموظف')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
        </DialogHeader>

        {fetchingOrg ? (
          <div className="py-8 text-center text-gray-500">جاري تحميل بيانات المنظمة...</div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input id="first_name" {...register('first_name')} placeholder="Enter first name" />
              {errors.first_name && <p className="text-sm text-red-500">{errors.first_name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input id="last_name" {...register('last_name')} placeholder="Enter last name" />
              {errors.last_name && <p className="text-sm text-red-500">{errors.last_name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" {...register('email')} placeholder="Enter email address" />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_title">Job Title *</Label>
              <Input id="job_title" {...register('job_title')} placeholder="Enter job title" />
              {errors.job_title && <p className="text-sm text-red-500">{errors.job_title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input id="department" {...register('department')} placeholder="Enter department (optional)" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee_code">Employee Code</Label>
              <Input id="employee_code" {...register('employee_code')} placeholder="Enter employee code (optional)" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value) => setValue('status', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-500">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !orgId}>
                {loading ? 'Saving...' : 'Save Employee'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}