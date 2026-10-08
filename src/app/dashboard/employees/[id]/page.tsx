// src/app/dashboard/employees/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Mail, Phone, Briefcase, User, FileText,
  CreditCard, Home, Download, Edit2
} from 'lucide-react'
import Link from 'next/link'
import { EmployeeQR } from '@/components/modules/employees/EmployeeQR'
import { toast } from 'sonner'

interface Employee {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  job_title: string
  department: string
  employee_code: string
  status: string
  nationality: string
  date_of_birth: string
  gender: string
  marital_status: string
  blood_type: string
  join_date: string
  employment_type: string
  emergency_contact_name: string
  emergency_contact_phone: string
  emergency_contact_relationship: string
  passport_number: string
  passport_expiry: string
  visa_number: string
  visa_expiry: string
  emirates_id: string
  emirates_id_expiry: string
  salary: number
  bank_name: string
  bank_account: string
  iban: string
  address: string
  notes: string
  profile_image: string
}

export default function EmployeeProfilePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()

  const [employee, setEmployee] = useState<Employee | null>(null)
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
        toast.error('Failed to load employee: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchEmployee()
    }
  }, [id, supabase])

  const handleExportPDF = () => {
    // استخدام window.print() كحل مؤقت (يمكن استبداله بمكتبة PDF لاحقاً)
    window.print()
  }

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
          <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/employees')}>
            ← Back to Employees
          </Button>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: { className: 'bg-green-100 text-green-800', label: 'Active' },
      inactive: { className: 'bg-gray-100 text-gray-800', label: 'Inactive' },
      on_leave: { className: 'bg-yellow-100 text-yellow-800', label: 'On Leave' },
      terminated: { className: 'bg-red-100 text-red-800', label: 'Terminated' },
    }
    return variants[status] || variants.inactive
  }

  const status = getStatusBadge(employee.status)
  const initials = `${employee.first_name?.charAt(0) || ''}${employee.last_name?.charAt(0) || ''}`.toUpperCase()

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold">Employee Profile</h1>
          <p className="text-sm text-gray-500 mt-1">View and manage employee information</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/employees/${employee.id}/edit`}>
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

      {/* Profile Card */}
      <Card className="print:shadow-none print:border-0">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <Avatar className="h-24 w-24">
              <AvatarImage src={employee.profile_image || undefined} />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold">
                  {employee.first_name} {employee.last_name}
                </h2>
                <Badge className={status.className}>{status.label}</Badge>
              </div>
              <p className="text-gray-600">{employee.job_title || 'N/A'}</p>
              <p className="text-sm text-gray-500">{employee.department || 'N/A'}</p>
              <div className="flex flex-wrap gap-4 mt-2 text-sm">
                <div className="flex items-center gap-1">
                  <Mail size={14} className="text-gray-400" />
                  <span>{employee.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone size={14} className="text-gray-400" />
                  <span>{employee.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Briefcase size={14} className="text-gray-400" />
                  <span>#{employee.employee_code || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 print:hidden">
              <EmployeeQR employeeId={employee.id} employeeName={`${employee.first_name} ${employee.last_name}`} />
              <p className="text-xs text-gray-500">Scan QR to view profile</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 print:grid-cols-2 print:gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <User size={16} /> Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem label="Nationality" value={employee.nationality || 'N/A'} />
            <InfoItem label="Date of Birth" value={employee.date_of_birth ? new Date(employee.date_of_birth).toLocaleDateString() : 'N/A'} />
            <InfoItem label="Gender" value={employee.gender || 'N/A'} />
            <InfoItem label="Marital Status" value={employee.marital_status || 'N/A'} />
            <InfoItem label="Blood Type" value={employee.blood_type || 'N/A'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Briefcase size={16} /> Employment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem label="Employee Code" value={employee.employee_code || 'N/A'} />
            <InfoItem label="Job Title" value={employee.job_title || 'N/A'} />
            <InfoItem label="Department" value={employee.department || 'N/A'} />
            <InfoItem label="Employment Type" value={employee.employment_type?.replace('_', ' ') || 'N/A'} />
            <InfoItem label="Join Date" value={employee.join_date ? new Date(employee.join_date).toLocaleDateString() : 'N/A'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <FileText size={16} /> Documents & IDs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem label="Emirates ID" value={employee.emirates_id || 'N/A'} />
            <InfoItem label="Emirates ID Expiry" value={employee.emirates_id_expiry ? new Date(employee.emirates_id_expiry).toLocaleDateString() : 'N/A'} />
            <InfoItem label="Passport" value={employee.passport_number || 'N/A'} />
            <InfoItem label="Passport Expiry" value={employee.passport_expiry ? new Date(employee.passport_expiry).toLocaleDateString() : 'N/A'} />
            <InfoItem label="Visa" value={employee.visa_number || 'N/A'} />
            <InfoItem label="Visa Expiry" value={employee.visa_expiry ? new Date(employee.visa_expiry).toLocaleDateString() : 'N/A'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Phone size={16} /> Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem label="Email" value={employee.email || 'N/A'} />
            <InfoItem label="Phone" value={employee.phone || 'N/A'} />
            <InfoItem label="Address" value={employee.address || 'N/A'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Home size={16} /> Emergency Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem label="Name" value={employee.emergency_contact_name || 'N/A'} />
            <InfoItem label="Phone" value={employee.emergency_contact_phone || 'N/A'} />
            <InfoItem label="Relationship" value={employee.emergency_contact_relationship || 'N/A'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <CreditCard size={16} /> Financial
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem label="Salary" value={employee.salary ? `${employee.salary} AED` : 'N/A'} />
            <InfoItem label="Bank" value={employee.bank_name || 'N/A'} />
            <InfoItem label="Account" value={employee.bank_account || 'N/A'} />
            <InfoItem label="IBAN" value={employee.iban || 'N/A'} />
          </CardContent>
        </Card>
      </div>

      {employee.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 whitespace-pre-wrap">{employee.notes}</p>
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