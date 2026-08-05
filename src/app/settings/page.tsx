'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { apiFetch, apiUpload } from '@/lib/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/hooks/use-toast'
import { ImageCropper } from '@/components/image-cropper'
import {
  Loader2,
  Save,
  Camera,
  Download,
  ChevronLeft,
  AlertTriangle,
  Image as ImageIcon,
} from 'lucide-react'
import { DatePicker } from '@/components/ui/date-picker'
import Link from 'next/link'

export default function SettingsPage() {
  const { user, refreshUser } = useAuth()
  const searchParams = useSearchParams()
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [activeSection, setActiveSection] = useState('profile')

  // Profile fields
  const [realName, setRealName] = useState('')
  const [className, setClassName] = useState('')
  const [signature, setSignature] = useState('')
  const [birthday, setBirthday] = useState('')
  const [address, setAddress] = useState('')
  const [hobbies, setHobbies] = useState('')

  // Avatar upload
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [avatarCropOpen, setAvatarCropOpen] = useState(false)
  const [avatarPickedFile, setAvatarPickedFile] = useState<File | null>(null)

  // Cover image upload
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState('')
  const [coverCropOpen, setCoverCropOpen] = useState(false)
  const [coverPickedFile, setCoverPickedFile] = useState<File | null>(null)

  // Social
  const [wechat, setWechat] = useState('')
  const [weibo, setWeibo] = useState('')
  const [douyin, setDouyin] = useState('')
  const [bilibili, setBilibili] = useState('')

  // Contact
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  // Password
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPwd, setChangingPwd] = useState(false)
  const [forceChangePassword, setForceChangePassword] = useState(false)

  // Notifications
  const [notifyComment, setNotifyComment] = useState(true)
  const [notifyLike, setNotifyLike] = useState(true)
  const [notifyAudit, setNotifyAudit] = useState(true)
  const [notifySystem, setNotifySystem] = useState(true)

  useEffect(() => {
    if (user) {
      setRealName(user.realName)
      setClassName(user.className)
      setSignature(user.signature)
      setBirthday(user.birthday)
      setAddress(user.address)
      setHobbies(user.hobbies)
      setWechat(user.wechat)
      setWeibo(user.weibo)
      setDouyin(user.douyin)
      setBilibili(user.bilibili)
      setPhone(user.phone)
      setEmail(user.email)
      setNotifyComment(user.notifyComment as any ?? true)
      setNotifyLike(user.notifyLike as any ?? true)
      setNotifyAudit(user.notifyAudit as any ?? true)
      setNotifySystem(user.notifySystem as any ?? true)
    }
  }, [user])

  useEffect(() => {
    if (searchParams.get('changePassword') === '1') {
      setActiveSection('password')
      setForceChangePassword(true)
    }
  }, [searchParams])

  if (!user) {
    return (
      <div className="container py-20 text-center text-muted-foreground">
        请先登录
      </div>
    )
  }

  const handlePickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarPickedFile(file)
      setAvatarCropOpen(true)
    }
    e.target.value = ''
  }

  const handleAvatarCropComplete = (blob: Blob) => {
    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(blob))
    setAvatarCropOpen(false)
  }

  const handlePickCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverPickedFile(file)
      setCoverCropOpen(true)
    }
    e.target.value = ''
  }

  const handleCoverCropComplete = (blob: Blob) => {
    const file = new File([blob], 'cover.jpg', { type: 'image/jpeg' })
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(blob))
    setCoverCropOpen(false)
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      if (avatarFile || coverFile) {
        const formData = new FormData()
        if (avatarFile) formData.append('avatar', avatarFile)
        if (coverFile) formData.append('coverImage', coverFile)
        formData.append('realName', realName)
        formData.append('className', className)
        formData.append('signature', signature)
        formData.append('birthday', birthday)
        formData.append('address', address)
        formData.append('hobbies', hobbies)
        await apiUpload('/api/settings/profile', formData)
      } else {
        await apiFetch('/api/settings/profile', {
          method: 'PUT',
          body: JSON.stringify({
            realName, className, signature, birthday, address, hobbies,
          }),
        })
      }
      toast({ title: '资料已保存' })
      refreshUser()
    } catch (err: any) {
      toast({ title: err.message || '保存失败', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSocial = async () => {
    setSaving(true)
    try {
      await apiFetch('/api/settings/profile', {
        method: 'PUT',
        body: JSON.stringify({ wechat, weibo, douyin, bilibili }),
      })
      toast({ title: '社交账号已保存' })
      refreshUser()
    } catch (err: any) {
      toast({ title: err.message || '保存失败', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveContact = async () => {
    setSaving(true)
    try {
      await apiFetch('/api/settings/profile', {
        method: 'PUT',
        body: JSON.stringify({ phone, email }),
      })
      toast({ title: '联系方式已保存' })
      refreshUser()
    } catch (err: any) {
      toast({ title: err.message || '保存失败', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({ title: '请填写新密码', variant: 'destructive' })
      return
    }
    if (!forceChangePassword && !oldPassword) {
      toast({ title: '请填写旧密码', variant: 'destructive' })
      return
    }
    if (newPassword.length < 6) {
      toast({ title: '新密码至少6位', variant: 'destructive' })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({ title: '两次新密码不一致', variant: 'destructive' })
      return
    }
    setChangingPwd(true)
    try {
      const body: Record<string, string> = { newPassword }
      if (!forceChangePassword) body.oldPassword = oldPassword
      await apiFetch('/api/settings/password', {
        method: 'PUT',
        body: JSON.stringify(body),
      })
      toast({ title: '密码已修改' })
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setForceChangePassword(false)
    } catch (err: any) {
      toast({ title: err.message || '修改失败', variant: 'destructive' })
    } finally {
      setChangingPwd(false)
    }
  }

  const handleSaveNotifications = async () => {
    setSaving(true)
    try {
      await apiFetch('/api/settings/notifications', {
        method: 'PUT',
        body: JSON.stringify({
          notifyComment, notifyLike, notifyAudit, notifySystem,
        }),
      })
      toast({ title: '通知配置已保存' })
    } catch (err: any) {
      toast({ title: err.message || '保存失败', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/settings/export', {
        method: 'POST',
        credentials: 'include',
      })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `user-data-${user.id}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast({ title: '导出成功' })
    } catch {
      toast({ title: '导出失败', variant: 'destructive' })
    } finally {
      setExporting(false)
    }
  }

  const sections = [
    { key: 'profile', label: '资料编辑' },
    { key: 'social', label: '社交账号' },
    { key: 'contact', label: '联系方式' },
    { key: 'password', label: '密码修改' },
    { key: 'notifications', label: '通知配置' },
    { key: 'export', label: '数据导出' },
  ]

  return (
    <div className="container py-6 max-w-3xl">
      <div className="flex items-center gap-2 mb-6">
        <Link href={`/user/${user.username}`}>
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" />返回
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">个人设置</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-40 shrink-0">
          <nav className="flex md:flex-col gap-1 overflow-x-auto">
            {sections.map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={`text-left px-4 py-2.5 rounded-md text-sm whitespace-nowrap transition-colors ${
                  activeSection === s.key
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1">
          {activeSection === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">资料编辑</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center gap-2">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={avatarPreview || user.avatar} />
                    <AvatarFallback className="text-xl">{user.realName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <label className="cursor-pointer">
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        <Camera className="h-4 w-4 mr-1" />更换头像
                      </span>
                    </Button>
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePickAvatar}
                    />
                  </label>
                </div>

                <div className="space-y-2">
                  <Label>个人主页封面</Label>
                  {coverPreview || user.coverImage ? (
                    <div className="relative rounded-lg overflow-hidden h-32 bg-muted">
                      <img
                        src={coverPreview || user.coverImage}
                        alt="封面"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 h-32 flex flex-col items-center justify-center gap-1 text-muted-foreground">
                      <ImageIcon className="h-8 w-8" />
                      <span className="text-sm">暂无封面</span>
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        <Camera className="h-4 w-4 mr-1" />更换封面
                      </span>
                    </Button>
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePickCover}
                    />
                  </label>
                </div>

                <div className="space-y-2">
                  <Label>真实姓名</Label>
                  <Input value={realName} disabled className="bg-muted cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                  <Label>班级</Label>
                  <Input value={className} onChange={(e) => setClassName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>个性签名</Label>
                  <Textarea value={signature} onChange={(e) => setSignature(e.target.value)} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>生日</Label>
                  <DatePicker value={birthday} onChange={(e) => setBirthday(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>地址</Label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>爱好</Label>
                  <Input value={hobbies} onChange={(e) => setHobbies(e.target.value)} />
                </div>
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  保存
                </Button>
              </CardContent>
            </Card>
          )}

          {activeSection === 'social' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">社交账号</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>微信</Label>
                  <Input value={wechat} onChange={(e) => setWechat(e.target.value)} placeholder="微信号" />
                </div>
                <div className="space-y-2">
                  <Label>微博</Label>
                  <Input value={weibo} onChange={(e) => setWeibo(e.target.value)} placeholder="微博ID" />
                </div>
                <div className="space-y-2">
                  <Label>抖音</Label>
                  <Input value={douyin} onChange={(e) => setDouyin(e.target.value)} placeholder="抖音号" />
                </div>
                <div className="space-y-2">
                  <Label>B站</Label>
                  <Input value={bilibili} onChange={(e) => setBilibili(e.target.value)} placeholder="B站UID" />
                </div>
                <Button onClick={handleSaveSocial} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  保存
                </Button>
              </CardContent>
            </Card>
          )}

          {activeSection === 'contact' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">联系方式</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>手机号</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="手机号码" />
                </div>
                <div className="space-y-2">
                  <Label>邮箱</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" type="email" />
                </div>
                <Button onClick={handleSaveContact} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  保存
                </Button>
              </CardContent>
            </Card>
          )}

          {activeSection === 'password' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">密码修改</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {forceChangePassword && (
                  <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      您使用的是初始密码，为了账户安全，请立即修改密码。
                    </p>
                  </div>
                )}
                {!forceChangePassword && (
                  <div className="space-y-2">
                    <Label>旧密码</Label>
                    <Input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>新密码</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label>确认新密码</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <Button onClick={handleChangePassword} disabled={changingPwd}>
                  {changingPwd ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  修改密码
                </Button>
              </CardContent>
            </Card>
          )}

          {activeSection === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">通知配置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">评论通知</p>
                    <p className="text-xs text-muted-foreground">有人评论你的动态时通知</p>
                  </div>
                  <Switch checked={notifyComment} onCheckedChange={setNotifyComment} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">点赞通知</p>
                    <p className="text-xs text-muted-foreground">有人点赞你的动态时通知</p>
                  </div>
                  <Switch checked={notifyLike} onCheckedChange={setNotifyLike} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">审核通知</p>
                    <p className="text-xs text-muted-foreground">动态审核结果通知</p>
                  </div>
                  <Switch checked={notifyAudit} onCheckedChange={setNotifyAudit} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">系统通知</p>
                    <p className="text-xs text-muted-foreground">系统维护等通知</p>
                  </div>
                  <Switch checked={notifySystem} onCheckedChange={setNotifySystem} />
                </div>
                <Button onClick={handleSaveNotifications} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  保存
                </Button>
              </CardContent>
            </Card>
          )}

          {activeSection === 'export' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">数据导出</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  导出你的所有个人数据，包括资料、动态、大事记等，打包为 ZIP 文件下载。
                </p>
                <Button onClick={handleExport} disabled={exporting}>
                  {exporting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  导出个人数据
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ImageCropper
        open={avatarCropOpen}
        onClose={() => setAvatarCropOpen(false)}
        file={avatarPickedFile}
        aspect={1}
        circular={true}
        onCropComplete={handleAvatarCropComplete}
      />

      <ImageCropper
        open={coverCropOpen}
        onClose={() => setCoverCropOpen(false)}
        file={coverPickedFile}
        aspect={3 / 1}
        circular={false}
        onCropComplete={handleCoverCropComplete}
      />
    </div>
  )
}
