// src/app/api/projects/[id]/export-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id } = params

    // 1. جلب بيانات المشروع
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !project) {
      console.error('Project fetch error:', error)
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // 2. إنشاء مستند PDF جديد
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
    let y = height - margin

    // ============================================================
    // HEADER
    // ============================================================
    page.drawRectangle({
      x: 0,
      y: height - 70,
      width,
      height: 70,
      color: primaryColor,
    })

    page.drawText('YAMANOVA', {
      x: margin,
      y: height - 42,
      size: 20,
      font: fontBold,
      color: rgb(1, 1, 1),
    })
    page.drawText('Smart Safety Platform', {
      x: margin,
      y: height - 60,
      size: 10,
      font: font,
      color: rgb(1, 1, 1),
    })

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
    // معلومات المشروع الأساسية
    // ============================================================
    y = height - 100

    // اسم المشروع
    page.drawText(project.name, {
      x: margin,
      y: y,
      size: 22,
      font: fontBold,
      color: textColor,
    })
    y -= 28

    // الحالة (شارة)
    const statusColors: Record<string, any> = {
      planning: rgb(0.6, 0.6, 0.6),
      active: rgb(0.06, 0.69, 0.38),
      on_hold: rgb(0.96, 0.62, 0.04),
      completed: rgb(0.23, 0.49, 0.96),
      cancelled: rgb(0.94, 0.27, 0.27),
    }
    const statusColor = statusColors[project.status] || rgb(0.6, 0.6, 0.6)
    const statusLabel = project.status ? project.status.charAt(0).toUpperCase() + project.status.slice(1).replace('_', ' ') : 'N/A'
    const statusWidth = fontBold.widthOfTextAtSize(statusLabel, 10) + 16
    page.drawRectangle({
      x: margin,
      y: y - 12,
      width: statusWidth,
      height: 18,
      color: statusColor,
      borderRadius: 9,
    })
    page.drawText(statusLabel, {
      x: margin + 8,
      y: y - 8,
      size: 10,
      font: fontBold,
      color: rgb(1, 1, 1),
    })

    // الكود والعميل بجانب الحالة
    const infoText = `Code: ${project.code || 'N/A'}  •  Client: ${project.client_name || 'N/A'}`
    page.drawText(infoText, {
      x: margin + statusWidth + 15,
      y: y - 6,
      size: 11,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    })
    y -= 22

    // المعرف
    const idInfo = `ID: ${project.id.substring(0, 8)}`
    page.drawText(idInfo, {
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

    const formatDate = (date: string) => {
      if (!date) return 'N/A'
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    }

    const getDuration = (start: string, end: string) => {
      if (!start || !end) return 'N/A'
      const diff = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24))
      return `${diff} days`
    }

    const basicFields = [
      { label: 'Project Name', value: project.name },
      { label: 'Project Code', value: project.code },
      { label: 'Status', value: statusLabel },
      { label: 'Created', value: formatDate(project.created_at) },
    ]
    const timelineFields = [
      { label: 'Start Date', value: formatDate(project.start_date) },
      { label: 'End Date', value: formatDate(project.end_date) },
      { label: 'Duration', value: getDuration(project.start_date, project.end_date) },
    ]
    const clientFields = [
      { label: 'Client Name', value: project.client_name },
      { label: 'Location', value: project.location },
    ]

    let leftY = y
    let rightY = y

    leftY = addSection('Basic Information', basicFields, leftX, leftY)
    leftY -= 10
    leftY = addSection('Timeline', timelineFields, leftX, leftY)

    rightY = addSection('Client & Location', clientFields, rightX, rightY)

    // وصف المشروع (في الأسفل)
    if (project.description) {
      const descY = Math.min(leftY, rightY) - 20
      const descHeight = 60
      page.drawRectangle({
        x: margin,
        y: descY - descHeight,
        width: width - margin * 2,
        height: descHeight,
        color: lightGray,
        borderColor: borderColor,
        borderWidth: 1,
        borderRadius: 4,
      })
      page.drawText('Description', {
        x: margin + 10,
        y: descY - 10,
        size: 10,
        font: fontBold,
        color: primaryColor,
      })
      page.drawText(project.description, {
        x: margin + 10,
        y: descY - 28,
        size: 9,
        font: font,
        color: textColor,
        maxWidth: width - margin * 2 - 20,
        lineHeight: 14,
      })
    }

    // ============================================================
    // تذييل الصفحة
    // ============================================================
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

    // حفظ PDF
    const pdfBytes = await pdfDoc.save()

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=project_${project.code || project.id}.pdf`,
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