// src/app/api/fire-safety/[id]/export-pdf/route.ts
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

    const { data: equipment, error } = await supabase
      .from('fire_equipment')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !equipment) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 })
    }

    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842])
    const { width, height } = page.getSize()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const primaryColor = rgb(0.12, 0.23, 0.54)
    const redColor = rgb(0.94, 0.27, 0.27)
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
    page.drawText(`Fire Safety Equipment: ${equipment.name}`, {
      x: margin,
      y: y,
      size: 18,
      font: fontBold,
      color: redColor,
    })
    y -= 25

    const typeLabels: Record<string, string> = {
      extinguisher: 'Extinguisher',
      alarm: 'Alarm',
      hydrant: 'Hydrant',
      pump: 'Pump',
      emergency_light: 'Emergency Light',
      sprinkler: 'Sprinkler',
      hose: 'Hose',
      other: 'Other',
    }
    const info = `Type: ${typeLabels[equipment.equipment_type] || equipment.equipment_type}  •  Status: ${equipment.status}  •  Condition: ${equipment.condition}`
    page.drawText(info, { x: margin, y: y, size: 11, font: font, color: textColor })
    y -= 20

    const idInfo = `ID: ${equipment.id.substring(0, 8)}  •  SN: ${equipment.serial_number || 'N/A'}`
    page.drawText(idInfo, { x: margin, y: y, size: 9, font: font, color: labelColor })
    y -= 25

    // Fields
    const fields = [
      { label: 'Location', value: equipment.location },
      { label: 'Building', value: equipment.building },
      { label: 'Floor', value: equipment.floor },
      { label: 'Room', value: equipment.room },
      { label: 'Model', value: equipment.model },
      { label: 'Manufacturer', value: equipment.manufacturer },
      { label: 'Capacity', value: equipment.capacity },
      { label: 'Pressure (bar)', value: equipment.pressure_level ? String(equipment.pressure_level) : 'N/A' },
      { label: 'Installation Date', value: equipment.installation_date ? new Date(equipment.installation_date).toLocaleDateString() : 'N/A' },
      { label: 'Expiry Date', value: equipment.expiry_date ? new Date(equipment.expiry_date).toLocaleDateString() : 'N/A' },
      { label: 'Last Inspection', value: equipment.last_inspection_date ? new Date(equipment.last_inspection_date).toLocaleDateString() : 'N/A' },
      { label: 'Next Inspection', value: equipment.next_inspection_date ? new Date(equipment.next_inspection_date).toLocaleDateString() : 'N/A' },
      { label: 'Inspection Frequency', value: equipment.inspection_frequency ? `${equipment.inspection_frequency} days` : 'N/A' },
      { label: 'Notes', value: equipment.notes },
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
        'Content-Disposition': `attachment; filename=fire_equipment_${equipment.id}.pdf`,
        'Content-Length': pdfBytes.length.toString(),
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to generate PDF', details: error.message }, { status: 500 })
  }
}