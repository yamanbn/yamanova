// src/app/api/visitors/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// ============================================================
// GET: جلب قائمة الزوار (مع إمكانية البحث والفلترة)
// ============================================================
export async function GET(request: NextRequest) {
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

    // قراءة معاملات البحث من URL
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all' // all, active, completed

    // بناء الاستعلام
    let query = supabase
      .from('visitors')
      .select(`
        *,
        visitor_visits (
          id,
          check_in_time,
          check_out_time,
          status,
          project_id,
          host_employee_id,
          employees (
            first_name,
            last_name
          )
        )
      `)
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })

    // فلترة حسب البحث (الاسم، الشركة، رقم الهوية)
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,company_name.ilike.%${search}%,id_number.ilike.%${search}%`)
    }

    // فلترة حسب الحالة (نأخذ آخر زيارة لكل زائر)
    // سنقوم بمعالجة الفلترة في الكود بعد الجلب

    const { data, error } = await query

    if (error) throw error

    // معالجة البيانات: نضيف حقل `last_visit_status` لكل زائر
    const visitorsWithStatus = (data || []).map((visitor: any) => {
      const visits = visitor.visitor_visits || []
      const lastVisit = visits.length > 0 ? visits[0] : null // مفترض أن الترتيب تنازلي حسب created_at
      return {
        ...visitor,
        last_visit_status: lastVisit?.status || 'no_visits',
        last_visit_time: lastVisit?.check_in_time || null,
        host_name: lastVisit?.employees ? `${lastVisit.employees.first_name} ${lastVisit.employees.last_name}` : null,
      }
    })

    // فلترة حسب الحالة (إذا كانت القيمة غير 'all')
    let filteredVisitors = visitorsWithStatus
    if (status !== 'all') {
      filteredVisitors = visitorsWithStatus.filter(v => v.last_visit_status === status)
    }

    return NextResponse.json(filteredVisitors)
  } catch (error: any) {
    console.error('❌ GET /api/visitors error:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}

// ============================================================
// POST: إضافة زائر جديد
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
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'لم يتم العثور على المنظمة' }, { status: 404 })
    }

    // قراءة البيانات من الطلب
    const body = await request.json()
    const { 
      full_name, 
      phone, 
      email, 
      id_type, 
      id_number, 
      company_name, 
      notes,
      // بيانات الزيارة (اختيارية)
      project_id,
      host_employee_id,
      purpose,
      expected_check_out
    } = body

    // التحقق من البيانات المطلوبة
    if (!full_name) {
      return NextResponse.json(
        { error: 'الاسم الكامل مطلوب' },
        { status: 400 }
      )
    }

    // 1. إدراج الزائر
    const { data: visitor, error: visitorError } = await supabase
      .from('visitors')
      .insert({
        organization_id: profile.organization_id,
        full_name,
        phone: phone || null,
        email: email || null,
        id_type: id_type || null,
        id_number: id_number || null,
        company_name: company_name || null,
        notes: notes || null,
      })
      .select()
      .single()

    if (visitorError) throw visitorError

    // 2. إذا تم توفير بيانات الزيارة، نقوم بإنشاء زيارة جديدة
    let visit = null
    if (project_id && host_employee_id && purpose) {
      // إنشاء رمز QR فريد
      const qrHash = `VIS-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`

      const { data: newVisit, error: visitError } = await supabase
        .from('visitor_visits')
        .insert({
          organization_id: profile.organization_id,
          visitor_id: visitor.id,
          project_id: project_id,
          host_employee_id: host_employee_id,
          purpose: purpose,
          expected_check_out: expected_check_out || null,
          qr_code_hash: qrHash,
          status: 'active',
          check_in_time: new Date().toISOString(),
          check_in_by: user.id,
        })
        .select(`
          *,
          projects (name),
          employees (first_name, last_name)
        `)
        .single()

      if (visitError) throw visitError
      visit = newVisit

      // 🔔 إرسال إشعار للموظف المزور (إذا كان موجوداً)
      if (host_employee_id) {
        await supabase
          .from('notifications')
          .insert({
            organization_id: profile.organization_id,
            user_id: user.id, // يمكن تغييره إلى المستخدم المزور إذا كان لدينا user_id
            title: '👤 زائر جديد',
            message: `${full_name} من ${company_name || 'شركة غير محددة'} في طريقه لزيارتك`,
            type: 'info',
            link: `/dashboard/visitors/${visitor.id}`,
            sent_at: new Date().toISOString(),
          })
      }
    }

    return NextResponse.json({
      success: true,
      visitor,
      visit,
    }, { status: 201 })

  } catch (error: any) {
    console.error('❌ POST /api/visitors error:', error)
    return NextResponse.json(
      { error: error.message || 'فشل إضافة الزائر' },
      { status: 500 }
    )
  }
}