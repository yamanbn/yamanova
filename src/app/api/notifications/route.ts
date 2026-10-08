// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// ============================================================
// GET: جلب الإشعارات
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 })
    }

    // جلب المنظمة الخاصة بالمستخدم
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.organization_id) {
      console.error('Profile error:', profileError)
      return NextResponse.json({ error: 'لم يتم العثور على المنظمة' }, { status: 404 })
    }

    // جلب الإشعارات (خاصة بالمستخدم + العامة)
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order('sent_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Supabase Select Error:', error)
      throw error
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('GET /api/notifications error:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}

// ============================================================
// POST: إضافة إشعار جديد (للاستخدام الداخلي أو للاختبار)
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 })
    }

    // جلب المنظمة
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.organization_id) {
      return NextResponse.json({ error: 'لم يتم العثور على المنظمة' }, { status: 404 })
    }

    // قراءة البيانات
    const body = await request.json()
    const { title, message, type, link, scheduled_for, is_public = false } = body

    if (!title || !message) {
      return NextResponse.json(
        { error: 'العنوان والرسالة مطلوبان' },
        { status: 400 }
      )
    }

    // تحضير البيانات للإدراج (نزيل أي أعمدة غير موجودة)
    const insertData: any = {
      organization_id: profile.organization_id,
      title,
      message,
      type: type || 'info',
      link: link || null,
      sent_at: new Date().toISOString(),
      // ملاحظة: إذا كان عمود scheduled_for غير موجود في الجدول، قم بإزالته
      // scheduled_for: scheduled_for || null,
      read_at: null, // استخدام read_at بدلاً من is_read (كما هو موجود في الجدول)
    }

    // إذا كان الإشعار عاماً (لجميع المستخدمين)، نترك user_id = null
    if (!is_public) {
      insertData.user_id = user.id
    }

    console.log('📝 إدراج إشعار:', insertData)

    const { data, error } = await supabase
      .from('notifications')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('❌ Supabase Insert Error:', error)
      throw error
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    console.error('❌ POST /api/notifications error:', error)
    return NextResponse.json(
      { error: error.message || 'فشل إرسال الإشعار' },
      { status: 500 }
    )
  }
}