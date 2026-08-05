'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/auth-context'
import { apiFetch } from '@/lib/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import {
  MapPin,
  Cake,
  Heart,
  Edit,
  Image as ImageIcon,
  ChevronLeft,
  Mail,
  Phone,
  MessageCircle,
  CalendarDays,
  EyeOff,
  User,
  Star,
} from 'lucide-react'
import { cn, formatLastActive, getZodiacSign } from '@/lib/utils'
import type { UserInfo, ClassEventInfo } from '@/types'

function InfoField({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary shrink-0" />
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium ml-auto text-right">{value}</span>
    </div>
  )
}

function ContactRow({
  label,
  value,
  privacy,
  icon: Icon,
}: {
  label: string
  value: string
  privacy: string
  icon: React.ComponentType<{ className?: string }>
}) {
  if (privacy !== 'public') {
    return (
      <div className="flex items-center gap-2 py-2">
        <Icon className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm text-muted-foreground shrink-0">{label}</span>
        <span className="ml-auto">
          <Badge variant="secondary" className="text-xs gap-1">
            <EyeOff className="h-3 w-3" />未公开
          </Badge>
        </span>
      </div>
    )
  }
  if (!value) return null
  return (
    <div className="flex items-center gap-2 py-2">
      <Icon className="h-4 w-4 text-primary shrink-0" />
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium ml-auto">{value}</span>
    </div>
  )
}

function AlbumCard({ album }: { album: { id: number; title: string; coverImage: string; createdAt: string; _count: { images: number } } }) {
  return (
    <Link href={`/albums/${album.id}`}>
      <Card className="hover:shadow-md transition-shadow duration-200 overflow-hidden group">
        <div className="relative w-full h-40 bg-muted">
          {album.coverImage ? (
            <Image src={album.coverImage} alt={album.title} fill sizes="(min-width: 768px) 33vw, 50vw" className="object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
            {album._count.images}张
          </div>
        </div>
        <CardContent className="p-3">
          <p className="text-sm font-medium truncate">{album.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(new Date(album.createdAt), 'yyyy-MM-dd')}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser, loading: authLoading } = useAuth()
  const rawId = params.id as string

  const [profile, setProfile] = useState<UserInfo | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  const [albums, setAlbums] = useState<any[]>([])
  const [events, setEvents] = useState<ClassEventInfo[]>([])
  const [albumsLoaded, setAlbumsLoaded] = useState(false)
  const [eventsLoaded, setEventsLoaded] = useState(false)
  const [albumTotal, setAlbumTotal] = useState(0)
  const [eventTotal, setEventTotal] = useState(0)
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'albums')

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'albums' || tab === 'events') setActiveTab(tab)
  }, [searchParams])

  const isOwnProfile = currentUser?.id === profile?.id || currentUser?.username === rawId

  useEffect(() => {
    apiFetch<UserInfo>(`/api/users/${rawId}`)
      .then((data) => setProfile(data))
      .catch(() => setProfile(null))
      .finally(() => setProfileLoading(false))
  }, [rawId])

  useEffect(() => {
    if (!profile) return
    apiFetch<any[]>('/api/users/' + rawId + '/albums')
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        setAlbumTotal(list.length)
        setAlbums(list.slice(0, 6))
        setAlbumsLoaded(true)
      })
      .catch(() => setAlbumsLoaded(true))
    apiFetch<{ list: ClassEventInfo[]; total: number }>('/api/users/' + rawId + '/events')
      .then((data) => {
        const list = data.list || []
        setEventTotal(data.total || list.length)
        setEvents(list.slice(0, 6))
        setEventsLoaded(true)
      })
      .catch(() => setEventsLoaded(true))
  }, [profile, rawId])

  if (profileLoading || authLoading) {
    return (
      <div className="container py-6 max-w-3xl">
        <Skeleton className="h-52 sm:h-64 rounded-2xl mb-4" />
        <div className="relative -mt-16 mb-4 flex flex-col items-center">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 mt-2" />
          <Skeleton className="h-4 w-36 mt-1" />
        </div>
        <Skeleton className="h-40 rounded-xl mb-4" />
        <Skeleton className="h-24 rounded-xl mb-4" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="container py-20 flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground mb-4">请先登录后查看同学主页</p>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/login">登录</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/register">注册</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">用户不存在</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4 mr-2" />返回
        </Button>
      </div>
    )
  }

  const hobbyTags = profile.hobbies
    ? profile.hobbies
        .split(/[,，\s]+/)
        .filter(Boolean)
        .slice(0, 8)
    : []

  const zodiac = profile.birthday ? getZodiacSign(profile.birthday) : ''

  return (
    <div className="container py-6 max-w-3xl">
      <div className="relative h-52 sm:h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-500">
        {profile.coverImage && (
          <>
            <Image src={profile.coverImage} alt="" fill sizes="768px" className="object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-black/25" />
          </>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-3 left-3 text-white hover:text-white hover:bg-white/20"
          onClick={() => router.back()}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />返回
        </Button>
        <div className="absolute bottom-4 left-4 right-4 flex items-end gap-4">
          <div className="relative shrink-0">
            <Avatar className="h-20 w-20 ring-4 ring-white/90 shadow-lg">
              <AvatarImage src={profile.avatar} />
              <AvatarFallback className="text-xl bg-gradient-to-br from-blue-400 to-indigo-500 text-white">
                {profile.realName?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <span
              className={cn(
                'absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white',
                profile.onlineStatus ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]' : 'bg-gray-400'
              )}
            />
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-white drop-shadow-sm">
                {profile.realName || profile.username}
              </h1>
              {profile.onlineStatus ? (
                <Badge className="bg-green-500/90 text-white text-xs border-0">在线</Badge>
              ) : profile.lastActiveAt ? (
                <span className="text-xs text-white/80">{formatLastActive(profile.lastActiveAt)}</span>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2 pb-1 shrink-0">
            {isOwnProfile && (
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/90 hover:bg-white text-gray-700 shadow"
                onClick={() => router.push('/settings')}
              >
                <Edit className="h-4 w-4 mr-1" />编辑
              </Button>
            )}
          </div>
        </div>
      </div>

      {profile.signature && (
        <p className="text-sm text-muted-foreground text-center mb-6 px-4">
          {profile.signature}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href={`/user/${rawId}?tab=albums`}>
          <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer">
            <CardContent className="p-4 text-center">
              <ImageIcon className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-xl font-bold">{albumTotal}</p>
              <p className="text-xs text-muted-foreground">相册</p>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/user/${rawId}?tab=events`}>
          <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer">
            <CardContent className="p-4 text-center">
              <CalendarDays className="h-5 w-5 mx-auto text-green-500 mb-1" />
              <p className="text-xl font-bold">{eventTotal}</p>
              <p className="text-xs text-muted-foreground">大事记</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">基本资料</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
            <InfoField label="姓名" value={profile.realName || profile.username} icon={User} />
            <InfoField label="生日" value={profile.birthday ? format(new Date(profile.birthday), 'yyyy-MM-dd') : '-'} icon={Cake} />
            {zodiac && <InfoField label="星座" value={zodiac} icon={Star} />}
            {profile.address && <InfoField label="城市" value={profile.address} icon={MapPin} />}
          </div>
        </CardContent>
      </Card>

      {hobbyTags.length > 0 && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">兴趣标签</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {hobbyTags.map((tag: string) => (
                <Badge key={tag} variant="secondary" className="px-3 py-1 text-sm">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">联系方式</h3>
          </div>
          <div className="divide-y divide-border">
            <ContactRow label="手机" value={profile.phone} privacy={profile.phonePrivacy} icon={Phone} />
            <ContactRow label="邮箱" value={profile.email} privacy={profile.emailPrivacy} icon={Mail} />
            <ContactRow label="微信" value={profile.wechat} privacy={profile.wechatPrivacy} icon={MessageCircle} />
            <ContactRow label="微博" value={profile.weibo} privacy={profile.weiboPrivacy} icon={Heart} />
          </div>
        </CardContent>
      </Card>

      <div className="mb-4">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('albums')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2',
              activeTab === 'albums'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <ImageIcon className="h-4 w-4" />
            TA的相册
            <span className="text-xs text-muted-foreground ml-1">({albumTotal})</span>
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2',
              activeTab === 'events'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <CalendarDays className="h-4 w-4" />
            大事记
            <span className="text-xs text-muted-foreground ml-1">({eventTotal})</span>
          </button>
        </div>
      </div>

      {activeTab === 'albums' && (
        <>
          {!albumsLoaded ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <Skeleton className="h-40 rounded-t-xl" />
                  <CardContent className="p-3">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : albums.length === 0 ? (
            <div className="text-center text-muted-foreground py-20">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-40" />
              暂无相册
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                {albums.map((album: any) => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </div>
              {albumTotal > 6 && (
                <div className="text-center mt-4">
                  <Link href={`/user/${rawId}?tab=albums`}>
                    <Button variant="outline" size="sm">
                      查看全部 {albumTotal} 个相册
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </>
      )}

      {activeTab === 'events' && (
        <div className="space-y-4">
          {!eventsLoaded ? (
            [1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Skeleton className="h-20 w-20 rounded shrink-0" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-full mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : events.length === 0 ? (
            <div className="text-center text-muted-foreground py-20">
              <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-40" />
              暂无大事记
            </div>
          ) : (
            <>
              {events.map((event) => (
                <Link key={event.id} href={`/events/${event.id}`}>
                  <Card className="hover:shadow-md transition-shadow duration-200">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        {event.images?.[0] && (
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                            <Image
                              src={event.images[0].thumbnailUrl || event.images[0].url}
                              alt={event.title}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{event.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {event.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <CalendarDays className="h-3 w-3" />
                            {format(new Date(event.eventDate), 'yyyy-MM-dd')}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {eventTotal > 6 && (
                <div className="text-center mt-4">
                  <Link href={`/user/${rawId}?tab=events`}>
                    <Button variant="outline" size="sm">
                      查看全部 {eventTotal} 条大事记
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
