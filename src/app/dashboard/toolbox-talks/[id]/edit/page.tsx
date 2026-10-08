// src/app/dashboard/toolbox-talks/[id]/edit/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

export default function EditToolboxTalkPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [formData, setFormData] = useState({
    title: '',
    topic: '',
    date: '',
    location: '',
    conducted_by: '',
    duration: 30,
    attendees_count: 0,
    key_points: '',
    discussion_points: '',
    action_items: '',
    project_id: '',
  })

  // جلب المشاريع
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .limit(1)
          .maybeSingle()

        if (profile?.organization_id) {
          const { data } = await supabase
            .from('projects')
            .select('id, name')
            .eq('organization_id', profile.organization_id)
          setProjects(data || [])
        }
      } catch (e) { /* ignore */ }
    }
    fetchProjects()
  }, [])

  // جلب بيانات الجلسة
  useEffect(() => {
    const fetchTalk = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('toolbox_talks')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error

        setFormData({
          title: data.title || '',
          topic: data.topic || '',
          date: data.date || '',
          location: data.location || '',
          conducted_by: data.conducted_by || '',
          duration: data.duration || 30,
          attendees_count: data.attendees_count || 0,
          key_points: data.key_points || '',
          discussion_points: data.discussion_points || '',
          action_items: data.action_items || '',
          project_id: data.project_id || '',
        })
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchTalk()
    }
  }, [id, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const dataToSave = {
        title: formData.title,
        topic: formData.topic,
        date: formData.date || null,
        location: formData.location || null,
        conducted_by: formData.conducted_by || null,
        duration: parseInt(formData.duration as any) || 30,
        attendees_count: parseInt(formData.attendees_count as any) || 0,
        key_points: formData.key_points || null,
        discussion_points: formData.discussion_points || null,
        action_items: formData.action_items || null,
        project_id: formData.project_id || null,
      }

      const { error } = await supabase
        .from('toolbox_talks')
        .update(dataToSave)
        .eq('id', id)

      if (error) throw error

      toast.success('Toolbox talk updated successfully')
      // ✅ العودة إلى صفحة التفاصيل مع المسار الصحيح
      router.push(`/dashboard/toolbox-talks/${id}`)
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to update: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading toolbox talk...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push(`/dashboard/toolbox-talks/${id}`)}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Talk
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/dashboard/toolbox-talks/${id}`)}
          className="gap-2"
        >
          <ArrowLeft size={16} />
          Back to Talk
        </Button>
        <h1 className="text-2xl font-bold">Edit Toolbox Talk</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
              {error}
            </div>
          )}

          <div>
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>Topic *</Label>
            <Input
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                min="5"
                max="120"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 30 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Meeting location"
              />
            </div>
            <div>
              <Label>Conducted By</Label>
              <Input
                value={formData.conducted_by}
                onChange={(e) => setFormData({ ...formData, conducted_by: e.target.value })}
                placeholder="Supervisor name"
              />
            </div>
          </div>

          <div>
            <Label>Project</Label>
            <Select
              value={formData.project_id}
              onValueChange={(value) => setFormData({ ...formData, project_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Attendees Count</Label>
            <Input
              type="number"
              min="0"
              value={formData.attendees_count}
              onChange={(e) => setFormData({ ...formData, attendees_count: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div>
            <Label>Key Points</Label>
            <textarea
              value={formData.key_points}
              onChange={(e) => setFormData({ ...formData, key_points: e.target.value })}
              className="w-full border rounded-md px-3 py-2 min-h-[60px]"
              placeholder="Key points covered"
            />
          </div>

          <div>
            <Label>Discussion Points</Label>
            <textarea
              value={formData.discussion_points}
              onChange={(e) => setFormData({ ...formData, discussion_points: e.target.value })}
              className="w-full border rounded-md px-3 py-2 min-h-[60px]"
              placeholder="Discussion topics"
            />
          </div>

          <div>
            <Label>Action Items</Label>
            <textarea
              value={formData.action_items}
              onChange={(e) => setFormData({ ...formData, action_items: e.target.value })}
              className="w-full border rounded-md px-3 py-2 min-h-[60px]"
              placeholder="Action items from the meeting"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => router.push(`/dashboard/toolbox-talks/${id}`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Update Toolbox Talk'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}