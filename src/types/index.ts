export interface UserInfo {
  id: number
  username: string
  realName: string
  className: string
  avatar: string
  signature: string
  birthday: string
  address: string
  hobbies: string
  phone: string
  email: string
  wechat: string
  weibo: string
  douyin: string
  bilibili: string
  coverImage: string
  cardBackground: string
  cardBgColor: string
  cardBgImage: string
  notifyComment: boolean
  notifyLike: boolean
  notifyAudit: boolean
  notifySystem: boolean
  phonePrivacy: string
  emailPrivacy: string
  wechatPrivacy: string
  weiboPrivacy: string
  douyinPrivacy: string
  bilibiliPrivacy: string
  status: string
  onlineStatus: boolean
  lastActiveAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AlbumInfo {
  id: number
  title: string
  description: string
  coverImage: string
  visibility: string
  allowSave: boolean
  creatorId: number
  createdAt: string
  updatedAt: string
  creator: {
    id: number
    username: string
    realName: string
    avatar: string
  }
  images: AlbumImageInfo[]
  _count?: { images: number }
}

export interface AlbumImageInfo {
  id: number
  albumId: number
  url: string
  uploaderId: number
  createdAt: string
  uploader: {
    id: number
    username: string
    realName: string
    avatar: string
  }
}

export interface ClassEventInfo {
  id: number
  userId: number
  title: string
  description: string
  eventDate: string
  createdAt: string
  updatedAt: string
  user: {
    id: number
    username: string
    realName: string
    avatar: string
  }
  images: EventImageInfo[]
}

export interface EventImageInfo {
  id: number
  userId: number
  imageType: 'MAIN' | 'SUPPLEMENT'
  url: string
  thumbnailUrl: string
  createdAt: string
  user: {
    id: number
    realName: string
  }
  comments: EventImageCommentInfo[]
  _count?: { likes: number }
  liked?: boolean
}

export interface EventImageCommentInfo {
  id: number
  imageId: number
  userId: number
  content: string
  createdAt: string
  user: {
    id: number
    username: string
    realName: string
    avatar: string
  }
}

export interface NotificationInfo {
  id: number
  type: string
  title: string
  content: string
  relatedId: number | null
  isRead: boolean
  createdAt: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export type PrivacyLevel = 'public' | 'private' | 'friends_only' | 'custom'
