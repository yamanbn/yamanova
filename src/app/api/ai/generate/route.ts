// src/app/api/ai/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// ============================================================
// POST: توليد مستندات السلامة بالذكاء الاصطناعي
// ============================================================
export async function POST(req: NextRequest) {
  try {
    // ✅ تهيئة OpenAI داخل الدالة (Lazy Initialization)
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY غير مُهيأ في متغيرات البيئة' },
        { status: 500 }
      )
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const { prompt, type } = await req.json()

    // التحقق من المدخلات
    if (!prompt || !type) {
      return NextResponse.json(
        { error: 'prompt و type مطلوبان' },
        { status: 400 }
      )
    }

    // ============================================================
    // إعداد الـ Prompts
    // ============================================================
    let systemPrompt = `You are YAMANOVA, an expert HSE (Health, Safety, Environment) AI assistant for the UAE construction and industrial sector. 
Generate professional safety documents in JSON format.`

    let userPrompt = `Generate a ${type} based on this input: ${prompt}. 
Return valid JSON only with fields appropriate for a safety document.`

    if (type === 'risk_assessment') {
      userPrompt = `Generate a risk assessment for: ${prompt}. 
Return JSON with: { title, hazards: [{description, likelihood(1-5), severity(1-5), control_measures}], residual_risk }`
    }

    // ============================================================
    // استدعاء OpenAI
    // ============================================================
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    const content = response.choices[0].message.content

    // محاولة تحليل JSON مع معالجة الأخطاء
    let parsedContent
    try {
      parsedContent = JSON.parse(content || '{}')
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError)
      return NextResponse.json(
        {
          error: 'فشل في تحليل استجابة الذكاء الاصطناعي',
          raw: content
        },
        { status: 500 }
      )
    }

    return NextResponse.json(parsedContent)

  } catch (error: any) {
    console.error('❌ AI Generation Error:', error)
    return NextResponse.json(
      {
        error: 'AI generation failed',
        details: error.message
      },
      { status: 500 }
    )
  }
}