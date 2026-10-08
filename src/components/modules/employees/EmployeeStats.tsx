// src/components/modules/employees/EmployeeStats.tsx
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Users, UserCheck, UserX, UserMinus, Briefcase } from 'lucide-react'

interface EmployeeStatsProps {
  employees: any[]
  totalCount: number
}

export function EmployeeStats({ employees, totalCount }: EmployeeStatsProps) {
  const activeCount = employees.filter(e => e.status === 'active').length
  const onLeaveCount = employees.filter(e => e.status === 'on_leave').length
  const terminatedCount = employees.filter(e => e.status === 'terminated').length
  const inactiveCount = employees.filter(e => e.status === 'inactive').length

  const stats = [
    {
      title: 'Total Employees',
      value: totalCount,
      icon: Users,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
    },
    {
      title: 'Active',
      value: activeCount,
      icon: UserCheck,
      color: 'bg-green-500',
      textColor: 'text-green-600',
    },
    {
      title: 'On Leave',
      value: onLeaveCount,
      icon: UserMinus,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
    },
    {
      title: 'Terminated',
      value: terminatedCount,
      icon: UserX,
      color: 'bg-red-500',
      textColor: 'text-red-600',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.color} bg-opacity-10`}>
                <stat.icon className={`h-5 w-5 ${stat.textColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}