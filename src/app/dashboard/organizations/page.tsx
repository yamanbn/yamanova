// src/app/(dashboard)/organizations/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useOrganization } from '@/hooks/useOrganization'

interface Organization {
  id: string
  name: string
  status: string
  created_at: string
}

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const supabase = createClient()
  const { orgId, loading: orgLoading, error: orgError } = useOrganization()

  const fetchOrgs = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrgs(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrgs()
  }, [])

  const handleAdd = async () => {
    if (!newName.trim()) return
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('organizations')
        .insert({ name: newName, status: 'active' })

      if (error) throw error
      setNewName('')
      setShowForm(false)
      fetchOrgs()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this organization?')) return
    setLoading(true)
    try {
      const { error } = await supabase.from('organizations').delete().eq('id', id)
      if (error) throw error
      fetchOrgs()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (orgLoading) {
    return <div className="p-8 text-center">جاري تحميل بيانات المنظمة...</div>
  }

  if (orgError) {
    return (
      <div className="p-8 text-center text-red-600">
        <p>{orgError}</p>
        <p className="text-sm text-gray-500 mt-2">يرجى إضافة منظمة جديدة باستخدام هذا النموذج.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Organizations</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <Plus size={18} /> Add Organization
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <input placeholder="Search organizations..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md" />
      </div>

      {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-600 border border-red-200">{error}</div>}

      <div className="bg-white rounded-md shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Created</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr>
            ) : orgs.length === 0 ? (
              <tr><td colSpan={4} className="p-4 text-center text-gray-500">No organizations found.</td></tr>
            ) : (
              orgs.map((org) => (
                <tr key={org.id} className="border-t hover:bg-gray-50">
                  <td className="p-4 font-medium">{org.name}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      org.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {org.status}
                    </span>
                  </td>
                  <td className="p-4">{new Date(org.created_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    <button onClick={() => handleDelete(org.id)} className="text-red-600 hover:text-red-800">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Organization</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Organization Name *</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter organization name"
              />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={loading || !newName.trim()}>
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}