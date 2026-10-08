// src/app/api/ppe/[id]/export-pdf/route.ts
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

    const { data: item, error } = await supabase
      .from('ppe_items')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !item) {
      return NextResponse.json({ error: 'PPE item not found' }, { status: 404 })
    }

    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842])
    const { width, height } = page.getSize()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const primaryColor = rgb(0.12, 0.23, 0.54)
    const blueColor = rgb(0.23, 0.49, 0.96)
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
    page.drawText(`PPE Item: ${item.name}`, {
      x: margin,
      y: y,
      size: 18,
      font: fontBold,
      color: blueColor,
    })
    y -= 25

    const categoryLabels: Record<string, string> = {
      head_protection: 'Head Protection',
      eye_protection: 'Eye Protection',
      face_protection: 'Face Protection',
      hearing_protection: 'Hearing Protection',
      respiratory_protection: 'Respiratory',
      hand_protection: 'Hand Protection',
      foot_protection: 'Foot Protection',
      body_protection: 'Body Protection',
      fall_protection: 'Fall Protection',
      other: 'Other',
    }
    const info = `Category: ${categoryLabels[item.category] || item.category}  •  Status: ${item.status}  •  Condition: ${item.condition}`
    page.drawText(info, { x: margin, y: y, size: 11, font: font, color: textColor })
    y -= 20

    const idInfo = `ID: ${item.id.substring(0, 8)}  •  SN: ${item.serial_number || 'N/A'}  •  Qty: ${item.quantity}`
    page.drawText(idInfo, { x: margin, y: y, size: 9, font: font, color: labelColor })
    y -= 25

    // Fields
    const fields = [
      { label: 'Model', value: item.model },
      { label: 'Manufacturer', value: item.manufacturer },
      { label: 'Size', value: item.size },
      { label: 'Color', value: item.color },
      { label: 'Location', value: item.location },
      { label: 'Storage Area', value: item.storage_area },
      { label: 'Minimum Quantity', value: item.min_quantity ? String(item.min_quantity) : 'N/A' },
      { label: 'Purchase Date', value: item.purchase_date ? new Date(item.purchase_date).toLocaleDateString() : 'N/A' },
      { label: 'Purchase Cost', value: item.purchase_cost ? `${item.purchase_cost} AED` : 'N/A' },
      { label: 'Expiry Date', value: item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : 'N/A' },
      { label: 'Inspection Frequency', value: item.inspection_frequency ? `${item.inspection_frequency} days` : 'N/A' },
      { label: 'Next Inspection', value: item.next_inspection_date ? new Date(item.next_inspection_date).toLocaleDateString() : 'N/A' },
      { label: 'Notes', value: item.notes },
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
        'Content-Disposition': `attachment; filename=ppe_${item.id}.pdf`,
        'Content-Length': pdfBytes.length.toString(),
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to generate PDF', details: error.message }, { status: 500 })
  }
}