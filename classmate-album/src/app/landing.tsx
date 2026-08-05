'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Users, BookOpen, Camera, Bell } from 'lucide-react'

export function LandingPage() {
  return (
    <div className="container py-8 flex flex-col items-center animate-in fade-in duration-500">
      <div className="text-center max-w-2xl mb-8 sm:mb-12 pt-4 sm:pt-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-4">
          同学录
        </h1>
        <p className="text-lg text-muted-foreground mb-2">
          记录同窗岁月，珍藏青春记忆
        </p>
        <p className="text-sm text-muted-foreground mb-6 sm:mb-8">
          班级专属空间，汇聚每一个人的故事
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/login">
            <Button size="lg" className="px-8">
              登录
            </Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline" className="px-8">
              注册
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-4xl w-full">
        <Card className="text-center p-6 hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-0 space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">同学名录</h3>
            <p className="text-sm text-muted-foreground">
              浏览全班同学信息，查看联系方式与社交账号
            </p>
          </CardContent>
        </Card>

        <Card className="text-center p-6 hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-0 space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Camera className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">朋友圈动态</h3>
            <p className="text-sm text-muted-foreground">
              分享生活点滴，点赞评论互动
            </p>
          </CardContent>
        </Card>

        <Card className="text-center p-6 hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-0 space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">大事记</h3>
            <p className="text-sm text-muted-foreground">
              记录班级重要时刻，上传照片共同见证
            </p>
          </CardContent>
        </Card>

        <Card className="text-center p-6 hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-0 space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">实时通知</h3>
            <p className="text-sm text-muted-foreground">
              点赞评论系统公告，消息实时推送
            </p>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground mt-8 sm:mt-16">
        需使用管理员发放的注册码方可注册
      </p>
    </div>
  )
}
