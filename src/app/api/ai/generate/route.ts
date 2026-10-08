import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { prompt, type } = await req.json()

    let systemPrompt = `You are YAMANOVA, an expert HSE (Health, Safety, Environment) AI assistant for the UAE construction and industrial sector. 
Generate professional safety documents in JSON format.`

    let userPrompt = `Generate a ${type} based on this input: ${prompt}. 
Return valid JSON only with fields appropriate for a safety document.`

    if (type === 'risk_assessment') {
      userPrompt = `Generate a risk assessment for: ${prompt}. 
Return JSON with: { title, hazards: [{description, likelihood(1-5), severity(1-5), control_measures}], residual_risk }`
    }

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
    return NextResponse.json(JSON.parse(content || '{}'))
  } catch (error) {
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
  }
}