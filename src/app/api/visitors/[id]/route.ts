// src/app/api/visitors/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// ============================================================
// GET: جلب تفاصيل زائر محدد مع جميع زياراته
// ============================================================
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 })
    }

    // جلب المنظمة
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'لم يتم العثور على المنظمة' }, { status: 404 })
    }

    const { id } = params

    // جلب بيانات الزائر مع جميع زياراته
    const { data: visitor, error } = await supabase
      .from('visitors')
      .select(`
        *,
        visitor_visits (
          *,
          projects (id, name),
          employees (id, first_name, last_name, job_title),
          profiles!visitor_visits_check_in_by_fkey (id, full_name),
          profiles!visitor_visits_check_out_by_fkey (id, full_name)
        )
      `)
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .single()

    if (error) throw error
    if (!visitor) {
      return NextResponse.json({ error: 'الزائر غير موجود' }, { status: 404 })
    }

    return NextResponse.json(visitor)
  } catch (error: any) {
    console.error('❌ GET /api/visitors/[id] error:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}

// ============================================================
// PUT: تحديث بيانات الزائر
// ============================================================
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { 
      full_name, 
      phone, 
      email, 
      id_type, 
      id_number, 
      company_name, 
      notes,
      is_blacklisted
    } = body

    // تحديث الزائر
    const { data: visitor, error } = await supabase
      .from('visitors')
      .update({
        full_name,
        phone,
        email,
        id_type,
        id_number,
        company_name,
        notes,
        is_blacklisted,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, visitor })
  } catch (error: any) {
    console.error('❌ PUT /api/visitors/[id] error:', error)
    return NextResponse.json(
      { error: error.message || 'فشل تحديث الزائر' },
      { status: 500 }
    )
  }
}

// ============================================================
// DELETE: حذف زائر (مع حذف زياراته تلقائياً عبر CASCADE)
// ============================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 })
    }

    const { id } = params

    const { error } = await supabase
      .from('visitors')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('❌ DELETE /api/visitors/[id] error:', error)
    return NextResponse.json(
      { error: error.message || 'فشل حذف الزائر' },
      { status: 500 }
    )
  }
}