// src/app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  AlertTriangle, 
  ClipboardCheck, 
  Shield, 
  FolderKanban, 
  HardHat, 
  Package, 
  GraduationCap,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = createClient()
  
  // جلب بيانات المستخدم والمنظمة
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .single()

  const orgId = profile?.organization_id

  // ============================================================
  // جلب الإحصائيات من جميع الوحدات
  // ============================================================
  const [
    { count: employeesCount },
    { count: projectsCount },
    { count: incidentsCount },
    { count: inspectionsCount },
    { count: riskAssessmentsCount },
    { count: toolboxTalksCount },
    { count: permitsCount },
    { count: fireEquipmentCount },
    { count: assetsCount },
    { count: ppeCount },
    { count: trainingsCount },
  ] = await Promise.all([
    supabase.from('employees').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('incidents').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('inspections').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('risk_assessments').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('toolbox_talks').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('permits').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('fire_equipment').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('assets').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('ppe_items').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('trainings').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
  ])

  // ============================================================
  // جلب البيانات الإضافية
  // ============================================================
  // جلب آخر 5 حوادث
  const { data: recentIncidents } = await supabase
    .from('incidents')
    .select('id, title, severity, status, created_at')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(5)

  // جلب آخر 5 موظفين
  const { data: recentEmployees } = await supabase
    .from('employees')
    .select('id, first_name, last_name, job_title, created_at')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(5)

  // جلب آخر 5 تفتيش
  const { data: recentInspections } = await supabase
    .from('inspections')
    .select('id, title, status, scheduled_date')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(5)

  // ============================================================
  // حساب بعض الإحصائيات المتقدمة
  // ============================================================
  // عدد الحوادث الخطيرة
  const { count: criticalIncidents } = await supabase
    .from('incidents')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .in('severity', ['high', 'critical', 'catastrophic'])

  // نسبة اكتمال التفتيش
  const { count: completedInspections } = await supabase
    .from('inspections')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'completed')

  const inspectionCompletionRate = inspectionsCount > 0 
    ? Math.round((completedInspections / inspectionsCount) * 100) 
    : 0

  // عدد التصاريح المعلقة
  const { count: pendingPermits } = await supabase
    .from('permits')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'pending')

  // عدد التدريبات الإجبارية
  const { count: mandatoryTrainings } = await supabase
    .from('trainings')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('is_mandatory', true)

  // ============================================================
  // عرض الصفحة
  // ============================================================
  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your safety and operations platform</p>
      </div>

      {/* ============================================================
          الصف الأول: بطاقات الإحصائيات الرئيسية (6 بطاقات)
          ============================================================ */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard 
          title="Employees" 
          value={employeesCount || 0} 
          icon={<Users className="h-5 w-5 text-blue-600" />}
          color="blue"
        />
        <StatCard 
          title="Projects" 
          value={projectsCount || 0} 
          icon={<FolderKanban className="h-5 w-5 text-purple-600" />}
          color="purple"
        />
        <StatCard 
          title="Incidents" 
          value={incidentsCount || 0} 
          icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
          color="red"
          subText={`${criticalIncidents || 0} critical`}
        />
        <StatCard 
          title="Inspections" 
          value={inspectionsCount || 0} 
          icon={<ClipboardCheck className="h-5 w-5 text-green-600" />}
          color="green"
          subText={`${inspectionCompletionRate}% completed`}
        />
        <StatCard 
          title="Risk Assessments" 
          value={riskAssessmentsCount || 0} 
          icon={<Shield className="h-5 w-5 text-orange-600" />}
          color="orange"
        />
        <StatCard 
          title="Trainings" 
          value={trainingsCount || 0} 
          icon={<GraduationCap className="h-5 w-5 text-indigo-600" />}
          color="indigo"
          subText={`${mandatoryTrainings || 0} mandatory`}
        />
      </div>

      {/* ============================================================
          الصف الثاني: بطاقات إضافية (PPE, Assets, Permits, Toolbox)
          ============================================================ */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="PPE Items" 
          value={ppeCount || 0} 
          icon={<HardHat className="h-5 w-5 text-cyan-600" />}
          color="cyan"
        />
        <StatCard 
          title="Assets" 
          value={assetsCount || 0} 
          icon={<Package className="h-5 w-5 text-emerald-600" />}
          color="emerald"
        />
        <StatCard 
          title="Permits" 
          value={permitsCount || 0} 
          icon={<ClipboardCheck className="h-5 w-5 text-yellow-600" />}
          color="yellow"
          subText={`${pendingPermits || 0} pending`}
        />
        <StatCard 
          title="Toolbox Talks" 
          value={toolboxTalksCount || 0} 
          icon={<ClipboardCheck className="h-5 w-5 text-teal-600" />}
          color="teal"
        />
      </div>

      {/* ============================================================
          الصف الثالث: الجداول (آخر الحوادث، آخر الموظفين، آخر التفتيش)
          ============================================================ */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* آخر الحوادث */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Recent Incidents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentIncidents && recentIncidents.length > 0 ? (
              <div className="space-y-3">
                {recentIncidents.map((incident) => (
                  <div key={incident.id} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0">
                    <div>
                      <p className="text-sm font-medium truncate max-w-[150px]">{incident.title || 'Untitled'}</p>
                      <p className="text-xs text-gray-500">{new Date(incident.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      incident.severity === 'critical' || incident.severity === 'high' 
                        ? 'bg-red-100 text-red-800' 
                        : incident.severity === 'medium' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {incident.severity || 'N/A'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No incidents reported.</p>
            )}
          </CardContent>
        </Card>

        {/* آخر الموظفين */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              New Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentEmployees && recentEmployees.length > 0 ? (
              <div className="space-y-3">
                {recentEmployees.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{employee.first_name} {employee.last_name}</p>
                      <p className="text-xs text-gray-500">{employee.job_title || 'N/A'}</p>
                    </div>
                    <span className="text-xs text-gray-400">{new Date(employee.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No employees added yet.</p>
            )}
          </CardContent>
        </Card>

        {/* آخر التفتيش */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-green-500" />
              Recent Inspections
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentInspections && recentInspections.length > 0 ? (
              <div className="space-y-3">
                {recentInspections.map((inspection) => (
                  <div key={inspection.id} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0">
                    <div>
                      <p className="text-sm font-medium truncate max-w-[150px]">{inspection.title || 'Untitled'}</p>
                      <p className="text-xs text-gray-500">{inspection.scheduled_date ? new Date(inspection.scheduled_date).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      inspection.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : inspection.status === 'in_progress'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {inspection.status || 'N/A'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No inspections scheduled.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ============================================================
          الصف الرابع: ملخص سريع
          ============================================================ */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryItem 
          title="Total Fire Equipment" 
          value={fireEquipmentCount || 0} 
          icon="🔥"
        />
        <SummaryItem 
          title="Total Assets" 
          value={assetsCount || 0} 
          icon="📦"
        />
        <SummaryItem 
          title="Total PPE Items" 
          value={ppeCount || 0} 
          icon="🪖"
        />
        <SummaryItem 
          title="Total Risk Assessments" 
          value={riskAssessmentsCount || 0} 
          icon="🛡️"
        />
      </div>
    </div>
  )
}

// ============================================================
// مكونات مساعدة
// ============================================================

function StatCard({ 
  title, 
  value, 
  icon, 
  color = 'blue',
  subText 
}: { 
  title: string
  value: number | string
  icon: React.ReactNode
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange' | 'indigo' | 'cyan' | 'emerald' | 'teal'
  subText?: string
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    teal: 'bg-teal-50 text-teal-600',
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subText && (
              <p className="text-xs text-gray-400 mt-0.5">{subText}</p>
            )}
          </div>
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SummaryItem({ title, value, icon }: { title: string; value: number; icon: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </CardContent>
    </Card>
  )
}