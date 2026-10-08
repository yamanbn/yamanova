// src/components/modules/employees/EmployeeActions.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Download, Edit2 } from 'lucide-react'
import Link from 'next/link'

export function EmployeeActions({ employeeId }: { employeeId: string }) {
  const handleExportPDF = () => {
    window.open(`/api/employees/${employeeId}/export-pdf`, '_blank')
  }

  return (
    <div className="flex items-center gap-3">
      <Link href={`/employees/${employeeId}/edit`}>
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
  )
}