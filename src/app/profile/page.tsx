'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Mail, Phone, Calendar, Briefcase, MapPin } from 'lucide-react'
import { useSession } from 'next-auth/react'

export default function ProfilePage() {
  const { data: session } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState({
    name: session?.user?.name || '用户名',
    email: session?.user?.email || 'user@example.com',
    phone: '',
    bio: '这是用户的个人简介',
    location: '',
    company: '',
    role: '',
  })

  const handleSave = () => {
    // 这里可以保存用户资料到服务器
    console.log('保存资料:', profile)
    setIsEditing(false)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">个人资料</h1>
        <p className="text-gray-600">管理你的个人信息和偏好设置</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 个人信息卡片 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>个人信息</CardTitle>
                <CardDescription>基本资料和联系方式</CardDescription>
              </div>
              <Button 
                variant={isEditing ? 'default' : 'outline'}
                onClick={isEditing ? handleSave : () => setIsEditing(true)}
              >
                {isEditing ? '保存' : '编辑'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 头像 */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={session?.user?.image || ''} />
                <AvatarFallback className="bg-blue-100 text-blue-800">
                  {profile.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold">{profile.name}</h3>
                <p className="text-gray-600">{profile.email}</p>
              </div>
            </div>

            {/* 表单字段 */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">姓名</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) =>setProfile({...profile, name: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">电话</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">所在地</Label>
                  <Input
                    id="location"
                    value={profile.location}
                    onChange={(e) => setProfile({...profile, location: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">公司</Label>
                  <Input
                    id="company"
                    value={profile.company}
                    onChange={(e) => setProfile({...profile, company: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">职位</Label>
                  <Input
                    id="role"
                    value={profile.role}
                    onChange={(e) => setProfile({...profile, role: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">个人简介</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({...profile, bio: e.target.value})}
                  disabled={!isEditing}
                  rows={4}
                  placeholder="介绍一下自己..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 统计信息卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>我的统计</CardTitle>
            <CardDescription>你的活动数据</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">12</div>
              <div className="text-sm text-gray-500">完成面试</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">85</div>
              <div className="text-sm text-gray-500">平均评分</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">5</div>
              <div className="text-sm text-gray-500">技能标签</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">320</div>
              <div className="text-sm text-gray-500">练习分钟</div>
            </div>

            <Button variant="outline" className="w-full mt-4">
              查看详细统计
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 账户设置卡片 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>账户设置</CardTitle>
          <CardDescription>账户安全和偏好设置</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium">通知设置</div>
                <div className="text-sm text-gray-500">管理邮件和应用通知</div>
              </div>
            </div>
            <Button variant="outline" size="sm">
              设置
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Briefcase className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium">面试偏好</div>
                <div className="text-sm text-gray-500">设置面试类型和难度</div>
              </div>
            </div>
            <Button variant="outline" size="sm">
              设置
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <User className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="font-medium">账户安全</div>
                <div className="text-sm text-gray-500">修改密码和安全设置</div>
              </div>
            </div>
            <Button variant="outline" size="sm">
              设置
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}