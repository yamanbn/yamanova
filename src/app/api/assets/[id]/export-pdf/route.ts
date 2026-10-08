// src/app/api/assets/[id]/export-pdf/route.ts
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

    const { data: asset, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
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
    page.drawText(`Asset: ${asset.name}`, {
      x: margin,
      y: y,
      size: 18,
      font: fontBold,
      color: blueColor,
    })
    y -= 25

    const typeLabels: Record<string, string> = {
      vehicle: 'Vehicle',
      machinery: 'Machinery',
      equipment: 'Equipment',
      tool: 'Tool',
      facility: 'Facility',
      furniture: 'Furniture',
      it_equipment: 'IT Equipment',
      other: 'Other',
    }
    const info = `Type: ${typeLabels[asset.asset_type] || asset.asset_type}  •  Status: ${asset.status}  •  Condition: ${asset.condition}`
    page.drawText(info, { x: margin, y: y, size: 11, font: font, color: textColor })
    y -= 20

    const idInfo = `ID: ${asset.id.substring(0, 8)}  •  Tag: ${asset.asset_tag || 'N/A'}  •  SN: ${asset.serial_number || 'N/A'}`
    page.drawText(idInfo, { x: margin, y: y, size: 9, font: font, color: labelColor })
    y -= 25

    // Fields
    const fields = [
      { label: 'Model', value: asset.model },
      { label: 'Manufacturer', value: asset.manufacturer },
      { label: 'Location', value: asset.location },
      { label: 'Building', value: asset.building },
      { label: 'Floor', value: asset.floor },
      { label: 'Room', value: asset.room },
      { label: 'Purchase Date', value: asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : 'N/A' },
      { label: 'Purchase Cost', value: asset.purchase_cost ? `${asset.purchase_cost} AED` : 'N/A' },
      { label: 'Warranty Expiry', value: asset.warranty_expiry ? new Date(asset.warranty_expiry).toLocaleDateString() : 'N/A' },
      { label: 'Lifespan', value: asset.lifespan_years ? `${asset.lifespan_years} years` : 'N/A' },
      { label: 'Maintenance Frequency', value: asset.maintenance_frequency ? `${asset.maintenance_frequency} days` : 'N/A' },
      { label: 'Next Maintenance', value: asset.next_maintenance_date ? new Date(asset.next_maintenance_date).toLocaleDateString() : 'N/A' },
      { label: 'Notes', value: asset.notes },
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
        'Content-Disposition': `attachment; filename=asset_${asset.id}.pdf`,
        'Content-Length': pdfBytes.length.toString(),
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to generate PDF', details: error.message }, { status: 500 })
  }
}