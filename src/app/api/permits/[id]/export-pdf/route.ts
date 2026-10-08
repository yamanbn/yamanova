// src/app/api/permits/[id]/export-pdf/route.ts
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

    const { data: permit, error } = await supabase
      .from('permits')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !permit) {
      return NextResponse.json({ error: 'Permit not found' }, { status: 404 })
    }

    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842])
    const { width, height } = page.getSize()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const primaryColor = rgb(0.12, 0.23, 0.54)
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
    page.drawText(`Permit to Work: ${permit.title}`, {
      x: margin,
      y: y,
      size: 18,
      font: fontBold,
      color: primaryColor,
    })
    y -= 25

    const typeLabels: Record<string, string> = {
      hot_work: 'Hot Work',
      cold_work: 'Cold Work',
      confined_space: 'Confined Space',
      working_at_height: 'Working at Height',
      electrical: 'Electrical Work',
      lifting: 'Lifting Operations',
      excavation: 'Excavation',
      chemical: 'Chemical Handling',
      other: 'Other',
    }
    const info = `Type: ${typeLabels[permit.permit_type] || permit.permit_type}  •  Status: ${permit.status}  •  Priority: ${permit.priority}`
    page.drawText(info, { x: margin, y: y, size: 11, font: font, color: textColor })
    y -= 20

    const idInfo = `ID: ${permit.id.substring(0, 8)}  •  Applicant: ${permit.applicant_name || 'N/A'}`
    page.drawText(idInfo, { x: margin, y: y, size: 9, font: font, color: labelColor })
    y -= 25

    // Fields
    const fields = [
      { label: 'Location', value: permit.location },
      { label: 'Start Time', value: permit.start_datetime ? new Date(permit.start_datetime).toLocaleString() : 'N/A' },
      { label: 'End Time', value: permit.end_datetime ? new Date(permit.end_datetime).toLocaleString() : 'N/A' },
      { label: 'Risk Level', value: permit.risk_level },
      { label: 'Description', value: permit.description },
      { label: 'Control Measures', value: permit.control_measures },
      { label: 'PPE Required', value: permit.ppe_required },
      { label: 'Emergency Procedures', value: permit.emergency_procedures },
      { label: 'Notes', value: permit.notes },
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
        'Content-Disposition': `attachment; filename=permit_${permit.id}.pdf`,
        'Content-Length': pdfBytes.length.toString(),
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to generate PDF', details: error.message }, { status: 500 })
  }
}