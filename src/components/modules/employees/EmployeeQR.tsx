// src/components/modules/employees/EmployeeQR.tsx
'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Card, CardContent } from '@/components/ui/card'

interface EmployeeQRProps {
  employeeId: string
  employeeName: string
}

export function EmployeeQR({ employeeId, employeeName }: EmployeeQRProps) {
  const [qrCode, setQrCode] = useState<string>('')

  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = `${window.location.origin}/employees/${employeeId}`
        const qr = await QRCode.toDataURL(url, {
          width: 200,
          margin: 2,
          color: {
            dark: '#1E3A8A',
            light: '#FFFFFF',
          },
        })
        setQrCode(qr)
      } catch (err) {
        console.error('Failed to generate QR code:', err)
      }
    }

    if (employeeId) {
      generateQR()
    }
  }, [employeeId])

  if (!qrCode) {
    return <div className="text-center py-4">Loading QR code...</div>
  }

  return (
    <Card className="max-w-sm mx-auto">
      <CardContent className="p-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrCode} alt={`QR Code for ${employeeName}`} className="mx-auto" />
        <p className="mt-4 font-medium">{employeeName}</p>
        <p className="text-sm text-gray-500">Employee ID: {employeeId.substring(0, 8)}</p>
      </CardContent>
    </Card>
  )
}