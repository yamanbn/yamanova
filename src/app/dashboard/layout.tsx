// src/app/dashboard/layout.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard/DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // جلب عدد الإشعارات غير المقروءة
  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', profile?.organization_id)
    .or(`user_id.eq.${user.id},user_id.is.null`)
    .is('read_at', null)

  return (
    <DashboardShell
      profile={profile}
      unreadCount={unreadCount || 0}
    >
      {children}
    </DashboardShell>
  )
}