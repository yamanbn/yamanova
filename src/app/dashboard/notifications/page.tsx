// src/app/dashboard/notifications/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  Clock, 
  Settings,
  Plus,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'alert' | 'success' | 'expiry' | 'reminder'
  link: string
  read_at: string | null
  sent_at: string
  created_at: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all')
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  // ============================================================
  // جلب الإشعارات
  // ============================================================
  const fetchNotifications = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'فشل جلب الإشعارات')
      }

      console.log('✅ تم جلب الإشعارات:', data) // للتأكد من وصول البيانات
      setNotifications(data || [])
      setUnreadCount(data?.filter((n: Notification) => !n.read_at).length || 0)
    } catch (err: any) {
      console.error('❌ Fetch error:', err)
      setError(err.message)
      toast.error(`❌ ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // إرسال إشعار تجريبي
  // ============================================================
  const sendTestNotification = async () => {
    console.log('🔄 جاري إرسال إشعار تجريبي...')
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '📢 إشعار تجريبي',
          message: `تم إنشاء هذا الإشعار في ${new Date().toLocaleTimeString()}`,
          type: 'info',
          link: '/dashboard',
          is_public: false,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'فشل الإرسال')
      }

      console.log('✅ تم الإرسال بنجاح:', data)
      toast.success('✅ تم إرسال الإشعار التجريبي!')
      await fetchNotifications() // تحديث القائمة
    } catch (err: any) {
      console.error('❌ Send error:', err)
      toast.error(`❌ فشل الإرسال: ${err.message}`)
    }
  }

  // ============================================================
  // تحديث عند تغيير التبويب
  // ============================================================
  useEffect(() => {
    fetchNotifications()
  }, [activeTab])

  // ============================================================
  // Realtime: استقبال الإشعارات فوراً
  // ============================================================
  useEffect(() => {
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const newNotif = payload.new as Notification
          console.log('🔔 إشعار جديد في الوقت الفعلي:', newNotif)
          setNotifications((prev) => [newNotif, ...prev])
          setUnreadCount((prev) => prev + 1)
          toast.info('🔔 إشعار جديد!', {
            description: newNotif.title,
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  // ============================================================
  // تحديد إشعار كمقروء
  // ============================================================
  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n
        )
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
      toast.success('✅ تم التحديث')
    } catch (err: any) {
      toast.error('❌ فشل التحديث')
    }
  }

  // ============================================================
  // تحديد الكل كمقروء
  // ============================================================
  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.read_at).map((n) => n.id)
      if (unreadIds.length === 0) {
        toast.info('لا يوجد إشعارات غير مقروءة')
        return
      }

      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadIds)

      if (error) throw error

      setNotifications((prev) =>
        prev.map((n) =>
          unreadIds.includes(n.id) ? { ...n, read_at: new Date().toISOString() } : n
        )
      )
      setUnreadCount(0)
      toast.success('✅ تم تحديث الكل')
    } catch (err: any) {
      toast.error('❌ فشل التحديث')
    }
  }

  // ============================================================
  // دوال مساعدة للواجهة
  // ============================================================
  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'alert': return <XCircle className="h-5 w-5 text-red-500" />
      case 'expiry': return <Clock className="h-5 w-5 text-orange-500" />
      default: return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-l-4 border-l-green-500'
      case 'warning': return 'border-l-4 border-l-yellow-500'
      case 'alert': return 'border-l-4 border-l-red-500'
      case 'expiry': return 'border-l-4 border-l-orange-500'
      default: return 'border-l-4 border-l-blue-500'
    }
  }

  // تصفية الإشعارات حسب التبويب النشط
  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : notifications.filter(n => !n.read_at)

  // ============================================================
  // العرض (بدون مكونات Shadcn UI)
  // ============================================================
  return (
    <div className="space-y-6">
      {/* الهيدر */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            الإشعارات
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-1">تابع التنبيهات والتذكيرات المهمة</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* زر إرسال تجريبي */}
          <button
            onClick={sendTestNotification}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            إرسال تجريبي
          </button>

          {/* زر تحديث */}
          <button
            onClick={fetchNotifications}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </button>

          {/* زر تحديد الكل كمقروء */}
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              تحديد الكل كمقروء
            </button>
          )}

          {/* زر الإعدادات */}
          <Link href="/dashboard/settings">
            <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
              <Settings className="h-4 w-4" />
              الإعدادات
            </button>
          </Link>
        </div>
      </div>

      {/* التبويبات (أزرار عادية) */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          الكل
        </button>
        <button
          onClick={() => setActiveTab('unread')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-1 ${
            activeTab === 'unread'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          غير المقروء
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* عرض الأخطاء من الخادم */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600 border border-red-200">
          ⚠️ {error}
        </div>
      )}

      {/* قائمة الإشعارات */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">جاري التحميل...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">لا توجد إشعارات</p>
            <p className="text-sm text-gray-400">أنت على اطلاع كامل!</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4 flex items-start gap-4 ${getTypeColor(notification.type)} ${!notification.read_at ? 'bg-blue-50/50' : ''}`}
            >
              <div className="flex-shrink-0 mt-1">
                {getIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className={`font-medium ${!notification.read_at ? 'text-blue-700' : 'text-gray-900'}`}>
                      {notification.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-0.5">{notification.message}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-400">
                        {new Date(notification.sent_at).toLocaleString('ar-EG')}
                      </span>
                      {notification.link && (
                        <Link href={notification.link} className="text-xs text-blue-600 hover:underline">
                          عرض التفاصيل →
                        </Link>
                      )}
                    </div>
                  </div>
                  {!notification.read_at && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="flex-shrink-0 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      تحديد كمقروء
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}