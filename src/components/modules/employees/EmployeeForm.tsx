// src/components/modules/employees/EmployeeForm.tsx (نسخة مبسطة - بدون Tabs و ScrollArea)
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { toast } from 'sonner'

interface EmployeeFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee?: any
  onSuccess: () => void
}

export function EmployeeForm({ open, onOpenChange, employee, onSuccess }: EmployeeFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    job_title: '',
    department: '',
    status: 'active',
    nationality: '',
    date_of_birth: '',
    gender: 'male',
    marital_status: 'single',
    join_date: '',
    employment_type: 'full_time',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    passport_number: '',
    passport_expiry: '',
    visa_number: '',
    visa_expiry: '',
    emirates_id: '',
    emirates_id_expiry: '',
    salary: '',
    bank_name: '',
    bank_account: '',
    iban: '',
    address: '',
    notes: '',
  })

  // ملء النموذج عند التعديل
  useEffect(() => {
    if (employee) {
      setFormData({
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        job_title: employee.job_title || '',
        department: employee.department || '',
        status: employee.status || 'active',
        nationality: employee.nationality || '',
        date_of_birth: employee.date_of_birth || '',
        gender: employee.gender || 'male',
        marital_status: employee.marital_status || 'single',
        join_date: employee.join_date || '',
        employment_type: employee.employment_type || 'full_time',
        emergency_contact_name: employee.emergency_contact_name || '',
        emergency_contact_phone: employee.emergency_contact_phone || '',
        emergency_contact_relationship: employee.emergency_contact_relationship || '',
        passport_number: employee.passport_number || '',
        passport_expiry: employee.passport_expiry || '',
        visa_number: employee.visa_number || '',
        visa_expiry: employee.visa_expiry || '',
        emirates_id: employee.emirates_id || '',
        emirates_id_expiry: employee.emirates_id_expiry || '',
        salary: employee.salary || '',
        bank_name: employee.bank_name || '',
        bank_account: employee.bank_account || '',
        iban: employee.iban || '',
        address: employee.address || '',
        notes: employee.notes || '',
      })
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        job_title: '',
        department: '',
        status: 'active',
        nationality: '',
        date_of_birth: '',
        gender: 'male',
        marital_status: 'single',
        join_date: '',
        employment_type: 'full_time',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        emergency_contact_relationship: '',
        passport_number: '',
        passport_expiry: '',
        visa_number: '',
        visa_expiry: '',
        emirates_id: '',
        emirates_id_expiry: '',
        salary: '',
        bank_name: '',
        bank_account: '',
        iban: '',
        address: '',
        notes: '',
      })
    }
  }, [employee])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // الحصول على organization_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .limit(1)
        .maybeSingle()

      if (!profile?.organization_id) {
        throw new Error('لم يتم العثور على منظمة')
      }

      // تنظيف البيانات الفارغة
      const cleanedData: any = { ...formData }
      Object.keys(cleanedData).forEach((key) => {
        if (cleanedData[key] === '' || cleanedData[key] === null || cleanedData[key] === undefined) {
          delete cleanedData[key]
        }
      })

      cleanedData.organization_id = profile.organization_id

      let result
      if (employee?.id) {
        // تحديث
        result = await supabase
          .from('employees')
          .update(cleanedData)
          .eq('id', employee.id)
      } else {
        // إضافة - إنشاء رقم موظف تلقائي
        const { count } = await supabase
          .from('employees')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', profile.organization_id)
        const employeeCode = `EMP-${String((count || 0) + 1).padStart(4, '0')}`
        result = await supabase
          .from('employees')
          .insert({ ...cleanedData, employee_code: employeeCode })
      }

      if (result.error) throw result.error

      toast.success(employee?.id ? 'Employee updated successfully' : 'Employee added successfully')
      onSuccess()
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to save employee: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employee?.id ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
              {error}
            </div>
          )}

          {/* قسم المعلومات الشخصية */}
          <div className="border-b pb-4">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name *</Label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <Label>Nationality</Label>
                <Input
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  placeholder="e.g., UAE, Egypt, India"
                />
              </div>
              <div>
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <Label>Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Marital Status</Label>
                <Select
                  value={formData.marital_status}
                  onValueChange={(value) => setFormData({ ...formData, marital_status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Blood Type</Label>
                <Select
                  value={formData.blood_type || 'O+'}
                  onValueChange={(value) => setFormData({ ...formData, blood_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* قسم معلومات الاتصال */}
          <div className="border-b pb-4">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">Contact</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
            <div className="mt-4">
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter address"
              />
            </div>
          </div>

          {/* قسم المعلومات الوظيفية */}
          <div className="border-b pb-4">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">Employment Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Job Title *</Label>
                <Input
                  value={formData.job_title}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Department</Label>
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Enter department"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <Label>Employment Type</Label>
                <Select
                  value={formData.employment_type}
                  onValueChange={(value) => setFormData({ ...formData, employment_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="temporary">Temporary</SelectItem>
                    <SelectItem value="intern">Intern</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Join Date</Label>
                <Input
                  type="date"
                  value={formData.join_date}
                  onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-4">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* قسم المستندات */}
          <div className="border-b pb-4">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">Documents & IDs</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Emirates ID</Label>
                <Input
                  value={formData.emirates_id}
                  onChange={(e) => setFormData({ ...formData, emirates_id: e.target.value })}
                />
              </div>
              <div>
                <Label>Emirates ID Expiry</Label>
                <Input
                  type="date"
                  value={formData.emirates_id_expiry}
                  onChange={(e) => setFormData({ ...formData, emirates_id_expiry: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <Label>Passport Number</Label>
                <Input
                  value={formData.passport_number}
                  onChange={(e) => setFormData({ ...formData, passport_number: e.target.value })}
                />
              </div>
              <div>
                <Label>Passport Expiry</Label>
                <Input
                  type="date"
                  value={formData.passport_expiry}
                  onChange={(e) => setFormData({ ...formData, passport_expiry: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <Label>Visa Number</Label>
                <Input
                  value={formData.visa_number}
                  onChange={(e) => setFormData({ ...formData, visa_number: e.target.value })}
                />
              </div>
              <div>
                <Label>Visa Expiry</Label>
                <Input
                  type="date"
                  value={formData.visa_expiry}
                  onChange={(e) => setFormData({ ...formData, visa_expiry: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* قسم جهة الاتصال الطارئة */}
          <div className="border-b pb-4">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">Emergency Contact</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                />
              </div>
              <div>
                <Label>Relationship</Label>
                <Input
                  value={formData.emergency_contact_relationship}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_relationship: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* قسم المعلومات المالية */}
          <div className="border-b pb-4">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">Financial</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Salary (AED)</Label>
                <Input
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                />
              </div>
              <div>
                <Label>Bank Name</Label>
                <Input
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <Label>Bank Account</Label>
                <Input
                  value={formData.bank_account}
                  onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                />
              </div>
              <div>
                <Label>IBAN</Label>
                <Input
                  value={formData.iban}
                  onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* ملاحظات */}
          <div>
            <Label>Notes</Label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full border rounded-md px-3 py-2 min-h-[80px]"
              placeholder="Additional notes"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : employee?.id ? 'Update Employee' : 'Save Employee'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}