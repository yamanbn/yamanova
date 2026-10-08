// src/hooks/useOrganization.ts
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useOrganization() {
  const [orgId, setOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchOrg = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data: user } = await supabase.auth.getUser()
        if (!user?.user) {
          setError('غير مسجل الدخول')
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.user.id)
          .maybeSingle()

        if (error) throw error

        if (!data || !data.organization_id) {
          setError('لم يتم العثور على منظمة. يرجى إضافة منظمة من صفحة المنظمات أو تنفيذ كود SQL للربط.')
          setOrgId(null)
        } else {
          setOrgId(data.organization_id)
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchOrg()
  }, [])

  return { orgId, loading, error }
}