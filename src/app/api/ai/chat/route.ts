// src/app/api/ai/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import OpenAI from 'openai'

// تهيئة OpenAI باستخدام المفتاح من .env
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// ============================================================
// POST: إرسال رسالة إلى المساعد
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // التحقق من المصادقة
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

    // قراءة الرسائل من الطلب
    const body = await request.json()
    const { messages, conversation_id, type = 'general' } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'الرسائل مطلوبة' }, { status: 400 })
    }

    // ============================================================
    // 1. إرسال الطلب إلى OpenAI
    // ============================================================
    const systemPrompt = `
أنت مساعد ذكي متخصص في السلامة والعمليات (HSE) في منصة YAMANOVA.
تخصصك: تحليل الحوادث، تقييم المخاطر، إجراءات السلامة، خطط التدريب، الامتثال.
أجب باللغة العربية الفصحى (أو باللغة التي يسأل بها المستخدم).
كن دقيقاً ومختصراً، وقدم نصائح عملية.
إذا سُئلت عن بيانات محددة (مثل تقارير المشاريع)، قل أنك لا تملك الوصول المباشر للبيانات ولكن يمكنك تقديم تحليل عام بناءً على الخبرة.
استخدم نبرة رسمية ولكن ودودة.
`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // يمكنك تغيير إلى 'gpt-4' إذا كان لديك حق الوصول
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const reply = completion.choices[0]?.message?.content || 'عذراً، لم أستطع توليد رد.'

    // ============================================================
    // 2. حفظ المحادثة في قاعدة البيانات (اختياري)
    // ============================================================
    let conversationId = conversation_id

    if (!conversationId) {
      // إنشاء محادثة جديدة
      const { data: newConv, error: convError } = await supabase
        .from('ai_conversations')
        .insert({
          organization_id: profile.organization_id,
          user_id: user.id,
          title: messages[0]?.content?.slice(0, 50) || 'محادثة جديدة',
          messages: messages,
        })
        .select('id')
        .single()

      if (!convError && newConv) {
        conversationId = newConv.id
      }
    } else {
      // تحديث المحادثة الموجودة (إضافة الرسائل الجديدة)
      const { data: existing } = await supabase
        .from('ai_conversations')
        .select('messages')
        .eq('id', conversationId)
        .single()

      if (existing) {
        const updatedMessages = [...existing.messages, ...messages, { role: 'assistant', content: reply }]
        await supabase
          .from('ai_conversations')
          .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
          .eq('id', conversationId)
      }
    }

    // ============================================================
    // 3. إرجاع الرد للمستخدم
    // ============================================================
    return NextResponse.json({
      reply,
      conversation_id: conversationId,
    })

  } catch (error: any) {
    console.error('❌ AI Chat Error:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في المساعد' },
      { status: 500 }
    )
  }
}