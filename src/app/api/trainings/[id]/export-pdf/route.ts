// src/app/api/trainings/[id]/export-pdf/route.ts
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

    const { data: training, error } = await supabase
      .from('trainings')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !training) {
      return NextResponse.json({ error: 'Training not found' }, { status: 404 })
    }

    // جلب عدد الحضور
    const { count: attendanceCount } = await supabase
      .from('training_attendance')
      .select('*', { count: 'exact', head: true })
      .eq('training_id', id)

    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842])
    const { width, height } = page.getSize()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const primaryColor = rgb(0.12, 0.23, 0.54)
    const purpleColor = rgb(0.55, 0.16, 0.79)
    const labelColor = rgb(0.42, 0.42, 0.42)
    const textColor = rgb(0.07, 0.07, 0.07)
    const margin = 50
    let y = height - margin

    // Header
    page.drawRectangle({ x: 0, y: height - 70, width, height: 70, color: primaryColor })
    page.drawText('YAMANOVA', { x: margin, y: height - 42, size: 20, font: fontBold, color: rgb(1, 1, 1) })
    page.drawText('Smart Safety Platform', { x: margin, y: height - 60, size: 10, font: font, color: rgb(1, 1, 1) })

    const dateStr = new Date().toLocaleString()
    page.drawText(`Generated: ${dateStr}`, {
      x: width - margin - font.widthOfTextAtSize(`Generated: ${dateStr}`, 9),
      y: height - 42,
      size: 9,
      font: font,
      color: rgb(1, 1, 1),
    })

    y = height - 100
    page.drawText(`Training Program: ${training.title}`, {
      x: margin,
      y: y,
      size: 18,
      font: fontBold,
      color: purpleColor,
    })
    y -= 25

    const typeLabels: Record<string, string> = {
      safety: 'Safety',
      technical: 'Technical',
      leadership: 'Leadership',
      compliance: 'Compliance',
      soft_skills: 'Soft Skills',
      certification: 'Certification',
      other: 'Other',
    }
    const info = `Type: ${typeLabels[training.training_type] || training.training_type}  •  Status: ${training.status}  •  Attendees: ${attendanceCount || 0} / ${training.max_attendees}`
    page.drawText(info, { x: margin, y: y, size: 11, font: font, color: textColor })
    y -= 20

    const idInfo = `ID: ${training.id.substring(0, 8)}  •  Trainer: ${training.trainer_name || 'N/A'}  •  Mandatory: ${training.is_mandatory ? 'Yes' : 'No'}`
    page.drawText(idInfo, { x: margin, y: y, size: 9, font: font, color: labelColor })
    y -= 25

    // Fields
    const fields = [
      { label: 'Trainer Company', value: training.trainer_company },
      { label: 'Location', value: training.location },
      { label: 'Start Date', value: training.start_date ? new Date(training.start_date).toLocaleString() : 'N/A' },
      { label: 'End Date', value: training.end_date ? new Date(training.end_date).toLocaleString() : 'N/A' },
      { label: 'Duration', value: training.duration_hours ? `${training.duration_hours} hours` : 'N/A' },
      { label: 'Cost', value: training.cost ? `${training.cost} AED` : 'Free' },
      { label: 'Description', value: training.description },
      { label: 'Notes', value: training.notes },
    ]

    fields.forEach((field) => {
      if (field.value) {
        page.drawText(`${field.label}:`, {
          x: margin,
          y: y,
          size: 10,
          font: fontBold,
          color: primaryColor,
        })
        y -= 16
        const lines = field.value.split('\n')
        lines.forEach((line) => {
          page.drawText(line, {
            x: margin + 10,
            y: y,
            size: 9,
            font: font,
            color: textColor,
          })
          y -= 14
        })
        y -= 6
      }
    })

    // Footer
    const footerY = 40
    page.drawLine({ start: { x: margin, y: footerY + 15 }, end: { x: width - margin, y: footerY + 15 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) })
    page.drawText('YAMANOVA - Smart Safety Platform', { x: margin, y: footerY, size: 8, font: font, color: labelColor })
    page.drawText('Page 1', { x: width - margin - font.widthOfTextAtSize('Page 1', 8), y: footerY, size: 8, font: font, color: labelColor })

    const pdfBytes = await pdfDoc.save()
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=training_${training.id}.pdf`,
        'Content-Length': pdfBytes.length.toString(),
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to generate PDF', details: error.message }, { status: 500 })
  }
}