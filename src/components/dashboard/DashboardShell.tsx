// src/components/dashboard/DashboardShell.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
  UserRoundCheck,
  Menu,
  X,
} from 'lucide-react'

interface DashboardShellProps {
  profile: any
  unreadCount: number
  children: React.ReactNode
}

export function DashboardShell({ profile, unreadCount, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  // إغلاق القائمة تلقائياً عند تغيير الصفحة (مهم للموبايل)
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // منع scroll في الـ body عندما تكون القائمة مفتوحة على الموبايل
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  // إغلاق القائمة بزر Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  // تسجيل الخروج
  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch (err) {
      console.error('Logout error:', err)
      setLoggingOut(false)
    }
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">

      {/* Overlay معتم يظهر خلف القائمة على الموبايل */}
      <div
        className={`
          fixed inset-0 bg-black/50 z-40 lg:hidden
          transition-opacity duration-300
          ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl flex flex-col
          transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:w-64 lg:shadow-md
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* شعار الشركة */}
        <div className="p-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="YAMANOVA"
                width={36}
                height={36}
                className="h-9 w-auto object-contain"
                onError={(e) => {
                  // في حال عدم وجود الشعار، أخفِ الصورة
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
              <h1 className="text-xl font-bold text-blue-600">YAMANOVA</h1>
            </div>

            {/* زر الإغلاق - يظهر فقط على الموبايل */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg hover:bg-gray-100 lg:hidden"
              aria-label="إغلاق القائمة"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {profile?.organization_id ? 'Enterprise' : 'Personal'}
          </p>
        </div>

        {/* القائمة */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <NavItem href="/dashboard" icon={<LayoutDashboard size={18} />}>
            Dashboard
          </NavItem>
          <NavItem href="/dashboard/employees" icon={<Users size={18} />}>
            Employees
          </NavItem>
          <NavItem href="/dashboard/projects" icon={<FolderKanban size={18} />}>
            Projects
          </NavItem>
          <NavItem href="/dashboard/incidents" icon={<AlertTriangle size={18} />}>
            Incidents
          </NavItem>
          <NavItem href="/dashboard/inspections" icon={<ClipboardCheck size={18} />}>
            Inspections
          </NavItem>
          <NavItem href="/dashboard/risk-assessments" icon={<Shield size={18} />}>
            Risk Assessments
          </NavItem>
          <NavItem href="/dashboard/toolbox-talks" icon={<ClipboardList size={18} />}>
            Toolbox Talks
          </NavItem>
          <NavItem href="/dashboard/permits" icon={<FileText size={18} />}>
            Permits
          </NavItem>
          <NavItem href="/dashboard/fire-safety" icon={<Flame size={18} />}>
            Fire Safety
          </NavItem>
          <NavItem href="/dashboard/assets" icon={<Package size={18} />}>
            Assets
          </NavItem>
          <NavItem href="/dashboard/ppe" icon={<HardHat size={18} />}>
            PPE
          </NavItem>
          <NavItem href="/dashboard/trainings" icon={<GraduationCap size={18} />}>
            Trainings
          </NavItem>
          <NavItem href="/dashboard/visitors" icon={<UserRoundCheck size={18} />}>
            Visitors
          </NavItem>
          <NavItem href="/dashboard/ai-assistant" icon={<Sparkles size={18} />}>
            AI Assistant
          </NavItem>
          <NavItem href="/dashboard/notifications" icon={<Bell size={18} />} badge={unreadCount}>
            Notifications
          </NavItem>
          <NavItem href="/dashboard/organizations" icon={<Building2 size={18} />}>
            Organizations
          </NavItem>
          <NavItem href="/dashboard/settings" icon={<Settings size={18} />}>
            Settings
          </NavItem>
        </nav>

        {/* تسجيل الخروج */}
        <div className="p-3 border-t flex-shrink-0">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <LogOut size={18} />
            <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>

      {/* المحتوى الرئيسي */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* الهيدر */}
        <header className="bg-white shadow-sm px-3 py-3 lg:px-6 lg:py-4 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* زر فتح القائمة - يظهر فقط على الموبايل */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 lg:hidden flex-shrink-0"
              aria-label="فتح القائمة"
            >
              <Menu size={22} className="text-gray-700" />
            </button>

            <h2 className="text-base lg:text-xl font-semibold truncate">
              Welcome, {profile?.full_name || 'User'}
            </h2>
          </div>

          <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
            {/* الإشعارات */}
            <Link
              href="/dashboard/notifications"
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Bell className="h-5 w-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>

            {/* الدور - يظهر فقط على الشاشات الأكبر */}
            <span className="hidden sm:inline-block text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full capitalize">
              {profile?.role || 'worker'}
            </span>
          </div>
        </header>

        {/* محتوى الصفحة */}
        <main className="flex-1 overflow-y-auto p-3 lg:p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}

// ============================================================
// مكون NavItem - عنصر واحد في القائمة
// ============================================================
function NavItem({
  href,
  icon,
  children,
  badge,
}: {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
  badge?: number
}) {
  const pathname = usePathname()

  // تحديد ما إذا كان العنصر نشطاً
  const isActive =
    pathname === href ||
    (href !== '/dashboard' && pathname?.startsWith(href))

  return (
    <Link
      href={href}
      className={`
        flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg
        text-sm font-medium transition-colors
        ${
          isActive
            ? 'bg-blue-50 text-blue-700'
            : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
        }
      `}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className={isActive ? 'text-blue-600' : 'text-gray-500'}>
          {icon}
        </span>
        <span className="truncate">{children}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center flex-shrink-0">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  )
}