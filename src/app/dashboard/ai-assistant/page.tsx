// src/app/dashboard/ai-assistant/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Loader2,
  FileText,
  AlertTriangle,
  Shield,
  BookOpen
} from 'lucide-react'
import { toast } from 'sonner'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // التمرير التلقائي إلى آخر رسالة
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ============================================================
  // إرسال رسالة
  // ============================================================
  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed) return

    const userMessage: Message = { role: 'user', content: trimmed }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          conversation_id: conversationId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'فشل التواصل مع المساعد')
      }

      setConversationId(data.conversation_id)
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err: any) {
      console.error('❌ Send error:', err)
      toast.error(`❌ ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // توليد تقرير سريع (مثال: تحليل سلامة)
  // ============================================================
  const quickPrompts = [
    { label: 'تحليل حادث', icon: <AlertTriangle className="h-4 w-4" />, prompt: 'أريد تحليل أسباب حادث عمل شائع في مواقع البناء، مع اقتراح إجراءات وقائية.' },
    { label: 'تقييم مخاطر', icon: <Shield className="h-4 w-4" />, prompt: 'قدم لي نموذجاً لتقييم المخاطر لمشروع بناء، مع تصنيف المخاطر وإجراءات التخفيف.' },
    { label: 'خطة تدريب', icon: <BookOpen className="h-4 w-4" />, prompt: 'أنشئ خطة تدريب أسبوعية للسلامة لعمال البناء، تشمل مواضيع مثل استخدام الرافعات والوقاية من السقوط.' },
    { label: 'تقرير عام', icon: <FileText className="h-4 w-4" />, prompt: 'اكتب تقريراً عاماً عن أداء السلامة في مشروع بناء، مع توصيات لتحسين الأداء.' },
  ]

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* الهيدر */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-yellow-500" />
          AI Assistant
        </h1>
        <p className="text-gray-500">اسأل عن أي شيء يتعلق بالسلامة والعمليات – تحليل، تقييم، خطط، ونصائح</p>
      </div>

      {/* الأزرار السريعة */}
      <div className="flex flex-wrap gap-2">
        {quickPrompts.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleQuickPrompt(item.prompt)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors"
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {/* منطقة المحادثة */}
      <div className="bg-white rounded-lg border shadow-sm p-4 h-[520px] overflow-y-auto flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <Bot className="h-16 w-16 mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-500">مرحباً! كيف يمكنني مساعدتك اليوم؟</p>
            <p className="text-sm">اطرح سؤالاً عن السلامة، العمليات، أو اطلب تقريراً.</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-4 flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white">
                  <Bot className="h-5 w-5" />
                </div>
              )}
              <div
                className={`p-3 rounded-lg max-w-[80%] ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white">
                  <User className="h-5 w-5" />
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>جاري التفكير...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* مربع الإدخال */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !loading && sendMessage()}
          placeholder="اكتب سؤالك هنا..."
          className="flex-1 border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <Send className="h-5 w-5" />
          إرسال
        </button>
      </div>
    </div>
  )
}