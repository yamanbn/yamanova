// src/app/api/visitors/[id]/visits/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// POST: تسجيل خروج زائر (إنهاء الزيارة)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const visitorId = params.id
    const body = await request.json()
    const { location, notes } = body

    // العثور على الزيارة النشطة لهذا الزائر
    const { data: activeVisit, error: visitError } = await supabase
      .from('visitor_visits')
      .select('id')
      .eq('visitor_id', visitorId)
      .eq('status', 'active')
      .maybeSingle()

    if (visitError) throw visitError

    if (!activeVisit) {
      return NextResponse.json({ error: 'لا توجد زيارة نشطة لهذا الزائر' }, { status: 404 })
    }

    // تحديث الزيارة (تسجيل الخروج)
    const { data: updatedVisit, error: updateError } = await supabase
      .from('visitor_visits')
      .update({
        status: 'completed',
        check_out_time: new Date().toISOString(),
        check_out_location: location || null,
        check_out_by: user.id,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', activeVisit.id)
      .select()
      .single()

    if (updateError) throw updateError

    // تسجيل في سجل الزوار
    await supabase
      .from('visitor_logs')
      .insert({
        organization_id: profile.organization_id,
        visitor_id: visitorId,
        visit_id: activeVisit.id,
        action: 'check_out',
        location: location || null,
        performed_by: user.id,
      })

    return NextResponse.json({
      success: true,
      visit: updatedVisit,
    })
  } catch (error: any) {
    console.error('POST /api/visitors/[id]/visits error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}