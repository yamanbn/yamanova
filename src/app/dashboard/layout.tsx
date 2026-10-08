// src/app/dashboard/layout.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  LayoutDashboard, 
  Users, 
  FolderKanban, 
  AlertTriangle, 
  ClipboardCheck, 
  Shield, 
  Settings,
  LogOut,
  Building2,
  ClipboardList,
  FileText,
  Flame,
  Package,
  HardHat,
  GraduationCap,
  Bell,
  Sparkles,
  UserRoundCheck, // 👈 أيقونة الزوار
} from 'lucide-react'

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
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Image 
              src="/logo.png" 
              alt="YAMANOVA Logo" 
              width={32}
              height={32}
              className="h-8 w-auto object-contain"
            />
            <h1 className="text-xl font-bold text-blue-600">YAMANOVA</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {profile?.organization_id ? 'Enterprise' : 'Personal'}
          </p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavItem href="/dashboard" icon={<LayoutDashboard size={18} />}>Dashboard</NavItem>
          <NavItem href="/dashboard/employees" icon={<Users size={18} />}>Employees</NavItem>
          <NavItem href="/dashboard/projects" icon={<FolderKanban size={18} />}>Projects</NavItem>
          <NavItem href="/dashboard/incidents" icon={<AlertTriangle size={18} />}>Incidents</NavItem>
          <NavItem href="/dashboard/inspections" icon={<ClipboardCheck size={18} />}>Inspections</NavItem>
          <NavItem href="/dashboard/risk-assessments" icon={<Shield size={18} />}>Risk Assessments</NavItem>
          <NavItem href="/dashboard/toolbox-talks" icon={<ClipboardList size={18} />}>Toolbox Talks</NavItem>
          <NavItem href="/dashboard/permits" icon={<FileText size={18} />}>Permits</NavItem>
          <NavItem href="/dashboard/fire-safety" icon={<Flame size={18} />}>Fire Safety</NavItem>
          <NavItem href="/dashboard/assets" icon={<Package size={18} />}>Assets</NavItem>
          <NavItem href="/dashboard/ppe" icon={<HardHat size={18} />}>PPE</NavItem>
          <NavItem href="/dashboard/trainings" icon={<GraduationCap size={18} />}>Trainings</NavItem>
          
          {/* 👇 إضافة عنصر الزوار (Visitor Management) */}
          <NavItem 
            href="/dashboard/visitors" 
            icon={<UserRoundCheck size={18} />}
          >
            Visitors
          </NavItem>

          <NavItem 
            href="/dashboard/ai-assistant" 
            icon={<Sparkles size={18} />}
          >
            AI Assistant
          </NavItem>

          <NavItem 
            href="/dashboard/notifications" 
            icon={<Bell size={18} />}
            badge={unreadCount || 0}
          >
            Notifications
          </NavItem>

          <NavItem href="/dashboard/organizations" icon={<Building2 size={18} />}>Organizations</NavItem>
          <NavItem href="/dashboard/settings" icon={<Settings size={18} />}>Settings</NavItem>
        </nav>
        <div className="p-4 border-t">
          <form action="/auth/signout" method="post">
            <button className="flex w-full items-center gap-2 text-gray-600 hover:text-red-600">
              <LogOut size={18} /> Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Welcome, {profile?.full_name || 'User'}</h2>
          <div className="flex items-center gap-4">
            {/* أيقونة الجرس في الهيدر */}
            <Link href="/dashboard/notifications" className="relative">
              <Bell className="h-5 w-5 text-gray-600 hover:text-blue-600 transition-colors" />
              {unreadCount && unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
            <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              {profile?.role || 'worker'}
            </span>
            <span className="text-sm text-gray-500">🇦🇪</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}

// ============================================================
// مكون NavItem مع دعم badge
// ============================================================
function NavItem({ 
  href, 
  icon, 
  children,
  badge
}: { 
  href: string
  icon: React.ReactNode
  children: React.ReactNode
  badge?: number
}) {
  return (
    <Link 
      href={href} 
      className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
    >
      <div className="flex items-center gap-3">
        {icon}
        <span>{children}</span>
      </div>
      {badge && badge > 0 && (
        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  )
}