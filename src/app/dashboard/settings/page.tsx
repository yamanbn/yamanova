// src/app/dashboard/settings/page.tsx (محدث مع إعدادات الإشعارات)
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useOrganization } from '@/hooks/useOrganization'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [settings, setSettings] = useState({
    email_enabled: true,
    whatsapp_enabled: false,
    push_enabled: true,
    expiry_alerts: true,
    incident_alerts: true,
    inspection_alerts: true,
    training_alerts: true,
    permit_alerts: true,
  })
  const supabase = createClient()
  const { orgId, loading: orgLoading, error: orgError } = useOrganization()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: user } = await supabase.auth.getUser()
      if (user?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.user.id)
          .single()
        setProfile(data)

        // جلب إعدادات الإشعارات
        const { data: notifSettings } = await supabase
          .from('notification_settings')
          .select('*')
          .eq('user_id', user.user.id)
          .single()

        if (notifSettings) {
          setSettings({
            email_enabled: notifSettings.email_enabled !== false,
            whatsapp_enabled: notifSettings.whatsapp_enabled || false,
            push_enabled: notifSettings.push_enabled !== false,
            expiry_alerts: notifSettings.expiry_alerts !== false,
            incident_alerts: notifSettings.incident_alerts !== false,
            inspection_alerts: notifSettings.inspection_alerts !== false,
            training_alerts: notifSettings.training_alerts !== false,
            permit_alerts: notifSettings.permit_alerts !== false,
          })
        }
      }
    }
    fetchProfile()
  }, [])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user?.user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile?.full_name,
          arabic_name: profile?.arabic_name,
          phone: profile?.phone,
        })
        .eq('id', user.user.id)

      if (error) throw error
      setMessage('Profile updated successfully!')
      toast.success('Profile updated successfully!')
    } catch (err: any) {
      setMessage('Error: ' + err.message)
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    setLoading(true)
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user?.user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: user.user.id,
          email_enabled: settings.email_enabled,
          whatsapp_enabled: settings.whatsapp_enabled,
          push_enabled: settings.push_enabled,
          expiry_alerts: settings.expiry_alerts,
          incident_alerts: settings.incident_alerts,
          inspection_alerts: settings.inspection_alerts,
          training_alerts: settings.training_alerts,
          permit_alerts: settings.permit_alerts,
        }, { onConflict: 'user_id' })

      if (error) throw error
      toast.success('Notification settings saved!')
    } catch (err: any) {
      toast.error('Failed to save settings')
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
        <p className="text-sm text-gray-500 mt-2">يرجى إضافة منظمة من صفحة المنظمات.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input
                value={profile?.full_name || ''}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="Your full name"
              />
            </div>
            <div>
              <Label>Arabic Name</Label>
              <Input
                value={profile?.arabic_name || ''}
                onChange={(e) => setProfile({ ...profile, arabic_name: e.target.value })}
                placeholder="الاسم بالعربية"
              />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input
                value={profile?.phone || ''}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="+971 50 123 4567"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={profile?.email || ''}
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed here</p>
            </div>
            {message && (
              <div className={`p-3 rounded-md text-sm ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {message}
              </div>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <p className="text-sm text-gray-500">Choose how you want to receive notifications</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Channels */}
          <div>
            <h3 className="text-sm font-medium mb-3">Notification Channels</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-normal">Email Notifications</Label>
                  <p className="text-xs text-gray-400">Receive notifications via email</p>
                </div>
                <Switch
                  checked={settings.email_enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, email_enabled: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-normal">WhatsApp Notifications</Label>
                  <p className="text-xs text-gray-400">Receive notifications via WhatsApp</p>
                </div>
                <Switch
                  checked={settings.whatsapp_enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, whatsapp_enabled: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-normal">Push Notifications</Label>
                  <p className="text-xs text-gray-400">Receive notifications in-app</p>
                </div>
                <Switch
                  checked={settings.push_enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, push_enabled: checked })}
                />
              </div>
            </div>
          </div>

          {/* Alert Types */}
          <div>
            <h3 className="text-sm font-medium mb-3">Alert Types</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-normal">Expiry Alerts</Label>
                <Switch
                  checked={settings.expiry_alerts}
                  onCheckedChange={(checked) => setSettings({ ...settings, expiry_alerts: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="font-normal">Incident Alerts</Label>
                <Switch
                  checked={settings.incident_alerts}
                  onCheckedChange={(checked) => setSettings({ ...settings, incident_alerts: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="font-normal">Inspection Alerts</Label>
                <Switch
                  checked={settings.inspection_alerts}
                  onCheckedChange={(checked) => setSettings({ ...settings, inspection_alerts: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="font-normal">Training Alerts</Label>
                <Switch
                  checked={settings.training_alerts}
                  onCheckedChange={(checked) => setSettings({ ...settings, training_alerts: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="font-normal">Permit Alerts</Label>
                <Switch
                  checked={settings.permit_alerts}
                  onCheckedChange={(checked) => setSettings({ ...settings, permit_alerts: checked })}
                />
              </div>
            </div>
          </div>

          <Button onClick={handleSaveSettings} disabled={loading}>
            {loading ? 'Saving...' : 'Save Notification Settings'}
          </Button>
        </CardContent>
      </Card>

      {/* Organization Information */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Organization ID: <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{orgId || 'Not assigned'}</span>
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Role: <span className="font-medium capitalize">{profile?.role || 'worker'}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}