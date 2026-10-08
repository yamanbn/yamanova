// src/app/api/employees/[id]/export-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PDFDocument, StandardFonts, rgb, PDFImage } from 'pdf-lib'
import QRCode from 'qrcode'
import fs from 'fs/promises'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id } = params

    // 1. جلب بيانات الموظف
    const { data: employee, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // 2. إنشاء مستند PDF
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842]) // A4
    const { width, height } = page.getSize()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // ألوان
    const primaryColor = rgb(0.12, 0.23, 0.54)
    const lightGray = rgb(0.96, 0.97, 0.98)
    const borderColor = rgb(0.85, 0.87, 0.89)
    const textColor = rgb(0.07, 0.07, 0.07)
    const labelColor = rgb(0.42, 0.42, 0.42)

    const margin = 50
    const headerHeight = 70

    // 3. تحميل الشعار
    let logoImage: PDFImage | null = null
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo.png')
      const logoBuffer = await fs.readFile(logoPath)
      logoImage = await pdfDoc.embedPng(logoBuffer)
    } catch (e) { /* ignore */ }

    // 4. إنشاء QR Code
    let qrImage: PDFImage | null = null
    try {
      const qrDataURL = await QRCode.toDataURL(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/employees/${employee.id}`,
        { width: 150, margin: 2, color: { dark: '#1E3A8A', light: '#FFFFFF' } }
      )
      const qrBuffer = Buffer.from(qrDataURL.split(',')[1], 'base64')
      qrImage = await pdfDoc.embedPng(qrBuffer)
    } catch (e) { /* ignore */ }

    // ============================================================
    // HEADER (شريط علوي)
    // ============================================================
    page.drawRectangle({
      x: 0,
      y: height - headerHeight,
      width,
      height: headerHeight,
      color: primaryColor,
    })

    // الشعار (يسار)
    let logoWidth = 0
    if (logoImage) {
      const logoDims = logoImage.scale(0.3)
      logoWidth = logoDims.width + 15
      page.drawImage(logoImage, {
        x: margin,
        y: height - 58,
        width: logoDims.width,
        height: logoDims.height,
      })
    }

    // عنوان YAMANOVA
    const titleX = margin + logoWidth
    page.drawText('YAMANOVA', {
      x: titleX,
      y: height - 42,
      size: 20,
      font: fontBold,
      color: rgb(1, 1, 1),
    })
    page.drawText('Smart Safety Platform', {
      x: titleX,
      y: height - 60,
      size: 10,
      font: font,
      color: rgb(1, 1, 1),
    })

    // التاريخ (يمين)
    const dateStr = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    page.drawText(`Generated: ${dateStr}`, {
      x: width - margin - font.widthOfTextAtSize(`Generated: ${dateStr}`, 9),
      y: height - 42,
      size: 9,
      font: font,
      color: rgb(1, 1, 1),
    })

    // ============================================================
    // QR Code (موضع ثابت في الزاوية اليمنى العليا، فوق المحتوى)
    // ============================================================
    let qrX = 0,
      qrY = 0,
      qrSize = 0
    if (qrImage) {
      const qrTargetSize = 65 // حجم صغير
      const qrDims = qrImage.scale(qrTargetSize / 150)
      qrSize = qrDims.width
      qrX = width - margin - qrDims.width
      qrY = height - headerHeight - 20 - qrDims.height
      page.drawImage(qrImage, {
        x: qrX,
        y: qrY,
        width: qrDims.width,
        height: qrDims.height,
      })
      // نص تحت QR
      const qrLabel = 'Scan to view profile'
      page.drawText(qrLabel, {
        x: qrX + qrDims.width / 2 - font.widthOfTextAtSize(qrLabel, 7) / 2,
        y: qrY - 12,
        size: 7,
        font: font,
        color: labelColor,
      })
    }

    // ============================================================
    // منطقة المحتوى (تبدأ بعد الـ QR بمسافة كافية)
    // ============================================================
    // نحسب أعلى نقطة للمحتوى بحيث لا يتداخل مع QR
    let contentY = height - headerHeight - 30
    if (qrImage) {
      // إذا كان QR موجوداً، نضبط المسافة بحيث يكون المحتوى تحت QR
      const qrBottom = qrY - 12 // تحت النص
      contentY = Math.min(contentY, qrBottom - 20)
    }

    // ============================================================
    // معلومات الموظف الأساسية (تحت الهيدر)
    // ============================================================
    let y = contentY - 10

    // الاسم
    page.drawText(`${employee.first_name} ${employee.last_name}`, {
      x: margin,
      y: y,
      size: 22,
      font: fontBold,
      color: textColor,
    })
    y -= 28

    // الحالة (شارة)
    const statusColors: Record<string, any> = {
      active: rgb(0.06, 0.69, 0.38),
      inactive: rgb(0.6, 0.6, 0.6),
      on_leave: rgb(0.96, 0.62, 0.04),
      terminated: rgb(0.94, 0.27, 0.27),
    }
    const statusColor = statusColors[employee.status] || rgb(0.6, 0.6, 0.6)
    const statusText = (employee.status || 'N/A').toUpperCase()
    const statusWidth = fontBold.widthOfTextAtSize(statusText, 10) + 16
    page.drawRectangle({
      x: margin,
      y: y - 12,
      width: statusWidth,
      height: 18,
      color: statusColor,
      borderRadius: 9,
    })
    page.drawText(statusText, {
      x: margin + 8,
      y: y - 8,
      size: 10,
      font: fontBold,
      color: rgb(1, 1, 1),
    })

    // الوظيفة والقسم
    const jobInfo = `${employee.job_title || 'N/A'} • ${employee.department || 'N/A'}`
    page.drawText(jobInfo, {
      x: margin + statusWidth + 15,
      y: y - 6,
      size: 11,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    })
    y -= 22

    // الكود والمعرف
    const codeInfo = `Employee Code: ${employee.employee_code || 'N/A'}  |  ID: ${employee.id.substring(0, 8)}`
    page.drawText(codeInfo, {
      x: margin,
      y: y,
      size: 9,
      font: font,
      color: labelColor,
    })
    y -= 25

    // ============================================================
    // الأقسام (عمودين)
    // ============================================================
    const colWidth = (width - margin * 3) / 2
    let leftX = margin
    let rightX = margin + colWidth + margin / 2

    const addSection = (title: string, fields: { label: string; value: string }[], xPos: number, yPos: number) => {
      const sectionHeight = fields.length * 18 + 30
      // خلفية
      page.drawRectangle({
        x: xPos,
        y: yPos - sectionHeight,
        width: colWidth,
        height: sectionHeight,
        color: lightGray,
        borderColor: borderColor,
        borderWidth: 1,
        borderRadius: 4,
      })
      // عنوان
      page.drawText(title, {
        x: xPos + 10,
        y: yPos - 10,
        size: 10,
        font: fontBold,
        color: primaryColor,
      })
      let innerY = yPos - 25
      fields.forEach((field) => {
        const labelText = `${field.label}:`
        const labelWidth = fontBold.widthOfTextAtSize(labelText, 8)
        page.drawText(labelText, {
          x: xPos + 10,
          y: innerY,
          size: 8,
          font: fontBold,
          color: labelColor,
        })
        const val = field.value || 'N/A'
        page.drawText(val, {
          x: xPos + 10 + labelWidth + 5,
          y: innerY,
          size: 8,
          font: font,
          color: textColor,
        })
        innerY -= 16
      })
      return yPos - sectionHeight - 8
    }

    // الحقول
    const personalFields = [
      { label: 'Nationality', value: employee.nationality },
      { label: 'Date of Birth', value: employee.date_of_birth ? new Date(employee.date_of_birth).toLocaleDateString() : 'N/A' },
      { label: 'Gender', value: employee.gender },
      { label: 'Marital Status', value: employee.marital_status },
      { label: 'Blood Type', value: employee.blood_type },
    ]
    const employmentFields = [
      { label: 'Employee Code', value: employee.employee_code },
      { label: 'Job Title', value: employee.job_title },
      { label: 'Department', value: employee.department },
      { label: 'Employment Type', value: employee.employment_type?.replace('_', ' ') },
      { label: 'Join Date', value: employee.join_date ? new Date(employee.join_date).toLocaleDateString() : 'N/A' },
    ]
    const documentsFields = [
      { label: 'Emirates ID', value: employee.emirates_id },
      { label: 'Emirates ID Expiry', value: employee.emirates_id_expiry ? new Date(employee.emirates_id_expiry).toLocaleDateString() : 'N/A' },
      { label: 'Passport', value: employee.passport_number },
      { label: 'Passport Expiry', value: employee.passport_expiry ? new Date(employee.passport_expiry).toLocaleDateString() : 'N/A' },
      { label: 'Visa', value: employee.visa_number },
      { label: 'Visa Expiry', value: employee.visa_expiry ? new Date(employee.visa_expiry).toLocaleDateString() : 'N/A' },
    ]
    const contactFields = [
      { label: 'Email', value: employee.email },
      { label: 'Phone', value: employee.phone },
      { label: 'Address', value: employee.address },
    ]
    const emergencyFields = [
      { label: 'Name', value: employee.emergency_contact_name },
      { label: 'Phone', value: employee.emergency_contact_phone },
      { label: 'Relationship', value: employee.emergency_contact_relationship },
    ]
    const financialFields = [
      { label: 'Salary', value: employee.salary ? `${employee.salary} AED` : 'N/A' },
      { label: 'Bank', value: employee.bank_name },
      { label: 'Account', value: employee.bank_account },
      { label: 'IBAN', value: employee.iban },
    ]

    let leftY = y
    let rightY = y

    leftY = addSection('Personal Information', personalFields, leftX, leftY)
    leftY -= 10
    leftY = addSection('Employment Details', employmentFields, leftX, leftY)

    rightY = addSection('Documents & IDs', documentsFields, rightX, rightY)
    rightY -= 10
    rightY = addSection('Contact', contactFields, rightX, rightY)
    rightY -= 10
    rightY = addSection('Emergency Contact', emergencyFields, rightX, rightY)
    rightY -= 10
    rightY = addSection('Financial', financialFields, rightX, rightY)

    // ملاحظات
    if (employee.notes) {
      const notesY = Math.min(leftY, rightY) - 20
      page.drawRectangle({
        x: margin,
        y: notesY - 35,
        width: width - margin * 2,
        height: 35,
        color: lightGray,
        borderColor: borderColor,
        borderWidth: 1,
        borderRadius: 4,
      })
      page.drawText('Notes', {
        x: margin + 10,
        y: notesY - 10,
        size: 10,
        font: fontBold,
        color: primaryColor,
      })
      page.drawText(employee.notes, {
        x: margin + 10,
        y: notesY - 26,
        size: 8,
        font: font,
        color: textColor,
      })
    }

    // تذييل
    const footerY = 40
    page.drawLine({
      start: { x: margin, y: footerY + 15 },
      end: { x: width - margin, y: footerY + 15 },
      thickness: 1,
      color: borderColor,
    })
    page.drawText('YAMANOVA - Smart Safety Platform', {
      x: margin,
      y: footerY,
      size: 8,
      font: font,
      color: labelColor,
    })
    page.drawText('Page 1', {
      x: width - margin - font.widthOfTextAtSize('Page 1', 8),
      y: footerY,
      size: 8,
      font: font,
      color: labelColor,
    })

    const pdfBytes = await pdfDoc.save()
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=employee_${employee.employee_code || employee.id}.pdf`,
        'Content-Length': pdfBytes.length.toString(),
      },
    })
  } catch (error: any) {
    console.error('PDF Generation Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error.message },
      { status: 500 }
    )
  }
}