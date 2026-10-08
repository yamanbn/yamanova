// src/app/api/visitors/qr/[hash]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: { hash: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { hash } = params

    // جلب الزيارة عبر رمز QR
    const { data: visit, error } = await supabase
      .from('visitor_visits')
      .select(`
        id,
        visitor_id,
        visitors!inner(full_name, company_name, phone, email),
        project_id,
        projects(name),
        host_employee_id,
        employees!host_employee_id(first_name, last_name, job_title),
        purpose,
        status,
        check_in_time,
        check_out_time
      `)
      .eq('qr_code_hash', hash)
      .maybeSingle()

    if (error) throw error

    if (!visit) {
      return NextResponse.json({ error: 'رمز QR غير صالح' }, { status: 404 })
    }

    return NextResponse.json(visit)
  } catch (error: any) {
    console.error('GET /api/visitors/qr/[hash] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: تسجيل الدخول عبر QR (إذا كان الزائر خارج الموقع)
export async function POST(
  request: NextRequest,
  { params }: { params: { hash: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'لم يتم العثور على المنظمة' }, { status: 404 })
    }

    const { hash } = params
    const body = await request.json()
    const { location } = body

    // جلب الزيارة
    const { data: visit, error: visitError } = await supabase
      .from('visitor_visits')
      .select('id, status, visitor_id')
      .eq('qr_code_hash', hash)
      .maybeSingle()

    if (visitError) throw visitError

    if (!visit) {
      return NextResponse.json({ error: 'رمز QR غير صالح' }, { status: 404 })
    }

    if (visit.status !== 'active') {
      return NextResponse.json({ error: 'هذه الزيارة غير نشطة' }, { status: 400 })
    }

    // تحديث وقت الدخول (إذا لم يكن مسجلاً)
    const { data: updated, error: updateError } = await supabase
      .from('visitor_visits')
      .update({
        check_in_time: new Date().toISOString(),
        check_in_location: location || null,
        check_in_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', visit.id)
      .select()
      .single()

    if (updateError) throw updateError

    // تسجيل في السجل
    await supabase
      .from('visitor_logs')
      .insert({
        organization_id: profile.organization_id,
        visitor_id: visit.visitor_id,
        visit_id: visit.id,
        action: 'check_in',
        location: location || null,
        performed_by: user.id,
      })

    return NextResponse.json({
      success: true,
      visit: updated,
    })
  } catch (error: any) {
    console.error('POST /api/visitors/qr/[hash] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}